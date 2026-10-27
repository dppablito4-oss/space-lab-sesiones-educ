import {AccountActions} from '../live';
import type {CSSProperties} from 'react';
import {QuickSession} from './QuickSession';
import {SessionPreview} from './SessionPreview';

export function SessionEditor() {
    return <>
{" "}
{"\n"}
<div id="app-view" className="app-wrapper hidden">
{"\n"}
{"\n"}
<header className="app-header glass-card">
{"\n"}
<div className="header-leading">
{"\n"}
<div className="header-brand" data-action="view-landing" style={{"cursor": "pointer"} as CSSProperties} title="Volver al inicio / presentación" role="button" tabIndex={0} aria-label="Volver al inicio de Space Lab">
{"\n"}
<div className="brand-icon" style={{"background": "linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(123,97,255,0.2) 100%)", "borderColor": "rgba(0,212,255,0.35)"} as CSSProperties}>
{"\n"}
<img src="assets/favicon.svg" alt="Space Lab Logo" className="brand-logo-img"/>
{"\n"}
</div>
{"\n"}
<div>
{"\n"}
<h1 className="brand-title">
{"Space Lab"}
</h1>
{"\n"}
<span className="brand-subtitle">
{"Sesiones Educativas"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="header-context" aria-label="Contexto de la sesión">
{"\n"}
<span className="header-context-label">
{"Editor de sesión"}
</span>
{"\n"}
<span id="session-context-title" className="header-context-title">
{"Nueva sesión"}
</span>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="header-user-badge" className="header-user-badge" role="region" aria-label="Perfil y créditos del docente" hidden={true}>
{"\n"}
<div className="user-avatar-badge" id="header-user-avatar" aria-hidden="true">
{"--"}
</div>
{"\n"}
<div className="user-details-col">
{"\n"}
<div className="user-name-row">
{"\n"}
<span className="user-display-name" id="header-user-name">
{"Docente"}
</span>
{"\n"}
<span className="user-plan-tag" id="header-user-plan">
{"Plan docente"}
</span>
{"\n"}
</div>
{"\n"}
<div className="user-credits-sub">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span className="user-credits-text" id="header-user-credits">
{"-- créditos IA"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="save-indicator" id="save-indicator" role="status" aria-live="polite">
{"\n"}
<span className="save-dot">

</span>
{"\n"}
<span className="save-text">
{"Sin cambios"}
</span>
{"\n"}
</div>
{"\n"}
<nav className="header-actions">
{"\n"}
<a href="mailto:pabloclsa87@gmail.com" className="btn btn-ghost btn-sm" aria-label="Contactar con soporte por correo">
{"Soporte"}
</a>
{"\n"}
<span id="ai-credit-indicator" className="ai-credit-indicator" role="status" aria-live="polite" hidden={true}>
{"IA · -- créditos"}
</span>
{"\n"}
<button id="btn-home-nav" type="button" className="btn btn-ghost btn-sm" data-action="view-home" hidden={true}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-folder">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Mi espacio"}
</span>
{"\n"}
</button>
{"\n"}
<label className="theme-picker" title="Tema de la aplicación">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-theme">

</use>
</svg>
{"\n"}
<span className="sr-only">
{"Tema de la aplicación"}
</span>
{"\n"}
<select id="theme-preference" aria-label="Tema de la aplicación">
{"\n"}
<option value="system">
{"Sistema"}
</option>
{"\n"}
<option value="light">
{"Claro"}
</option>
{"\n"}
<option value="dark">
{"Oscuro"}
</option>
{"\n"}
</select>
{"\n"}
</label>
{"\n"}
<button id="btn-toggle-edit" className="btn btn-ghost btn-icon" title="Modo edición / lectura" aria-label="Cambiar modo de edición">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-edit">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Editar"}
</span>
{"\n"}
</button>
{"\n"}
<button id="btn-preview" className="btn btn-ghost btn-icon" title="Vista previa de impresión" aria-label="Abrir vista previa">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-eye">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Vista Previa"}
</span>
{"\n"}
</button>
{"\n"}
<details id="export-command-menu" className="command-menu">
{"\n"}
<summary className="btn btn-primary" aria-label="Abrir opciones de exportación">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Exportar"}
</span>
{"\n"}
<svg className="ui-icon command-menu-chevron" aria-hidden="true">
<use href="#icon-chevron-down">

</use>
</svg>
{"\n"}
</summary>
{"\n"}
<div className="command-menu-panel" role="group" aria-label="Opciones de exportación">
{"\n"}
<span className="command-menu-heading">
{"Exportar sesión"}
</span>
{"\n"}
<button id="btn-export-pdf" className="btn btn-pdf" title="Exportar sesión a PDF" aria-label="Exportar sesión a PDF">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Documento PDF"}
</span>
{"\n"}
</button>
{"\n"}
<button id="btn-export-word" className="btn btn-word" title="Exportar sesión a Word" aria-label="Exportar sesión a Word">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Documento Word"}
</span>
{"\n"}
</button>
{"\n"}
<span className="command-menu-separator" aria-hidden="true">

</span>
{"\n"}
<a id="btn-download-engine" href="https://descargas.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="btn btn-ghost" title="Descargar Motor de Exportación Local (.exe)">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Obtener motor local"}
</span>
{"\n"}
</a>
{"\n"}
</div>
{"\n"}
</details>
{"\n"}
<div id="auth-header-container" className="auth-header-container"><AccountActions/></div>
{"\n"}
<button id="btn-menu-mobile" className="btn btn-ghost btn-icon mobile-only" title="Abrir planificación" aria-label="Abrir planificación" aria-expanded="false" aria-controls="sidebar">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-menu">

</use>
</svg>
{"\n"}
<span className="btn-label">
{"Planificar"}
</span>
{"\n"}
</button>
{"\n"}
</nav>
{"\n"}
</header>
{"\n"}
{"\n"}
<main className="app-main">
{"\n"}
<nav id="workflow-rail" className="workflow-rail" aria-label="Flujo de creación">
{"\n"}
<button id="btn-toggle-rail" className="workflow-rail-brand" type="button" aria-label="Mostrar nombres de las etapas" aria-expanded="false" aria-controls="workflow-tabs">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-menu">

</use>
</svg>
{"\n"}
<span>
{"Etapas"}
</span>
{"\n"}
</button>
{"\n"}
<button type="button" id="quick-open-planner" className="btn btn-ghost" aria-controls="sidebar">
{"Editar sesión"}
</button>
{"\n"}
<div id="workflow-tabs" className="sidebar-tabs" role="group" aria-label="Secciones de la sesión">
{"\n"}
<button type="button" className="sidebar-tab active" data-tab="tab-ai" aria-label="Copiloto, en curso" aria-current="step" aria-controls="tab-ai">
{"\n"}
<span className="tab-step">
{"01"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Copiloto"}
</span>
<span className="tab-state">
{"En curso"}
</span>
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="sidebar-tab" data-tab="tab-general" aria-label="Datos, pendiente" aria-controls="tab-general">
{"\n"}
<span className="tab-step">
{"02"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-building">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Datos"}
</span>
<span className="tab-state">
{"Pendiente"}
</span>
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="sidebar-tab" data-tab="tab-propositos" aria-label="Propósitos, pendiente" aria-controls="tab-propositos">
{"\n"}
<span className="tab-step">
{"03"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Propósitos"}
</span>
<span className="tab-state">
{"Pendiente"}
</span>
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="sidebar-tab" data-tab="tab-design" aria-label="Diseño, pendiente" aria-controls="tab-design">
{"\n"}
<span className="tab-step">
{"04"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-sliders">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Diseño"}
</span>
<span className="tab-state">
{"Pendiente"}
</span>
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="sidebar-tab" data-tab="tab-alumnos" aria-label="Alumnos, pendiente" aria-controls="tab-alumnos">
{"\n"}
<span className="tab-step">
{"05"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-users">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Alumnos"}
</span>
<span className="tab-state">
{"Pendiente"}
</span>
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="sidebar-tab" data-tab="tab-fichas" aria-label="Fichas, pendiente" aria-controls="tab-fichas">
{"\n"}
<span className="tab-step">
{"06"}
</span>
{"\n"}
<svg className="ui-icon tab-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span className="tab-copy">
<span className="tab-text">
{"Fichas"}
</span>
<span className="tab-state">
{"Pendiente"}
</span>
</span>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
</nav>
{"\n"}
{"\n"}
<aside id="sidebar" className="sidebar glass-card">
{"\n"}
<div className="sidebar-header">
{"\n"}
<div>
{"\n"}
<span className="sidebar-eyebrow">
{"Planificador docente"}
</span>
{"\n"}
<h2 className="sidebar-title">
{"Diseña tu sesión"}
</h2>
{"\n"}
</div>
{"\n"}
<button id="btn-close-sidebar" type="button" className="btn btn-ghost btn-sm" aria-label="Volver al documento">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
<span>
{"Volver al documento"}
</span>
</button>
{"\n"}
</div>
{"\n"}
<div className="sidebar-workflow">
{"\n"}
<form id="session-form" className="session-form" autoComplete="off">
{"\n"}
<QuickSession/>
{"\n"}
{"\n"}
<div id="tab-ai" className="tab-pane active" role="region" aria-labelledby="inspector-title">
{"\n"}
<div className="inspector-heading planner-section-heading">
{"\n"}
<span id="inspector-step" className="inspector-step">
{"Paso 01 de 06"}
</span>
{"\n"}
<h3 id="inspector-title">
{"Configura el copiloto"}
</h3>
{"\n"}
<p id="inspector-description">
{"Elige el modelo, la plantilla y las referencias para preparar tu sesión."}
</p>
{"\n"}
<p className="planner-scroll-help">
{"Baja para continuar. El menú te lleva directo a cada sección."}
</p>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group ai-model-card">
{"\n"}
<div className="ai-model-header">
{"\n"}
<div>
{"\n"}
<span className="ai-model-eyebrow">
{"Copiloto Space AI"}
</span>
{"\n"}
<strong>
{"Enrutamiento inteligente"}
</strong>
{"\n"}
</div>
{"\n"}
<span className="ai-model-status" id="ai-availability-status">
{"Disponibilidad por verificar"}
</span>
{"\n"}
</div>
{"\n"}
<label htmlFor="select-ai-provider" className="form-label">
{"\n                                Modo de calidad\n                            "}
</label>
{"\n"}
<select defaultValue="automatic" id="select-ai-provider" className="form-select">
{"\n"}
<option value="automatic">
{"Automático — Recomendado"}
</option>
{"\n"}
<option value="fast" disabled={true} hidden={true}>
{"Rápido — Menor latencia"}
</option>
{"\n"}
<option value="balanced" disabled={true} hidden={true}>
{"Equilibrado — Calidad y eficiencia"}
</option>
{"\n"}
<option value="max_quality" disabled={true} hidden={true}>
{"Máxima calidad — Trabajo curricular complejo"}
</option>
{"\n"}
</select>
{"\n"}
<p id="ai-availability-help" className="curriculum-help">
{"Automático delega la selección al gateway. Las demás opciones requieren verificar tu cuenta y el backend."}
</p>
{"\n"}
<div id="model-capabilities-badge" className="model-capabilities-badge">
{"\n"}
<svg className="ui-icon badge-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span className="badge-text">
<strong>
{"Automático:"}
</strong>
{" El gateway elige la ruta más adecuada según la tarea y los archivos."}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sliders">

</use>
</svg>
{"\n                                Estructura de la Sesión\n                            "}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="select-template" className="form-label">
{"Tipo de Sesión"}
</label>
{"\n"}
<select id="select-template" className="form-select">
{"\n"}
<option value="estandar">
{"Sesión estándar MINEDU"}
</option>
{"\n"}
<option value="inicial">
{"Sesión de educación inicial"}
</option>
{"\n"}
<option value="laboratorio">
{"Sesión de laboratorio"}
</option>
{"\n"}
<option value="refuerzo">
{"Sesión de refuerzo"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="select-methodology" className="form-label">
{"Metodología Didáctica"}
</label>
{"\n"}
<select id="select-methodology" className="form-select">
{"\n"}
<option value="">
{"-- Por defecto del Área --"}
</option>
{"\n"}
<option value="polya">
{"Método de Polya — resolución de problemas"}
</option>
{"\n"}
<option value="erca">
{"Ciclo ERCA — experiencia, reflexión, conceptualización y aplicación"}
</option>
{"\n"}
<option value="project_based_learning">
{"Aprendizaje Basado en Proyectos"}
</option>
{"\n"}
<option value="flipped">
{"Aula invertida"}
</option>
{"\n"}
<option value="indagacion">
{"Indagación científica (STEAM)"}
</option>
{"\n"}
<option value="cooperativo">
{"Aprendizaje cooperativo"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card source-file-group">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-upload">

</use>
</svg>
{"\n                                Documento de Referencia "}
<span className="optional-label" style={{"fontSize": "0.65rem", "color": "var(--text-muted)", "marginLeft": "auto"} as CSSProperties}>
{"Opcional"}
</span>
{"\n"}
</div>
{"\n"}
<div id="source-file-dropzone" className="source-file-dropzone">
{"\n"}
<span className="icon">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-upload">

</use>
</svg>
</span>
{"\n"}
<span className="text">
{"Haz clic o arrastra un archivo aquí (PDF, imagen, audio o texto)"}
</span>
{"\n"}
</div>
{"\n"}
<div id="source-file-info" className="source-file-info hidden">
{"\n"}
<span className="file-name" id="source-file-name-text">

</span>
{"\n"}
<button type="button" id="btn-remove-source-file" className="btn-remove-file" title="Eliminar archivo" aria-label="Eliminar archivo">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
<input type="file" id="input-source-file" className="hidden" accept=".pdf,image/*,audio/*,text/plain,.csv,.md,.json"/>
{"\n"}
<div id="source-file-guidance" className="source-file-guidance hidden">
{"\n"}
<label htmlFor="input-source-instruction" className="form-label">
{"\n                                    ¿Qué parte debe usar la IA?\n                                "}
</label>
{"\n"}
<textarea id="input-source-instruction" className="form-textarea" rows={3} maxLength={600} placeholder="Ej.: Toma como situación central la primera situación problemática de la página 2. No uses los otros ejemplos.">

</textarea>
{"\n"}
<p className="source-file-guidance-help">
{"\n                                    Indica una página, un rango (págs. 3–5) o describe la situación. Si lo dejas vacío, la IA revisará todo el archivo.\n                                "}
</p>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"marginTop": "0.5rem"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-pedagogy-brief" className="pb-trigger-btn btn btn-ghost" title="Afinar el enfoque pedagógico con la IA antes de generar" style={{"width": "100%", "padding": "10px 16px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" Afinar enfoque pedagógico con IA\n                            "}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="tab-general" className="tab-pane" role="region" aria-labelledby="planner-title-general">
{"\n"}
<header className="planner-section-heading">
<span className="planner-section-step">
{"Paso 02 de 06"}
</span>
<h3 id="planner-title-general">
{"Completa los datos"}
</h3>
<p>
{"Define la institución, el grado, el área y la identidad de tu sesión."}
</p>
</header>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-building">

</use>
</svg>
{"\n                                Institución y Jurisdicción\n                            "}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-institucion" className="form-label">
{"Institución Educativa"}
</label>
{"\n"}
<input type="text" id="input-institucion" className="form-input" placeholder="I.E. N° 000 — Nombre"/>
{"\n"}
</div>
{"\n"}
<div className="form-row">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-dre" className="form-label">
{"DRE"}
</label>
{"\n"}
<input type="text" id="input-dre" className="form-input" placeholder="DRE Ucayali"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-ugel" className="form-label">
{"UGEL"}
</label>
{"\n"}
<input type="text" id="input-ugel" className="form-input" placeholder="UGEL Padre Abad"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-user">

</use>
</svg>
{"\n                                Equipo Docente\n                            "}
</div>
{"\n"}
<div className="form-row">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-docente" className="form-label">
{"Docente"}
</label>
{"\n"}
<input type="text" id="input-docente" className="form-input" placeholder="Nombre completo"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-director" className="form-label">
{"Director(a)"}
</label>
{"\n"}
<input type="text" id="input-director" className="form-input" placeholder="Nombre del director"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sliders">

</use>
</svg>
{"\n                                Programación de Aula\n                            "}
</div>
{"\n"}
<div className="form-row">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-fecha" className="form-label">
{"Fecha"}
</label>
{"\n"}
<input type="date" id="input-fecha" className="form-input"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-nivel" className="form-label">
{"Nivel"}
</label>
{"\n"}
<select id="input-nivel" className="form-select">
{"\n"}
<option value="SECUNDARIA">
{"Secundaria"}
</option>
{"\n"}
<option value="PRIMARIA">
{"Primaria"}
</option>
{"\n"}
<option value="INICIAL">
{"Inicial"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="form-row">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-grado" className="form-label">
{"Grado"}
</label>
{"\n"}
<select id="input-grado" className="form-select">
{"\n"}
<option value="">
{"Seleccionar"}
</option>
{"\n"}
<option value="3 años">
{"3 años (Inicial)"}
</option>
{"\n"}
<option value="4 años">
{"4 años (Inicial)"}
</option>
{"\n"}
<option value="5 años">
{"5 años (Inicial)"}
</option>
{"\n"}
<option value="1°">
{"1° Grado"}
</option>
{"\n"}
<option value="2°">
{"2° Grado"}
</option>
{"\n"}
<option value="3°">
{"3° Grado"}
</option>
{"\n"}
<option value="4°">
{"4° Grado"}
</option>
{"\n"}
<option value="5°">
{"5° Grado"}
</option>
{"\n"}
<option value="6°">
{"6° Grado"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-seccion" className="form-label">
{"Sección"}
</label>
{"\n"}
<input type="text" id="input-seccion" className="form-input" placeholder="A, B, C..."/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="form-row">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-numero-sesion" className="form-label">
{"N° de Sesión"}
</label>
{"\n"}
<input type="text" id="input-numero-sesion" className="form-input" placeholder="03"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-duracion" className="form-label">
{"Duración"}
</label>
{"\n"}
<input type="text" id="input-duracion" className="form-input" placeholder="90 min"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n                                Identidad y Temario\n                            "}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-area" className="form-label">
{"Área Curricular"}
</label>
{"\n"}
<select id="input-area" className="form-select">
{"\n"}
<option value="">
{"Seleccionar"}
</option>
{"\n"}
<option value="Comunicación">
{"Comunicación"}
</option>
{"\n"}
<option value="Matemática">
{"Matemática"}
</option>
{"\n"}
<option value="Ciencia y Tecnología">
{"Ciencia y Tecnología"}
</option>
{"\n"}
<option value="Personal Social">
{"Personal Social"}
</option>
{"\n"}
<option value="Arte y Cultura">
{"Arte y Cultura"}
</option>
{"\n"}
<option value="Educación Física">
{"Educación Física"}
</option>
{"\n"}
<option value="Educación Religiosa">
{"Educación Religiosa"}
</option>
{"\n"}
<option value="Inglés">
{"Inglés"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-unidad" className="form-label">
{"Unidad Didáctica"}
</label>
{"\n"}
<input type="text" id="input-unidad" className="form-input" placeholder="Unidad N° — Título"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-titulo" className="form-label">
{"Título de la Sesión"}
</label>
{"\n"}
<input type="text" id="input-titulo" className="form-input" placeholder="Título descriptivo de la sesión"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div style={{"display": "flex", "gap": "8px", "marginTop": "1rem"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-save-defaults" className="btn btn-ghost btn-sm" title="Guardar predeterminados en la nube" style={{"flex": "1", "fontSize": "0.76rem", "padding": "8px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-save">

</use>
</svg>
{" Predeterminados\n                            "}
</button>
{"\n"}
<button type="button" id="btn-new" className="btn btn-ghost btn-sm" title="Limpiar formulario e iniciar nueva sesión" style={{"flex": "1", "fontSize": "0.76rem", "padding": "8px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-trash">

</use>
</svg>
{" Limpiar Todo\n                            "}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="tab-propositos" className="tab-pane" role="region" aria-labelledby="planner-title-propositos">
{"\n"}
<header className="planner-section-heading">
<span className="planner-section-step">
{"Paso 03 de 06"}
</span>
<h3 id="planner-title-propositos">
{"Elige los aprendizajes"}
</h3>
<p>
{"Marca competencias y capacidades. Después, precisa los desempeños y enfoques que trabajarás."}
</p>
</header>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"\n                                Competencias y Capacidades\n                            "}
</div>
{"\n"}
<div id="curriculum-picker" className="curriculum-picker" aria-label="Seleccionar competencias y capacidades">

</div>
{"\n"}
<details id="curriculum-manual" className="form-disclosure" open={true}>
{"\n"}
<summary>
{"Editar aprendizajes manualmente"}
</summary>
{"\n"}
<div className="form-disclosure-content">
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-competencia" className="form-label">
{"Competencia Curricular"}
</label>
{"\n"}
<select id="select-cneb-competencia" className="form-select hidden" style={{"marginBottom": "6px", "fontSize": "0.8rem", "backgroundColor": "rgba(0, 212, 255, 0.08)", "borderColor": "var(--border-accent)"} as CSSProperties}>

</select>
{"\n"}
<textarea id="input-competencia" className="form-textarea" rows={2} placeholder="Competencia curricular...">

</textarea>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-capacidad" className="form-label">
{"Capacidad a Desarrollar"}
</label>
{"\n"}
<select id="select-cneb-capacidad" className="form-select hidden" style={{"marginBottom": "6px", "fontSize": "0.8rem", "backgroundColor": "rgba(0, 212, 255, 0.08)", "borderColor": "var(--border-accent)"} as CSSProperties}>

</select>
{"\n"}
<textarea id="input-capacidad" className="form-textarea" rows={2} placeholder="Capacidades a desarrollar...">

</textarea>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</details>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n                                Desempeños Esperados\n                            "}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-desempeno" className="form-label">
{"Desempeño de la sesión (por verificar)"}
</label>
{"\n"}
<textarea id="input-desempeno" className="form-textarea" rows={3} placeholder="Desempeños esperados...">

</textarea>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n                                Enfoques Transversales CNEB\n                            "}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-enfoque" className="form-label">
{"Enfoque Transversal 1"}
</label>
{"\n"}
<select id="select-cneb-enfoque" className="form-select" style={{"marginBottom": "6px", "fontSize": "0.8rem", "backgroundColor": "rgba(0, 212, 255, 0.08)", "borderColor": "var(--border-accent)"} as CSSProperties}>

</select>
{"\n"}
<input type="text" id="input-enfoque" className="form-input" placeholder="Ej: Enfoque de derechos"/>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label htmlFor="input-enfoque2" className="form-label">
{"Enfoque Transversal 2"}
</label>
{"\n"}
<select id="select-cneb-enfoque2" className="form-select" style={{"marginBottom": "6px", "fontSize": "0.8rem", "backgroundColor": "rgba(0, 212, 255, 0.08)", "borderColor": "var(--border-accent)"} as CSSProperties}>

</select>
{"\n"}
<input type="text" id="input-enfoque2" className="form-input" placeholder="Ej: Enfoque ambiental"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<section id="session-proposals" className="quick-suggestions" aria-labelledby="session-proposals-title">
{"\n"}
<h4 id="session-proposals-title">
{"Propuestas para tu sesión"}
</h4>
{"\n"}
<p>
{"Actividades, criterios y evidencias son propuestas editables del docente o de la IA; no son textos curriculares oficiales. La IA las completará al generar."}
</p>
{"\n"}
<div className="form-group">
<label className="form-label" htmlFor="input-session-activities">
{"Actividades sugeridas"}
</label>
<textarea id="input-session-activities" className="form-textarea" rows={3} maxLength={2000} placeholder="Propón una actividad o revisa la propuesta después de generar.">

</textarea>
</div>
{"\n"}
<div className="form-group">
<label className="form-label" htmlFor="input-session-criteria">
{"Criterios de evaluación sugeridos (uno por línea)"}
</label>
<textarea id="input-session-criteria" className="form-textarea" rows={3} maxLength={2000}>

</textarea>
</div>
{"\n"}
<div className="form-group">
<label className="form-label" htmlFor="input-session-evidence">
{"Evidencia sugerida"}
</label>
<textarea id="input-session-evidence" className="form-textarea" rows={2} maxLength={2000}>

</textarea>
</div>
{"\n"}
</section>
{"\n"}
</div>
{" "}
{"\n"}
{"\n"}
<div id="tab-design" className="tab-pane" role="region" aria-labelledby="planner-title-design">
{"\n"}
<header className="planner-section-heading">
<span className="planner-section-step">
{"Paso 04 de 06"}
</span>
<h3 id="planner-title-design">
{"Dale tu estilo"}
</h3>
<p>
{"Ajusta cómo se verá tu documento en el editor y al exportarlo."}
</p>
</header>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sliders">

</use>
</svg>
{"\n                                Presentación del Documento\n                            "}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-preset">
{"Estilo Prediseñado"}
</label>
{"\n"}
<select defaultValue="minedu" id="select-design-preset" className="form-select">
{"\n"}
<option value="minedu">
{"MINEDU oficial"}
</option>
{"\n"}
<option value="institucional">
{"Institucional azul"}
</option>
{"\n"}
<option value="moderno">
{"Moderno verde"}
</option>
{"\n"}
<option value="clasico">
{"Clásico editorial"}
</option>
{"\n"}
<option value="accesible">
{"Accesible alto contraste"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-image">

</use>
</svg>
{"\n                                Logos del Encabezado\n                            "}
</div>
{"\n"}
<div style={{"display": "flex", "gap": "8px", "marginBottom": "10px"} as CSSProperties}>
{"\n"}
<input type="file" id="input-upload-logo" accept="image/png,image/jpeg,image/webp" className="hidden"/>
{"\n"}
<button type="button" id="btn-trigger-upload-logo" className="btn btn-ghost btn-sm" style={{"flex": "1", "fontSize": "0.74rem", "padding": "6px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-upload">

</use>
</svg>
{" Subir logo\n                                "}
</button>
{"\n"}
<button type="button" id="btn-refresh-logos" className="btn btn-ghost btn-icon" style={{"minWidth": "34px", "minHeight": "34px", "fontSize": "0.8rem", "padding": "2px"} as CSSProperties} title="Actualizar lista" aria-label="Actualizar galería de logos">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-refresh">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
<div id="logos-container" style={{"display": "grid", "gridTemplateColumns": "repeat(4, 1fr)", "gap": "6px", "maxHeight": "120px", "overflowY": "auto", "padding": "6px", "background": "rgba(0,0,0,0.25)", "borderRadius": "8px", "border": "1px solid var(--border)"} as CSSProperties}>
{"\n"}
<span style={{"gridColumn": "span 4", "fontSize": "0.7rem", "textAlign": "center", "color": "var(--text-muted)", "padding": "4px"} as CSSProperties}>
{"Inicia\n                                    sesión para ver logos"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<details className="form-disclosure">
{"\n"}
<summary>
{"Ajustes avanzados"}
</summary>
{"\n"}
<div className="form-disclosure-content">
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="input-design-theme-color">
{"Color de Bordes y Recuadros"}
</label>
{"\n"}
<div style={{"display": "flex", "gap": "8px", "alignItems": "center"} as CSSProperties}>
{"\n"}
<input type="color" id="input-design-theme-color" className="form-input" style={{"padding": "2px", "width": "45px", "height": "35px", "borderRadius": "6px", "cursor": "pointer", "background": "transparent", "border": "1px solid var(--border)"} as CSSProperties} defaultValue="#000000"/>
{"\n"}
<input type="text" id="input-design-theme-color-hex" className="form-input" placeholder="#000000" aria-label="Código hexadecimal del color de bordes" style={{"flex": "1", "fontFamily": "monospace"} as CSSProperties} defaultValue="#000000"/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="input-design-accent-color">
{"Color de títulos y acentos"}
</label>
{"\n"}
<input type="color" id="input-design-accent-color" className="form-input" defaultValue="#C0392B" style={{"padding": "2px", "width": "100%", "height": "35px", "cursor": "pointer", "background": "transparent", "border": "1px solid var(--border)"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-font-family">
{"Tipo de Letra (Fuente)"}
</label>
{"\n"}
<select defaultValue="Arial, sans-serif" id="select-design-font-family" className="form-select">
{"\n"}
<option value="Arial, sans-serif">
{"Arial (Sans-serif estándar)"}
</option>
{"\n"}
<option value="Calibri, Arial, sans-serif">
{"Calibri (Word moderna)"}
</option>
{"\n"}
<option value="'Times New Roman', serif">
{"Times New Roman (Serif clásica)"}
</option>
{"\n"}
<option value="Georgia, serif">
{"Georgia (Serif de pantalla)"}
</option>
{"\n"}
<option value="'Courier New', monospace">
{"Courier New (Monospaced)"}
</option>
{"\n"}
<option value="'Space Grotesk', sans-serif">
{"Space Grotesk (Moderna)"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-font-size">
{"Tamaño de Letra"}
</label>
{"\n"}
<select defaultValue="10pt" id="select-design-font-size" className="form-select">
{"\n"}
<option value="8pt">
{"Pequeño (8pt)"}
</option>
{"\n"}
<option value="9pt">
{"Estándar MINEDU (9pt)"}
</option>
{"\n"}
<option value="10pt">
{"Normal (10pt)"}
</option>
{"\n"}
<option value="11pt">
{"Grande (11pt)"}
</option>
{"\n"}
<option value="12pt">
{"Muy Grande (12pt)"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-padding">
{"Espaciado de Celdas (Padding)"}
</label>
{"\n"}
<select defaultValue="4px 6px" id="select-design-padding" className="form-select">
{"\n"}
<option value="2px 4px">
{"Compacto (2px)"}
</option>
{"\n"}
<option value="4px 6px">
{"Estándar (4px)"}
</option>
{"\n"}
<option value="6px 8px">
{"Amplio (6px)"}
</option>
{"\n"}
<option value="8px 10px">
{"Espacioso (8px)"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-line-height">
{"Interlineado (Line Height)"}
</label>
{"\n"}
<select defaultValue="1.4" id="select-design-line-height" className="form-select">
{"\n"}
<option value="1.2">
{"Compacto (1.2)"}
</option>
{"\n"}
<option value="1.3">
{"Sutil (1.3)"}
</option>
{"\n"}
<option value="1.4">
{"Estándar (1.4)"}
</option>
{"\n"}
<option value="1.5">
{"Amplio (1.5)"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="form-group">
{"\n"}
<label className="form-label" htmlFor="select-design-header-bg">
{"Estilo de Cabeceras de Momentos"}
</label>
{"\n"}
<input type="color" id="select-design-header-bg" className="form-input" defaultValue="#BDD6EE" style={{"padding": "2px", "width": "100%", "height": "35px", "cursor": "pointer", "background": "transparent", "border": "1px solid var(--border)"} as CSSProperties}/>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</details>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="tab-alumnos" className="tab-pane" role="region" aria-labelledby="planner-title-alumnos">
{"\n"}
<header className="planner-section-heading">
<span className="planner-section-step">
{"Paso 05 de 06"}
</span>
<h3 id="planner-title-alumnos">
{"Añade a tus estudiantes"}
</h3>
<p>
{"Prepara la lista de cotejo para tu grado y sección."}
</p>
</header>
{"\n"}
<div className="form-card">
{"\n"}
<div className="form-card-title" style={{"justifyContent": "space-between"} as CSSProperties}>
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "8px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-users">

</use>
</svg>
{"\n                                    Registro de Estudiantes\n                                "}
</div>
{"\n"}
<button type="button" id="btn-save-alumnos" className="btn btn-primary btn-sm" style={{"fontSize": "0.72rem", "padding": "4px 12px", "cursor": "pointer"} as CSSProperties}>
{"Guardar Alumnos"}
</button>
{"\n"}
</div>
{"\n"}
<p style={{"fontSize": "0.74rem", "color": "var(--text-muted)", "marginBottom": "12px", "lineHeight": "1.4"} as CSSProperties}>
{"\n                                Registra la lista de alumnos para autocompletar la Lista de Cotejo de tu sesión.\n                            "}
</p>
{"\n"}
<div className="form-group" style={{"marginBottom": "0"} as CSSProperties}>
{"\n"}
<textarea id="textarea-alumnos" className="form-textarea student-list-input" placeholder="Pega los nombres aquí, uno por línea. Ejemplo:\nACOSTA MURGA, CLIFEER AMELEX\nAGUILAR JAVIER, FARID OMAR">

</textarea>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div id="tab-fichas" className="tab-pane" role="region" aria-labelledby="planner-title-fichas">
{"\n"}
<header className="planner-section-heading">
<span className="planner-section-step">
{"Paso 06 de 06"}
</span>
<h3 id="planner-title-fichas">
{"Prepara tus fichas"}
</h3>
<p>
{"Una vez generada tu sesión, prepara el material de aplicación que acompañará a tus estudiantes."}
</p>
</header>
{"\n"}
{"\n"}
<div id="apartado-fichas" className="form-card ficha-prompt-apartado">
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "justifyContent": "space-between", "marginBottom": "8px"} as CSSProperties}>
{"\n"}
<label htmlFor="input-ficha-prompt" className="form-card-title" style={{"margin": "0", "fontSize": "0.82rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true" style={{"color": "#00D4FF"} as CSSProperties}>
<use href="#icon-sparkles">

</use>
</svg>
{"\n                                    Ficha Didáctica (Prompt IA)\n                                "}
</label>
{"\n"}
<button type="button" id="btn-copy-ficha-prompt" className="btn btn-ghost btn-sm" style={{"fontSize": "0.72rem", "padding": "4px 10px"} as CSSProperties} title="Copiar prompt de ficha">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-copy">

</use>
</svg>
{" Copiar\n                                "}
</button>
{"\n"}
</div>
{"\n"}
<p style={{"fontSize": "0.74rem", "color": "var(--text-muted)", "marginBottom": "12px", "lineHeight": "1.4"} as CSSProperties}>
{"\n                                Genera un prompt optimizado para ChatGPT Images o Midjourney para crear fichas listas para imprimir:\n                            "}
</p>
{"\n"}
<div style={{"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "8px", "marginBottom": "10px"} as CSSProperties}>
{"\n"}
<div>
{"\n"}
<label htmlFor="select-ficha-nivel" className="form-label" style={{"fontSize": "0.72rem", "marginBottom": "4px"} as CSSProperties}>
{"Dificultad"}
</label>
{"\n"}
<select defaultValue="avanzado" id="select-ficha-nivel" className="form-select" style={{"fontSize": "0.75rem", "padding": "6px 8px"} as CSSProperties}>
{"\n"}
<option value="inicio">
{"Nivel Inicio (Andamiaje)"}
</option>
{"\n"}
<option value="avanzado">
{"Nivel Avanzado (Estándar)"}
</option>
{"\n"}
<option value="experto">
{"Nivel Experto (Desafío)"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
<div>
{"\n"}
<label htmlFor="select-ficha-variante" className="form-label" style={{"fontSize": "0.72rem", "marginBottom": "4px"} as CSSProperties}>
{"Variante"}
</label>
{"\n"}
<select defaultValue="estandar" id="select-ficha-variante" className="form-select" style={{"fontSize": "0.75rem", "padding": "6px 8px"} as CSSProperties}>
{"\n"}
<option value="estandar">
{"Datos de la sesión"}
</option>
{"\n"}
<option value="alternativa">
{"Situación alternativa"}
</option>
{"\n"}
<option value="refuerzo">
{"Refuerzo guiado"}
</option>
{"\n"}
<option value="reto">
{"Reto / Extensión"}
</option>
{"\n"}
</select>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<textarea id="input-ficha-prompt" className="form-textarea" rows={7} readOnly={true} style={{"fontSize": "0.75rem", "fontFamily": "ui-monospace, SFMono-Regular, Consolas, monospace", "lineHeight": "1.35", "background": "rgba(0,0,0,0.3)", "resize": "vertical"} as CSSProperties} placeholder="Primero genera la sesión para poder crear la ficha didáctica...">

</textarea>
{"\n"}
<div style={{"display": "flex", "gap": "8px", "marginTop": "10px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-trigger-ficha-prompt" className="btn btn-primary btn-sm" style={{"flex": "1", "fontSize": "0.78rem", "padding": "8px 12px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" Generar variante\n                                "}
</button>
{"\n"}
<button type="button" id="btn-modal-ficha-prompt" className="btn btn-ghost btn-sm" style={{"fontSize": "0.78rem", "padding": "8px 12px"} as CSSProperties} title="Ver prompt en ventana completa" aria-label="Ver prompt en ventana completa">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-expand">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<details className="form-disclosure session-management-disclosure" style={{"marginTop": "1.25rem"} as CSSProperties}>
{"\n"}
<summary style={{"fontSize": "0.78rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true" style={{"color": "#00D4FF", "marginRight": "6px"} as CSSProperties}>
<use href="#icon-folder">

</use>
</svg>
{"\n                            Gestión de Sesiones y Archivos\n                        "}
</summary>
{"\n"}
<div className="form-disclosure-content">
{"\n"}
{"\n"}
<div className="form-actions" style={{"borderTop": "none", "paddingTop": "4px"} as CSSProperties}>
{"\n"}
<div className="form-actions-row" style={{"display": "flex", "gap": "6px", "marginBottom": "6px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-save" className="btn btn-ghost btn-sm" style={{"flex": "1"} as CSSProperties} title="Guardar cambios en la sesión actual">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-save">

</use>
</svg>
{" Guardar\n                                    "}
</button>
{"\n"}
<button type="button" id="btn-load" className="btn btn-ghost btn-sm" style={{"flex": "1"} as CSSProperties} title="Cargar sesión previamente guardada">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-folder">

</use>
</svg>
{" Cargar\n                                    "}
</button>
{"\n"}
</div>
{"\n"}
<button type="button" id="btn-save-as" className="btn btn-ghost btn-sm" title="Guardar una copia de esta sesión con un nuevo título" style={{"width": "100%", "marginBottom": "6px"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-save">

</use>
</svg>
{" Guardar como…\n                                "}
</button>
{"\n"}
<div className="form-actions-row" style={{"display": "flex", "gap": "6px"} as CSSProperties}>
{"\n"}
<button type="button" id="btn-export-json" className="btn btn-ghost btn-sm" style={{"flex": "1", "fontSize": "0.72rem"} as CSSProperties} title="Exportar sesión a archivo JSON">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{" Exportar JSON\n                                    "}
</button>
{"\n"}
<button type="button" id="btn-import-json" className="btn btn-ghost btn-sm" style={{"flex": "1", "fontSize": "0.72rem"} as CSSProperties} title="Importar sesión desde archivo JSON">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-upload">

</use>
</svg>
{" Importar JSON\n                                    "}
</button>
{"\n"}
</div>
{"\n"}
<input type="file" id="input-import-file" className="hidden" accept=".json"/>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="saved-sessions" style={{"marginTop": "1rem"} as CSSProperties}>
{"\n"}
<h3 className="saved-title" style={{"fontSize": "0.75rem", "marginBottom": "6px"} as CSSProperties}>
{"Sesiones guardadas"}
</h3>
{"\n"}
<ul id="saved-list" className="saved-list">
{"\n"}
<li className="saved-empty">
{"No hay sesiones guardadas"}
</li>
{"\n"}
</ul>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</details>
{"\n"}
</form>
{"\n"}
<aside className="session-planning-summary" aria-labelledby="planning-summary-heading">
{"\n"}
<span className="sidebar-eyebrow" id="planning-summary-heading">
{"Tu sesión, de un vistazo"}
</span>
{"\n"}
<svg className="ui-icon planning-summary-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<h3 id="planning-summary-title">
{"Tu próxima clase"}
</h3>
{"\n"}
<p id="planning-summary-context">
{"Completa los datos de tu sesión."}
</p>
{"\n"}
<dl id="planning-summary-facts">

</dl>
{"\n"}
<div className="planning-summary-note">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
<p>
{"Inicio, desarrollo y cierre. Una estructura para acompañarte en el aula."}
</p>
</div>
{"\n"}
</aside>
{"\n"}
{"\n"}
<div className="sidebar-primary-action">
{"\n"}
<span className="sidebar-primary-hint">
{"Listo para crear"}
</span>
{"\n"}
<button type="button" id="btn-generate" className="btn btn-primary btn-full">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{" Generar sesión con IA\n                    "}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</aside>
{"\n"}
<SessionPreview/>
{"\n"}
</main>
{"\n"}
</div>
{"\n"}
    </>;
}
