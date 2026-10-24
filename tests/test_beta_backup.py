"""Encrypted archives must round-trip and reject tampering or unrelated keys."""
import base64
from pathlib import Path
import sys

from nacl.exceptions import CryptoError
from nacl.public import PrivateKey

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from beta_backup import dump_counts, seal, unseal  # noqa: E402


def main():
    key = PrivateKey.generate()
    public = base64.b64encode(bytes(key.public_key)).decode()
    private = base64.b64encode(bytes(key)).decode()
    payload = b'synthetic backup content; no production rows'
    encrypted = seal(payload, public)
    assert payload not in encrypted
    assert unseal(encrypted, private) == payload
    for ciphertext, secret in [
        (encrypted[:-1] + bytes([encrypted[-1] ^ 1]), private),
        (encrypted, base64.b64encode(bytes(PrivateKey.generate())).decode()),
    ]:
        try:
            unseal(ciphertext, secret)
        except CryptoError:
            pass
        else:
            raise AssertionError('Invalid ciphertext/key was accepted')
    assert dump_counts('COPY public.sesiones (id) FROM stdin;\na\nb\n\\.\nCOPY auth.users (id) FROM stdin;\n\\.\n') == {
        'public.sesiones': 2, 'auth.users': 0}
    print('test_beta_backup.py: encryption, tamper rejection, recovery and snapshot counts OK')


if __name__ == '__main__':
    main()
