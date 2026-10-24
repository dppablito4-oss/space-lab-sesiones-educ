"""Read-only operational database connection; secrets are supplied by the runner."""
import os

import psycopg

PROJECT = 'koptglmifwpzrfzvipnm'


def connection():
    return psycopg.connect(
        host=os.environ['PGHOST'], port=int(os.environ.get('PGPORT', '5432')),
        user=os.environ['PGUSER'], password=os.environ['PGPASSWORD'],
        dbname='postgres', sslmode='require', connect_timeout=15,
        options='-c default_transaction_read_only=on -c statement_timeout=120000',
    )
