"""Create an encrypted database + Storage backup and verify an isolated restore.

Only sealed ciphertext is written to --output. The recovery key is never printed.
"""
import argparse
import base64
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import tarfile
import tempfile
from urllib.parse import quote
from urllib.request import urlopen
import uuid

from nacl.public import PrivateKey, PublicKey, SealedBox

from beta_ops import PROJECT, connection

IMAGE = 'postgres:17.6'
SCHEMAS = ('public', 'auth', 'storage', 'private', 'supabase_migrations')


def seal(data: bytes, public_key: str) -> bytes:
    return SealedBox(PublicKey(base64.b64decode(public_key))).encrypt(data)


def unseal(data: bytes, private_key: str) -> bytes:
    return SealedBox(PrivateKey(base64.b64decode(private_key))).decrypt(data)


def command(arguments, *, work, input_bytes=None):
    run = subprocess.run(arguments, input=input_bytes, capture_output=True, timeout=300)
    if run.returncode:
        # Full stderr stays inside the encrypted diagnostic, never public logs.
        (work / 'diagnostic.txt').write_bytes(run.stderr)
        raise RuntimeError('Backup command failed; encrypted diagnostic retained')
    return run.stdout


def dump_counts(sql: str) -> dict:
    counts = {}
    current = None
    for line in sql.splitlines():
        match = re.match(r'^COPY ([\w]+)\.([\w]+) .* FROM stdin;$', line)
        if match:
            current = '.'.join(match.groups())
            counts[current] = 0
        elif line == r'\.':
            current = None
        elif current:
            counts[current] += 1
    return counts


