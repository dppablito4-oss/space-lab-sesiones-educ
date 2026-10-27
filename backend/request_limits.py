"""Bound actual ASGI body bytes before JSON parsing, including chunked requests."""
from collections.abc import Callable

from starlette.responses import PlainTextResponse
from starlette.types import ASGIApp, Receive, Scope, Send


class RequestSizeLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: Callable[[], int]):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)
        limit = self.max_bytes()
        declared = dict(scope.get('headers', [])).get(b'content-length')
        if declared is not None:
            try:
                length = int(declared)
                if length < 0:
                    raise ValueError
            except ValueError:
                return await PlainTextResponse('Content-Length inválido.', 400)(scope, receive, send)
            if length > limit:
                return await PlainTextResponse('Solicitud demasiado grande.', 413)(scope, receive, send)

        body = bytearray()
        while True:
            message = await receive()
            if message['type'] == 'http.disconnect':
                return
            chunk = message.get('body', b'')
            if len(body) + len(chunk) > limit:
                return await PlainTextResponse('Solicitud demasiado grande.', 413)(scope, receive, send)
            body.extend(chunk)
            if not message.get('more_body', False):
                break

        received = False

        async def bounded_receive():
            nonlocal received
            if received:
                return await receive()
            received = True
            content = bytes(body)
            body.clear()
            return {'type': 'http.request', 'body': content, 'more_body': False}

        await self.app(scope, bounded_receive, send)
