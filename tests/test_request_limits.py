"""Enforce body bounds before application parsing, independent of headers."""
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'backend'))
from request_limits import RequestSizeLimitMiddleware  # noqa: E402


class RequestLimitTests(unittest.IsolatedAsyncioTestCase):
    async def request(self, chunks, headers=()):
        messages = []
        called = []
        reads = []
        chunks = list(chunks)

        async def receive():
            reads.append(True)
            if not chunks:
                return {'type':'http.disconnect'}
            return {'type':'http.request','body':chunks.pop(0),'more_body':bool(chunks)}

        async def app(scope, receive, send):
            called.append((await receive())['body'])
            await send({'type':'http.response.start','status':200,'headers':[]})
            await send({'type':'http.response.body','body':b'ok'})

        async def send(message):
            messages.append(message)

        middleware = RequestSizeLimitMiddleware(app, lambda: 10)
        await middleware({'type':'http','headers':list(headers)}, receive, send)
        return messages[0]['status'], called, len(reads)

    async def test_chunked_oversize_is_rejected_before_app(self):
        status, called, reads = await self.request([b'a'*6,b'b'*5,b'never-read'])
        self.assertEqual((status, called, reads), (413, [], 2))

    async def test_lying_short_content_length_does_not_bypass(self):
        status, called, _ = await self.request([b'a'*11], [(b'content-length',b'2')])
        self.assertEqual((status,called),(413,[]))

    async def test_exact_limit_and_empty_body_reach_app_unchanged(self):
        self.assertEqual((await self.request([b'a'*4,b'b'*6]))[:2], (200,[b'aaaabbbbbb']))
        self.assertEqual((await self.request([b'']))[:2], (200,[b'']))

    async def test_declared_oversize_rejected_without_reading(self):
        self.assertEqual(await self.request([b'x'],[(b'content-length',b'11')]),(413,[],0))

    async def test_invalid_or_negative_length(self):
        for value in [b'-1',b'no-number']:
            self.assertEqual(await self.request([b'x'],[(b'content-length',value)]),(400,[],0))

    async def test_many_small_chunks_cannot_accumulate_past_limit(self):
        self.assertEqual(await self.request([b'x']*100),(413,[],11))

    async def test_disconnected_partial_upload_never_calls_app(self):
        middleware = RequestSizeLimitMiddleware(lambda *_: self.fail('Disconnected request dispatched'),lambda:10)
        async def receive():
            return {'type':'http.disconnect'}
        await middleware({'type':'http','headers':[]},receive,lambda *_: self.fail('Response after disconnect'))


if __name__ == '__main__':
    unittest.main()
