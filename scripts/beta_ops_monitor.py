"""Monitor aggregate beta capacity; never emit document content or credentials."""
import json
from beta_ops import connection


def main():
    with connection() as db:
        credits, estimated, concurrent = db.execute("""
            SELECT COALESCE(sum(credits) FILTER (WHERE status='success' OR
                    (status='reserved' AND created_at>now()-interval '10 minutes')),0),
                COALESCE(sum(provider_cost_usd) FILTER (WHERE status='success'),0),
                count(*) FILTER (WHERE status='reserved' AND created_at>now()-interval '10 minutes')
            FROM public.ai_usage WHERE created_at >=
                date_trunc('day',now() AT TIME ZONE 'America/Bogota') AT TIME ZONE 'America/Bogota'
        """).fetchone()
        credit_limit, cost_limit = db.execute('SELECT daily_credits,daily_estimated_usd FROM private.beta_limits WHERE singleton').fetchone()
        errors, completed = db.execute("""
            SELECT count(*) FILTER (WHERE response_status>=500),count(*)
            FROM public.ai_gateway_requests WHERE created_at>now()-interval '30 minutes' AND status<>'processing'
        """).fetchone()
    warning = credits * 5 >= credit_limit * 4 or estimated * 5 >= cost_limit * 4 or (completed >= 5 and errors / completed >= .3)
    print(json.dumps({'credits_today': int(credits), 'credit_limit': credit_limit,
                      'estimated_usd_today': float(estimated), 'estimated_usd_limit': float(cost_limit),
                      'concurrent': concurrent, 'server_errors_30m': errors, 'completed_30m': completed,
                      'capacity_warning': warning}))
    return 1 if warning else 0


if __name__ == '__main__':
    raise SystemExit(main())
