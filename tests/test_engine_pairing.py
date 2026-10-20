"""The desktop hyperlink must survive FastAPI startup with its original token."""
import contextlib
import io
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlsplit

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

import main  # noqa: E402


class EnginePairingTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.token_path = Path(temporary.name) / "connection_token.txt"
        for name, value in {
            "TOKEN_FILE": self.token_path,
            "CONNECTION_TOKEN": "0" * 64,
            "CLIENT_CONNECTED": False,
            "_CONNECTION_TOKEN_INITIALIZED": False,
        }.items():
            patcher = patch.object(main, name, value, create=True)
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_desktop_hyperlink_is_accepted_after_server_startup(self):
        def open_gui():
            # The GUI renders and binds this URL before starting the server.
            displayed_url = main.pairing_url()
            displayed_token = parse_qs(urlsplit(displayed_url).query)["token"][0]
            with TestClient(main.app) as client:
                response = client.get("/verificar-token", params={"token": displayed_token})
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["status"], "Connected")
                self.assertEqual(main.pairing_url(), displayed_url)
                self.assertEqual(self.token_path.read_text(encoding="utf-8"), displayed_token)

        with (
            patch.object(main, "running_engine_accepts", return_value=False),
            patch.object(main, "local_port_is_busy", return_value=False),
            patch.object(main, "acquire_single_instance_mutex", return_value=True),
            patch.object(main, "start_gui", side_effect=open_gui) as gui,
            contextlib.redirect_stdout(io.StringIO()),
        ):
            main.run_desktop_application()
            gui.assert_called_once()

    def test_direct_server_startup_creates_a_valid_persisted_token(self):
        with contextlib.redirect_stdout(io.StringIO()), TestClient(main.app) as client:
            token = self.token_path.read_text(encoding="utf-8")
            self.assertRegex(token, r"^[0-9a-f]{64}$")
            self.assertNotEqual(token, "0" * 64)
            self.assertEqual(client.get("/verificar-token", params={"token": token}).status_code, 200)
            self.assertEqual(client.get("/verificar-token", params={"token": "incorrecto"}).status_code, 401)


if __name__ == "__main__":
    unittest.main()
