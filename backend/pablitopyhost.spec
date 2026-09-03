# -*- mode: python ; coding: utf-8 -*-
# pablitopyhost.spec
# PyInstaller spec para Space Lab — Motor de Exportación Pedagógica
#
# Notas importantes:
# - playwright se incluye como módulo Python (para sus APIs asyncio)
# - Chromium NO se bundlea: main.py lo descarga en runtime en EXE_DIR/bin/
# - tkinter debe estar instalado en el Python del build (incluido por defecto en CPython oficial)

from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('../assets/logo.ico', 'assets'),
        ('../assets/logo.png', 'assets'),
        ('../assets/templates/session_template_v1.docx', 'assets/templates'),
    ],
    hiddenimports=[
        'playwright.async_api',
        'playwright._impl._browser_context',
        'docx_builder',
        'docx_builder_v1',
        'word_math',
        'matplotlib',
        'matplotlib.mathtext',
        'PIL.Image',
        'models',
        'models.session_document',
        'adapters',
        'adapters.legacy_to_v1',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ] + collect_submodules('pkg_resources._vendor'),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    # Excluir drivers de Chromium — se descargan en runtime, no en el bundle
    excludes=[
        'playwright.driver',
        'test',
        'unittest',
        'doctest',
        'pdb',
    ],
    noarchive=False,
    optimize=1,
)

pyz = PYZ(a.pure, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='pablitopyhost',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=['..\\assets\\logo.ico'],
)