def isolated_restore(work: Path, counts: dict, roles: list[str]):
    name = 'spacelab-restore-' + uuid.uuid4().hex[:12]
    command(['docker', 'run', '-d', '--name', name, '--network', 'none',
             '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', IMAGE], work=work)
    try:
        # docker exec pg_isready waits briefly without exposing a port.
        import time
        for _ in range(30):
            ready = subprocess.run(['docker', 'exec', name, 'pg_isready', '-U', 'postgres'], capture_output=True)
            if ready.returncode == 0:
                break
            time.sleep(1)
        else:
            raise RuntimeError('Isolated restore database did not start')
        bootstrap = "CREATE SCHEMA IF NOT EXISTS extensions; CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions;\n"
        for role in roles:
            if role != 'postgres' and not role.startswith('pg_'):
                quoted = '"' + role.replace('"', '""') + '"'
                bootstrap += f'DO $$ BEGIN CREATE ROLE {quoted} NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$;\n'
        command(['docker', 'exec', '-i', name, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'],
                work=work, input_bytes=bootstrap.encode())
        command(['docker', 'cp', str(work / 'database.dump'), name + ':/tmp/database.dump'], work=work)
        command(['docker', 'exec', name, 'pg_restore', '-U', 'postgres', '-d', 'postgres',
                 '--no-owner', '--no-acl', '--clean', '--if-exists', '--exit-on-error',
                 '--single-transaction', '/tmp/database.dump'], work=work)
        for table, expected in counts.items():
            # Names originate in pg_dump and pass the identifier-only regex.
            schema, relation = table.split('.')
            query = f'SELECT count(*) FROM "{schema}"."{relation}";'
            actual = command(['docker', 'exec', name, 'psql', '-U', 'postgres', '-Atc', query], work=work)
            if int(actual.strip()) != expected:
                raise RuntimeError('Restored table count differs from the exported snapshot')
    finally:
        subprocess.run(['docker', 'rm', '-f', name], capture_output=True, timeout=30)


def main():
    parser = argparse.ArgumentParser(__doc__)
    parser.add_argument('--output', type=Path, default=Path('backup-output'))
    parser.add_argument('--verify-restore', action='store_true')
    args = parser.parse_args()
    os.umask(0o077)
    args.output.mkdir(parents=True, exist_ok=True)
    workspace = Path('.backup-work').resolve()
    workspace.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    with tempfile.TemporaryDirectory(prefix='export-', dir=workspace) as directory:
        work = Path(directory).resolve()
        if not work.is_relative_to(workspace):
            raise RuntimeError('Unsafe backup workspace')
        manifest = {'project': PROJECT, 'created_at_utc': stamp, 'restore_verified': False}
        failure = None
        try:
            with connection() as db:
                objects = db.execute('SELECT o.bucket_id,o.name,b.public FROM storage.objects o JOIN storage.buckets b ON b.id=o.bucket_id ORDER BY o.bucket_id,o.name').fetchall()
                roles = [row[0] for row in db.execute('SELECT rolname FROM pg_roles').fetchall()]
            command(['docker', 'run', '--rm', '-v', str(work) + ':/work',
                     '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGUSER', '-e', 'PGPASSWORD',
                     '-e', 'PGDATABASE=postgres', '-e', 'PGSSLMODE=require', IMAGE,
                     'pg_dump', '-Fc', '--no-owner', '--no-acl', '--no-large-objects',
                     *[arg for schema in SCHEMAS for arg in ('-n', schema)],
                     '-f', '/work/database.dump'], work=work)
            data_sql = command(['docker', 'run', '--rm', '-v', str(work) + ':/work', IMAGE,
                                'pg_restore', '--data-only', '-f', '-', '/work/database.dump'], work=work)
            counts = dump_counts(data_sql.decode('utf-8'))
            if not counts or 'auth.users' not in counts or 'public.sesiones' not in counts:
                raise RuntimeError('Backup does not contain the expected application tables')
            manifest['table_counts'] = counts
            files = []
            (work / 'objects').mkdir()
            for bucket, name, public in objects:
                if not public:
                    raise RuntimeError('Private Storage bucket needs a scoped download configuration')
                url = f'https://{PROJECT}.supabase.co/storage/v1/object/public/{quote(bucket, safe="")}/{quote(name, safe="/")}'
                with urlopen(url, timeout=30) as response:
                    data = response.read(100 * 1024 * 1024 + 1)
                if len(data) > 100 * 1024 * 1024:
                    raise RuntimeError('Storage object exceeds the backup size limit')
                identifier = hashlib.sha256((bucket + '/' + name).encode()).hexdigest()
                (work / 'objects' / identifier).write_bytes(data)
                files.append({'bucket': bucket, 'name': name, 'file': 'objects/' + identifier,
                              'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)})
            manifest['objects'] = files
            if args.verify_restore:
                isolated_restore(work, counts, roles)
                manifest['restore_verified'] = True
        except Exception as error:
            failure = error
            manifest['error_type'] = type(error).__name__
        (work / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
        package = io.BytesIO()
        with tarfile.open(fileobj=package, mode='w:gz') as archive:
            for path in sorted(work.rglob('*')):
                if path.is_file():
                    archive.add(path, arcname=path.relative_to(work).as_posix())
        encrypted = seal(package.getvalue(), os.environ['BETA_BACKUP_RECIPIENT'])
        suffix = '.failed.sealed' if failure else '.sealed'
        destination = args.output / ('spacelab-' + stamp + suffix)
        destination.write_bytes(encrypted)
        # Validate encryption in memory; never publish a decrypted archive.
        private_key = os.environ.get('BETA_BACKUP_PRIVATE_KEY')
        if private_key and unseal(encrypted, private_key) != package.getvalue():
            raise RuntimeError('Encrypted backup validation failed')
        print(json.dumps({'encrypted_bytes': len(encrypted), 'tables': len(manifest.get('table_counts', {})),
                          'storage_objects': len(manifest.get('objects', [])),
                          'restore_verified': manifest['restore_verified'], 'ok': failure is None}))
        if failure:
            raise SystemExit(1)


if __name__ == '__main__':
    main()
