"""Isolated engine process for HTTP/browser regression tests; never production."""
import argparse
import json
from pathlib import Path
import socket
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'backend'))
import main  # noqa: E402
import uvicorn  # noqa: E402

parser = argparse.ArgumentParser()
parser.add_argument('--limit', type=int, default=65536)
args = parser.parse_args()
with tempfile.TemporaryDirectory() as directory:
    main.TOKEN_FILE = Path(directory) / 'test.token'
    main.MAX_REQUEST_BYTES = args.limit
    main.initialize_connection_token()
    # Force the actual offline Chromium fallback, even on a Word-equipped PC.
    def no_word(*_args):
        raise OSError('Offline renderer regression')
    main.convert_docx_to_pdf = no_word
    main.buscar_navegador_compatible = lambda: None
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        print(json.dumps({'port':listener.getsockname()[1],'token':main.CONNECTION_TOKEN}), flush=True)
        config = uvicorn.Config(main.app, host='127.0.0.1', log_level='error', loop='asyncio')
        uvicorn.Server(config).run(sockets=[listener])
