-- Dedicated scheduled-backup identity; its password is provisioned separately.
BEGIN;
CREATE ROLE spacelab_backup NOLOGIN BYPASSRLS;
GRANT pg_read_all_data TO spacelab_backup;
ALTER ROLE spacelab_backup SET default_transaction_read_only = on;
ALTER ROLE spacelab_backup SET statement_timeout = '120s';
COMMENT ON ROLE spacelab_backup IS 'Read-only exports; credentials live in the backup runner secret store';
COMMIT;
