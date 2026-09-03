import os
import re
import sys
import json
import socket
import secrets
import asyncio
import webbrowser
import threading
import time
import warnings
import urllib.parse
import urllib.request
import zipfile
import tkinter as tk
from tkinter import scrolledtext
from pathlib import Path
from typing import List, Optional

# Determinar base absoluta del ejecutable para portabilidad
if getattr(sys, 'frozen', False):
    EXE_DIR = Path(sys.executable).parent
    BASE_DIR = Path(sys._MEIPASS)
else:
    EXE_DIR = Path(__file__).resolve().parent
    BASE_DIR = EXE_DIR.parent

LOCAL_BIN_DIR = EXE_DIR / "bin"
CHROMIUM_DIR = LOCAL_BIN_DIR / "chrome-win"
CHROMIUM_EXE = CHROMIUM_DIR / "chrome.exe"

# Desactivar advertencias molestas en la consola (como DeprecationWarnings de FastAPI/Lifespan)
warnings.filterwarnings("ignore")

# Configurar consola en Windows para UTF-8 de forma forzada para evitar fallos con emojis/bloques
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from docx_builder import build_docx_from_json, build_docx_from_html
from docx_builder_v1 import build_docx_from_v1
from adapters.legacy_to_v1 import adapt_legacy_to_v1
from models.session_document import SessionDocumentV1

# Librerías para estilizar consola
try:
    from rich import print as rprint
    from rich.console import Console
    console = Console()
except ImportError:
    # Fallback si no está instalado rich
    console = None
    def rprint(*args, **kwargs):
        print(*args, **kwargs)

# Inicialización de FastAPI
app = FastAPI(
    title="Motor de Exportación Pedagógica",
    description="Backend local para generación premium de PDFs y Word (.docx)"
)

ALLOWED_ORIGINS = {
    "https://sesiones.sypablitodp.site",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
}
LOCAL_ORIGIN_PATTERN = r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$"
MAX_REQUEST_BYTES = 25 * 1024 * 1024

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_origin_regex=LOCAL_ORIGIN_PATTERN,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

