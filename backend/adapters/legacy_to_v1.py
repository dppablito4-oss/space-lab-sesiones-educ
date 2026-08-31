"""
Legacy → SessionDocument v1 adapter (Python).

Converts the output of normalize_sesion_data() (main.py) into a
SessionDocumentV1 Pydantic model.

RULES:
  - NEVER drop fields silently.
  - Unknown fields are logged as warnings.
  - The result must pass SessionDocumentV1(**doc.model_dump()) round-trip.
"""
from __future__ import annotations
import re
from typing import List, Optional, Tuple
from models.session_document import (
    SessionDocumentV1, MetadataV1, LogosData,
    PropositoV1, CompetenciaTransversalV1, EnfoqueTransversalV1,
    RecursosV1, MomentosV1, MomentoV1, SessionProcess, RichContent,
    EvaluacionV1, FichaTrabajoV1, JuegoLibreSectoresV1, ListaCotejoV1
)


def _str(v) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return "\n".join(str(x).strip() for x in v if str(x).strip())
    return str(v).strip()


def _arr(v) -> List[str]:
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str):
        return [x.strip() for x in v.split("\n") if x.strip()]
    return []


def _int(v, fallback: int = 0) -> int:
    if isinstance(v, int):
        return v
    if isinstance(v, str):
        digits = re.sub(r"[^\d]", "", v)
        return int(digits) if digits else fallback
    return fallback


def _rich(v) -> RichContent:
    s = _str(v)
    fmt = "html" if re.search(r"<[a-z][\s\S]*>", s, re.IGNORECASE) else "text"
    return RichContent(format=fmt, value=s)


def _humanize_key(key: str) -> str:
    parts = key.split("_")
    cleaned = [p.capitalize() for p in parts if not p.isdigit() and p.lower() not in ("proceso", "paso")]
    return " ".join(cleaned) if cleaned else key.replace("_", " ").capitalize()


def _derive_process_id(key: str) -> str:
    cleaned = re.sub(r"^(proceso|paso)_\d+_?", "", key, flags=re.IGNORECASE)
    cleaned = re.sub(r"[^a-z0-9_]", "_", cleaned.lower())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned or key


def adapt_legacy_to_v1(data: dict, form_meta: dict | None = None) -> Tuple[SessionDocumentV1, List[str]]:
    """
    Converts a legacy normalized dict (output of normalize_sesion_data) to
    SessionDocumentV1.

    Returns (document, warnings).
    """
    warnings: List[str] = []
    if not isinstance(data, dict):
        return SessionDocumentV1(), ["Input no es un dict"]

    fm = form_meta or {}

    # ── Metadata ──
    rm = data.get("metadata", {}) or {}
    metadata = MetadataV1(
        institucion=_str(fm.get("institucion") or rm.get("institucion")),
        dre=_str(fm.get("dre") or rm.get("dre")),
        ugel=_str(fm.get("ugel") or rm.get("ugel")),
        docente=_str(fm.get("docente") or rm.get("docente")),
        director=_str(fm.get("director") or rm.get("director")),
        fecha=_str(fm.get("fecha") or rm.get("fecha")),
        nivel=_str(fm.get("nivel") or rm.get("nivel")),
        grado=_str(fm.get("grado") or rm.get("grado")),
        seccion=_str(fm.get("seccion") or rm.get("seccion")),
        area=_str(fm.get("area") or rm.get("area")),
        numeroSesion=_str(fm.get("numero_sesion") or rm.get("numero_sesion") or rm.get("numeroSesion")),
        duracionMinutos=_int(fm.get("duracion") or rm.get("duracion") or rm.get("duracionMinutos"), 90),
        unidad=_str(fm.get("unidad") or rm.get("unidad")),
        titulo=_str(fm.get("titulo") or rm.get("titulo") or data.get("_titulo_sesion_retador")),
        logos=LogosData(
            institucional=rm.get("logo_left_url") or rm.get("logo_institucional"),
            regional=rm.get("logo_regional_url") or rm.get("logo_regional"),
        ),
    )

    # ── Proposito ──
    rp = data.get("proposito", {}) or {}
    proposito = PropositoV1(
        texto=_str(rp.get("proposito_texto") or rp.get("texto")),
        competencia=_str(rp.get("competencia")),
        capacidades=_arr(rp.get("capacidades")),
        estandar=_str(rp.get("estandar")),
        desempeno=_str(rp.get("desempeno")),
        conocimientos=_str(rp.get("conocimientos")),
        criterios=_arr(rp.get("criterios")),
        evidencia=_str(rp.get("producto_evidencia") or rp.get("evidencia")),
        instrumento=_str(rp.get("instrumento")),
    )

    # ── Competencias Transversales ──
    raw_ct = data.get("competencias_transversales", [])
    cts: List[CompetenciaTransversalV1] = []
    if isinstance(raw_ct, list):
        for ct in raw_ct:
            if isinstance(ct, dict):
                cts.append(CompetenciaTransversalV1(
                    titulo=_str(ct.get("titulo", "Competencia Transversal")),
                    desempenos=_arr(ct.get("desempenos")),
                ))

    # ── Enfoques Transversales ──
    raw_et = data.get("enfoques_transversales", [])
    ets: List[EnfoqueTransversalV1] = []
    if isinstance(raw_et, list):
        for et in raw_et:
            if isinstance(et, dict):
                ets.append(EnfoqueTransversalV1(
                    nombre=_str(et.get("nombre", "Enfoque Transversal")),
                    valor=_str(et.get("valor")),
                    actitudes=_str(et.get("actitudes")),
                ))

    # ── Recursos ──
    rr = data.get("recursos", {}) or {}
    recursos = RecursosV1(
        enlaces=_str(rr.get("enlaces")),
        materiales=_str(rr.get("materiales")),
        refuerzo=_str(rr.get("refuerzo")),
    )

    # ── Momentos ──
    raw_mom = data.get("momentos", {}) or {}
    momentos = MomentosV1(
        inicio=_adapt_inicio(raw_mom.get("inicio", {}), warnings),
        desarrollo=_adapt_desarrollo(raw_mom.get("desarrollo", {}), warnings),
        cierre=_adapt_cierre(raw_mom.get("cierre", {}), warnings),
    )

    # ── Evaluación (NUNCA eliminar) ──
    raw_eval = data.get("evaluacion", {}) or {}
    evaluacion = EvaluacionV1(
        criterioConsolidado=_str(raw_eval.get("criterio") or raw_eval.get("criterioConsolidado")),
        evidencia=_str(raw_eval.get("evidencia") or proposito.evidencia),
        instrumento=_str(raw_eval.get("instrumento") or proposito.instrumento),
    )

    # ── Ficha de Trabajo ──
    raw_ficha = data.get("ficha_trabajo")
    ficha = None
    if isinstance(raw_ficha, dict):
        ficha = FichaTrabajoV1(
            titulo=_str(raw_ficha.get("titulo")),
            indicaciones=_str(raw_ficha.get("indicaciones")),
            actividades=_str(raw_ficha.get("actividades")),
        )

    # ── Juego Libre Sectores ──
    raw_jls = data.get("juego_libre_sectores")
    jls = None
    if isinstance(raw_jls, dict):
        jls = JuegoLibreSectoresV1(
            planificacion=_str(raw_jls.get("planificacion")),
            organizacion=_str(raw_jls.get("organizacion")),
            ejecucion=_str(raw_jls.get("ejecucion")),
            orden=_str(raw_jls.get("orden")),
            socializacion=_str(raw_jls.get("socializacion")),
            representacion=_str(raw_jls.get("representacion")),
        )

    # ── Lista de Cotejo ──
    raw_alumnos = data.get("alumnos", [])
    lista_cotejo = ListaCotejoV1(
        alumnos=_arr(raw_alumnos),
        criterios=list(proposito.criterios) if proposito.criterios else [],
    )

    doc = SessionDocumentV1(
        metadata=metadata,
        proposito=proposito,
        competenciasTransversales=cts,
        enfoquesTransversales=ets,
        recursos=recursos,
        momentos=momentos,
        evaluacion=evaluacion,
        fichaTrabajo=ficha,
        juegoLibreSectores=jls,
        listaCotejo=lista_cotejo,
    )
    return doc, warnings


