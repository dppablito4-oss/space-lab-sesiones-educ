"""Offline PDF rendering: inert document content and trusted local math code."""
import asyncio
import base64
import binascii
import hashlib
from functools import lru_cache
from pathlib import Path
import re
import sys
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from bs4 import BeautifulSoup

MAX_IMAGE_BYTES = 5 * 1024 * 1024
LOGO_HOST = 'koptglmifwpzrfzvipnm.supabase.co'
LOGO_PATH = '/storage/v1/object/public/logos/'
MATHJAX_SHA256 = 'd4295dc33744836935c1399feece5159577b34c5c8ffb9f1c6324cd82e03a882'
DROP_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'base', 'form', 'input',
             'button', 'textarea', 'select', 'template', 'svg', 'math', 'audio', 'video']
URL_ATTRIBUTES = {'href', 'srcset', 'action', 'formaction', 'poster', 'background', 'ping', 'srcdoc'}


def resource_root() -> Path:
    return Path(sys._MEIPASS) if getattr(sys, 'frozen', False) else Path(__file__).resolve().parents[1]


def allowed_logo_url(value: str) -> bool:
    if len(value) > 2048 or re.search(r'[\s\\<>"\'\x00-\x1f]', value):
        return False
    try:
        parsed = urlsplit(value)
        return (parsed.scheme == 'https' and parsed.hostname == LOGO_HOST
                and parsed.port in (None, 443) and parsed.username is None
                and parsed.password is None and parsed.path.startswith(LOGO_PATH)
                and not parsed.fragment and not parsed.query
                and not re.search(r'%2[ef]|%5c|/\.\.?(/|$)', parsed.path, re.I))
    except ValueError:
        return False


def validated_image(data: bytes) -> str:
    if len(data) > MAX_IMAGE_BYTES:
        return ''
    if data.startswith(b'\x89PNG\r\n\x1a\n'):
        mime = 'image/png'
    elif data.startswith(b'\xff\xd8\xff'):
        mime = 'image/jpeg'
    elif data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        mime = 'image/webp'
    else:
        return ''
    return f'data:{mime};base64,' + base64.b64encode(data).decode('ascii')


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise URLError('No se permiten redirecciones de logos.')


def load_logo(value: str) -> str:
    if value.startswith('data:'):
        if not re.match(r'^data:image/(?:png|jpeg|webp);base64,', value, re.I):
            return ''
        encoded = value.split(',', 1)[1]
        if len(encoded) > (MAX_IMAGE_BYTES + 2) // 3 * 4:
            return ''
        try:
            return validated_image(base64.b64decode(encoded, validate=True))
        except (ValueError, binascii.Error):
            return ''
    if value in ('assets/logo.png', './assets/logo.png'):
        return validated_image((resource_root() / 'assets/logo.png').read_bytes())
    if not allowed_logo_url(value):
        return ''
    try:
        # Only this fixed project/bucket may be fetched; Chromium stays offline.
        request = Request(value, headers={'User-Agent': 'SpaceLab-Local-PDF'})
        with build_opener(NoRedirects()).open(request, timeout=5) as response:
            if response.status != 200:
                return ''
            return validated_image(response.read(MAX_IMAGE_BYTES + 1))
    except (OSError, URLError, ValueError):
        return ''


def sanitize_pdf_html(html: str) -> str:
    soup = BeautifulSoup(html, 'html.parser')
    for tag in soup.find_all(DROP_TAGS):
        tag.decompose()
    for tag in soup.find_all('meta'):
        if tag.has_attr('http-equiv'):
            tag.decompose()
    for tag in soup.find_all(True):
        for attribute in list(tag.attrs):
            if attribute.lower().startswith('on') or attribute.lower() in URL_ATTRIBUTES:
                del tag.attrs[attribute]
        if tag.name == 'img':
            image = load_logo(str(tag.get('src', '')))
            if image:
                tag['src'] = image
            else:
                tag.decompose()
        elif tag.has_attr('src'):
            del tag.attrs['src']
    # CSS remains available for pagination. All network/file URLs are blocked
    # by the offline browser and route interception, including escaped CSS URLs.
    return str(soup)


@lru_cache(maxsize=1)
def mathjax_source() -> str:
    data = (resource_root() / 'assets/vendor/mathjax/tex-svg.js').read_bytes()
    if hashlib.sha256(data).hexdigest() != MATHJAX_SHA256:
        raise ValueError('El recurso local de fórmulas no coincide con su versión verificada.')
    return data.decode('utf-8')


async def render_pdf_html(browser, html: str, *, typeset_math: bool = False) -> bytes:
    html = await asyncio.to_thread(sanitize_pdf_html, html)
    context = await browser.new_context(java_script_enabled=False, offline=True, service_workers='block')
    try:
        await context.route('**/*', lambda route: route.abort())
        page = await context.new_page()
        await page.set_content(html, wait_until='load')
        if typeset_math:
            # DevTools evaluation can run trusted code while document scripts,
            # event handlers and navigation remain disabled in the context.
            await page.evaluate(r'''window.MathJax = {
                tex: {inlineMath:[['$','$'],['\\(','\\)']], displayMath:[['$$','$$'],['\\[','\\]']],
                    processEscapes:true, packages:['base','ams','newcommand','noundefined'],
                    maxMacros:1000, maxBuffer:8192},
                startup:{typeset:false}, options:{enableMenu:false}, svg:{fontCache:'local'}
            }''')
            await page.evaluate(mathjax_source())
            await page.evaluate('async()=>{await MathJax.startup.promise; await MathJax.typesetPromise();}')
        return await page.pdf(print_background=True, prefer_css_page_size=True,
                              margin={'top':'0','bottom':'0','left':'0','right':'0'},
                              display_header_footer=False)
    finally:
        await context.close()
