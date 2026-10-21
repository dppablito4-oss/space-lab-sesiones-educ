"""Serve the application on loopback without exposing private workspace files."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PRIVATE_DIRECTORIES = {'artifacts', 'backend', 'supabase', 'tests', 'scripts'}


class PreviewHandler(SimpleHTTPRequestHandler):
    def public_path(self) -> bool:
        path = unquote(urlsplit(self.path).path).replace('\\', '/')
        parts = [part for part in path.split('/') if part]
        if any(part.startswith('.') or 'token' in part.lower() for part in parts) or (
            parts and parts[0].casefold() in PRIVATE_DIRECTORIES
        ):
            self.send_error(404)
            return False
        if path == '/':
            self.path = '/index.html'
        return True

    def do_GET(self):
        if self.public_path():
            super().do_GET()

    def do_HEAD(self):
        if self.public_path():
            super().do_HEAD()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, *_args):
        pass


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 3000), partial(PreviewHandler, directory=str(ROOT)))
    print('Web local: http://localhost:3000/index.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