@app.middleware("http")
async def protect_local_engine(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_REQUEST_BYTES:
                return Response("Solicitud demasiado grande.", status_code=413)
        except ValueError:
            return Response("Content-Length inválido.", status_code=400)

    response = await call_next(request)
    origin = request.headers.get("origin", "")
    if origin in ALLOWED_ORIGINS or re.fullmatch(LOCAL_ORIGIN_PATTERN, origin):
        response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

# Variables globales para el enlace de sesión
if getattr(sys, 'frozen', False):
    TOKEN_FILE = EXE_DIR / "connection_token.txt"
else:
    TOKEN_FILE = BASE_DIR / "connection_token.txt"

# The token gets rotated only after this process has confirmed that it owns the
# single-instance mutex and that port 8000 is free.  Rotating it at import time
# made a second launch invalidate the token of the instance already running.
CONNECTION_TOKEN = secrets.token_hex(32)
CLIENT_CONNECTED = False
LOCAL_ENGINE_URL = "http://127.0.0.1:8000"
PAIRING_PAGE_URL = "https://sesiones.sypablitodp.site/conexion.html"
_SINGLE_INSTANCE_MUTEX = None


def pairing_url(token: Optional[str] = None) -> str:
    """Build the public pairing URL for the current or supplied token."""
    active_token = token or CONNECTION_TOKEN
    return f"{PAIRING_PAGE_URL}?token={urllib.parse.quote(active_token)}"


def rotate_and_store_connection_token() -> str:
    """Create the token for a new server instance and persist it when possible."""
    global CONNECTION_TOKEN
    CONNECTION_TOKEN = secrets.token_hex(32)
    try:
        TOKEN_FILE.write_text(CONNECTION_TOKEN, encoding="utf-8")
    except Exception:
        # The GUI still exposes the in-memory pairing URL if the executable
        # directory is read-only.
        pass
    return CONNECTION_TOKEN


def read_stored_connection_token() -> Optional[str]:
    """Read a token written by the instance that currently owns the server."""
    try:
        token = TOKEN_FILE.read_text(encoding="utf-8").strip()
    except (OSError, UnicodeError):
        return None
    return token if re.fullmatch(r"[0-9a-f]{64}", token) else None


def local_port_is_busy() -> bool:
    """Return whether a process is already listening on the engine port."""
    try:
        with socket.create_connection(("127.0.0.1", 8000), timeout=0.35):
            return True
    except OSError:
        return False


def running_engine_accepts(token: Optional[str] = None) -> bool:
    """Identify our local engine and, when supplied, validate its token."""
    try:
        with urllib.request.urlopen(f"{LOCAL_ENGINE_URL}/", timeout=0.75) as response:
            status = json.loads(response.read().decode("utf-8"))
        if status.get("engine") != "FastAPI + Python Export Engine":
            return False
        if token is None:
            return True
        encoded_token = urllib.parse.quote(token)
        with urllib.request.urlopen(
            f"{LOCAL_ENGINE_URL}/verificar-token?token={encoded_token}", timeout=0.75
        ) as response:
            verification = json.loads(response.read().decode("utf-8"))
        return verification.get("status") == "Connected"
    except (OSError, ValueError, UnicodeError):
        return False


def acquire_single_instance_mutex() -> bool:
    """Acquire a Windows mutex held for the lifetime of the desktop process."""
    global _SINGLE_INSTANCE_MUTEX
    if not sys.platform.startswith("win"):
        return True

    import ctypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel32.CreateMutexW.argtypes = (ctypes.c_void_p, ctypes.c_bool, ctypes.c_wchar_p)
    kernel32.CreateMutexW.restype = ctypes.c_void_p
    kernel32.CloseHandle.argtypes = (ctypes.c_void_p,)
    kernel32.CloseHandle.restype = ctypes.c_bool

    handle = kernel32.CreateMutexW(None, False, "Local\\SYPablitoDP.ExportEngine")
    if not handle:
        raise ctypes.WinError(ctypes.get_last_error())
    if ctypes.get_last_error() == 183:  # ERROR_ALREADY_EXISTS
        kernel32.CloseHandle(handle)
        return False

    _SINGLE_INSTANCE_MUTEX = handle
    return True


def show_startup_message(title: str, message: str, *, error: bool = False) -> None:
    """Show a small native message without creating a second application window."""
    from tkinter import messagebox

    root = tk.Tk()
    root.withdraw()
    try:
        if error:
            messagebox.showerror(title, message, parent=root)
        else:
            messagebox.showinfo(title, message, parent=root)
    finally:
        root.destroy()


def open_existing_pairing_page() -> bool:
    """Open the valid link belonging to an engine that is already online."""
    token = read_stored_connection_token()
    if not token or not running_engine_accepts(token):
        return False
    webbrowser.open(pairing_url(token))
    return True

# ── NORMALIZACIÓN Y MAPEO DE LLAVES DE ENTRADA (ADAPTADOR JSON) ──
def standardize_key(k: str) -> str:
    # 1. Minúsculas y limpieza
    k = k.lower().strip()
    # 2. Normalizar acentos y caracteres españoles comunes
    k = k.replace('ñ', 'n')
    k = k.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    k = k.replace('ü', 'u')
    # 3. Reemplazar cualquier caracter no alfanumérico con guion bajo
    k = re.sub(r'[^a-z0-9_]', '_', k)
    # 4. Colapsar guiones bajos múltiples
    k = re.sub(r'_+', '_', k)
    # 5. Eliminar guiones bajos al inicio o al final
    k = k.strip('_')
    return k

def clean_and_map_dict(data: dict, schema_map: dict) -> dict:
    if not isinstance(data, dict):
        return data
    cleaned = {}
    for k, v in data.items():
        sk = standardize_key(k)
        mapped_key = schema_map.get(sk, sk)
        cleaned[mapped_key] = v
    return cleaned

TOP_LEVEL_MAP = {
    'metadata': 'metadata',
    'proposito': 'proposito',
    'propositos': 'proposito',
    'proposito_aprendizaje': 'proposito',
    'propositos_aprendizaje': 'proposito',
    'competencias_transversales': 'competencias_transversales',
    'competenciastransversales': 'competencias_transversales',
    'enfoques_transversales': 'enfoques_transversales',
    'enfoquestransversales': 'enfoques_transversales',
    'enfoques': 'enfoques_transversales',
    'recursos': 'recursos',
    'recursos_materiales': 'recursos',
    'materiales_recursos': 'recursos',
    'momentos': 'momentos',
    'momentos_didacticos': 'momentos',
    'secuencia_didactica': 'momentos',
    'secuencia': 'momentos',
    'momentos_de_la_sesion': 'momentos',
    'ficha_trabajo': 'ficha_trabajo',
    'fichatrabajo': 'ficha_trabajo',
    'ficha_de_trabajo': 'ficha_trabajo',
    'ficha': 'ficha_trabajo',
    'juego_libre_sectores': 'juego_libre_sectores',
    'juego_libre': 'juego_libre_sectores',
    'juego_libre_en_los_sectores': 'juego_libre_sectores',
    'juego_libre_en_sectores': 'juego_libre_sectores',
    'alumnos': 'alumnos',
    'estudiantes': 'alumnos',
    'lista_alumnos': 'alumnos',
    'lista_estudiantes': 'alumnos',
    'lista_de_cotejo': 'alumnos',
    'titulo_sesion_retador': '_titulo_sesion_retador',
    'titulo_sesion': '_titulo_sesion_retador',
    'evaluacion': 'evaluacion',
    'token': 'token'
}

METADATA_MAP = {
    'institucion': 'institucion',
    'institucion_educativa': 'institucion',
    'institucioneducativa': 'institucion',
    'ie': 'institucion',
    'i_e': 'institucion',
    'colegio': 'institucion',
    'dre': 'dre',
    'd_r_e': 'dre',
    'ugel': 'ugel',
    'u_g_e_l': 'ugel',
    'docente': 'docente',
    'profesor': 'docente',
    'profesora': 'docente',
    'maestro': 'docente',
    'maestra': 'docente',
    'director': 'director',
    'directora': 'director',
    'director_ie': 'director',
    'director_de_la_ie': 'director',
    'fecha': 'fecha',
    'date': 'fecha',
    'nivel': 'nivel',
    'level': 'nivel',
    'numero_sesion': 'numero_sesion',
    'sesion_numero': 'numero_sesion',
    'numero_de_sesion': 'numero_sesion',
    'n_sesion': 'numero_sesion',
    'grado': 'grado',
    'grade': 'grado',
    'seccion': 'seccion',
    'sección': 'seccion',
    'section': 'seccion',
    'area': 'area',
    'curso': 'area',
    'materia': 'area',
    'duracion': 'duracion',
    'duracion_minutos': 'duracion',
    'tiempo': 'duracion',
    'unidad': 'unidad',
    'unidad_proyecto': 'unidad',
    'proyecto': 'unidad',
    'nombre_unidad': 'unidad',
    'titulo': 'titulo',
    'titulo_sesion': 'titulo',
    'nombre_sesion': 'titulo',
    'logo_left_url': 'logo_left_url',
    'logo_left': 'logo_left_url',
    'logo_institucional': 'logo_left_url',
    'logo_regional_url': 'logo_regional_url',
    'logo_regional': 'logo_regional_url',
    'logo_right': 'logo_regional_url',
    'logo_ugel': 'logo_regional_url',
    'logo_dre': 'logo_regional_url'
}

PROPOSITO_MAP = {
    'proposito_texto': 'proposito_texto',
    'proposito': 'proposito_texto',
    'proposito_sesion': 'proposito_texto',
    'proposito_de_la_sesion': 'proposito_texto',
    'conocimientos': 'conocimientos',
    'contenido': 'conocimientos',
    'contenidos': 'conocimientos',
    'temas': 'conocimientos',
    'tema': 'conocimientos',
    'conocimiento': 'conocimientos',
    'conocimientos_clave': 'conocimientos',
    'competencia': 'competencia',
    'competencias': 'competencia',
    'estandar': 'estandar',
    'estandar_aprendizaje': 'estandar',
    'estandar_de_aprendizaje': 'estandar',
    'capacidades': 'capacidades',
    'capacidad': 'capacidades',
    'criterios': 'criterios',
    'criterio': 'criterios',
    'criterios_evaluacion': 'criterios',
    'criterio_evaluacion': 'criterios',
    'criterios_de_evaluacion': 'criterios',
    'criterios_eval': 'criterios',
    'producto_evidencia': 'producto_evidencia',
    'evidencia': 'producto_evidencia',
    'evidencias': 'producto_evidencia',
    'producto': 'producto_evidencia',
    'productos': 'producto_evidencia',
    'evidencia_aprendizaje': 'producto_evidencia',
    'producto_aprendizaje': 'producto_evidencia',
    'evidencia_de_aprendizaje': 'producto_evidencia',
    'producto_o_evidencia': 'producto_evidencia',
    'instrumento': 'instrumento',
    'instrumentos': 'instrumento',
    'instrumento_evaluacion': 'instrumento',
    'instrumentos_evaluacion': 'instrumento',
    'instrumento_de_evaluacion': 'instrumento',
    'instrumentos_de_evaluacion': 'instrumento',
    'desempeno': 'desempeno',
    'desempeño': 'desempeno',
    'desempenos': 'desempeno',
    'desempeños': 'desempeno',
    'desempeno_grado': 'desempeno',
    'desempeño_grado': 'desempeno',
    'desempeno_del_grado': 'desempeno',
    'desempeño_del_grado': 'desempeno',
    'desempenos_precisados': 'desempeno',
    'desempeños_precisados': 'desempeno'
}

COMPETENCIA_TRANSVERSAL_MAP = {
    'titulo': 'titulo',
    'nombre': 'titulo',
    'competencia': 'titulo',
    'desempenos': 'desempenos',
    'desempeños': 'desempenos',
    'desempeno': 'desempenos',
    'desempeño': 'desempenos',
    'desempenos_precisados': 'desempenos',
    'desempeños_precisados': 'desempenos',
    'criterios': 'desempenos',
    'criterios_evaluacion': 'desempenos'
}

ENFOQUE_TRANSVERSAL_MAP = {
    'nombre': 'nombre',
    'enfoque': 'nombre',
    'titulo': 'nombre',
    'valor': 'valor',
    'valores': 'valor',
    'actitudes': 'actitudes',
    'actitud': 'actitudes',
    'acciones_observables': 'actitudes',
    'acciones': 'actitudes',
    'actitudes_o_acciones_observables': 'actitudes',
    'actitudes_observables': 'actitudes'
}

RECURSOS_MAP = {
    'enlaces': 'enlaces',
    'enlace': 'enlaces',
    'links': 'enlaces',
    'link': 'enlaces',
    'paginas_web': 'enlaces',
    'paginas_consulta': 'enlaces',
    'paginas_de_consulta': 'enlaces',
    'paginas_de_texto': 'enlaces',
    'paginas_de_texto_consulta': 'enlaces',
    'referencias': 'enlaces',
    'bibliografia': 'enlaces',
    'materiales': 'materiales',
    'recursos': 'materiales',
    'materiales_recursos': 'materiales',
    'materiales_y_recursos': 'materiales',
    'materiales_y_recursos_educativos': 'materiales',
    'recursos_educativos': 'materiales',
    'refuerzo': 'refuerzo',
    'reforzamiento': 'refuerzo',
    'actividades_refuerzo': 'refuerzo',
    'actividades_de_refuerzo': 'refuerzo',
    'actividades_de_refuerzo_escolar': 'refuerzo',
    'refuerzo_escolar': 'refuerzo'
}

JUEGO_LIBRE_MAP = {
    'planificacion': 'planificacion',
    'planificación': 'planificacion',
    'organizacion': 'organizacion',
    'organización': 'organizacion',
    'ejecucion': 'ejecucion',
    'ejecución': 'ejecucion',
    'orden': 'orden',
    'socializacion': 'socializacion',
    'socialización': 'socializacion',
    'representacion': 'representacion',
    'representación': 'representacion'
}

MOMENTO_INICIO_MAP = {
    'tiempo_total': 'tiempo_total',
    'tiempo': 'tiempo_total',
    'duracion': 'tiempo_total',
    'tiempo_inicio': 'tiempo_total',
    'minutos': 'tiempo_total',
    'actividades': 'actividades',
    'secuencia': 'actividades',
    'estrategias': 'actividades',
    'procesos': 'actividades',
    'estrategias_inicio': 'actividades'
}

PROCESO_DESARROLLO_MAP = {
    'clave': 'clave',
    'key': 'clave',
    'id': 'clave',
    'titulo': 'titulo',
    'nombre': 'titulo',
    'proceso': 'titulo',
    'contenido': 'contenido',
    'contenidos': 'contenido',
    'actividades': 'contenido',
    'descripcion': 'contenido',
    'texto': 'contenido'
}

MOMENTO_DESARROLLO_MAP = {
    'tiempo_total': 'tiempo_total',
    'tiempo': 'tiempo_total',
    'duracion': 'tiempo_total',
    'tiempo_desarrollo': 'tiempo_total',
    'procesos': 'procesos',
    'procesos_didacticos': 'procesos',
    'actividades': 'procesos',
    'processes': 'procesos'
}

MOMENTO_CIERRE_MAP = {
    'tiempo_total': 'tiempo_total',
    'tiempo': 'tiempo_total',
    'duracion': 'tiempo_total',
    'tiempo_cierre': 'tiempo_total',
    'metacognicion': 'metacognicion',
    'metacognición': 'metacognicion',
    'preguntas_metacognicion': 'metacognicion',
    'preguntas_de_metacognicion': 'metacognicion',
    'reflexion': 'metacognicion',
    'reflexión': 'metacognicion',
    'evaluacion': 'evaluacion',
    'evaluación': 'evaluacion',
    'evaluacion_formativa': 'evaluacion',
    'evaluación_formativa': 'evaluacion',
    'extension': 'extension',
    'extensión': 'extension',
    'extension_para_casa': 'extension',
    'extension_casa': 'extension',
    'tarea': 'extension',
    'tarea_casa': 'extension',
    'casa': 'extension',
    'actividad_extension': 'extension'
}

MOMENTOS_MAP = {
    'inicio': 'inicio',
    'introduccion': 'inicio',
    'desarrollo': 'desarrollo',
    'proceso': 'desarrollo',
    'cuerpo': 'desarrollo',
    'cierre': 'cierre',
    'conclusion': 'cierre'
}

FICHA_TRABAJO_MAP = {
    'titulo': 'titulo',
    'actividad': 'titulo',
    'nombre': 'titulo',
    'indicaciones': 'indicaciones',
    'indicacion': 'indicaciones',
    'instrucciones': 'indicaciones',
    'actividades': 'actividades',
    'contenido': 'actividades',
    'ejercicios': 'actividades'
}

def _humanize_key(k: str) -> str:
    """Convierte 'proceso_1_familiarizacion' -> 'Familiarizacion'."""
    parts = k.split('_')
    cleaned = [p.capitalize() for p in parts if not p.isdigit() and p.lower() not in ('proceso', 'paso')]
    return ' '.join(cleaned) if cleaned else k.replace('_', ' ').capitalize()

def _flatten_sub_momentos_inicio(inicio_dict: dict) -> list:
    """Convierte sub-momentos del inicio (motivacion, saberes_previos, etc.) en lista de actividades."""
    sub_keys = ['motivacion', 'saberes_previos', 'problematizacion', 'proposito_organizacion']
    labels = {
        'motivacion': 'Motivacion',
        'saberes_previos': 'Saberes previos',
        'problematizacion': 'Problematizacion',
        'proposito_organizacion': 'Proposito y organizacion'
    }
    actividades = []
    for sk in sub_keys:
        val = inicio_dict.get(sk) or inicio_dict.get(standardize_key(sk))
        if val and isinstance(val, str) and val.strip():
            actividades.append(f"{labels.get(sk, sk)}: {val.strip()}")
    return actividades

def _extract_flat_procesos(desarrollo_dict: dict) -> list:
    """Extrae llaves planas proceso_X_... del desarrollo y las convierte en lista de procesos."""
    procs = []
    proc_keys = sorted(
        [k for k in desarrollo_dict if re.match(r'^proceso_\d+', k) or re.match(r'^paso_\d+', k)],
        key=lambda x: int(re.search(r'\d+', x).group()) if re.search(r'\d+', x) else 0
    )
    for pk in proc_keys:
        val = desarrollo_dict[pk]
        titulo = _humanize_key(pk)
        contenido = []
        if isinstance(val, str):
            contenido = [x.strip() for x in val.split('\n') if x.strip()]
            if not contenido:
                contenido = [val.strip()]
        elif isinstance(val, list):
            contenido = [str(x).strip() for x in val if str(x).strip()]
        procs.append({
            'clave': pk,
            'titulo': titulo,
            'contenido': contenido
        })
    return procs

def _split_cierre_actividades(text: str) -> dict:
    """Divide el texto plano de cierre.actividades en metacognicion, evaluacion y extension."""
    meta, evalu, ext = [], [], []
    current = meta
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
        ll = line.lower()
        if 'metacognici' in ll:
            current = meta
        elif 'evaluaci' in ll:
            current = evalu
        elif 'extensi' in ll or 'tarea' in ll or 'casa' in ll:
            current = ext
        clean = re.sub(r'^[•\-\*\d\.\)]+\s*', '', line).strip()
        if clean:
            current.append(clean)
    # Si no se pudo dividir, todo va a metacognicion
    if not meta and not evalu and not ext:
        meta = [x.strip() for x in text.split('\n') if x.strip()]
    return {'metacognicion': meta, 'evaluacion': evalu, 'extension': ext}

def normalize_sesion_data(data: dict) -> dict:
    if not isinstance(data, dict):
        return {}
    
    # 1. Normalizar llaves de nivel superior
    data = clean_and_map_dict(data, TOP_LEVEL_MAP)

    # 1b. Mover titulo_sesion_retador a metadata.titulo si existe
    titulo_retador = data.pop('_titulo_sesion_retador', None)
    
    # 2. Normalizar metadata
    metadata_raw = data.get('metadata')
    if isinstance(metadata_raw, dict):
        metadata_clean = clean_and_map_dict(metadata_raw, METADATA_MAP)
    else:
        metadata_clean = {}
    # Aplicar titulo_sesion_retador como fallback para titulo
    if titulo_retador and not metadata_clean.get('titulo'):
        metadata_clean['titulo'] = titulo_retador
    data['metadata'] = metadata_clean

    # 3. Normalizar proposito
    proposito_raw = data.get('proposito')
    if isinstance(proposito_raw, dict):
        proposito_clean = clean_and_map_dict(proposito_raw, PROPOSITO_MAP)
        # Asegurar que los campos tipo lista sean listas
        for list_field in ['capacidades', 'criterios']:
            if list_field in proposito_clean:
                val = proposito_clean[list_field]
                if isinstance(val, str):
                    proposito_clean[list_field] = [x.strip() for x in val.split('\n') if x.strip()]
                elif not isinstance(val, list):
                    proposito_clean[list_field] = []
            else:
                proposito_clean[list_field] = []
        if 'desempeno' in proposito_clean:
            if isinstance(proposito_clean['desempeno'], list):
                proposito_clean['desempeno'] = '\n'.join([str(x) for x in proposito_clean['desempeno']])
            elif proposito_clean['desempeno'] is not None:
                proposito_clean['desempeno'] = str(proposito_clean['desempeno']).strip()
        if 'conocimientos' in proposito_clean:
            if isinstance(proposito_clean['conocimientos'], list):
                proposito_clean['conocimientos'] = '\n'.join([str(x) for x in proposito_clean['conocimientos']])
            elif proposito_clean['conocimientos'] is not None:
                proposito_clean['conocimientos'] = str(proposito_clean['conocimientos']).strip()
    else:
        proposito_clean = {'capacidades': [], 'criterios': []}
    data['proposito'] = proposito_clean
    cts_raw = data.get('competencias_transversales', [])
    cts_clean = []
    if isinstance(cts_raw, dict):
        # FORMATO IA: convertir objeto {tic: [...], autonoma: [...]} a lista
        tic_items = cts_raw.get('tic', []) or cts_raw.get('TIC', []) or []
        autonoma_items = cts_raw.get('autonoma', []) or cts_raw.get('gestiona_aprendizaje', []) or []
        if tic_items:
            if isinstance(tic_items, str):
                tic_items = [x.strip() for x in tic_items.split('\n') if x.strip()]
            cts_clean.append({
                'titulo': 'Se desenvuelve en los entornos virtuales generados por las TIC',
                'desempenos': tic_items if isinstance(tic_items, list) else []
            })
        if autonoma_items:
            if isinstance(autonoma_items, str):
                autonoma_items = [x.strip() for x in autonoma_items.split('\n') if x.strip()]
            cts_clean.append({
                'titulo': 'Gestiona su aprendizaje de manera autonoma',
                'desempenos': autonoma_items if isinstance(autonoma_items, list) else []
            })
    elif isinstance(cts_raw, list):
        # FORMATO FRONTEND: ya viene como lista de objetos
        for ct in cts_raw:
            if isinstance(ct, dict):
                ct_clean = clean_and_map_dict(ct, COMPETENCIA_TRANSVERSAL_MAP)
                if 'desempenos' in ct_clean:
                    val = ct_clean['desempenos']
                    if isinstance(val, str):
                        ct_clean['desempenos'] = [x.strip() for x in val.split('\n') if x.strip()]
                    elif not isinstance(val, list):
                        ct_clean['desempenos'] = []
                else:
                    ct_clean['desempenos'] = []
                if 'titulo' not in ct_clean or not ct_clean['titulo']:
                    ct_clean['titulo'] = "Competencia Transversal"
                cts_clean.append(ct_clean)
    data['competencias_transversales'] = cts_clean

    # 5. Normalizar enfoques_transversales
    ets_raw = data.get('enfoques_transversales', [])
    ets_clean = []
    if isinstance(ets_raw, list):
        for et in ets_raw:
            if isinstance(et, dict):
                et_clean = clean_and_map_dict(et, ENFOQUE_TRANSVERSAL_MAP)
                if 'nombre' not in et_clean or not et_clean['nombre']:
                    et_clean['nombre'] = "Enfoque Transversal"
                if 'valor' not in et_clean or not et_clean['valor']:
                    et_clean['valor'] = ""
                if 'actitudes' not in et_clean or not et_clean['actitudes']:
                    et_clean['actitudes'] = ""
                ets_clean.append(et_clean)
    data['enfoques_transversales'] = ets_clean

    # 6. Normalizar recursos
    recursos_raw = data.get('recursos')
    if isinstance(recursos_raw, dict):
        recursos_clean = clean_and_map_dict(recursos_raw, RECURSOS_MAP)
    else:
        recursos_clean = {}
    data['recursos'] = recursos_clean

    # 7. Normalizar momentos
    momentos_raw = data.get('momentos')
    if isinstance(momentos_raw, dict):
        momentos_clean = clean_and_map_dict(momentos_raw, MOMENTOS_MAP)
        
        # 7a. Inicio — soportar sub-momentos de la IA
        inicio_raw = momentos_clean.get('inicio')
        if isinstance(inicio_raw, dict):
            inicio_clean = clean_and_map_dict(inicio_raw, MOMENTO_INICIO_MAP)
            # Verificar si hay sub-momentos de la IA (motivacion, saberes_previos, etc.)
            sub_actividades = _flatten_sub_momentos_inicio(inicio_clean)
            if 'actividades' in inicio_clean:
                val = inicio_clean['actividades']
                if isinstance(val, str):
                    inicio_clean['actividades'] = [x.strip() for x in val.split('\n') if x.strip()]
                elif not isinstance(val, list):
                    inicio_clean['actividades'] = []
            else:
                inicio_clean['actividades'] = []
            # Si se encontraron sub-momentos y actividades esta vacia, usar sub-momentos
            if sub_actividades and not inicio_clean['actividades']:
                inicio_clean['actividades'] = sub_actividades
        else:
            inicio_clean = {'actividades': []}
        momentos_clean['inicio'] = inicio_clean

        # 7b. Desarrollo — soportar llaves planas proceso_X_... de la IA
        desarrollo_raw = momentos_clean.get('desarrollo')
        if isinstance(desarrollo_raw, dict):
            desarrollo_clean = clean_and_map_dict(desarrollo_raw, MOMENTO_DESARROLLO_MAP)
            procs_raw = desarrollo_clean.get('procesos', [])
            procs_clean = []
            if isinstance(procs_raw, list) and len(procs_raw) > 0:
                # FORMATO FRONTEND: ya viene como lista de objetos
                for pr in procs_raw:
                    if isinstance(pr, dict):
                        pr_clean = clean_and_map_dict(pr, PROCESO_DESARROLLO_MAP)
                        if 'clave' not in pr_clean or not pr_clean['clave']:
                            pr_clean['clave'] = secrets.token_hex(4)
                        if 'titulo' not in pr_clean or not pr_clean['titulo']:
                            pr_clean['titulo'] = "Proceso"
                        if 'contenido' in pr_clean:
                            val = pr_clean['contenido']
                            if isinstance(val, str):
                                pr_clean['contenido'] = [x.strip() for x in val.split('\n') if x.strip()]
                            elif not isinstance(val, list):
                                pr_clean['contenido'] = []
                        else:
                            pr_clean['contenido'] = []
                        procs_clean.append(pr_clean)
            else:
                # FORMATO IA: extraer llaves planas proceso_X_...
                procs_clean = _extract_flat_procesos(desarrollo_clean)
            desarrollo_clean['procesos'] = procs_clean
            # Limpiar llaves planas residuales del dict
            keys_to_remove = [k for k in list(desarrollo_clean.keys()) if re.match(r'^proceso_\d+', k) or re.match(r'^paso_\d+', k)]
            for k in keys_to_remove:
                del desarrollo_clean[k]
        else:
            desarrollo_clean = {'procesos': []}
        momentos_clean['desarrollo'] = desarrollo_clean

        # 7c. Cierre — soportar texto plano en 'actividades' de la IA
        cierre_raw = momentos_clean.get('cierre')
        if isinstance(cierre_raw, dict):
            cierre_clean = clean_and_map_dict(cierre_raw, MOMENTO_CIERRE_MAP)
            # Verificar si la IA mando un solo campo 'actividades' como texto plano
            actividades_text = cierre_clean.pop('actividades', None) if 'actividades' in cierre_clean else None
            for list_field in ['metacognicion', 'evaluacion', 'extension']:
                if list_field in cierre_clean:
                    val = cierre_clean[list_field]
                    if isinstance(val, str):
                        cierre_clean[list_field] = [x.strip() for x in val.split('\n') if x.strip()]
                    elif not isinstance(val, list):
                        cierre_clean[list_field] = []
                else:
                    cierre_clean[list_field] = []
            # Si hay texto en actividades y las listas estan vacias, dividir
            if actividades_text and isinstance(actividades_text, str):
                has_content = bool(cierre_clean.get('metacognicion') or cierre_clean.get('evaluacion') or cierre_clean.get('extension'))
                if not has_content:
                    split = _split_cierre_actividades(actividades_text)
                    cierre_clean['metacognicion'] = split['metacognicion']
                    cierre_clean['evaluacion'] = split['evaluacion']
                    cierre_clean['extension'] = split['extension']
        else:
            cierre_clean = {'metacognicion': [], 'evaluacion': [], 'extension': []}
        momentos_clean['cierre'] = cierre_clean
    else:
        momentos_clean = {
            'inicio': {'actividades': []},
            'desarrollo': {'procesos': []},
            'cierre': {'metacognicion': [], 'evaluacion': [], 'extension': []}
        }
    data['momentos'] = momentos_clean

    # 8. Normalizar ficha_trabajo
    ficha_raw = data.get('ficha_trabajo')
    if isinstance(ficha_raw, dict):
        ficha_clean = clean_and_map_dict(ficha_raw, FICHA_TRABAJO_MAP)
    else:
        ficha_clean = None
    data['ficha_trabajo'] = ficha_clean

    # 9. Normalizar juego_libre_sectores
    jls_raw = data.get('juego_libre_sectores')
    if isinstance(jls_raw, dict):
        jls_clean = clean_and_map_dict(jls_raw, JUEGO_LIBRE_MAP)
    else:
        jls_clean = None
    data['juego_libre_sectores'] = jls_clean

    # 10. Normalizar alumnos
    alumnos_raw = data.get('alumnos', [])
    if isinstance(alumnos_raw, list):
        data['alumnos'] = [str(x) for x in alumnos_raw]
    else:
        data['alumnos'] = []

    # 11. Token
    if 'token' not in data:
        data['token'] = ""

    # Limpiar campos internos temporales
    data.pop('evaluacion', None)

    return data

# Esquemas de Datos con Token obligatorio para mayor seguridad
class ExportPDFRequest(BaseModel):
    html_content: str
    titulo: str = "Sesion_de_Aprendizaje"
    token: str

class ExportDocxRequest(BaseModel):
    html_content: str
    titulo: str = "Sesion_de_Aprendizaje"
    token: str

# ── MODELO DE DATOS JSON ESTRUCTURADO PARA SESIONES PREMIUM ──
class MetadataData(BaseModel):
    institucion: Optional[str] = ""
    dre: Optional[str] = ""
    ugel: Optional[str] = ""
    docente: Optional[str] = ""
    director: Optional[str] = ""
    fecha: Optional[str] = ""
    nivel: Optional[str] = ""
    numero_sesion: Optional[str] = ""
    grado: Optional[str] = ""
    seccion: Optional[str] = ""
    area: Optional[str] = ""
    duracion: Optional[str] = ""
    unidad: Optional[str] = ""
    titulo: Optional[str] = ""
    logo_left_url: Optional[str] = ""
    logo_regional_url: Optional[str] = ""

class PropositoData(BaseModel):
    proposito_texto: Optional[str] = ""
    conocimientos: Optional[str] = ""
    competencia: Optional[str] = ""
    estandar: Optional[str] = ""
    desempeno: Optional[str] = ""
    capacidades: List[str] = Field(default_factory=list)
    criterios: List[str] = Field(default_factory=list)
    producto_evidencia: Optional[str] = ""
    instrumento: Optional[str] = ""

class CompetenciaTransversal(BaseModel):
    titulo: str
    desempenos: List[str] = Field(default_factory=list)

class EnfoqueTransversal(BaseModel):
    nombre: str
    valor: str
    actitudes: str

class RecursosData(BaseModel):
    enlaces: Optional[str] = ""
    materiales: Optional[str] = ""
    refuerzo: Optional[str] = ""

class MomentoInicio(BaseModel):
    tiempo_total: Optional[str] = ""
    actividades: List[str] = Field(default_factory=list)

class ProcesoDesarrollo(BaseModel):
    clave: str
    titulo: str
    contenido: List[str] = Field(default_factory=list)

class MomentoDesarrollo(BaseModel):
    tiempo_total: Optional[str] = ""
    procesos: List[ProcesoDesarrollo] = Field(default_factory=list)

class MomentoCierre(BaseModel):
    tiempo_total: Optional[str] = ""
    metacognicion: List[str] = Field(default_factory=list)
    evaluacion: List[str] = Field(default_factory=list)
    extension: List[str] = Field(default_factory=list)

class MomentosData(BaseModel):
    inicio: MomentoInicio
    desarrollo: MomentoDesarrollo
    cierre: MomentoCierre

class FichaTrabajoData(BaseModel):
    titulo: Optional[str] = ""
    indicaciones: Optional[str] = ""
    actividades: Optional[str] = ""

class JuegoLibreSectoresData(BaseModel):
    planificacion: Optional[str] = ""
    organizacion: Optional[str] = ""
    ejecucion: Optional[str] = ""
    orden: Optional[str] = ""
    socializacion: Optional[str] = ""
    representacion: Optional[str] = ""

class SesionAprendizajeRequest(BaseModel):
    metadata: MetadataData
    proposito: PropositoData
    competencias_transversales: List[CompetenciaTransversal] = Field(default_factory=list)
    enfoques_transversales: List[EnfoqueTransversal] = Field(default_factory=list)
    recursos: RecursosData
    momentos: MomentosData
    ficha_trabajo: Optional[FichaTrabajoData] = None
    juego_libre_sectores: Optional[JuegoLibreSectoresData] = None
    alumnos: List[str] = Field(default_factory=list)
    presentation: dict = Field(default_factory=dict)
    token: str


@app.get("/")
def check_status():
    """Endpoint de control para verificar si el servidor local está activo."""
    return {
        "status": "Online",
        "engine": "FastAPI + Python Export Engine",
        "connected": CLIENT_CONNECTED
    }


@app.get("/verificar-token")
def verificar_token(token: str):
    """Verifica si el token proveído coincide con el de la sesión actual."""
    global CLIENT_CONNECTED
    if token == CONNECTION_TOKEN:
        if not CLIENT_CONNECTED:
            CLIENT_CONNECTED = True
            print("\n⚡ [CONEXIÓN ESTABLECIDA] El navegador se ha enlazado con éxito.\n")
        return {"status": "Connected", "message": "Enlace establecido correctamente."}
    else:
        raise HTTPException(status_code=401, detail="Token de conexión inválido.")


@app.post("/exportar-pdf")
async def exportar_pdf(payload: ExportPDFRequest):
    """
    Exporta el HTML y CSS recibido a un archivo PDF físico A4
    utilizando Playwright (Chromium headless) con paginado dinámico y reglas anti-corte de tablas.
    """
    if payload.token != CONNECTION_TOKEN:
        raise HTTPException(status_code=401, detail="No autorizado: Token de conexión inválido.")

    try:
        # Sanitizar el nombre del archivo
        filename = re.sub(r'[^a-zA-Z0-9-_\s]', '', payload.titulo).replace(' ', '_')
        nombre_archivo = f"{filename}.pdf"

        # HTML base mínimo — el frontend ya trae el HTML pre-paginado en divs .hoja-a4
        documento_completo = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{payload.titulo}</title>
            <style>
                /* Glue CSS mínimo: el frontend es responsable del diseño y la paginación */
                * {{ box-sizing: border-box; margin: 0; padding: 0; }}
                body {{
                    background: #fff;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }}
                /* Garantizar salto de página después de cada hoja */
                .hoja-a4 {{
                    page-break-after: always !important;
                    break-after: page !important;
                }}
                /* Ocultar elementos interactivos residuales */
                .no-print, .add-logo-placeholder, .btn-remove-logo {{
                    display: none !important;
                }}
            </style>
        </head>
        <body>
            {payload.html_content}
        </body>
        </html>
        """

        async with async_playwright() as p:
            ruta_motor = buscar_navegador_compatible()
            launch_args = {"headless": True}
            if ruta_motor:
                launch_args["executable_path"] = ruta_motor
            browser = await p.chromium.launch(**launch_args)
            context = await browser.new_context()
            page = await context.new_page()
            
            await page.set_content(documento_completo, wait_until="networkidle")
            
            # Usar prefer_css_page_size=True → Chromium respeta la medida exacta del div .hoja-a4
            # Los márgenes van en cero porque el padding ya está definido en el div
            pdf_bytes = await page.pdf(
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
                display_header_footer=False
            )
            await browser.close()

        if console:
            console.print(f"[green]✓ [PDF EXPORTADO] Generado con éxito: {nombre_archivo}[/green]")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={nombre_archivo}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        print("[ERROR PDF]", str(e))
        raise HTTPException(status_code=500, detail=f"Fallo al compilar PDF: {str(e)}")


def escape_html(text: str) -> str:
    """Escapa caracteres HTML básicos."""
    if not text:
        return ""
    return (text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace('"', "&quot;")
                .replace("'", "&#x27;"))


RICH_HTML_TAGS = {
    "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "div", "span"
}


def sanitize_rich_html(value: str) -> str:
    """Conserva el HTML pedagógico básico sin permitir contenido ejecutable."""
    if not value:
        return ""
    soup = BeautifulSoup(str(value), "html.parser")
    for unsafe in soup.find_all(["script", "style", "iframe", "object", "embed", "link", "meta"]):
        unsafe.decompose()
    for tag in list(soup.find_all(True)):
        if tag.name not in RICH_HTML_TAGS:
            tag.unwrap()
            continue
        clean_attrs = {}
        for name in ("colspan", "rowspan"):
            raw = tag.attrs.get(name)
            if raw and str(raw).isdigit():
                clean_attrs[name] = str(raw)
        style = str(tag.attrs.get("style", ""))
        if style and not re.search(r"url\s*\(|expression\s*\(|javascript:|@import", style, re.I):
            clean_attrs["style"] = style
        tag.attrs = clean_attrs
    return str(soup)


def render_rich_paragraph(value: str) -> str:
    rendered = sanitize_rich_html(value)
    if not rendered:
        return ""
    if re.search(r"<\s*(?:p|ul|ol|table|div)\b", rendered, re.I):
        return rendered
    return f"<p class='proceso-parrafo'>{rendered}</p>"


def build_pdf_html_from_json(session: SesionAprendizajeRequest) -> str:
    presentation = session.presentation or {}
    def css_color(value, fallback):
        value = str(value or '').upper()
        return value if re.fullmatch(r'#[0-9A-F]{6}', value) else fallback
    def bounded_float(value, fallback, minimum, maximum):
        try:
            return max(minimum, min(maximum, float(value)))
        except (TypeError, ValueError):
            return fallback
    primary = css_color(presentation.get('primaryColor'), '#000000')
    accent = css_color(presentation.get('accentColor'), '#C0392B')
    header_bg = css_color(presentation.get('headerBackground'), '#BDD6EE')
    font_family = presentation.get('fontFamily', 'Arial')
    if font_family not in {'Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New'}:
        font_family = 'Arial'
    font_size = bounded_float(presentation.get('fontSizePt'), 10, 8, 12)
    line_height = bounded_float(presentation.get('lineHeight'), 1.15, 1, 1.8)
    cell_padding = {'compact': '2px 4px', 'standard': '4px 6px', 'comfortable': '6px 8px', 'spacious': '8px 10px'}.get(presentation.get('cellPadding'), '4px 6px')
    # 1. Cabecera con logos si existen
    logo_left_html = ""
    if session.metadata.logo_left_url:
        logo_left_html = f'<img src="{session.metadata.logo_left_url}" class="header-logo-img" />'

    logo_right_html = ""
    if session.metadata.logo_regional_url:
        logo_right_html = f'<img src="{session.metadata.logo_regional_url}" class="header-logo-img" />'

    # 2. Listas de propósitos
    capacidades_html = "".join([f"<li>{escape_html(c)}</li>" for c in session.proposito.capacidades])
    criterios_html = "".join([f"<li>{escape_html(c)}</li>" for c in session.proposito.criterios])

    # 3. Competencias transversales
    ct_rows_html = ""
    if session.competencias_transversales:
        for ct in session.competencias_transversales:
            desempenos_li = "".join([f"<li>{escape_html(d)}</li>" for d in ct.desempenos])
            ct_rows_html += f"""
            <tr>
                <td style="font-weight: 600;">{escape_html(ct.titulo)}</td>
                <td><ul class="session-list">{desempenos_li}</ul></td>
            </tr>
            """

    # 4. Enfoques transversales
    enfoques_rows_html = ""
    if session.enfoques_transversales:
        for enf in session.enfoques_transversales:
            enfoques_rows_html += f"""
            <tr>
                <td style="font-weight: 600;">{escape_html(enf.nombre)}</td>
                <td>{escape_html(enf.valor)}</td>
                <td>{escape_html(enf.actitudes)}</td>
            </tr>
            """

    # 5. Momentos Didácticos (Fusión inteligente con rowspan en HTML)
    procesos_des = session.momentos.desarrollo.processes if hasattr(session.momentos.desarrollo, 'processes') else session.momentos.desarrollo.procesos
    cant_procesos = len(procesos_des) if procesos_des else 1

    # Inicio
    inicio_actividades_html = "".join(render_rich_paragraph(act) for act in session.momentos.inicio.actividades)
    
    # Desarrollo (Primer proceso y siguientes)
    desarrollo_primero_html = ""
    desarrollo_siguientes_html = ""
    
    if procesos_des:
        p_primero = procesos_des[0]
        p_primero_cont = "".join(render_rich_paragraph(par) for par in p_primero.contenido)
        desarrollo_primero_html = f"""
        <div class="proceso-titulo">{escape_html(p_primero.titulo)}</div>
        {p_primero_cont}
        """
        
        for idx in range(1, cant_procesos):
            p_sig = procesos_des[idx]
            p_sig_cont = "".join(render_rich_paragraph(par) for par in p_sig.contenido)
            desarrollo_siguientes_html += f"""
            <tr>
                <td>
                    <div class="proceso-titulo">{escape_html(p_sig.titulo)}</div>
                    {p_sig_cont}
                </td>
            </tr>
            """
    else:
        desarrollo_primero_html = "<p class='proceso-parrafo'>Gestión y Acompañamiento del Desarrollo de Competencias...</p>"

    # Cierre
    cierre_estrategias_html = ""
    if session.momentos.cierre.metacognicion:
        cierre_estrategias_html += "<p class='proceso-parrafo'><strong>Metacognición:</strong></p><ul class='session-list'>"
        cierre_estrategias_html += "".join([f"<li>{sanitize_rich_html(m)}</li>" for m in session.momentos.cierre.metacognicion])
        cierre_estrategias_html += "</ul>"
    if session.momentos.cierre.evaluacion:
        cierre_estrategias_html += "<p class='proceso-parrafo' style='margin-top:8px;'><strong>Evaluación formativa:</strong></p><ul class='session-list'>"
        cierre_estrategias_html += "".join([f"<li>{sanitize_rich_html(e)}</li>" for e in session.momentos.cierre.evaluacion])
        cierre_estrategias_html += "</ul>"
    if session.momentos.cierre.extension:
        cierre_estrategias_html += "<p class='proceso-parrafo' style='margin-top:8px;'><strong>Extensión para casa:</strong></p><ul class='session-list'>"
        cierre_estrategias_html += "".join([f"<li>{sanitize_rich_html(ext)}</li>" for ext in session.momentos.cierre.extension])
        cierre_estrategias_html += "</ul>"

    # Ficha de Trabajo
    ficha_html = ""
    if session.ficha_trabajo:
        ficha_actividades_p = sanitize_rich_html(session.ficha_trabajo.actividades or "")
        
        ficha_html = f"""
        <div class="hoja-a4" style="page-break-before: always; break-before: page;">
            <div class="ficha-title">FICHA DE TRABAJO INDEPENDIENTE PARA EL ESTUDIANTE</div>
            
            <table class="ficha-header-table">
                <tr>
                    <td>Nombre: __________________________________________________</td>
                    <td style="text-align: right;">Grado y Sección: ________________</td>
                </tr>
            </table>
            
            <div class="ficha-act-title">🎨 Actividad: {escape_html(session.ficha_trabajo.titulo or 'Mi Ficha Práctica')}</div>
            <div class="ficha-indicaciones">
                <strong>Indicaciones: </strong><span>{escape_html(session.ficha_trabajo.indicaciones or 'Realiza la actividad según las indicaciones.')}</span>
            </div>
            
            <div class="ficha-contenido">
                {ficha_actividades_p}
            </div>
        </div>
        """

    # 5.5. Construir la Lista de Cotejo dinámica basada en la lista de alumnos
    alumnos_list = session.alumnos if session.alumnos else []
    if not alumnos_list:
        alumnos_list = [f"Estudiante {i+1}" for i in range(30)]

    criterios = session.proposito.criterios if session.proposito.criterios else []
    if not criterios:
        criterios = [
            "Expresa con diversas representaciones la comprensión sobre el tema.",
            "Ordena y organiza conceptos clave para resolver problemas.",
            "Emplea estrategias y procedimientos diversos para realizar las tareas.",
            "Halla y valida soluciones utilizando criterios y conocimientos del área."
        ]

    criterios_headers_html = "".join([
        f"<th colspan='2' style='font-size: 7.5pt; font-weight: bold; background: #e2e8f0; border: 1px solid #000; padding: 4px; text-align: center; vertical-align: top; max-width: 150px;'>{escape_html(c)}</th>"
        for c in criterios
    ])

    criterios_subheaders_html = "".join([
        "<th style='width: 30px; text-align: center; background: #f1f5f9; border: 1px solid #000; font-size: 8pt; font-weight: bold;'>SI</th><th style='width: 30px; text-align: center; background: #f1f5f9; border: 1px solid #000; font-size: 8pt; font-weight: bold;'>NO</th>"
        for _ in criterios
    ])

    rows_html = ""
    for idx, stud in enumerate(alumnos_list):
        display_name = "" if stud.startswith("Estudiante ") else stud
        criterios_cells_html = "".join([
            "<td style='border: 1px solid #000;'></td><td style='border: 1px solid #000;'></td>"
            for _ in criterios
        ])
        rows_html += f"""
        <tr>
            <td style="text-align: center; font-weight: 700; height: 26px; border: 1px solid #000; font-size: 8.5pt;">{idx + 1}</td>
            <td style="text-align: left; padding-left: 6px; font-weight: 600; border: 1px solid #000; font-size: 8.5pt;">{escape_html(display_name)}</td>
            {criterios_cells_html}
        </tr>
        """

    lista_cotejo_html = f"""
    <div class="hoja-a4" style="page-break-before: always; break-before: page; padding: 18mm 12mm;">
        <div class="section-title" style="text-align: center; font-size: 11pt; font-weight: 800; text-transform: uppercase;">Instrumento de Evaluación</div>
        <div class="section-title" style="text-align: center; font-size: 9.5pt; font-weight: 700; background: #f1f5f9; color: #000; margin-top: 4px;">
            LISTA DE COTEJO {escape_html(session.metadata.grado or '2°')} {escape_html(session.metadata.seccion or 'A')}
        </div>
        
        <table class="content-table momentos-table" style="width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000;">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 30px; text-align: center; background: #e2e8f0; border: 1px solid #000; font-size: 8.5pt;">N°</th>
                    <th rowspan="2" style="text-align: left; padding-left: 6px; background: #e2e8f0; border: 1px solid #000; font-size: 8.5pt;">ESTUDIANTES</th>
                    {criterios_headers_html}
                </tr>
                <tr>
                    {criterios_subheaders_html}
                </tr>
            </thead>
            <tbody>
                {rows_html}
            </tbody>
        </table>
    </div>
    """

    # 6. HTML final unificado
    html_content = f"""<!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <!-- Cargar MathJax para renderizar ecuaciones matemáticas en el PDF -->
        <script>
            window.MathJax = {{
                tex: {{
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true
                }},
                options: {{
                    ignoreHtmlClass: 'tex2jax_ignore',
                    processHtmlClass: 'tex2jax_process'
                }},
                svg: {{
                    fontCache: 'global'
                }}
            }};
        </script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
            
            * {{ box-sizing: border-box; margin: 0; padding: 0; }}
            body {{
                font-family: '{font_family}', Arial, sans-serif;
                background: #ffffff;
                color: {primary};
                font-size: {font_size}pt;
                line-height: {line_height};
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }}

            @page {{
                size: A4 portrait;
                margin: 0 !important;
            }}

            .hoja-a4 {{
                width: 210mm;
                height: 297mm;
                min-height: 297mm;
                max-height: 297mm;
                padding: 18mm 12mm;
                box-sizing: border-box;
                background: #ffffff;
                position: relative;
                page-break-after: always;
                break-after: page;
                overflow: hidden;
            }}

            /* Cabecera */
            .header-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 8px;
            }}
            .header-table td {{
                border: none !important;
                padding: 0;
                vertical-align: middle;
            }}
            .header-logos {{
                width: 70px;
            }}
            .header-logo-img {{
                max-width: 65px;
                max-height: 65px;
                object-fit: contain;
            }}
            .header-text {{
                text-align: center;
                font-size: 7.5pt;
                line-height: 1.25;
                color: #334155;
            }}
            .header-text .minedu {{
                font-weight: 700;
                font-size: 8pt;
                color: #0f172a;
            }}
            .header-text .dre, .header-text .ugel {{
                font-weight: 600;
                font-size: 8pt;
            }}
            .header-text .agp {{
                font-style: italic;
                color: #64748b;
            }}

            .divider {{
                border-bottom: 2px solid {primary};
                margin-top: 4px;
                margin-bottom: 12px;
            }}

            .title-box {{
                text-align: center;
                margin-bottom: 12px;
            }}
            .title-box h1 {{
                font-size: 13pt;
                font-weight: 700;
                margin: 0;
                color: #0f172a;
                text-transform: uppercase;
            }}
            .title-box h2 {{
                font-size: 10.5pt;
                font-weight: 600;
                font-style: italic;
                margin: 2px 0 0 0;
                color: #334155;
            }}

            /* Tablas */
            table.content-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                page-break-inside: auto;
            }}
            table.content-table tr {{
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }}
            table.content-table th, table.content-table td {{
                border: 1px solid {primary};
                padding: {cell_padding};
                font-size: 9pt;
                vertical-align: top;
            }}
            table.content-table th {{
                background-color: {header_bg};
                font-weight: 600;
                text-align: left;
                color: #0f172a;
            }}
            table.content-table td.label-cell {{
                background-color: #f8fafc;
                font-weight: 600;
                color: #334155;
                width: 140px;
            }}

            .section-title {{
                font-size: 10.5pt;
                font-weight: 700;
                color: #0f172a;
                margin: 12px 0 4px 0;
                text-transform: uppercase;
                border-left: 3px solid {accent};
                padding-left: 6px;
            }}

            .section-content {{
                font-size: 9.5pt;
                color: #334155;
                padding-left: 4px;
                margin-bottom: 10px;
            }}

            /* Listas */
            ul.session-list {{
                margin: 0;
                padding-left: 14px;
            }}
            ul.session-list li {{
                margin-bottom: 2px;
            }}

            /* Momentos didácticos */
            .momentos-table th {{
                background-color: {header_bg} !important;
                font-size: 8.5pt !important;
                text-align: center !important;
            }}
            .momento-label-cell {{
                background-color: #f8fafc;
                font-weight: 700;
                font-size: 9pt;
                color: #0f172a;
                width: 120px;
            }}
            .momento-time {{
                font-size: 7.5pt;
                color: {accent};
                margin-top: 4px;
                font-weight: 600;
            }}
            .momento-eval-cell {{
                background-color: #f8fafc;
                font-weight: 600;
                font-size: 8pt;
                color: #475569;
                width: 95px;
            }}
            .proceso-titulo {{
                font-weight: 700;
                color: {accent};
                font-size: 8.5pt;
                text-transform: uppercase;
                margin-bottom: 4px;
            }}
            .proceso-parrafo {{
                margin: 0 0 4px 0;
                font-size: 9pt;
            }}

            /* Firmas */
            .firmas-container {{
                display: flex;
                justify-content: space-between;
                margin-top: 35px;
                padding: 0 30px;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }}
            .firma-box {{
                text-align: center;
                width: 180px;
            }}
            .firma-linea {{
                border-top: 1px solid #475569;
                margin-bottom: 4px;
            }}
            .firma-nombre {{
                font-weight: 600;
                font-size: 8.5pt;
                color: #0f172a;
            }}
            .firma-cargo {{
                font-size: 7.5pt;
                color: #64748b;
            }}

            /* Ficha de trabajo */
            .ficha-title {{
                text-align: center;
                font-size: 11pt;
                font-weight: 700;
                color: #0f172a;
                margin-top: 5px;
                margin-bottom: 15px;
                text-transform: uppercase;
            }}
            .ficha-header-table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 12px;
            }}
            .ficha-header-table td {{
                border-bottom: 2px solid #3498db;
                padding: 5px 0;
                font-weight: 600;
                font-size: 9pt;
                color: #2c3e50;
            }}
            .ficha-act-title {{
                font-size: 10.5pt;
                font-weight: 700;
                color: #2980b9;
                margin-top: 12px;
                margin-bottom: 4px;
            }}
            .ficha-indicaciones {{
                font-size: 9pt;
                margin-bottom: 10px;
            }}
            .ficha-indicaciones strong {{
                color: #0f172a;
            }}
            .ficha-indicaciones span {{
                font-style: italic;
                color: #555;
            }}
            .ficha-contenido {{
                font-size: 9pt;
                color: #334155;
                white-space: pre-wrap;
            }}
        </style>
    </head>
    <body>
        <div class="hoja-a4">
            <!-- ════════ CABECERA INSTITUCIONAL ════════ -->
            <!-- ════════ CABECERA INSTITUCIONAL ════════ -->
            <div style="display: flex; justify-content: center; width: 100%; margin-bottom: 6px; padding: 4px 0;">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAAAdiAAAHYgE4epnbAAAFWmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTA2LTEzPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkRhdGE+eyZxdW90O2RvYyZxdW90OzomcXVvdDtEQUhHd2FUUEtHMCZxdW90OywmcXVvdDt1c2VyJnF1b3Q7OiZxdW90O1VBR1hDeDFWMUhnJnF1b3Q7LCZxdW90O2JyYW5kJnF1b3Q7OiZxdW90O0NBTlZBIC0gUFJPJnF1b3Q7fTwvQXR0cmliOkRhdGE+CiAgICAgPEF0dHJpYjpFeHRJZD5lODJlNmY3Zi0yOTFiLTQ5MGQtOGE2Zi1mOGZkMTY5ZmQ1NTk8L0F0dHJpYjpFeHRJZD4KICAgICA8QXR0cmliOkZiSWQ+NTI1MjY1OTE0MTc5NTgwPC9BdHRyaWI6RmJJZD4KICAgICA8QXR0cmliOlRvdWNoVHlwZT4yPC9BdHRyaWI6VG91Y2hUeXBlPgogICAgPC9yZGY6bGk+CiAgIDwvcmRmOlNlcT4KICA8L0F0dHJpYjpBZHM+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOmRjPSdodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyc+CiAgPGRjOnRpdGxlPgogICA8cmRmOkFsdD4KICAgIDxyZGY6bGkgeG1sOmxhbmc9J3gtZGVmYXVsdCc+RGlzZcOxbyBzaW4gdMOtdHVsbyAtIDk8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnBkZj0naHR0cDovL25zLmFkb2JlLmNvbS9wZGYvMS4zLyc+CiAgPHBkZjpBdXRob3I+U2FtdWVsIFBhYmxvIENsYXVkaW88L3BkZjpBdXRob3I+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnhtcD0naHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyc+CiAgPHhtcDpDcmVhdG9yVG9vbD5DYW52YSAoUmVuZGVyZXIpIGRvYz1EQUhHd2FUUEtHMCB1c2VyPVVBR1hDeDFWMUhnIGJyYW5kPUNBTlZBIC0gUFJPPC94bXA6Q3JlYXRvclRvb2w+CiA8L3JkZjpEZXNjcmlwdGlvbj4KPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0ncic/PmiaSXQAAABOZVhJZk1NACoAAAAIAAQBGgAFAAAAAQAAAD4BGwAFAAAAAQAAAEYBKAADAAAAAQACAAACEwADAAAAAQABAAAAAAAAAAAAMAAAAAEAAAAwAAAAAUacJ10AAAiQSURBVHic7Zl7jNTVFcfPub/HzPxmZmdmd2aXdbu0JJg0tbWmkWq1plQaE6O2NanEpmmRpEhJW01LbYLFiMjLxEIgSEiDD0xFXsWCJQTpHwUqEfoQqqUKtYpK2de8Z37Pe+/pH7+Z3Xnt7C6uKX94/tnf3Nfvc8/53nPv/S0SEVx5xv7fAK3tE6ypmDqNY7lSFjhP6npzla/fPBdv2N5bLh/iXALqiF8MqDeFA1FFwfr2OI2SP23ZGzO5bVf1KDj2FgK46Hov5c2Xy/aAKz4XCsxS1S6V2ZLe9MRRxwuo8qFocFE8prOxXtPmLSLaXbZfAe1dz5ut6wBQlvLVsr09b1/w+O1GYEMq9tlQgDEEIkT0iQucrxkp/LLofShzK7viWnU+04ZVlnTQ4UOoHjadflXdnS+/ULJ7FeX+uPEVI6CxGgdWHxEgpqqruhM0nNtoiXll8xuRsF81bZI/YztnSSFk+0znguWcK1u/TnY805v4WiSo1zI1mcZwcczoAny2aMmqoqbNWzstRzIVAU9JZivs8U91T77vTF3rU5S/Oo4g8AU2Pd6yhdxrc0AgAJOp+01nSutIRYwrbMSTVFmyHxmLAIjoWNkcYhXHI+B+03WlnPwgAqDAhV4T6Y+EVRbyycH06yXzt2UHsDIUIZ6WcM5xJz9OQcg00ad1dVSEl4lFABdcb8l/h8tSzgzof+QEhADo15Gi7SpZk4/jv11vgOg6XVWqJZeDRQAnTXvJpfSdYeORGclXbWdEUaFuteFem8vJJWoCOGq7JsDckIaXnbck0e5C+elsaU0qfr0RBIR9titQBaIxMsTzqP7FtG8MhyYcsCTEAdNJAd5iBEYLp+Ytj+jJbHFv0XruquSccBARhjzvqB/Bem8BU35vWpMZ86Tp/E3i7ZrSo475aApYHtGKdOFty3u2t7NPrwxxwnYvgQJ+boCqvAAB8IDleRPF0ZFyc9FiAAujQbVmYpPFsiWtGM4XPL65NxFVKtIkooO2x1EBrAFC9B8vMO3vltN+2NdM+xCn2zT8cihQWz4pLIdoTaZQlPRETyLExroMcX6cUwWo8WiCNlMPtcWypXw4Z4YYe7DD0FkdycRYnGhdppDhYm0qZdR3Mu14F6gaukaHISAedjx3nDgSwNZs6STg3SrebAQbaifAkgQbcsXzDl+XiocVVl9FBy3HQ2UsY0GFavTpnMS3nNYOO2s5a0y3V9KyeFht2sonwHoxXzpleVt64hGlsWVByOOerIwwjrJzqJywW6T7kpAPZEpZwscigauDjadZImqHdbJsP5crbUrFOhSlubYg5fty1Dc0RlaDSIz9wxUNHSXR2kz+uMRvKbQgEWk+8yCO760Bj68Yzq7vSfRqLVIuEUlAD+vzAlWZiIAAEBDAkkQ1B3MC2F80N1miX3pPdceU1icxbI1lSbliKPODWPjz9evWN1PKLemcJEkVX9W+lGCUgSoH0dcKxVPFkg93xrJ/ljMZ0dbOSLemjeeUFlhEtCNXCgF+J9bCwzkh7k8X1pse1OncR6nJFGPrEv/DxbcHR960rIuut2ikOAjskUjg1ojR5sjaAus9l+/LlR5OxTXWWDvMxeJ0cRdnyBqvUDUhrP4kAgBOoAJeo2ohYIuGsqeBLdCVHyci44SvYo26kUTLBjJLu2LJJkm97/H7suXjkhEiIgIg+UmLalzVsCYJBNINRuhLRuihbPEVUO9QYV0yGmqacK0JIRur9xdMneHcDgPrZ3PR4/emC8cEEjCfQALR2BUGa//W4FEKMalry7PFlyW7EeT6RPjPpbJou1cqSj21LeXGTHFVKtZ8VdmSL54ChXBMPQQgiEazu78TVvdDACAkmgvigVh40WDmdxKvlWJHMvpopvTDnPme47XBglptEcBLudLXDb0/2Lj6CMBSVN855L8RxrTkJ3l//n4ZAjCS8xXxm0T4V9niHsGuB9rbHXssZ+4kxVO0CaBqtWUL+UKutKkv2VKKAhiQrLqKGFUTKBEAjj75ZTqJJTr+KGL8JF04QvhVBZ9KhB/NlXcIBoAIsp3aG7BOlO0ZCpupt84lNVrwfUYAgFwASqgkVQIgQEySWBnV52jKd0eKbxD7po6rO4w1OXOnVAARiGBCqFEsIjhQKN0Va7FrNnMRyTkM+zRtT6fhIgJWFOUHc5YWfMdx7x4pDqK6UIe1yY5BT/xJMmAM/WMsTcxVwcoLft5xlqbi47VjowlTiu8xsaU7Zijsjli4oZkl5bp0foMlXcLVhvLTrqiOGGfKi3G6J2MPM+bPoO3t338dAAB86HFgkFTHvXH4WYEJsVSDbd3xSNPm7V/R7rmUXm3JGMk/JEI/T3boiACACDeHA4e7gp+Rsnplm+AwXcH6gIuEpgfZuJOQQLoQy4NsVVdUb2rmSLk7V7xlIH+Es9sYHZsRm9cRrr9ywLVG4EjK+IIUNIkwVrCyUupsfCgAg8TqiLKsM9LAJIn+aTv3DWa+X3AdgJWGuqe3c1ZAbznUrKC2Kwam+oZJg2ln1wwHBgJQcoOU6RIAHo0ZS0xo+8w17/Ol8ebPpDQLOY/B4IjLHCGBb3Vwd1Lb3xMLNO2pLrF5N/ZfrDXhef6svnwDQU19eEmJX0dxU9s5KnAm4Narf22E0C66ldWkTN6tgzdZUZOyZXHF5qrPN3k4AaY8/XzC3WfwdwrAUy0L6kkR0hqZOIhlNwSpYfZo6PxR8wuKpbGFRokOtj4QgcoleN53tJWuPIwqKGuW0OAC/6Iz161r7qF2ejX1pznKxYDB/iNN1IO4y9GsCahAgL+FdLs+44oQnLiEGgWYDzQ9qC2NG7zi6nmYsACgJsSldet7hFyVYfgVhkEECoR/o1qA6L6jdFA4Fm25BHy+Wb2mPv+3wD4S0CCIIMxTWpyl9mqK1zSAfO9aVYFfo/3w+wZqK/Q9eFx5GxhfnVwAAAABJRU5ErkJggg==" style="max-height: 48px; width: auto;" alt="Space Lab Logo" />
            </div>
            
            <div class="divider"></div>
            
            <!-- ════════ TÍTULO PRINCIPAL ════════ -->
            <div class="title-box">
                <h1>SESIÓN DE APRENDIZAJE N° {escape_html(session.metadata.numero_sesion) or '01'}</h1>
                <h2>"{escape_html(session.metadata.titulo) or 'Título de la Sesión'}"</h2>
            </div>
            
            <!-- ════════ DATOS GENERALES ════════ -->
            <table class="content-table">
                <tr>
                    <td class="label-cell">Institución Educativa</td>
                    <td colspan="3">{escape_html(session.metadata.institucion)}</td>
                    <td class="label-cell">Nivel</td>
                    <td>{escape_html(session.metadata.nivel)}</td>
                </tr>
                <tr>
                    <td class="label-cell">Docente</td>
                    <td colspan="3">{escape_html(session.metadata.docente)}</td>
                    <td class="label-cell">Área</td>
                    <td>{escape_html(session.metadata.area)}</td>
                </tr>
                <tr>
                    <td class="label-cell">Grado</td>
                    <td>{escape_html(session.metadata.grado)}</td>
                    <td class="label-cell" style="width: 80px;">Sección</td>
                    <td>{escape_html(session.metadata.seccion)}</td>
                    <td class="label-cell">Unidad / Proyecto</td>
                    <td>{escape_html(session.metadata.unidad)}</td>
                </tr>
                <tr>
                    <td class="label-cell">Fecha</td>
                    <td colspan="3">{escape_html(session.metadata.fecha)}</td>
                    <td class="label-cell">Duración</td>
                    <td>{escape_html(session.metadata.duracion)} min</td>
                </tr>
            </table>
            
            <!-- ════════ I. PROPÓSITO ════════ -->
            <div class="section-title">I. Propósito de la Sesión</div>
            <div class="section-content">
                {escape_html(session.proposito.proposito_texto)}
            </div>
            
            <!-- ════════ II. CONOCIMIENTOS ════════ -->
            <div class="section-title">II. Conocimientos</div>
            <div class="section-content">
                {escape_html(session.proposito.conocimientos)}
            </div>
            
            <!-- ════════ III. PROPÓSITOS DE APRENDIZAJE ════════ -->
            <div class="section-title">III. Propósitos de Aprendizaje</div>
            
            <table class="content-table" style="margin-top: 4px;">
                <tr>
                    <td class="label-cell" style="width: 140px;">Competencia</td>
                    <td><strong>{escape_html(session.proposito.competencia)}</strong></td>
                </tr>
                <tr>
                    <td class="label-cell">Estándar de aprendizaje</td>
                    <td style="font-size: 8.5pt; color: #475569;">{escape_html(session.proposito.estandar)}</td>
                </tr>
            </table>
            
            <table class="content-table">
                <thead>
                    <tr>
                        <th>COMPETENCIAS</th>
                        <th>CAPACIDADES</th>
                        <th>CRITERIOS DE EVALUACIÓN</th>
                        <th>PRODUCTO / EVIDENCIA</th>
                        <th>INSTRUMENTOS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="font-weight: 600;">{escape_html(session.proposito.competencia)}</td>
                        <td><ul class="session-list">{capacidades_html}</ul></td>
                        <td><ul class="session-list">{criterios_html}</ul></td>
                        <td>{escape_html(session.proposito.producto_evidencia)}</td>
                        <td>{escape_html(session.proposito.instrumento)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- ════════ COMPETENCIAS TRANSVERSALES ════════ -->
            {"<table class='content-table'><thead><tr><th style='width: 35%'>COMPETENCIAS TRANSVERSALES</th><th>DESEMPEÑOS PRECISADOS / PRODUCTO / INSTRUMENTOS</th></tr></thead><tbody>" + ct_rows_html + "</tbody></table>" if ct_rows_html else ""}
            
            <!-- ════════ ENFOQUES TRANSVERSALES ════════ -->
            {"<table class='content-table'><thead><tr><th style='width: 30%'>ENFOQUES TRANSVERSALES</th><th style='width: 30%'>VALORES</th><th>ACTITUDES OBSERVABLES</th></tr></thead><tbody>" + enfoques_rows_html + "</tbody></table>" if enfoques_rows_html else ""}
            
            <!-- ════════ RECURSOS ════════ -->
            <table class="content-table" style="margin-top: 8px;">
                <tr>
                    <td class="label-cell" style="width: 200px;">Páginas de Texto, otros textos de consulta/Enlaces</td>
                    <td>{escape_html(session.recursos.enlaces)}</td>
                </tr>
                <tr>
                    <td class="label-cell">Materiales y recursos</td>
                    <td>{escape_html(session.recursos.materiales)}</td>
                </tr>
                <tr>
                    <td class="label-cell">Actividades de Refuerzo Escolar</td>
                    <td>{escape_html(session.recursos.refuerzo)}</td>
                </tr>
            </table>
            
            <!-- ════════ IV. SECUENCIA DIDÁCTICA ════════ -->
            <div class="section-title">IV. Secuencia Didáctica (Momentos)</div>
            
            <table class="content-table momentos-table" style="margin-top: 4px;">
                <thead>
                    <tr>
                        <th>MOMENTOS DE LA SESIÓN</th>
                        <th>ESTRATEGIAS / ACTIVIDADES</th>
                        <th>EVALUACIÓN</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- Inicio -->
                    <tr>
                        <td class="momento-label-cell">
                            INICIO
                            <div class="momento-time">TIEMPO: {escape_html(session.momentos.inicio.tiempo_total)} min</div>
                        </td>
                        <td>
                            {inicio_actividades_html}
                        </td>
                        <td class="momento-eval-cell" rowspan="1">
                            EVALUACIÓN FORMATIVA
                        </td>
                    </tr>
                    
                    <!-- Desarrollo (Primer Proceso) -->
                    <tr>
                        <td class="momento-label-cell" rowspan="{cant_procesos}">
                            DESARROLLO
                            <div class="momento-time">TIEMPO: {escape_html(session.momentos.desarrollo.tiempo_total)} min</div>
                        </td>
                        <td>
                            {desarrollo_primero_html}
                        </td>
                        <td class="momento-eval-cell" rowspan="{cant_procesos}">
                            EVALUACIÓN FORMATIVA<br><br>
                            <span style="font-size: 7.5pt; font-weight: normal; color: #64748b;">(Monitoreo activo y retroalimentación)</span>
                        </td>
                    </tr>
                    
                    <!-- Desarrollo (Procesos Siguientes) -->
                    {desarrollo_siguientes_html}
                    
                    <!-- Cierre -->
                    <tr>
                        <td class="momento-label-cell">
                            CIERRE
                            <div class="momento-time">TIEMPO: {escape_html(session.momentos.cierre.tiempo_total)} min</div>
                        </td>
                        <td>
                            {cierre_estrategias_html}
                        </td>
                        <td class="momento-eval-cell">
                            EVALUACIÓN FORMATIVA
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- ════════ FIRMAS ════════ -->
            <div class="firmas-container">
                <div class="firma-box">
                    <div class="firma-linea"></div>
                    <div class="firma-nombre">{escape_html(session.metadata.docente) or 'Docente de la Sesión'}</div>
                    <div class="firma-cargo">Docente de la Sesión</div>
                </div>
                <div class="firma-box">
                    <div class="firma-linea"></div>
                    <div class="firma-nombre">{escape_html(session.metadata.director) or 'Director(a) / Subdirector(a)'}</div>
                    <div class="firma-cargo">Director(a) / Subdirector(a)</div>
                </div>
            </div>
        </div>
        
        <!-- ════════ V. FICHA DE TRABAJO ════════ -->
        {ficha_html}
        
        <!-- ════════ VI. LISTA DE COTEJO ════════ -->
        {lista_cotejo_html}
    </body>
    </html>
    """
    return html_content


def v1_to_legacy_pdf_payload(doc: SessionDocumentV1, token: str) -> dict:
    """Compatibility view for the existing Chromium PDF fallback.

    SessionDocument v1 remains the source of truth; this is only used when
    native Word-to-PDF conversion is unavailable on the local machine.
    """
    def process_text(process):
        return process.contenido.value if process and process.contenido else ""

    def moment(moment):
        return {
            "tiempo_total": f"{moment.tiempoMinutos} min",
            "actividades": [process_text(p) for p in moment.procesos],
            "procesos": [
                {"clave": p.id, "titulo": p.titulo, "contenido": [process_text(p)]}
                for p in moment.procesos
            ]
        }

    def cierre(moment):
        grouped = {"metacognicion": [], "evaluacion": [], "extension": []}
        for process in moment.procesos:
            target = process.id
            if target in {"evaluacion", "evaluacion_formativa"}:
                target = "evaluacion"
            elif target not in {"metacognicion", "extension"}:
                target = "metacognicion"
            grouped[target].append(process_text(process))
        return {
            "tiempo_total": f"{moment.tiempoMinutos} min",
            **grouped,
        }

    metadata = doc.metadata.model_dump()
    metadata.update({
        "numero_sesion": doc.metadata.numeroSesion,
        "duracion": str(doc.metadata.duracionMinutos),
        "logo_left_url": doc.metadata.logos.institucional or "",
        "logo_regional_url": doc.metadata.logos.regional or "",
    })

    return {
        "metadata": metadata,
        "proposito": {
            **doc.proposito.model_dump(),
            "criterios_evaluacion": doc.proposito.criterios,
            "producto_evidencia": doc.proposito.evidencia,
        },
        "competencias_transversales": [item.model_dump() for item in doc.competenciasTransversales],
        "enfoques_transversales": [item.model_dump() for item in doc.enfoquesTransversales],
        "recursos": {
            "paginas_consulta": doc.recursos.enlaces,
            "materiales": doc.recursos.materiales,
            "actividades_refuerzo": doc.recursos.refuerzo,
        },
        "momentos": {
            "inicio": moment(doc.momentos.inicio),
            "desarrollo": moment(doc.momentos.desarrollo),
            "cierre": cierre(doc.momentos.cierre),
        },
        "ficha_trabajo": doc.fichaTrabajo.model_dump() if doc.fichaTrabajo else None,
        "juego_libre_sectores": doc.juegoLibreSectores.model_dump() if doc.juegoLibreSectores else None,
        "alumnos": doc.listaCotejo.alumnos,
        "presentation": doc.presentation.model_dump(),
        "token": token,
    }


@app.post("/exportar-pdf-json")
async def exportar_pdf_json(raw: dict = Body(...)):
    """
    Genera un archivo PDF a partir del JSON estructurado de la sesión de aprendizaje.
    Normaliza cualquier variante de llaves del JSON antes de validar con Pydantic.
    Intenta utilizar la conversión nativa de Word (docx2pdf) si está disponible en Windows,
    y si falla o no está disponible, cae de vuelta al renderizado con Playwright.
    """
    # v1 is the canonical source. The legacy shape below is only needed by
    # the existing Chromium HTML fallback.
    canonical_doc_v1 = None
    if raw.get("schemaVersion") == "1.0":
        token = raw.get("token", "")
        if token != CONNECTION_TOKEN:
            raise HTTPException(status_code=401, detail="No autorizado: Token de conexion invalido.")
        try:
            v1_data = dict(raw)
            v1_data.pop("token", None)
            canonical_doc_v1 = SessionDocumentV1(**v1_data)
            raw = v1_to_legacy_pdf_payload(canonical_doc_v1, token)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"SessionDocument v1 invalido: {exc}")

    # Normalizar y adaptar llaves antes de validar con Pydantic
    normalized = normalize_sesion_data(raw)
    try:
        payload = SesionAprendizajeRequest(**normalized)
    except Exception as ve:
        raise HTTPException(status_code=422, detail=f"Error de validación tras normalización: {str(ve)}")

    if payload.token != CONNECTION_TOKEN:
        raise HTTPException(status_code=401, detail="No autorizado: Token de conexión inválido.")

    try:
        titulo = payload.metadata.titulo or "Sesion_de_Aprendizaje"
        filename = re.sub(r'[^a-zA-Z0-9-_\s]', '', titulo).replace(' ', '_')
        nombre_archivo = f"{filename}.pdf"

        # 1. Intentar conversión nativa Word-to-PDF si estamos en Windows
        if sys.platform.startswith('win'):
            temp_docx = None
            temp_pdf = None
            try:
                from docx2pdf import convert
                
                # Generamos primero el Word perfecto usando la función premium
                docx_stream = (build_docx_from_v1(canonical_doc_v1)
                               if canonical_doc_v1 else build_docx_from_json(payload))
                
                # Crear archivos temporales
                temp_docx = LOCAL_BIN_DIR / f"temp_{secrets.token_hex(4)}_{filename}.docx"
                temp_pdf = LOCAL_BIN_DIR / f"temp_{secrets.token_hex(4)}_{filename}.pdf"
                
                LOCAL_BIN_DIR.mkdir(exist_ok=True)
                with open(temp_docx, "wb") as f:
                    f.write(docx_stream.read())
                    
                if console:
                    console.print(f"[yellow]⚡ Intentando conversión nativa Word-to-PDF para {nombre_archivo}...[/yellow]")
                
                # Ejecutar la conversión de Word en un hilo separado
                await asyncio.to_thread(convert, str(temp_docx), str(temp_pdf))
                
                # Leer los bytes del PDF resultante
                with open(temp_pdf, "rb") as f:
                    pdf_bytes = f.read()
                    
                if console:
                    console.print(f"[green]✓ [PDF PREMIUM CONVERTIDO] Generado vía Word con éxito: {nombre_archivo}[/green]")
                    
                return Response(
                    content=pdf_bytes,
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"attachment; filename={nombre_archivo}",
                        "Access-Control-Expose-Headers": "Content-Disposition"
                    }
                )
            except Exception as word_err:
                if console:
                    console.print(f"[yellow]⚠️ Falló conversión vía Word: {str(word_err)}. Usando fallback de Chromium...[/yellow]")
                else:
                    print(f"[WARN WORD PDF] Falló conversión: {word_err}. Usando fallback...")
            finally:
                for temp_path in (temp_docx, temp_pdf):
                    if temp_path:
                        try:
                            temp_path.unlink(missing_ok=True)
                        except Exception:
                            pass

        # 2. Fallback: Renderizado HTML con Playwright (Chromium headless)
        documento_html = build_pdf_html_from_json(payload)

        async with async_playwright() as p:
            ruta_motor = buscar_navegador_compatible()
            launch_args = {"headless": True}
            if ruta_motor:
                launch_args["executable_path"] = ruta_motor
            browser = await p.chromium.launch(**launch_args)
            context = await browser.new_context()
            page = await context.new_page()
            
            await page.set_content(documento_html, wait_until="networkidle")
            
            # Esperar a que MathJax termine de procesar las fórmulas matemáticas (si está presente)
            try:
                await page.evaluate("() => window.MathJax && window.MathJax.startup && window.MathJax.startup.promise")
            except Exception as e:
                print("[WARN MATHJAX WAIT]", str(e))
            
            # Captura a PDF con Playwright aplicando prefer_css_page_size y márgenes en cero (el diseño ya tiene padding)
            pdf_bytes = await page.pdf(
                print_background=True,
                prefer_css_page_size=True,
                margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
                display_header_footer=False
            )
            await browser.close()

        if console:
            console.print(f"[green]✓ [PDF PREMIUM EXPORTADO] Generado vía Chromium con éxito: {nombre_archivo}[/green]")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={nombre_archivo}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        print("[ERROR PDF JSON]", str(e))
        raise HTTPException(status_code=500, detail=f"Fallo al compilar PDF Premium: {str(e)}")


# ────────────────────────────────────────────────────────────────────────
# UTILIDADES DE CONSTRUCCIÓN DE WORD (.docx) NATIVAS - MOVIDAS A DOCX_BUILDER.PY
# ────────────────────────────────────────────────────────────────────────

@app.post("/exportar-docx")
async def exportar_docx(payload: ExportDocxRequest):
    """
    Convierte el HTML de la sesión en un archivo Word (.docx) nativo.
    Requiere token de conexión.
    """
    if payload.token != CONNECTION_TOKEN:
        raise HTTPException(status_code=401, detail="No autorizado: Token de conexión inválido.")

    try:
        # Sanitizar nombre del archivo
        filename = re.sub(r'[^a-zA-Z0-9-_\s]', '', payload.titulo).replace(' ', '_')
        nombre_archivo = f"{filename}.docx"

        # Compilar archivo DOCX
        docx_stream = build_docx_from_html(payload.html_content)

        if console:
            console.print(f"[blue]✓ [WORD EXPORTADO] Generado con éxito: {nombre_archivo}[/blue]")

        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={nombre_archivo}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        print("[ERROR DOCX]", str(e))
        raise HTTPException(status_code=500, detail=f"Fallo al compilar archivo de Word (.docx): {str(e)}")


@app.post("/exportar-docx-json")
async def exportar_docx_json(raw: dict = Body(...)):
    """
    Exporta una sesión de aprendizaje completa desde JSON a un archivo Word (.docx) nativo premium.
    Normaliza cualquier variante de llaves del JSON antes de validar con Pydantic.
    Requiere token de conexión.
    """
    # SessionDocument v1 is the canonical contract emitted by the frontend.
    # Keep the legacy path below only for imported historical sessions.
    if raw.get("schemaVersion") == "1.0":
        token = raw.get("token", "")
        if token != CONNECTION_TOKEN:
            raise HTTPException(status_code=401, detail="No autorizado: Token de conexión inválido.")
        try:
            v1_payload = dict(raw)
            v1_payload.pop("token", None)
            doc_v1 = SessionDocumentV1(**v1_payload)
            titulo = doc_v1.metadata.titulo or "Sesion_de_Aprendizaje"
            filename = re.sub(r'[^a-zA-Z0-9-_\s]', '', titulo).replace(' ', '_')
            nombre_archivo = f"{filename}.docx"
            docx_stream = build_docx_from_v1(doc_v1)
            return StreamingResponse(
                docx_stream,
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers={
                    "Content-Disposition": f"attachment; filename={nombre_archivo}",
                    "Access-Control-Expose-Headers": "Content-Disposition"
                }
            )
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"SessionDocument v1 inválido: {exc}")

    # Normalizar y adaptar llaves antes de validar con Pydantic
    normalized = normalize_sesion_data(raw)
    try:
        payload = SesionAprendizajeRequest(**normalized)
    except Exception as ve:
        raise HTTPException(status_code=422, detail=f"Error de validación tras normalización: {str(ve)}")

    # ── SessionDocument v1 shadow conversion (preparación para futuro builder v1) ──
    try:
        doc_v1, v1_warnings = adapt_legacy_to_v1(normalized)
        if v1_warnings:
            print(f"[V1 ADAPTER] Warnings: {v1_warnings}")
    except Exception as v1_err:
        print(f"[V1 ADAPTER] Error (non-blocking): {v1_err}")

    if payload.token != CONNECTION_TOKEN:
        raise HTTPException(status_code=401, detail="No autorizado: Token de conexión inválido.")

    try:
        titulo = payload.metadata.titulo or "Sesion_de_Aprendizaje"
        filename = re.sub(r'[^a-zA-Z0-9-_\s]', '', titulo).replace(' ', '_')
        nombre_archivo = f"{filename}.docx"

        # Compilar archivo DOCX usando el generador nativo SessionDocument v1 (con fallback a legacy)
        try:
            docx_stream = build_docx_from_v1(doc_v1)
        except Exception as v1_gen_err:
            print(f"[WARN] Fallback a builder legacy: {v1_gen_err}")
            docx_stream = build_docx_from_json(payload)

        if console:
            console.print(f"[green]✓ [WORD PREMIUM EXPORTADO] Generado nativamente con éxito: {nombre_archivo}[/green]")

        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={nombre_archivo}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )

    except Exception as e:
        print("[ERROR DOCX JSON]", str(e))
        raise HTTPException(status_code=500, detail=f"Fallo al compilar archivo de Word (.docx) nativo: {str(e)}")


# ────────────────────────────────────────────────────────────────────────
# INICIALIZACIÓN, COMPROBACIÓN DE CHROMIUM Y ARRANQUE
# ────────────────────────────────────────────────────────────────────────

def buscar_navegador_compatible():
    """Busca un ejecutable de Chromium en la carpeta local o en el sistema."""
    # 1. Prioridad Máxima: Verificar si ya existe en nuestra carpeta portable './bin'
    if CHROMIUM_EXE.exists():
        return str(CHROMIUM_EXE)

    # 2. Prioridad Secundaria: Buscar navegadores instalados en Windows
    if sys.platform.startswith('win'):
        rutas_sistema = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
        ]
        for ruta in rutas_sistema:
            if Path(ruta).exists():
                return ruta
    return None


def descargar_chromium_nativo():
    """Descarga Chromium usando urllib para no congelar el .exe y muestra barra de progreso."""
    LOCAL_BIN_DIR.mkdir(exist_ok=True)
    zip_path = LOCAL_BIN_DIR / "chromium.zip"
    
    # URL directa de Google APIs (Versión ligera y estable para Windows x64)
    url_chromium = "https://storage.googleapis.com/chromium-browser-snapshots/Win_x64/1182249/chrome-win.zip"

    print("\n⚠️  [MOTOR INCOMPLETO] No se detectó ningún navegador compatible (Chrome/Brave/Edge) ni motor local.")
    print("Iniciando descarga de motor Chromium portable (aprox. 140MB)...")
    
    last_percent = -1
    def progreso_download(block_num, block_size, total_size):
        nonlocal last_percent
        if total_size > 0:
            completed = block_num * block_size
            percent = int((completed / total_size) * 100)
            if percent != last_percent and percent % 5 == 0:  # Cada 5%
                last_percent = percent
                completed_mb = completed / (1024 * 1024)
                total_mb = total_size / (1024 * 1024)
                print(f"Descargando Chromium: {percent}% completado ({completed_mb:.1f} MB de {total_mb:.1f} MB)")

    # Extracción del ZIP de forma nativa
    try:
        urllib.request.urlretrieve(url_chromium, zip_path, reporthook=progreso_download)
        print("✓ Descarga completada. Extrayendo motor portable...")
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(LOCAL_BIN_DIR)
            
        # Eliminar el ZIP basura para ahorrar espacio
        if zip_path.exists():
            os.remove(zip_path)
            
        print("✓ Motor Chromium extraído y listo para usar en ./bin/chrome-win/\n")
    except Exception as e:
        print(f"❌ Error al descargar o extraer Chromium: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """Evento que se dispara al iniciar FastAPI para mostrar la URL de conexión segura en los logs."""
    target_url = pairing_url()
    print(f"🌐 [MOTOR ONLINE] Servidor de exportación corriendo en http://localhost:8000")
    print(f"🔗 [ENLACE SEGURO] URL de vinculación segura:\n{target_url}\n")


class TerminalRedirector:
    def __init__(self, text_widget):
        self.text_widget = text_widget
        self.ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

    def write(self, string):
        clean_string = self.ansi_escape.sub('', string)
        if not clean_string: return
        
        try:
            self.text_widget.configure(state='normal')
            
            # Limitar el historial de la terminal a las últimas 300 líneas para evitar fugas de memoria
            try:
                line_count = int(self.text_widget.index('end-1c').split('.')[0])
                if line_count > 300:
                    self.text_widget.delete('1.0', '100.0') # Borra las primeras 100 líneas antiguas
            except Exception:
                pass

            # Pintar de verde si detecta éxito, rojo si es error, blanco el resto
            tag = "muted"
            if "✓" in clean_string or "ONLINE" in clean_string or "Conectado" in clean_string or "enlazado" in clean_string: tag = "green"
            if "❌" in clean_string or "ERROR" in clean_string or "Fallo" in clean_string: tag = "red"
            
            self.text_widget.insert('end', clean_string, tag)
            self.text_widget.see('end')
            self.text_widget.configure(state='disabled')
        except Exception:
            pass

    def flush(self): pass


def start_gui():
    """Interfaz gráfica ultra-minimalista tipo terminal hacker."""
    root = tk.Tk()
    root.title("S.Y. PABLITO_DP - Servidor Local")
    root.geometry("850x500")
    root.configure(bg="#050505") # Negro profundo
    root.resizable(False, False)

    # Cargar icono si existe
    ico_path = BASE_DIR / "assets" / "logo.ico"
    if not ico_path.exists():
        ico_path = EXE_DIR.parent / "assets" / "logo.ico"
    if ico_path.exists():
        try:
            root.iconbitmap(str(ico_path))
        except Exception:
            pass

    # Interceptar el evento de cierre de ventana para mostrar advertencia
    from tkinter import messagebox
    def on_closing():
        if messagebox.askokcancel("Confirmar Salida", "¿Deseas cerrar el motor de exportación?\n\nSi lo cierras, se desconectará del navegador y no podrás exportar PDFs ni archivos de Word."):
            root.destroy()
            os._exit(0) # Terminar el proceso completo para liberar el puerto 8000
            
    root.protocol("WM_DELETE_WINDOW", on_closing)

    # 1. Widget de Texto Principal (Ocupa toda la ventana, sin bordes)
    terminal = scrolledtext.ScrolledText(
        root, 
        bg="#050505", 
        fg="#e2e8f0", 
        font=("Consolas", 10), 
        relief="flat", 
        bd=0, 
        insertbackground="#e2e8f0",
        highlightthickness=0,
        padx=20,
        pady=20
    )
    terminal.pack(fill="both", expand=True)

    # 2. Configuración de Etiquetas de Color (Sintaxis Hacker)
    terminal.tag_config("magenta", foreground="#d946ef")
    terminal.tag_config("blue", foreground="#3b82f6")
    terminal.tag_config("cyan", foreground="#06b6d4")
    terminal.tag_config("green", foreground="#22c55e")
    terminal.tag_config("yellow", foreground="#eab308")
    terminal.tag_config("red", foreground="#ef4444")
    terminal.tag_config("muted", foreground="#64748b")
    
    # Etiqueta especial para el ENLACE (Puras letritas, pero clickeable)
    terminal.tag_config("link", foreground="#38bdf8", underline=True)
    
    # Eventos del enlace (Cambia el cursor a la manito y abre la web)
    target_url = pairing_url()
    terminal.tag_bind("link", "<Enter>", lambda e: terminal.config(cursor="hand2"))
    terminal.tag_bind("link", "<Leave>", lambda e: terminal.config(cursor="xterm"))
    terminal.tag_bind("link", "<Button-1>", lambda e: webbrowser.open(target_url))

    # 3. El Banner Oficial (Ahora se renderizará perfecto sin cortes)
    banner_magenta = (
        "███████╗     ██╗   ██╗     ██████╗   █████╗  ██████╗  ██╗      ████████╗ ████████╗  ██████╗           ██████╗  ██████╗ \n"
        "██╔════╝     ╚██╗ ██╔╝     ██╔══██╗ ██╔══██╗ ██╔══██╗ ██║      ╚══██╔══╝ ╚══██╔══╝ ██╔═══██╗          ██╔══██╗ ██╔══██╗ \n"
    )
    banner_blue = (
        "███████╗      ╚████╔╝      ██████╔╝ ███████║ ██████╔╝ ██║         ██║       ██║    ██║   ██║          ██║  ██║ ██████╔╝ \n"
        "╚════██║ ██╗   ╚██╔╝   ██╗ ██╔═══╝  ██╔══██║ ██╔══██╗ ██║         ██║       ██║    ██║   ██║          ██║  ██║ ██╔═══╝  \n"
    )
    banner_cyan = (
        "███████║ ╚═╝    ██║    ╚═╝ ██║      ██║  ██║ ██████╔╝ ███████╗ ████████╗    ██║    ╚██████╔╝ ████████╗ ██████╔╝ ██║     \n"
        "╚══════╝        ╚═╝        ╚═╝      ╚═╝  ╚═╝ ╚═════╝  ╚══════╝ ╚══════╝    ╚═╝     ╚═════╝  ╚═══════╝ ╚═════╝  ╚═╝     \n"
    )

    # Insertar el Banner
    terminal.insert("end", banner_magenta, "magenta")
    terminal.insert("end", banner_blue, "blue")
    terminal.insert("end", banner_cyan, "cyan")
    
    # Separador y créditos
    terminal.insert("end", "\n" + "─" * 80 + "\n", "muted")
    terminal.insert("end", "  [ MOTOR DE EXPORTACIÓN REFINADO  ]", "green")
    terminal.insert("end", " | Desarrollado por: Samuel Pablo C.\n", "muted")
    terminal.insert("end", "─" * 80 + "\n\n", "muted")

    # Instrucciones y URL Clickeable
    terminal.insert("end", "[ESTADO] ", "yellow")
    terminal.insert("end", "Esperando vinculación de la web...\n")
    terminal.insert("end", "[ENLACE] ", "cyan")
    terminal.insert("end", "Haz clic en la siguiente URL para autorizar el motor:\n")
    
    # Aquí insertamos la URL pura con la etiqueta 'link'
    terminal.insert("end", f"> {target_url}\n\n", "link")

    sys.stdout = TerminalRedirector(terminal)
    sys.stderr = TerminalRedirector(terminal)
    terminal.configure(state='disabled')

    # 5. Hilo para arrancar FastAPI sin congelar la terminal UI
    def run_server_flow():
        try:
            print("Escaneando motor de renderizado Chromium...")
            motor_valido = buscar_navegador_compatible()
            if not motor_valido:
                descargar_chromium_nativo()
            else:
                print(f"✓ Navegador compatible detectado: {motor_valido}")
            
            print("Iniciando servidor local en el puerto 8000...")
            import uvicorn
            uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning", log_config=None)
        except Exception as e:
            print(f"\n❌ [ERROR CRÍTICO]: {str(e)}")

    threading.Thread(target=run_server_flow, daemon=True).start()
    
    # 6. Actualizar el estado visual cuando se conecte
    def check_connection():
        if CLIENT_CONNECTED:
            terminal.configure(state='normal')
            terminal.insert('end', "\n✓ [CONECTADO] El enlace de seguridad fue establecido con la web sesiones.sypablitodp.site.\n", "green")
            terminal.insert('end', "⚠️  [IMPORTANTE] Mantén esta ventana abierta en segundo plano. Si la cierras, se desconectará del navegador y no podra exportar sus sesiones a menso que abre otra ves el programa.\n\n", "yellow")
            terminal.configure(state='disabled')
            terminal.see('end')
        else:
            root.after(2000, check_connection)

    # 7. Forzar recolección de basura periódica de Python para evitar crecimiento de memoria
    import gc
    def force_gc():
        gc.collect()
        root.after(30000, force_gc)

    root.after(2000, check_connection)
    root.after(30000, force_gc)
    root.mainloop()

def run_desktop_application() -> None:
    """Start one engine instance or reuse the valid instance already running."""
    if running_engine_accepts():
        if open_existing_pairing_page():
            return
        show_startup_message(
            "Motor local ya iniciado",
            "El puerto 8000 ya pertenece al motor local, pero no se pudo recuperar "
            "su token. Cierra todas las ventanas de pablitopyhost.exe y vuelve a abrirlo.",
            error=True,
        )
        return

    if local_port_is_busy():
        show_startup_message(
            "Puerto 8000 ocupado",
            "Otro programa está usando el puerto 8000. Ciérralo y vuelve a iniciar "
            "pablitopyhost.exe.",
            error=True,
        )
        return

    if not acquire_single_instance_mutex():
        # The first instance may still be loading its bundled Python runtime.
        for _ in range(20):
            if open_existing_pairing_page():
                return
            time.sleep(0.25)
        show_startup_message(
            "Motor local iniciándose",
            "El motor local ya se está iniciando. Usa la ventana que está abierta "
            "y espera a que muestre [MOTOR ONLINE].",
        )
        return

    # Close the small race between the initial port check and mutex acquisition.
    if local_port_is_busy():
        show_startup_message(
            "Puerto 8000 ocupado",
            "Otro programa empezó a usar el puerto 8000. Ciérralo y vuelve a iniciar "
            "pablitopyhost.exe.",
            error=True,
        )
        return

    rotate_and_store_connection_token()
    start_gui()


if __name__ == "__main__":
    run_desktop_application()
