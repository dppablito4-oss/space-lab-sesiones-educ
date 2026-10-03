"""
DOCX Builder for PlanningContainer 2.0 (Unidades y Proyectos de Aprendizaje MINEDU / CNEB).

Genera un documento Word (.docx) nativo con formato oficial MINEDU:
  - Formato A4 y cuadrícula estricta de 10,490 twips (sum(cols) = 10490)
  - Paleta institucional calibrada (Peach, Blue Header, Gray Values, Accent)
  - Tablas con bordes negros 0.5pt (sz=4) y encabezados repetidos
  - Matriz curricular completa con competencias, capacidades, estándares y desempeños
  - Secuencia didáctica de sesiones y progresión pedagógica
  - Situación significativa con pregunta retadora destacada
  - Enfoques transversales, recursos, evaluación formativa y firmas
"""
from __future__ import annotations
import io
import sys
from pathlib import Path
from typing import List, Optional

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from models.planning_document import PlanningContainerV2
from docx_builder import (
    set_cell_background,
    set_cell_margins,
    add_table_borders_black,
    set_table_col_widths_and_indent,
    append_html_to_cell_or_paragraph
)


def _resource_root() -> Path:
    frozen_root = getattr(sys, "_MEIPASS", None)
    return Path(frozen_root) if frozen_root else Path(__file__).resolve().parent.parent


def _reference_template_path() -> Optional[Path]:
    assets_dir = _resource_root() / "assets"
    candidates = (
        assets_dir / "templates" / "session_template_v1.docx",
        assets_dir / "sesion plantilla.docx",
    )
    return next((path for path in candidates if path.exists()), None)


def _new_document_from_template() -> Document:
    template_path = _reference_template_path()
    doc = Document(template_path) if template_path else Document()
    body = doc._element.body
    for child in list(body):
        if child.tag != qn("w:sectPr"):
            body.remove(child)
    return doc


def _set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    header = tr_pr.find(qn("w:tblHeader"))
    if header is None:
        header = OxmlElement("w:tblHeader")
        tr_pr.append(header)
    header.set(qn("w:val"), "true")


