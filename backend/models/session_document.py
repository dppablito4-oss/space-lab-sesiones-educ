"""
SessionDocument v1 — Modelo Pydantic canónico.

Este modelo representa el contrato único SessionDocument v1 definido en:
  schemas/session-document.v1.schema.json

Es consumido por los renderers (DOCX, PDF) y validado contra el mismo
esquema que usa el frontend (JS).

REGLA: No eliminar campos silenciosamente. Si un campo llega, se conserva.
"""
from __future__ import annotations
from typing import Any, List, Optional, Literal
from pydantic import BaseModel, Field, field_validator


# ── Bloques fundamentales ──

class RichContent(BaseModel):
    """Contenido enriquecido con formato explícito."""
    format: Literal["html", "text"] = "html"
    value: str = ""


class SessionProcess(BaseModel):
    """Proceso pedagógico dentro de un momento (inicio/desarrollo/cierre)."""
    id: str
    orden: Optional[int] = None
    titulo: str
    methodology: Optional[str] = None
    contenido: RichContent = Field(default_factory=lambda: RichContent())


# ── Secciones del documento ──

class LogosData(BaseModel):
    institucional: Optional[str] = None
    regional: Optional[str] = None


class MetadataV1(BaseModel):
    institucion: str = ""
    dre: str = ""
    ugel: str = ""
    docente: str = ""
    director: str = ""
    fecha: str = ""
    nivel: str = ""
    grado: str = ""
    seccion: str = ""
    area: str = ""
    numeroSesion: str = ""
    duracionMinutos: int = 90
    unidad: str = ""
    titulo: str = ""
    logos: LogosData = Field(default_factory=LogosData)

    @field_validator("logos", mode="before")
    @classmethod
    def normalize_legacy_logos(cls, value: Any) -> Any:
        """Accept saved sessions that still store logos as DOM image lists."""
        if value is None:
            return {}
        if isinstance(value, LogosData):
            return value

        def extract_url(item: Any) -> Optional[str]:
            if isinstance(item, str):
                return item or None
            if not isinstance(item, dict):
                return None
            for key in ("url", "src", "data", "value"):
                candidate = item.get(key)
                if isinstance(candidate, str) and candidate:
                    return candidate
                if isinstance(candidate, dict):
                    nested = candidate.get("url") or candidate.get("src")
                    if isinstance(nested, str) and nested:
                        return nested
            return None

        if isinstance(value, dict):
            return {
                "institucional": extract_url(
                    value.get("institucional")
                    or value.get("logo_left_url")
                    or value.get("logo_institucional")
                    or value.get("left")
                ),
                "regional": extract_url(
                    value.get("regional")
                    or value.get("logo_regional_url")
                    or value.get("logo_regional")
                    or value.get("right")
                ),
            }

        if isinstance(value, (list, tuple)):
            normalized = {"institucional": None, "regional": None}
            unassigned = []
            for item in value:
                url = extract_url(item)
                if not url:
                    continue
                item_id = str(item.get("id", "")).lower() if isinstance(item, dict) else ""
                if any(marker in item_id for marker in ("left", "institucional", "marca")):
                    normalized["institucional"] = url
                elif any(marker in item_id for marker in ("right", "regional", "ugel", "dre")):
                    normalized["regional"] = url
                else:
                    unassigned.append(url)
            for key in ("institucional", "regional"):
                if normalized[key] is None and unassigned:
                    normalized[key] = unassigned.pop(0)
            return normalized

        return value


class PropositoV1(BaseModel):
    texto: str = ""
    competencia: str = ""
    capacidades: List[str] = Field(default_factory=list)
    estandar: str = ""
    desempeno: str = ""
    conocimientos: str = ""
    criterios: List[str] = Field(default_factory=list)
    evidencia: str = ""
    instrumento: str = ""


class CompetenciaTransversalV1(BaseModel):
    titulo: str
    desempenos: List[str] = Field(default_factory=list)


class EnfoqueTransversalV1(BaseModel):
    nombre: str
    valor: str = ""
    actitudes: str = ""


class RecursosV1(BaseModel):
    enlaces: str = ""
    materiales: str = ""
    refuerzo: str = ""


class MomentoV1(BaseModel):
    """Momento pedagógico con procesos tipados."""
    tiempoMinutos: int = 0
    procesos: List[SessionProcess] = Field(default_factory=list)


class MomentosV1(BaseModel):
    inicio: MomentoV1 = Field(default_factory=MomentoV1)
    desarrollo: MomentoV1 = Field(default_factory=MomentoV1)
    cierre: MomentoV1 = Field(default_factory=MomentoV1)


class EvaluacionV1(BaseModel):
    criterioConsolidado: str = ""
    evidencia: str = ""
    instrumento: str = ""


class FichaTrabajoV1(BaseModel):
    titulo: str = ""
    indicaciones: str = ""
    actividades: str = ""


class JuegoLibreSectoresV1(BaseModel):
    planificacion: str = ""
    organizacion: str = ""
    ejecucion: str = ""
    orden: str = ""
    socializacion: str = ""
    representacion: str = ""


class ListaCotejoV1(BaseModel):
    alumnos: List[str] = Field(default_factory=list)
    criterios: List[str] = Field(default_factory=list)


class PresentationV1(BaseModel):
    """Visual tokens shared by browser, Word and PDF renderers."""
    preset: Literal["minedu", "institucional", "moderno", "clasico", "accesible"] = "minedu"
    primaryColor: str = Field(default="#000000", pattern=r"^#[0-9A-Fa-f]{6}$")
    accentColor: str = Field(default="#C0392B", pattern=r"^#[0-9A-Fa-f]{6}$")
    headerBackground: str = Field(default="#BDD6EE", pattern=r"^#[0-9A-Fa-f]{6}$")
    fontFamily: Literal["Arial", "Calibri", "Georgia", "Times New Roman", "Courier New"] = "Arial"
    fontSizePt: float = Field(default=10, ge=8, le=12)
    cellPadding: Literal["compact", "standard", "comfortable", "spacious"] = "standard"
    lineHeight: float = Field(default=1.15, ge=1, le=1.8)


# ── Documento raíz ──

class SessionDocumentV1(BaseModel):
    """
    SessionDocument v1 — Fuente de verdad canónica.

    Todos los renderers (Web, PDF, DOCX) consumen esta estructura.
    No se permiten normalizaciones destructivas después de la validación.
    """
    schemaVersion: Literal["1.0"] = "1.0"
    metadata: MetadataV1 = Field(default_factory=MetadataV1)
    proposito: PropositoV1 = Field(default_factory=PropositoV1)
    competenciasTransversales: List[CompetenciaTransversalV1] = Field(default_factory=list)
    enfoquesTransversales: List[EnfoqueTransversalV1] = Field(default_factory=list)
    recursos: RecursosV1 = Field(default_factory=RecursosV1)
    momentos: MomentosV1 = Field(default_factory=MomentosV1)
    evaluacion: EvaluacionV1 = Field(default_factory=EvaluacionV1)
    fichaTrabajo: Optional[FichaTrabajoV1] = None
    juegoLibreSectores: Optional[JuegoLibreSectoresV1] = None
    listaCotejo: ListaCotejoV1 = Field(default_factory=ListaCotejoV1)
    presentation: PresentationV1 = Field(default_factory=PresentationV1)
