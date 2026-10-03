"""
DOCX Builder for PlanningContainer 2.0 (Unidades y Proyectos de Aprendizaje MINEDU / CNEB).
Especializado para Educación Secundaria (JEC y Regular).

Genera un documento Word (.docx) nativo con formato oficial MINEDU de alta fidelidad:
  - Formato A4 y cuadrícula estricta de 10,490 twips (sum(cols) = 10490) en todas las tablas
  - Paleta institucional calibrada (Peach, Blue Header, Gray Values, Accent)
  - Tablas con bordes negros 0.5pt (sz=4) y encabezados repetidos
  - I. Datos Informativos (con Coordinación Pedagógica JEC, Nivel, Ciclo y Secciones)
  - II. Situación Significativa y Pregunta Retadora + Tabla Dual de Propósito y Producto Integrador
  - III. Estándar de Aprendizaje del Ciclo (CNEB Ciclos VI y VII) y Matriz Curricular
  - IV. Competencias Transversales (TIC y Gestión Autónoma) y Enfoques Transversales
  - V. Secuencia Didáctica y Matriz Semanal de Sesiones (Criterios C1-C4, Campo Temático, Evidencia, Instrumento)
  - VI. Producto o Evidencia Final de la Unidad
  - VII. Materiales Educativos y Orientaciones para la Evaluación Formativa
  - VIII. Bibliografía y Orientaciones para la Evaluación
  - IX. Firmas de Responsabilidad Pedagógica (Coordinador Pedagógico y Docente de Área)
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
    BLUE_HDR = "BDD6EE"         # Azul pastel para cabeceras principales
    PEACH_HDR = "FCE4D6"        # Melocotón claro para subcabeceras y etiquetas
    GRAY_VAL = "F8FAFC"         # Gris muy tenue para contenido
    YELLOW_HDR = "FFF2CC"       # Amarillo suave para notas y retos

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
        p.paragraph_format.left_indent = Pt(-14.45)
        p.paragraph_format.space_before = Pt(12)
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

    def _bullet_list_cell(cell, items: List[str], bg: Optional[str] = None, bullet: str = "• "):
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
            prefix = bullet if not item.startswith(("•", "❖", "-", "1.", "2.", "3.", "C1", "C2", "C3", "C4")) else ""
            append_html_to_cell_or_paragraph(p, f"{prefix}{item}", default_font_size=8.5)

    # ══════════════════════════════════════════════════════════════════════════
    # ENCABEZADO OFICIAL Y TÍTULO DE LA UNIDAD DIDÁCTICA
    # ══════════════════════════════════════════════════════════════════════════
    admin = container.administrativeContext
    ident = container.identity

    dre_name = admin.dre or "DIRECCIÓN REGIONAL DE EDUCACIÓN"
    ugel_name = admin.ugel or "UNIDAD DE GESTIÓN EDUCATIVA LOCAL"

    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run(f"MINISTERIO DE EDUCACIÓN DEL PERÚ\n{dre_name.upper()} · {ugel_name.upper()}\nÁREA DE GESTIÓN PEDAGÓGICA · EDUCACIÓN SECUNDARIA")
    r_inst.font.size = Pt(8.5)
    r_inst.font.color.rgb = RGBColor(100, 116, 139)

    planning_types = {
        "unit": "UNIDAD DE APRENDIZAJE",
        "project": "PROYECTO DE APRENDIZAJE",
        "learning_experience": "EXPERIENCIA DE APRENDIZAJE",
        "context": "PLANIFICACIÓN CONTEXTUALIZADA"
    }
    type_label = planning_types.get(ident.planningType, "UNIDAD DE APRENDIZAJE")
    unit_num = ident.unitNumber if hasattr(ident, "unitNumber") and ident.unitNumber else "01"
    
    p_main_title = doc.add_paragraph()
    p_main_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_main_title.paragraph_format.space_before = Pt(8)
    p_main_title.paragraph_format.space_after = Pt(2)
    r_type = p_main_title.add_run(f"{type_label} N.° {unit_num}")
    r_type.bold = True
    r_type.font.size = Pt(13)
    r_type.font.color.rgb = PRIMARY_RGB

    unit_title = ident.title or "Título de la Unidad de Aprendizaje"
    p_sub_title = doc.add_paragraph()
    p_sub_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub_title.paragraph_format.space_after = Pt(12)
    r_sub = p_sub_title.add_run(f'“{unit_title}”')
    r_sub.bold = True
    r_sub.italic = True
    r_sub.font.size = Pt(11.5)
    r_sub.font.color.rgb = ACCENT_RGB

    # ══════════════════════════════════════════════════════════════════════════
    # I. DATOS INFORMATIVOS (4 columnas: 2200 + 3045 + 2200 + 3045 = 10490 twips)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("I", "Datos Informativos")

    info_widths = [2200, 3045, 2200, 3045]
    tbl_info = doc.add_table(rows=6, cols=4)
    set_table_col_widths_and_indent(tbl_info, info_widths, indent_twip=-289)
    add_table_borders_black(tbl_info)

    level_map = {"initial": "Educación Inicial", "primary": "Educación Primaria", "secondary": "Educación Secundaria"}
    level_name = level_map.get(ident.level, ident.level)
    cycle_name = f"Ciclo {ident.cycle}" if ident.cycle else "Ciclo VII"
    grade_name = f"{ident.grade}.º de Secundaria" if ident.grade else "4.° de Secundaria"
    sections_str = ", ".join(admin.sections) if admin.sections else "A, B, C y D"

    # Determinar áreas curriculares
    areas_list = list(dict.fromkeys(entry.area.officialName for entry in container.curriculumMap if entry.area and entry.area.officialName))
    areas_str = ", ".join(areas_list) if areas_list else "Matemática"

    dur_val = ident.duration.get("value", 4) if isinstance(ident.duration, dict) else 4
    dur_unit = ident.duration.get("unit", "weeks") if isinstance(ident.duration, dict) else "semanas"
    dur_unit_es = {"weeks": "semanas", "days": "días", "sessions": "sesiones"}.get(dur_unit, dur_unit)
    dur_str = f"{dur_val} {dur_unit_es}"

    dates_str = f"{ident.startDate or ''} al {ident.endDate or ''}".strip(" al") or admin.period or "Año Escolar 2026"
    coord_name = getattr(admin, "coordinator", None) or "Coordinación Pedagógica de Área"

    info_data = [
        ("Institución Educativa:", admin.institution or "I.E. Agropecuario JEC", "Director(a):", admin.director or "Dirección General"),
        ("Coordinador(a) Pedagógico(a):", coord_name, "Docente Responsable:", admin.teacher or "Docente de Área"),
        ("Nivel y Ciclo:", f"{level_name} · {cycle_name}", "Grado y Sección(es):", f"{grade_name} · {sections_str}"),
        ("Área(s) Curricular(es):", areas_str, "Año Lectivo / Periodo:", f"{admin.academicYear or '2026'} · {admin.period or 'Bimestre I'}"),
        ("Duración Estimada:", dur_str, "Temporalización:", dates_str),
        ("DRE / UGEL:", f"{admin.dre or 'DRE'} / {admin.ugel or 'UGEL'}", "Modelo de Servicio:", "JEC / EBR Secundaria")
    ]

    for row_idx, (l1, v1, l2, v2) in enumerate(info_data):
        row = tbl_info.rows[row_idx]
        _keep_row_together(row)
        _label_cell(row.cells[0], l1)
        _val_cell(row.cells[1], v1)
        _label_cell(row.cells[2], l2)
        _val_cell(row.cells[3], v2)

    # ══════════════════════════════════════════════════════════════════════════
    # II. SITUACIÓN SIGNIFICATIVA Y PREGUNTA RETADORA + TABLA DUAL DE PROPÓSITO Y PRODUCTO
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("II", "Situación Significativa y Pregunta Retadora")

    tbl_sit = doc.add_table(rows=1, cols=1)
    set_table_col_widths_and_indent(tbl_sit, [10490], indent_twip=-289)
    add_table_borders_black(tbl_sit)
    _keep_row_together(tbl_sit.rows[0])
    cell_sit = tbl_sit.rows[0].cells[0]
    set_cell_background(cell_sit, GRAY_VAL)
    set_cell_margins(cell_sit, top=100, bottom=100, left=140, right=140)

    sit = container.significantSituation
    p_context = cell_sit.paragraphs[0]
    p_context.paragraph_format.line_spacing = 1.15
    p_context.paragraph_format.space_after = Pt(4)
    r_ctx_lbl = p_context.add_run("Contexto y Diagnóstico Socio-Educativo: ")
    r_ctx_lbl.bold = True
    p_context.add_run(_clean_text(sit.context) or "Los estudiantes de Educación Secundaria enfrentan desafíos vinculados a su entorno sociocultural y productivo.")

    if sit.problemOrOpportunity:
        p_prob = cell_sit.add_paragraph()
        p_prob.paragraph_format.line_spacing = 1.15
        p_prob.paragraph_format.space_after = Pt(4)
        r_prb_lbl = p_prob.add_run("Problema o Desafío de la Comunidad: ")
        r_prb_lbl.bold = True
        p_prob.add_run(_clean_text(sit.problemOrOpportunity))

    driving_q = container.drivingQuestion or sit.expectedResponse or "¿Cómo resolvemos los desafíos planteados tomando decisiones informadas?"
    p_quest = cell_sit.add_paragraph()
    p_quest.paragraph_format.line_spacing = 1.2
    p_quest.paragraph_format.space_before = Pt(6)
    p_quest.paragraph_format.space_after = Pt(6)
    r_q_lbl = p_quest.add_run("Pregunta Retadora / Desafío Pedagógico:\n")
    r_q_lbl.bold = True
    r_q_lbl.font.color.rgb = ACCENT_RGB
    r_q_text = p_quest.add_run(f"“{driving_q}”")
    r_q_text.bold = True
    r_q_text.italic = True
    r_q_text.font.size = Pt(10)
    r_q_text.font.color.rgb = PRIMARY_RGB

    # ── TABLA DUAL: PROPÓSITO DE LA UNIDAD Y PRODUCTO FINAL (Exacto a la estructura de Secundaria) ──
    prod = container.finalProduct
    prod_title = prod.title if prod and prod.title else "Producto Integrador de Unidad"
    prod_desc = prod.description if prod and prod.description else "Plan, informe o prototipo donde los estudiantes aplican los conocimientos y competencias del área."
    purp_summary = container.purpose.summary if container.purpose and container.purpose.summary else "Desarrollar y evaluar competencias curriculares mediante situaciones auténticas de aprendizaje."

    tbl_dual = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_dual, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_dual)
    _set_repeat_table_header(tbl_dual.rows[0])
    _keep_row_together(tbl_dual.rows[0])
    _keep_row_together(tbl_dual.rows[1])

    _hdr_cell(tbl_dual.rows[0].cells[0], "PROPÓSITO DE LA EXPERIENCIA / UNIDAD DIDÁCTICA", bg=BLUE_HDR)
    _hdr_cell(tbl_dual.rows[0].cells[1], "PRODUCTO FINAL DE LA UNIDAD DIDÁCTICA", bg=BLUE_HDR)

    c_dual_purp = tbl_dual.rows[1].cells[0]
    set_cell_background(c_dual_purp, GRAY_VAL)
    set_cell_margins(c_dual_purp, top=80, bottom=80, left=100, right=100)
    p_dp = c_dual_purp.paragraphs[0]
    p_dp.paragraph_format.line_spacing = 1.15
    p_dp.paragraph_format.space_after = Pt(2)
    p_dp.add_run(purp_summary)

    c_dual_prod = tbl_dual.rows[1].cells[1]
    set_cell_background(c_dual_prod, GRAY_VAL)
    set_cell_margins(c_dual_prod, top=80, bottom=80, left=100, right=100)
    p_dpr = c_dual_prod.paragraphs[0]
    p_dpr.paragraph_format.line_spacing = 1.15
    p_dpr.paragraph_format.space_after = Pt(2)
    r_dpr_t = p_dpr.add_run(f"{prod_title}:\n")
    r_dpr_t.bold = True
    r_dpr_t.font.color.rgb = PRIMARY_RGB
    p_dpr.add_run(prod_desc)
    if prod and prod.expectedComponents:
        for comp_it in prod.expectedComponents:
            p_comp = c_dual_prod.add_paragraph()
            p_comp.paragraph_format.space_after = Pt(1)
            p_comp.paragraph_format.line_spacing = 1.1
            p_comp.add_run(f"• {comp_it}")

    # ══════════════════════════════════════════════════════════════════════════
    # III. PROPÓSITOS DE APRENDIZAJE Y MATRIZ DE EVALUACIÓN (CNEB)
    # Tabla A: Estándares de Aprendizaje del Ciclo
    # Tabla B: Matriz Curricular (Competencias, Capacidades, Desempeños, Criterios y Evidencias)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("III", "Propósitos de Aprendizaje y Matriz de Evaluación (CNEB)")

    # ── TABLA A: ESTÁNDARES DE APRENDIZAJE DE LAS COMPETENCIAS (Página 2 del PDF) ──
    std_widths = [2600, 3400, 4490]
    total_entries = max(1, len(container.curriculumMap))
    tbl_std = doc.add_table(rows=1 + total_entries, cols=3)
    set_table_col_widths_and_indent(tbl_std, std_widths, indent_twip=-289)
    add_table_borders_black(tbl_std)

    hdr_std = tbl_std.rows[0]
    _set_repeat_table_header(hdr_std)
    _keep_row_together(hdr_std)
    _hdr_cell(hdr_std.cells[0], "COMPETENCIAS", bg=PEACH_HDR)
    _hdr_cell(hdr_std.cells[1], "CAPACIDADES", bg=PEACH_HDR)
    _hdr_cell(hdr_std.cells[2], f"ESTÁNDARES DE APRENDIZAJE DE LAS COMPETENCIAS ({cycle_name.upper()})", bg=PEACH_HDR)

    for entry_idx, entry in enumerate(container.curriculumMap, start=1):
        row = tbl_std.rows[entry_idx]
        _keep_row_together(row)

        # Col 0: Competencia
        c0 = row.cells[0]
        set_cell_background(c0, GRAY_VAL)
        set_cell_margins(c0, top=60, bottom=60, left=80, right=80)
        p0 = c0.paragraphs[0]
        r_comp = p0.add_run(entry.competency.officialName or entry.competency.id)
        r_comp.bold = True
        r_comp.font.size = Pt(9)
        r_comp.font.color.rgb = PRIMARY_RGB

        # Col 1: Capacidades
        c1 = row.cells[1]
        caps_list = [cap.officialName or cap.id for cap in entry.capacities]
        _bullet_list_cell(c1, caps_list, bg=GRAY_VAL)

        # Col 2: Estándar
        c2 = row.cells[2]
        set_cell_background(c2, GRAY_VAL)
        set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
        p2 = c2.paragraphs[0]
        p2.paragraph_format.line_spacing = 1.15
        p2.paragraph_format.space_after = Pt(2)
        std_desc = entry.standard.description if entry.standard else "Resuelve problemas y modela situaciones con autonomía y rigor metodológico."
        append_html_to_cell_or_paragraph(p2, std_desc, default_font_size=8.5)

    # Espaciado sutil
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)
    p_sp.paragraph_format.space_after = Pt(4)

    # ── TABLA B: MATRIZ CURRICULAR DE EVALUACIÓN (Desempeños, Criterios y Evidencias) ──
    mat_widths = [2600, 2300, 2300, 1790, 1500]
    tbl_mat = doc.add_table(rows=1 + total_entries, cols=5)
    set_table_col_widths_and_indent(tbl_mat, mat_widths, indent_twip=-289)
    add_table_borders_black(tbl_mat)

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

        # Col 0: Área, Competencia y Capacidades
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

        # Col 1: Estándar
        c2 = row.cells[1]
        set_cell_background(c2, GRAY_VAL)
        set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
        std_desc = entry.standard.description if entry.standard else ""
        p_std = c2.paragraphs[0]
        p_std.paragraph_format.space_after = Pt(2)
        p_std.paragraph_format.line_spacing = 1.15
        append_html_to_cell_or_paragraph(p_std, std_desc or "Estándar oficial del ciclo.", default_font_size=8.5)

        # Col 2: Desempeños
        c3 = row.cells[2]
        perfs = [p.description for p in entry.performances]
        _bullet_list_cell(c3, perfs, bg=GRAY_VAL)

        # Col 3: Criterios
        c4 = row.cells[3]
        crits = [c.description for c in entry.criteria]
        _bullet_list_cell(c4, crits, bg=GRAY_VAL)

        # Col 4: Evidencias e Instrumentos
        c5 = row.cells[4]
        evids = [e.description for e in entry.expectedEvidence]
        insts = [c.instrument for c in entry.criteria if c.instrument] or ["Lista de cotejo"]
        combined = [f"Evidencia: {ev}" for ev in evids] + [f"Instrumento: {inst}" for inst in list(dict.fromkeys(insts))]
        _bullet_list_cell(c5, combined, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # IV. COMPETENCIAS Y ENFOQUES TRANSVERSALES (Páginas 2, 3 y 4 del PDF)
    # Tabla A: Competencias Transversales CNEB (TIC y Gestión Autónoma)
    # Tabla B: Enfoques Transversales y Valores
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("IV", "Enfoques Transversales y Actitudes Observables")

    # ── TABLA A: COMPETENCIAS TRANSVERSALES CNEB ──
    tbl_trans_comp = doc.add_table(rows=3, cols=3)
    set_table_col_widths_and_indent(tbl_trans_comp, [2600, 3400, 4490], indent_twip=-289)
    add_table_borders_black(tbl_trans_comp)

    hdr_tc = tbl_trans_comp.rows[0]
    _set_repeat_table_header(hdr_tc)
    _keep_row_together(hdr_tc)
    _hdr_cell(hdr_tc.cells[0], "COMPETENCIAS TRANSVERSALES", bg=BLUE_HDR)
    _hdr_cell(hdr_tc.cells[1], "CAPACIDADES", bg=BLUE_HDR)
    _hdr_cell(hdr_tc.cells[2], "DESEMPEÑOS DEL GRADO (SECUNDARIA)", bg=BLUE_HDR)

    # Fila 1: TIC
    r_tic = tbl_trans_comp.rows[1]
    _keep_row_together(r_tic)
    c_tic0 = r_tic.cells[0]
    set_cell_background(c_tic0, GRAY_VAL)
    set_cell_margins(c_tic0, top=60, bottom=60, left=80, right=80)
    p_tic0 = c_tic0.paragraphs[0]
    r_tic0 = p_tic0.add_run("Se desenvuelve en entornos virtuales generados por las TIC")
    r_tic0.bold = True
    r_tic0.font.size = Pt(8.5)
    _bullet_list_cell(r_tic.cells[1], [
        "Personaliza entornos virtuales.",
        "Gestiona información del entorno virtual.",
        "Interactúa en entornos virtuales.",
        "Crea objetos virtuales en diversos formatos."
    ], bg=GRAY_VAL)
    _bullet_list_cell(r_tic.cells[2], [
        "Clasifica y organiza información de diversas fuentes reconociendo derechos de autor y citando fuentes confiables.",
        "Registra datos mediante hojas de cálculo que le permitan ordenar y secuenciar información relevante.",
        "Utiliza herramientas multimedia e interactivas para elaborar proyectos escolares y representaciones digitales."
    ], bg=GRAY_VAL)

    # Fila 2: Autonomía
    r_aut = tbl_trans_comp.rows[2]
    _keep_row_together(r_aut)
    c_aut0 = r_aut.cells[0]
    set_cell_background(c_aut0, GRAY_VAL)
    set_cell_margins(c_aut0, top=60, bottom=60, left=80, right=80)
    p_aut0 = c_aut0.paragraphs[0]
    r_aut0 = p_aut0.add_run("Gestiona su aprendizaje de manera autónoma")
    r_aut0.bold = True
    r_aut0.font.size = Pt(8.5)
    _bullet_list_cell(r_aut.cells[1], [
        "Define metas de aprendizaje.",
        "Organiza acciones estratégicas para alcanzar sus metas de aprendizaje.",
        "Monitorea y ajusta su desempeño durante el proceso de aprendizaje."
    ], bg=GRAY_VAL)
    _bullet_list_cell(r_aut.cells[2], [
        "Determina metas de aprendizaje viables asociadas a sus conocimientos y habilidades formulándose preguntas de manera reflexiva.",
        "Organiza un conjunto de estrategias y procedimientos en función del tiempo y de los recursos de que dispone.",
        "Explica las acciones realizadas y los recursos movilizados en función de su pertinencia al logro de las metas de aprendizaje."
    ], bg=GRAY_VAL)

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(4)
    p_sp2.paragraph_format.space_after = Pt(4)

    # ── TABLA B: ENFOQUES TRANSVERSALES Y ACTITUDES OBSERVABLES (Páginas 3 y 4 del PDF) ──
    trans_widths = [2500, 2500, 2745, 2745]
    enfoques = container.transversalElements or [
        {"name": "Enfoque Orientación al bien común", "valuesOrAttitudes": ["Equidad y Justicia", "Solidaridad", "Empatía", "Responsabilidad"]},
        {"name": "Enfoque Búsqueda de la Excelencia", "valuesOrAttitudes": ["Superación personal", "Flexibilidad y apertura"]},
        {"name": "Enfoque Ambiental", "valuesOrAttitudes": ["Justicia y solidaridad", "Solidaridad planetaria y equidad intergeneracional"]}
    ]
    tbl_trans = doc.add_table(rows=1 + len(enfoques), cols=4)
    set_table_col_widths_and_indent(tbl_trans, trans_widths, indent_twip=-289)
    add_table_borders_black(tbl_trans)

    hdr_t = tbl_trans.rows[0]
    _set_repeat_table_header(hdr_t)
    _keep_row_together(hdr_t)
    _hdr_cell(hdr_t.cells[0], "ENFOQUE TRANSVERSAL", bg=PEACH_HDR)
    _hdr_cell(hdr_t.cells[1], "VALORES", bg=PEACH_HDR)
    _hdr_cell(hdr_t.cells[2], "ACTITUDES QUE SUPONEN", bg=PEACH_HDR)
    _hdr_cell(hdr_t.cells[3], "PRÁCTICA DE VALORES / ACCIONES EN AULA", bg=PEACH_HDR)

    actitudes_default = {
        "Enfoque Orientación al bien común": (
            "Disposición a reconocer derechos compartidos y proteger el bienestar común del aula y comunidad.",
            "Colabora activamente en equipos de trabajo cumpliendo acuerdos con respeto, escucha activa y solidaridad."
        ),
        "Enfoque Búsqueda de la Excelencia": (
            "Disposición a adquirir cualidades que mejoran el propio desempeño y aumentan el estado de satisfacción personal.",
            "Demuestra perseverancia en la resolución de tareas complejas reflexionando críticamente sobre sus avances y errores."
        ),
        "Enfoque Ambiental": (
            "Disposición a evaluar los impactos ecológicos de las actividades cotidianas actuando en beneficio de la naturaleza.",
            "Mantiene limpios y ordenados los espacios escolares y reduce el consumo innecesario de materiales reutilizándolos."
        ),
        "Enfoque de Derechos": (
            "Disposición a conversar con otras personas intercambiando ideas o afectos para construir consensos.",
            "Escucha los puntos de vista de sus compañeros y argumenta sus propuestas con fundamento democrático."
        ),
        "Enfoque Inclusivo o de Atención a la Diversidad": (
            "Reconocimiento al valor inherente de cada persona y de sus derechos por encima de cualquier diferencia.",
            "Asegura la participación equitativa de todos los estudiantes en las actividades escolares respetando ritmos de aprendizaje."
        )
    }

    for idx, enf in enumerate(enfoques, start=1):
        row = tbl_trans.rows[idx]
        _keep_row_together(row)
        name = enf.name if hasattr(enf, "name") else enf.get("name", "Enfoque Transversal")
        vals = enf.valuesOrAttitudes if hasattr(enf, "valuesOrAttitudes") else enf.get("valuesOrAttitudes", ["Respeto", "Responsabilidad"])
        
        c_name = row.cells[0]
        set_cell_background(c_name, GRAY_VAL)
        set_cell_margins(c_name, top=60, bottom=60, left=80, right=80)
        p = c_name.paragraphs[0]
        r = p.add_run(name)
        r.bold = True
        r.font.size = Pt(8.5)

        _bullet_list_cell(row.cells[1], vals, bg=GRAY_VAL)
        
        act_text, pract_text = actitudes_default.get(
            name,
            ("Disposición a actuar con empatía y principios éticos en beneficio del colectivo escolar.",
             "Demuestra compromiso y cooperación en las actividades pedagógicas individuales y grupales.")
        )
        _bullet_list_cell(row.cells[2], [act_text], bg=GRAY_VAL)
        _bullet_list_cell(row.cells[3], [pract_text], bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # V. SECUENCIA DIDÁCTICA Y PROGRESIÓN DE SESIONES DE APRENDIZAJE (Páginas 4 a 8 del PDF)
    # Matriz Semanal de 7 columnas
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("V", "Secuencia Didáctica y Progresión de Sesiones de Aprendizaje")

    seq_widths = [1800, 1200, 2000, 2300, 1400, 1000, 790]
    sessions = sorted(container.sequence, key=lambda s: s.index) if container.sequence else []
    total_sess = max(1, len(sessions))
    tbl_seq = doc.add_table(rows=1 + total_sess, cols=7)
    set_table_col_widths_and_indent(tbl_seq, seq_widths, indent_twip=-289)
    add_table_borders_black(tbl_seq)

    hdr_s = tbl_seq.rows[0]
    _set_repeat_table_header(hdr_s)
    _keep_row_together(hdr_s)
    _hdr_cell(hdr_s.cells[0], "COMPETENCIA", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[1], "SEMANA /\nFECHA", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[2], "SESIÓN DE\nAPRENDIZAJE", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[3], "CRITERIOS DE\nEVALUACIÓN", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[4], "CAMPO\nTEMÁTICO", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[5], "EVIDENCIA", bg=BLUE_HDR)
    _hdr_cell(hdr_s.cells[6], "INSTRUMENTO", bg=BLUE_HDR)

    if not sessions:
        row = tbl_seq.rows[1]
        for c in row.cells:
            _val_cell(c, "No se registraron sesiones en la secuencia.")
    else:
        for idx, item in enumerate(sessions, start=1):
            row = tbl_seq.rows[idx]
            _keep_row_together(row)

            # Col 0: Competencia
            c0 = row.cells[0]
            comps_list = [c for c in item.competencyRefs if c] or [entry.competency.officialName for entry in container.curriculumMap]
            _bullet_list_cell(c0, comps_list, bg=GRAY_VAL)

            # Col 1: Semana / Fechas
            c1 = row.cells[1]
            set_cell_background(c1, GRAY_VAL)
            set_cell_margins(c1, top=60, bottom=60, left=60, right=60)
            p1 = c1.paragraphs[0]
            p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p1.paragraph_format.space_after = Pt(2)
            r_sem = p1.add_run(f"SEMANA {item.week or 1}\n")
            r_sem.bold = True
            r_sem.font.size = Pt(8.5)
            r_sem.font.color.rgb = PRIMARY_RGB
            dur_mins = item.duration.get("value", 90) if isinstance(item.duration, dict) else 90
            r_time = p1.add_run(f"({dur_mins} min)")
            r_time.font.size = Pt(8)
            r_time.font.color.rgb = RGBColor(100, 116, 139)

            # Col 2: Nombre de la Sesión
            c2 = row.cells[2]
            set_cell_background(c2, GRAY_VAL)
            set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
            p2 = c2.paragraphs[0]
            p2.paragraph_format.space_after = Pt(2)
            p2.paragraph_format.line_spacing = 1.15
            r_snum = p2.add_run(f"Sesión {item.index:02d}:\n")
            r_snum.bold = True
            r_snum.font.size = Pt(8.5)
            r_snum.font.color.rgb = ACCENT_RGB
            r_tit = p2.add_run(item.title)
            r_tit.bold = True
            r_tit.font.size = Pt(8.5)

            # Col 3: Criterios de Evaluación numerados (❖ C1, ❖ C2...)
            c3 = row.cells[3]
            crits_by_id = {c.id: c.description for entry in container.curriculumMap for c in entry.criteria}
            raw_crits = [crits_by_id[c_id] for c_id in (item.criterionRefs or []) if c_id in crits_by_id]
            if not raw_crits:
                raw_crits = [c.description for entry in container.curriculumMap for c in entry.criteria]
            if raw_crits:
                formatted_crits = [
                    f"❖ C{c_i+1}: {cr}" if not str(cr).strip().startswith("❖") else str(cr)
                    for c_i, cr in enumerate(raw_crits[:4])
                ]
            else:
                formatted_crits = [
                    "❖ C1: Establece relaciones entre datos y condiciones del problema.",
                    "❖ C2: Selecciona y combina estrategias heurísticas y procedimientos pertinentes.",
                    "❖ C3: Justifica afirmaciones con argumentos y propiedades válidas."
                ]
            _bullet_list_cell(c3, formatted_crits, bg=GRAY_VAL, bullet="")

            # Col 4: Campo Temático
            c4 = row.cells[4]
            know = item.knowledge or ["Contenido temático curricular."]
            _bullet_list_cell(c4, [f"• {k}" for k in know], bg=GRAY_VAL, bullet="")

            # Col 5: Evidencia
            c5 = row.cells[5]
            evs = [e.get("description", str(e)) if isinstance(e, dict) else str(e) for e in item.evidence] or ["Ficha de actividades / Cuaderno"]
            _bullet_list_cell(c5, evs, bg=GRAY_VAL)

            # Col 6: Instrumento
            c6 = row.cells[6]
            inst_list = [i.get("label", str(i)) if isinstance(i, dict) else str(i) for i in item.assessmentInstruments] or ["Lista de cotejo"]
            _bullet_list_cell(c6, list(dict.fromkeys(inst_list)), bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # VI. PRODUCTO O EVIDENCIA FINAL DE LA UNIDAD
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VI", "Producto o Evidencia Final de la Unidad")

    tbl_prod = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_prod, [3000, 7490], indent_twip=-289)
    add_table_borders_black(tbl_prod)

    hdr_p = tbl_prod.rows[0]
    _set_repeat_table_header(hdr_p)
    _keep_row_together(hdr_p)
    _hdr_cell(hdr_p.cells[0], "DENOMINACIÓN DEL PRODUCTO INTEGRADOR", bg=PEACH_HDR)
    _hdr_cell(hdr_p.cells[1], "CARACTERÍSTICAS Y CRITERIOS DE LOGRO DEL PRODUCTO", bg=PEACH_HDR)

    row_p = tbl_prod.rows[1]
    _keep_row_together(row_p)
    c_p1 = row_p.cells[0]
    set_cell_background(c_p1, GRAY_VAL)
    set_cell_margins(c_p1, top=80, bottom=80, left=80, right=80)
    p_p1 = c_p1.paragraphs[0]
    r_ptit = p_p1.add_run(prod_title)
    r_ptit.bold = True
    r_ptit.font.size = Pt(9.5)
    r_ptit.font.color.rgb = PRIMARY_RGB

    c_p2 = row_p.cells[1]
    set_cell_background(c_p2, GRAY_VAL)
    set_cell_margins(c_p2, top=80, bottom=80, left=80, right=80)
    p_p2 = c_p2.paragraphs[0]
    p_p2.paragraph_format.line_spacing = 1.15
    p_p2.add_run(prod_desc)
    if prod and prod.expectedComponents:
        p_comp_hdr = c_p2.add_paragraph()
        p_comp_hdr.paragraph_format.space_before = Pt(4)
        p_comp_hdr.paragraph_format.space_after = Pt(2)
        r_comp_lbl = p_comp_hdr.add_run("Componentes y Criterios Esperados:")
        r_comp_lbl.bold = True
        r_comp_lbl.font.size = Pt(8.5)
        for comp_it in prod.expectedComponents:
            p_comp = c_p2.add_paragraph()
            p_comp.paragraph_format.space_after = Pt(1)
            p_comp.add_run(f"• {comp_it}")

    # ══════════════════════════════════════════════════════════════════════════
    # VII. MATERIALES Y RECURSOS EDUCATIVOS (Página 8 del PDF)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VII", "Materiales y Recursos Educativos")

    tbl_rec = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_rec, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_rec)

    hdr_r = tbl_rec.rows[0]
    _set_repeat_table_header(hdr_r)
    _keep_row_together(hdr_r)
    _hdr_cell(hdr_r.cells[0], "MATERIALES DE AULA", bg=BLUE_HDR)
    _hdr_cell(hdr_r.cells[1], "RECURSOS Y MEDIOS EDUCATIVOS (MINEDU)", bg=BLUE_HDR)

    row_r = tbl_rec.rows[1]
    _keep_row_together(row_r)
    mat_items = [
        "Papelotes cuadriculados y rayados, plumones de colores para pizarra y papel",
        "Juego de reglas geométricas, escuadras, compás y calculadora científica",
        "Tarjetas didácticas, tijeras, cartulinas, papeles de colores y cinta adhesiva",
        "Dispositivos digitales (tablets MINEDU / laptop XO / proyector multimedia)"
    ]
    rec_items = [
        f"Texto Escolar oficial de {areas_str} para Secundaria (MINEDU 2026)",
        f"Cuaderno de Trabajo oficial de Secundaria (MINEDU 2025/2026)",
        "Fichas de refuerzo escolar y fichas de actividades del área",
        "Plataforma PerúEduca (materiales educativos para Secundaria)"
    ]
    _bullet_list_cell(row_r.cells[0], mat_items, bg=GRAY_VAL)
    _bullet_list_cell(row_r.cells[1], rec_items, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # VIII. ORIENTACIONES PARA LA EVALUACIÓN FORMATIVA (Páginas 8 y 9 del PDF)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("VIII", "Orientaciones para la Evaluación Formativa")

    tbl_ev = doc.add_table(rows=2, cols=2)
    set_table_col_widths_and_indent(tbl_ev, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_ev)

    hdr_e = tbl_ev.rows[0]
    _set_repeat_table_header(hdr_e)
    _keep_row_together(hdr_e)
    _hdr_cell(hdr_e.cells[0], "FINALIDAD Y ENFOQUE FORMATIVO (RVM N.° 094-2020-MINEDU)", bg=PEACH_HDR)
    _hdr_cell(hdr_e.cells[1], "TÉCNICAS E INSTRUMENTOS DE EVALUACIÓN APLICADOS", bg=PEACH_HDR)

    row_e = tbl_ev.rows[1]
    _keep_row_together(row_e)
    orient_items = [
        "Valorar el desempeño de los estudiantes mediante evidencias complejas que pongan en juego, integren y combinen diversas capacidades.",
        "Identificar el nivel real de desarrollo en el que se encuentran los estudiantes respecto a las competencias para ayudarlos a avanzar a niveles superiores.",
        "Brindar retroalimentación oportuna, continua y reflexiva a través de preguntas descriptivas antes que verificar adquisiciones aisladas."
    ]
    inst_items = [
        "Autoevaluación: Fichas metacognitivas y diana de autovaloración para que el estudiante autorregule su proceso de aprendizaje.",
        "Coevaluación: Rúbricas y pautas de cotejo entre pares para retroalimentar constructivamente el trabajo en equipo.",
        "Heteroevaluación: Lista de cotejo por sesión, rúbrica analítica para el producto final y portafolio de evidencias del estudiante."
    ]
    _bullet_list_cell(row_e.cells[0], orient_items, bg=GRAY_VAL)
    _bullet_list_cell(row_e.cells[1], inst_items, bg=GRAY_VAL)

    # ══════════════════════════════════════════════════════════════════════════
    # IX. FIRMAS DE RESPONSABILIDAD PEDAGÓGICA (Página 9 del PDF)
    # ══════════════════════════════════════════════════════════════════════════
    _add_section_heading("IX", "Firmas de Responsabilidad Pedagógica")

    p_loc = doc.add_paragraph()
    p_loc.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_loc.paragraph_format.space_before = Pt(8)
    p_loc.paragraph_format.space_after = Pt(14)
    loc_text = f"{admin.dre or 'Región'}, {dates_str.split(' al ')[0] if ' al ' in dates_str else '2026'}"
    r_loc = p_loc.add_run(loc_text)
    r_loc.italic = True
    r_loc.font.size = Pt(9)
    r_loc.font.color.rgb = RGBColor(100, 116, 139)

    tbl_sig = doc.add_table(rows=1, cols=2)
    set_table_col_widths_and_indent(tbl_sig, [5245, 5245], indent_twip=-289)
    add_table_borders_black(tbl_sig)
    row_s = tbl_sig.rows[0]
    _keep_row_together(row_s)

    for cell, role, name_val in [
        (row_s.cells[0], "COORDINADOR(A) PEDAGÓGICO(A) / DIRECCIÓN", coord_name),
        (row_s.cells[1], "DOCENTE RESPONSABLE DEL ÁREA", admin.teacher or "Docente de Área")
    ]:
        set_cell_background(cell, GRAY_VAL)
        set_cell_margins(cell, top=200, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(36)
        p.paragraph_format.space_after = Pt(2)
        r_line = p.add_run("____________________________________\n")
        r_line.font.color.rgb = RGBColor(148, 163, 184)
        r_name = p.add_run(f"{name_val}\n")
        r_name.bold = True
        r_name.font.size = Pt(9)
        r_name.font.color.rgb = DARK_RGB
        r_role = p.add_run(role)
        r_role.bold = True
        r_role.font.size = Pt(8)
        r_role.font.color.rgb = PRIMARY_RGB

    # Finalizar y retornar stream en memoria
    stream = io.BytesIO()
    doc.save(stream)
    stream.seek(0)
    return stream