def _keep_row_together(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def _clean_text(val: Optional[str]) -> str:
    return str(val or "").strip()


def build_docx_from_planning_v2(container: PlanningContainerV2) -> io.BytesIO:
    """Construye un documento .docx nativo oficial a partir de PlanningContainerV2."""
    doc = _new_document_from_template()

    # Configuración de página A4 con márgenes de 0.75 in
    for s in doc.sections:
        s.page_width = Inches(8.27)
        s.page_height = Inches(11.69)
        s.top_margin = Inches(0.75)
        s.bottom_margin = Inches(0.75)
        s.left_margin = Inches(0.75)
        s.right_margin = Inches(0.75)

    # Colores institucionales
    PRIMARY_HEX = "1E3A8A"      # Azul Marino institucional MINEDU
    ACCENT_HEX = "C0392B"       # Rojo guinda MINEDU
    BLUE_HDR = "BDD6EE"         # Azul pastel para cabeceras
    PEACH_HDR = "FCE4D6"        # Melocotón claro para etiquetas y momentos
    GRAY_VAL = "F8FAFC"         # Gris muy tenue para contenido
    YELLOW_HDR = "FFF2CC"       # Amarillo suave para notas o preguntas retadoras

    PRIMARY_RGB = RGBColor(30, 58, 138)
    ACCENT_RGB = RGBColor(192, 57, 43)
    DARK_RGB = RGBColor(30, 41, 59)

    # Estilo base
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(9.5)
    style_normal.font.color.rgb = DARK_RGB

    def _add_section_heading(numeral: str, title: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r_num = p.add_run(f"{numeral}. ")
        r_num.bold = True
        r_num.font.size = Pt(11)
        r_num.font.color.rgb = ACCENT_RGB
        r_tit = p.add_run(title.upper())
        r_tit.bold = True
        r_tit.font.size = Pt(11)
        r_tit.font.color.rgb = PRIMARY_RGB

    def _label_cell(cell, text: str):
        set_cell_background(cell, PEACH_HDR)
        set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = DARK_RGB

    def _val_cell(cell, text: str):
        set_cell_background(cell, GRAY_VAL)
        set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        r = p.add_run(text or "")
        r.font.size = Pt(9)
        r.font.color.rgb = DARK_RGB

    def _hdr_cell(cell, text: str, bg: str = BLUE_HDR, sz: float = 9.0):
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        r.bold = True
        r.font.size = Pt(sz)
        r.font.color.rgb = DARK_RGB

    def _bullet_list_cell(cell, items: List[str], bg: Optional[str] = None):
        if bg:
            set_cell_background(cell, bg)
        set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
        cell.text = ""
        clean_items = [str(it).strip() for it in items if str(it or "").strip()]
        if not clean_items:
            p = cell.paragraphs[0]
            p.text = "—"
            p.paragraph_format.space_after = Pt(0)
            return
        for i, item in enumerate(clean_items):
            p = cell.paragraphs[0] if i == 0 else cell.add_paragraph()
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            append_html_to_cell_or_paragraph(p, f"• {item}", default_font_size=8.5)

    # ══════════════════════════════════════════════════════════════════════════
    # 1. ENCABEZADO OFICIAL Y TÍTULO DE LA PLANIFICACIÓN
    # ══════════════════════════════════════════════════════════════════════════
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("MINISTERIO DE EDUCACIÓN DEL PERÚ\nDIRECCIÓN REGIONAL DE EDUCACIÓN · UNIDAD DE GESTIÓN EDUCATIVA LOCAL")
    r_inst.font.size = Pt(8.5)
    r_inst.font.color.rgb = RGBColor(100, 116, 139)

    planning_types = {
        "unit": "UNIDAD DE APRENDIZAJE",
        "project": "PROYECTO DE APRENDIZAJE",
        "learning_experience": "EXPERIENCIA DE APRENDIZAJE",
        "context": "PLANIFICACIÓN CONTEXTUALIZADA"
    }
    type_label = planning_types.get(container.identity.planningType, "UNIDAD DE APRENDIZAJE")
    
    p_main_title = doc.add_paragraph()
    p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_main_title.paragraph_format.space_before = Pt(6)
    p_main_title.paragraph_format.space_after = Pt(2)
    r_type = p_main_title.add_run(type_label)
    r_type.bold = True
    r_type.font.size = Pt(14)
    r_type.font.color.rgb = PRIMARY_RGB

    unit_title = container.identity.title or "Título de la Unidad"
    p_sub_title = doc.add_paragraph()
    p_sub_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub_title.paragraph_format.space_after = Pt(12)
    r_sub = p_sub_title.add_run(f'“{unit_title}”')
    r_sub.bold = True
    r_sub.font.size = Pt(12)
    r_sub.font.color.rgb = ACCENT_RGB

    # ══════════════════════════════════════════════════════════════════════════
    # I. DATOS INFORMATIVOS (4 columnas: 2200 + 3045 + 2200 + 3045 = 10490 twips)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("I", "Datos Informativos")

    info_widths = [2200, 3045, 2200, 3045]
    tbl_info = doc.add_table(rows=5, cols=4)
    set_table_col_widths_and_indent(tbl_info, info_widths, indent_twip=-289)
    add_table_borders_black(tbl_info)

    admin = container.administrativeContext
    ident = container.identity

    level_map = {"initial": "Educación Inicial", "primary": "Educación Primaria", "secondary": "Educación Secundaria"}
    level_name = level_map.get(ident.level, ident.level)
    cycle_name = f"Ciclo {ident.cycle}" if ident.cycle else "—"
    grade_name = f"{ident.grade}.º de Secundaria" if ident.grade else "—"
    sections_str = ", ".join(admin.sections) if admin.sections else "Única"

    # Determinar áreas curriculares
    areas_list = list(dict.fromkeys(entry.area.officialName for entry in container.curriculumMap if entry.area and entry.area.officialName))
    areas_str = ", ".join(areas_list) if areas_list else "Área General"

    dur_val = ident.duration.get("value", 4) if isinstance(ident.duration, dict) else 4
    dur_unit = ident.duration.get("unit", "weeks") if isinstance(ident.duration, dict) else "semanas"
    dur_unit_es = {"weeks": "semanas", "days": "días", "sessions": "sesiones"}.get(dur_unit, dur_unit)
    dur_str = f"{dur_val} {dur_unit_es}"

    dates_str = f"{ident.startDate or ''} al {ident.endDate or ''}".strip(" al") or admin.period or "Año Escolar 2026"

    info_data = [
        ("Institución Educativa:", admin.institution or "I.E. Oficial", "DRE / UGEL:", f"{admin.dre or 'DRE'} / {admin.ugel or 'UGEL'}"),
        ("Nivel y Ciclo:", f"{level_name} · {cycle_name}", "Grado y Sección:", f"{grade_name} · {sections_str}"),
        ("Área(s) Curricular(es):", areas_str, "Año Lectivo / Periodo:", f"{admin.academicYear or '2026'} · {admin.period or 'Bimestre I'}"),
        ("Docente Responsable:", admin.teacher or "Docente de Área", "Director(a):", admin.director or "Dirección I.E."),
        ("Duración Estimada:", dur_str, "Temporalización:", dates_str)
    ]

    for row_idx, (l1, v1, l2, v2) in enumerate(info_data):
        row = tbl_info.rows[row_idx]
        _keep_row_together(row)
        _label_cell(row.cells[0], l1)
        _val_cell(row.cells[1], v1)
        _label_cell(row.cells[2], l2)
        _val_cell(row.cells[3], v2)

    # ══════════════════════════════════════════════════════════════════════════
    # II. SITUACIÓN SIGNIFICATIVA Y RETO
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("II", "Situación Significativa y Pregunta Retadora")

    tbl_sit = doc.add_table(rows=1, cols=1)
    set_table_col_widths_and_indent(tbl_sit, [10490], indent_twip=-289)
    add_table_borders_black(tbl_sit)
    cell_sit = tbl_sit.rows[0].cells[0]
    set_cell_background(cell_sit, GRAY_VAL)
    set_cell_margins(cell_sit, top=100, bottom=100, left=140, right=140)

    sit = container.significantSituation
    p_context = cell_sit.paragraphs[0]
    p_context.paragraph_format.line_spacing = 1.15
    p_context.paragraph_format.space_after = Pt(4)
    r_ctx_lbl = p_context.add_run("A. Contexto y Diagnóstico: ")
    r_ctx_lbl.bold = True
    p_context.add_run(_clean_text(sit.context) or "Los estudiantes se desenvuelven en un entorno que demanda aprendizajes contextualizados.")

    if sit.problemOrOpportunity:
        p_prob = cell_sit.add_paragraph()
        p_prob.paragraph_format.line_spacing = 1.15
        p_prob.paragraph_format.space_after = Pt(4)
        r_prb_lbl = p_prob.add_run("B. Problema o Desafío Identificado: ")
        r_prb_lbl.bold = True
        p_prob.add_run(_clean_text(sit.problemOrOpportunity))

    driving_q = container.drivingQuestion or sit.expectedResponse or "¿Cómo resolvemos los desafíos de nuestra comunidad?"
    p_quest = cell_sit.add_paragraph()
    p_quest.paragraph_format.line_spacing = 1.2
    p_quest.paragraph_format.space_before = Pt(6)
    p_quest.paragraph_format.space_after = Pt(6)
    r_q_lbl = p_quest.add_run("C. Pregunta Retadora / Desafío: \n")
    r_q_lbl.bold = True
    r_q_lbl.font.color.rgb = ACCENT_RGB
    r_q_text = p_quest.add_run(f"“{driving_q}”")
    r_q_text.bold = True
    r_q_text.italic = True
    r_q_text.font.size = Pt(10)
    r_q_text.font.color.rgb = PRIMARY_RGB

    if container.purpose and container.purpose.summary:
        p_purp = cell_sit.add_paragraph()
        p_purp.paragraph_format.line_spacing = 1.15
        p_purp.paragraph_format.space_after = Pt(2)
        r_pur_lbl = p_purp.add_run("D. Propósito de la Unidad: ")
        r_pur_lbl.bold = True
        p_purp.add_run(_clean_text(container.purpose.summary))

    # ══════════════════════════════════════════════════════════════════════════
    # III. MATRIZ DE PROPÓSITOS DE APRENDIZAJE Y EVALUACIÓN
    # Columnas: [Área/Comp/Cap: 2600, Estándar: 2300, Desempeños: 2300, Criterios: 1790, Evidencia/Inst: 1500] = 10490 twips
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("III", "Propósitos de Aprendizaje y Matriz de Evaluación (CNEB)")

    mat_widths = [2600, 2300, 2300, 1790, 1500]
    total_entries = max(1, len(container.curriculumMap))
    tbl_mat = doc.add_table(rows=1 + total_entries, cols=5)
    set_table_col_widths_and_indent(tbl_mat, mat_widths, indent_twip=-289)
    add_table_borders_black(tbl_mat)

    # Cabecera
    hdr_row = tbl_mat.rows[0]
    _set_repeat_table_header(hdr_row)
    _keep_row_together(hdr_row)
    _hdr_cell(hdr_row.cells[0], "COMPETENCIAS Y\nCAPACIDADES", bg=BLUE_HDR)
    _hdr_cell(hdr_row.cells[1], "ESTÁNDAR DE\nAPRENDIZAJE (CICLO)", bg=BLUE_HDR)
    _hdr_cell(hdr_row.cells[2], "DESEMPEÑOS PRECISADOS\nDEL GRADO", bg=BLUE_HDR)
    _hdr_cell(hdr_row.cells[3], "CRITERIOS DE\nEVALUACIÓN", bg=BLUE_HDR)
    _hdr_cell(hdr_row.cells[4], "EVIDENCIA E\nINSTRUMENTO", bg=BLUE_HDR)

    for entry_idx, entry in enumerate(container.curriculumMap, start=1):
        row = tbl_mat.rows[entry_idx]
        _keep_row_together(row)

        # Columna 1: Área, Competencia y Capacidades
        c1 = row.cells[0]
        set_cell_background(c1, GRAY_VAL)
        set_cell_margins(c1, top=60, bottom=60, left=80, right=80)
        p_c1 = c1.paragraphs[0]
        p_c1.paragraph_format.space_after = Pt(2)
        r_area = p_c1.add_run(f"ÁREA: {entry.area.officialName or 'Área Curricular'}\n")
        r_area.bold = True
        r_area.font.size = Pt(8)
        r_area.font.color.rgb = ACCENT_RGB

        r_comp = p_c1.add_run(f"{entry.competency.officialName or entry.competency.id}\n")
        r_comp.bold = True
        r_comp.font.size = Pt(9)
        r_comp.font.color.rgb = PRIMARY_RGB

        p_caps_hdr = c1.add_paragraph()
        p_caps_hdr.paragraph_format.space_before = Pt(4)
        p_caps_hdr.paragraph_format.space_after = Pt(2)
        r_cap_lbl = p_caps_hdr.add_run("Capacidades:")
        r_cap_lbl.bold = True
        r_cap_lbl.font.size = Pt(8.5)

        for cap in entry.capacities:
            p_cap = c1.add_paragraph()
            p_cap.paragraph_format.space_after = Pt(1)
            p_cap.paragraph_format.line_spacing = 1.1
            append_html_to_cell_or_paragraph(p_cap, f"• {cap.officialName or cap.id}", default_font_size=8)

        # Columna 2: Estándar
        c2 = row.cells[1]
        set_cell_background(c2, GRAY_VAL)
        set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
        std_desc = entry.standard.description if entry.standard else ""
        p_std = c2.paragraphs[0]
        p_std.paragraph_format.space_after = Pt(2)
        p_std.paragraph_format.line_spacing = 1.15
        append_html_to_cell_or_paragraph(p_std, std_desc or "Estándar oficial del ciclo.", default_font_size=8.5)

        # Columna 3: Desempeños
        c3 = row.cells[2]
        perfs = [p.description for p in entry.performances]
        _bullet_list_cell(c3, perfs, bg=GRAY_VAL)

        # Columna 4: Criterios
        c4 = row.cells[3]
        crits = [c.description for c in entry.criteria]
        _bullet_list_cell(c4, crits, bg=GRAY_VAL)

        # Columna 5: Evidencias e Instrumentos
        c5 = row.cells[4]
        evids = [e.description for e in entry.expectedEvidence]
        insts = [c.instrument for c in entry.criteria if c.instrument] or ["Lista de cotejo"]
        combined = [f"Evidencia: {ev}" for ev in evids] + [f"Instrumento: {inst}" for inst in list(dict.fromkeys(insts))]
        _bullet_list_cell(c5, combined, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # IV. ENFOQUES TRANSVERSALES
    # Columnas: [Enfoque: 3200, Valores: 3200, Actitudes: 4090] = 10490 twips
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("IV", "Enfoques Transversales y Actitudes Observables")

    trans_widths = [3200, 3200, 4090]
    enfoques = container.transversalElements or [
        {"name": "Enfoque de Orientación al bien común", "valuesOrAttitudes": ["Solidaridad", "Responsabilidad social"]}
    ]
    tbl_trans = doc.add_table(rows=1 + len(enfoques), cols=3)
    set_table_col_widths_and_indent(tbl_trans, trans_widths, indent_twip=-289)
    add_table_borders_black(tbl_trans)

    hdr_t = tbl_trans.rows[0]
    _set_repeat_table_header(hdr_t)
    _keep_row_together(hdr_t)
    _hdr_cell(hdr_t.cells[0], "ENFOQUES TRANSVERSALES", bg=PEACH_HDR)
    _hdr_cell(hdr_t.cells[1], "VALORES", bg=PEACH_HDR)
    _hdr_cell(hdr_t.cells[2], "ACTITUDES / ACCIONES OBSERVABLES", bg=PEACH_HDR)

    for idx, enf in enumerate(enfoques, start=1):
        row = tbl_trans.rows[idx]
        _keep_row_together(row)
        name = enf.name if hasattr(enf, "name") else enf.get("name", "Enfoque Transversal")
        vals = enf.valuesOrAttitudes if hasattr(enf, "valuesOrAttitudes") else enf.get("valuesOrAttitudes", ["Respeto"])
        
        c_name = row.cells[0]
        set_cell_background(c_name, GRAY_VAL)
        set_cell_margins(c_name, top=60, bottom=60, left=80, right=80)
        p = c_name.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.size = Pt(8.5)

        _bullet_list_cell(row.cells[1], vals, bg=GRAY_VAL)
        act_text = "Disposición a valorar y apoyar a los miembros de la comunidad escolar fomentando la empatía y justicia."
        _bullet_list_cell(row.cells[2], [act_text], bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # V. SECUENCIA DIDÁCTICA Y PROGRESIÓN DE SESIONES
    # Columnas: [Sesión/Tiempo: 1200, Título: 2690, Competencias: 2600, Actividades: 2500, Evidencia/Inst: 1500] = 10490 twips
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("V", "Secuencia Didáctica y Progresión de Sesiones de Aprendizaje")

    seq_widths = [1200, 2690, 2600, 2500, 1500]
    sessions = sorted(container.sequence, key=lambda s: s.index) if container.sequence else []
    total_sess = max(1, len(sessions))
    tbl_seq = doc.add_table(rows=1 + total_sess, cols=5)
    set_table_col_widths_and_indent(tbl_seq, seq_widths, indent_twip=-289)
    add_table_borders_black(tbl_seq)

    hdr_s = tbl_seq.rows[0]
    _set_repeat_table_header(hdr_s)
    _keep_row_together(hdr_s)
    _hdr_cell(hdr_s.cells[0], "SESIÓN /\nTIEMPO", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[1], "TÍTULO DE LA SESIÓN", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[2], "COMPETENCIAS Y\nDESEMPEÑOS", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[3], "CAMPO TEMÁTICO Y\nACTIVIDADES CLAVE", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[4], "EVIDENCIA E\nINSTRUMENTO", bg=BLUE_HDR)

    if not sessions:
        row = tbl_seq.rows[1]
        for c in row.cells:
            _val_cell(c, "No se registraron sesiones en la secuencia.")
    else:
        for idx, item in enumerate(sessions, start=1):
            row = tbl_seq.rows[idx]
            _keep_row_together(row)

            # Col 1: Sesión N.° y Tiempo
            dur_mins = item.duration.get("value", 90) if isinstance(item.duration, dict) else 90
            c1 = row.cells[0]
            set_cell_background(c1, GRAY_VAL)
            set_cell_margins(c1, top=60, bottom=60, left=60, right=60)
            p1 = c1.paragraphs[0]
            p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p1.paragraph_format.space_after = Pt(2)
            r_num = p1.add_run(f"SESIÓN {item.index:02d}\n")
            r_num.bold = True
            r_num.font.size = Pt(8.5)
            r_num.font.color.rgb = PRIMARY_RGB
            r_dur = p1.add_run(f"Semana {item.week or 1}\n{dur_mins} min")
            r_dur.font.size = Pt(8)
            r_dur.font.color.rgb = RGBColor(100, 116, 139)

            # Col 2: Título
            c2 = row.cells[1]
            set_cell_background(c2, GRAY_VAL)
            set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
            p2 = c2.paragraphs[0]
            p2.paragraph_format.space_after = Pt(2)
            p2.paragraph_format.line_spacing = 1.15
            r_tit = p2.add_run(item.title)
            r_tit.bold = True
            r_tit.font.size = Pt(9)

            # Col 3: Competencias y Desempeños asociados
            c3 = row.cells[2]
            comps_list = [c for c in item.competencyRefs if c] or [entry.competency.officialName for entry in container.curriculumMap]
            _bullet_list_cell(c3, comps_list, bg=GRAY_VAL)

            # Col 4: Campo Temático y Actividades
            c4 = row.cells[3]
            know = [f"Tema: {k}" for k in item.knowledge]
            acts = item.activities or ["Desarrollo de actividades pedagógicas."]
            _bullet_list_cell(c4, know + acts, bg=GRAY_VAL)

            # Col 5: Evidencias e Instrumentos
            c5 = row.cells[4]
            evs = [e.get("description", str(e)) if isinstance(e, dict) else str(e) for e in item.evidence]
            inst_list = [i.get("label", str(i)) if isinstance(i, dict) else str(i) for i in item.assessmentInstruments] or ["Lista de cotejo"]
            _bullet_list_cell(c5, evs + inst_list, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # VI. PRODUCTO FINAL Y CRITERIOS DE LOGRO
    # Columnas: [Producto: 3000, Descripción/Criterios: 7490] = 10490 twips
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VI", "Producto o Evidencia Final de la Unidad")

    prod = container.finalProduct
    tbl_prod = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_prod, [3000, 7490], indent_twip=-289)
    add_table_borders_black(tbl_prod)

    hdr_p = tbl_prod.rows[0]
    _keep_row_together(hdr_p)
    _hdr_cell(hdr_p.cells[0], "DENOMINACIÓN DEL PRODUCTO", bg=PEACH_HDR)
    _hdr_cell(hdr_p.cells[1], "CARACTERÍSTICAS Y CRITERIOS DEL PRODUCTO", bg=PEACH_HDR)

    row_p = tbl_prod.rows[1]
    _keep_row_together(row_p)
    c_p1 = row_p.cells[0]
    set_cell_background(c_p1, GRAY_VAL)
    set_cell_margins(c_p1, top=60, bottom=60, left=80, right=80)
    p_p1 = c_p1.paragraphs[0]
    r_ptit = p_p1.add_run(prod.title if prod and prod.title else "Producto Integrador de Unidad")
    r_ptit.bold = True
    r_ptit.font.size = Pt(9.5)
    r_ptit.font.color.rgb = PRIMARY_RGB

    c_p2 = row_p.cells[1]
    set_cell_background(c_p2, GRAY_VAL)
    set_cell_margins(c_p2, top=60, bottom=60, left=80, right=80)
    p_p2 = c_p2.paragraphs[0]
    p_p2.paragraph_format.line_spacing = 1.15
    desc = prod.description if prod and prod.description else "Producto elaborado por los estudiantes que demuestra el nivel de logro de las competencias abordadas."
    p_p2.add_run(desc)
    if prod and prod.expectedComponents:
        p_comp_hdr = c_p2.add_paragraph()
        p_comp_hdr.paragraph_format.space_before = Pt(4)
        p_comp_hdr.paragraph_format.space_after = Pt(2)
        r_comp_lbl = p_comp_hdr.add_run("Componentes esperados:")
        r_comp_lbl.bold = True
        r_comp_lbl.font.size = Pt(8.5)
        for comp_it in prod.expectedComponents:
            p_comp = c_p2.add_paragraph()
            p_comp.paragraph_format.space_after = Pt(1)
            p_comp.add_run(f"• {comp_it}")

    # ══════════════════════════════════════════════════════════════════════════
    # VII. MATERIALES Y RECURSOS EDUCATIVOS
    # Columnas: [Docente: 5245, Estudiante: 5245] = 10490 twips
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VII", "Materiales y Recursos Educativos")

    tbl_rec = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_rec, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_rec)

    hdr_r = tbl_rec.rows[0]
    _keep_row_together(hdr_r)
    _hdr_cell(hdr_r.cells[0], "PARA EL DOCENTE", bg=BLUE_HDR)
    _hdr_cell(hdr_r.cells[1], "PARA EL ESTUDIANTE", bg=BLUE_HDR)

    row_r = tbl_rec.rows[1]
    _keep_row_together(row_r)
    doc_items = [
        "Currículo Nacional de la Educación Básica (CNEB 2016)",
        "Programa Curricular de Educación Secundaria (MINEDU)",
        "Guías metodológicas y manuales de orientación pedagógica"
    ]
    stu_items = [
        "Cuaderno de trabajo oficial de Secundaria (MINEDU)",
        "Textos escolares de consulta y lecturas seleccionadas",
        "Materiales manipulativos, fichas didácticas y dispositivos TIC"
    ]
    _bullet_list_cell(row_r.cells[0], doc_items, bg=GRAY_VAL)
    _bullet_list_cell(row_r.cells[1], stu_items, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # VIII. EVALUACIÓN Y ORIENTACIONES FORMATIVAS
    # Columnas: [3496, 3497, 3497 = 10490 twips]
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VIII", "Orientaciones para la Evaluación Formativa")

    tbl_ev = doc.add_table(rows=2, cols=3)
    set_table_col_widths_and_indent(tbl_ev, [3496, 3497, 3497], indent_twip=-289)
    add_table_borders_black(tbl_ev)

    hdr_e = tbl_ev.rows[0]
    _keep_row_together(hdr_e)
    _hdr_cell(hdr_e.cells[0], "EVALUACIÓN DIAGNÓSTICA", bg=PEACH_HDR)
    _hdr_cell(hdr_e.cells[1], "EVALUACIÓN FORMATIVA", bg=PEACH_HDR)
    _hdr_cell(hdr_e.cells[2], "EVALUACIÓN SUMATIVA", bg=PEACH_HDR)

    row_e = tbl_ev.rows[1]
    _keep_row_together(row_e)
    ev_plan = container.assessmentPlan
    diag_text = "Se aplica al inicio de la unidad para identificar el nivel de desarrollo de las competencias y necesidades reales del grupo."
    form_text = ev_plan.formativeAssessment or "Evaluación continua y formativa con retroalimentación reflexiva basada en criterios claros y rúbricas."
    sum_text = "Valoración integral de las evidencias y del producto final para determinar el nivel de logro alcanzado en la unidad."

    _bullet_list_cell(row_e.cells[0], [diag_text], bg=GRAY_VAL)
    _bullet_list_cell(row_e.cells[1], [form_text, f"Retroalimentación: {ev_plan.feedbackApproach or 'Preguntas reflexivas y descriptivas'}"], bg=GRAY_VAL)
    _bullet_list_cell(row_e.cells[2], [sum_text], bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # IX. FIRMAS DE RESPONSABILIDAD PEDAGÓGICA
    # Columnas: [5245, 5245 = 10490 twips]
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("IX", "Firmas de Responsabilidad Pedagógica")

    tbl_sig = doc.add_table(rows=1, cols=2)
    set_table_col_widths_and_indent(tbl_sig, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_sig)
    row_s = tbl_sig.rows[0]
    _keep_row_together(row_s)

    for cell, role in [(row_s.cells[0], "PROFESOR(A) DE ÁREA"), (row_s.cells[1], "DIRECCIÓN / SUBDIRECCIÓN")]:
        set_cell_background(cell, GRAY_VAL)
        set_cell_margins(cell, top=200, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(36)
        p.paragraph_format.space_after = Pt(2)
        r_line = p.add_run("____________________________________\n")
        r_line.font.color.rgb = RGBColor(148, 163, 184)
        r_role = p.add_run(role)
        r_role.bold = True
        r_role.font.size = Pt(9)
        r_role.font.color.rgb = DARK_RGB

    # Finalizar y retornar stream en memoria
    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream
