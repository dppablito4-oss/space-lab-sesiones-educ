from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    migration = (ROOT / "supabase/migrations/202609210001_profile_hardening.sql").read_text(encoding="utf-8")
    bootstrap = (ROOT / "database_setup.sql").read_text(encoding="utf-8")
    client = (ROOT / "js/supabase-client.js").read_text(encoding="utf-8")

    for sql in (migration, bootstrap):
        assert "check_profile_protected_update" in sql
        assert "to_jsonb(NEW) - v_editable_fields" in sql
        assert "public.is_admin()" in sql
        assert "before_profile_protected_update" in sql

    assert "sanitizeUpdate(profileData)" in client
    assert ".update(editableData)" in client
    assert ".update(profileData)" not in client

    print("profile_security.py: OK")


if __name__ == "__main__":
    main()