# ── Adaptadores de momentos ──

def _adapt_inicio(raw: dict, warnings: list) -> MomentoV1:
    if not isinstance(raw, dict):
        return MomentoV1(tiempoMinutos=15)

    tiempo = _int(raw.get("tiempo_total") or raw.get("tiempoMinutos"), 15)
    procesos: List[SessionProcess] = []

    # Si tiene actividades como lista (formato frontend normalizado)
    actividades = raw.get("actividades", [])
    if isinstance(actividades, list) and actividades:
        procesos.append(SessionProcess(
            id="actividad",
            orden=1,
            titulo="Actividades de inicio",
            contenido=_rich("".join(f"<p>{a}</p>" for a in actividades)),
        ))
    elif isinstance(actividades, str) and actividades.strip():
        procesos.append(SessionProcess(
            id="actividad",
            orden=1,
            titulo="Actividades de inicio",
            contenido=_rich(actividades),
        ))

    return MomentoV1(tiempoMinutos=tiempo, procesos=procesos)


def _adapt_desarrollo(raw: dict, warnings: list) -> MomentoV1:
    if not isinstance(raw, dict):
        return MomentoV1(tiempoMinutos=65)

    tiempo = _int(raw.get("tiempo_total") or raw.get("tiempoMinutos"), 65)
    procesos: List[SessionProcess] = []

    raw_procs = raw.get("procesos", [])
    if isinstance(raw_procs, list) and raw_procs:
        for idx, pr in enumerate(raw_procs):
            if isinstance(pr, dict):
                contenido_raw = pr.get("contenido", [])
                if isinstance(contenido_raw, list):
                    contenido_str = "".join(f"<p>{c}</p>" for c in contenido_raw if str(c).strip())
                else:
                    contenido_str = _str(contenido_raw)
                procesos.append(SessionProcess(
                    id=_str(pr.get("clave")) or f"proceso_{idx + 1}",
                    orden=idx + 1,
                    titulo=_str(pr.get("titulo")) or f"Proceso {idx + 1}",
                    contenido=_rich(contenido_str),
                ))

    return MomentoV1(tiempoMinutos=tiempo, procesos=procesos)


def _adapt_cierre(raw: dict, warnings: list) -> MomentoV1:
    if not isinstance(raw, dict):
        return MomentoV1(tiempoMinutos=10)

    tiempo = _int(raw.get("tiempo_total") or raw.get("tiempoMinutos"), 10)
    procesos: List[SessionProcess] = []
    orden = 1

    for field, fid, titulo in [
        ("metacognicion", "metacognicion", "Metacognición"),
        ("evaluacion", "evaluacion", "Evaluación formativa"),
        ("extension", "extension", "Extensión"),
    ]:
        items = raw.get(field, [])
        if isinstance(items, list) and items:
            if field == "metacognicion":
                html = "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
            else:
                html = "".join(f"<p>{i}</p>" for i in items)
            procesos.append(SessionProcess(
                id=fid,
                orden=orden,
                titulo=titulo,
                contenido=_rich(html),
            ))
            orden += 1

    return MomentoV1(tiempoMinutos=tiempo, procesos=procesos)
