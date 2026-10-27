import type {CSSProperties} from 'react';

export function Landing() {
    return <>
{" "}
{"\n"}
<div id="landing-view" className="landing-view">
{"\n"}
{"\n"}
<header className="landing-navbar">
{"\n"}
<a href="#/" className="landing-brand" aria-label="Space Lab - Inicio">
{"\n"}
<div className="landing-brand-logo">
{"\n"}
<img src="assets/favicon.svg" alt="Space Lab Logo"/>
{"\n"}
</div>
{"\n"}
<div className="landing-brand-text">
{"\n"}
<span className="landing-brand-title">
{"Space Lab"}
</span>
{"\n"}
<span className="landing-brand-badge">
{"MINEDU 2026 · CNEB"}
</span>
{"\n"}
</div>
{"\n"}
</a>
{"\n"}
<ul className="landing-nav-links">
{"\n"}
<li>
<a href="#como-funciona" className="landing-nav-link">
{"¿Cómo Funciona?"}
</a>
</li>
{"\n"}
<li>
<a href="#motor-local" className="landing-nav-link">
{"Motor Local"}
</a>
</li>
{"\n"}
<li>
<a href="#modelos-ia" className="landing-nav-link">
{"Modelos IA"}
</a>
</li>
{"\n"}
<li>
<a href="#preguntas-frecuentes" className="landing-nav-link">
{"Preguntas Frecuentes"}
</a>
</li>
{"\n"}
<li>
<a href="#contacto" className="landing-nav-link">
{"Contacto"}
</a>
</li>
{"\n"}
<li>
<a href="descargas_landing.html" className="landing-nav-link">
{"Descargas"}
</a>
</li>
{"\n"}
</ul>
{"\n"}
<div className="landing-nav-actions">
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
<select data-theme-selector="" aria-label="Tema de la aplicación">
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
<button type="button" className="btn btn-ghost btn-sm" data-action="open-login" aria-label="Iniciar sesión con tu cuenta">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-user">

</use>
</svg>
{"\n"}
<span>
{"Iniciar Sesión"}
</span>
{"\n"}
</button>
{"\n"}
<button type="button" className="btn btn-primary btn-sm" data-action="enter-app" aria-label="Abrir editor de sesiones de aprendizaje">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"Ir al Editor"}
</span>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
</header>
{"\n"}
{"\n"}
<section className="landing-hero">
{"\n"}
<div className="landing-hero-copy">
{"\n"}
<div className="landing-pill-badge">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"Plataforma Inteligente MINEDU 2026 · CNEB Perú"}
</span>
{"\n"}
</div>
{"\n"}
<h1 className="landing-hero-title">
{"\n                    Menos tiempo planificando."}
<br/>
<span className="highlight">
{"Más tiempo enseñando."}
</span>
{"\n"}
</h1>
{"\n"}
<p className="landing-hero-subtitle">
{"\n                    Prepara tu próxima clase para "}
<strong>
{"Inicial, Primaria o Secundaria"}
</strong>
{". Elige los aprendizajes, construye tu sesión con ayuda de la IA y dale tu toque antes de exportarla a "}
<strong>
{"Word o PDF"}
</strong>
{".\n                "}
</p>
{"\n"}
<div className="landing-hero-actions">
{"\n"}
<button type="button" className="landing-btn-lg landing-btn-primary" data-action="enter-app" aria-label="Comenzar a planificar sesión de aprendizaje gratis">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"Crear mi sesión"}
</span>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-arrow-right">

</use>
</svg>
{"\n"}
</button>
{"\n"}
<a href="#como-funciona" className="landing-btn-lg landing-btn-ghost" aria-label="Ver cómo funciona la plataforma">
{"\n"}
<span>
{"Ver Cómo Funciona"}
</span>
{"\n"}
</a>
{"\n"}
</div>
{"\n"}
<div className="landing-badges-row">
{"\n"}
<div className="landing-badge-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"CNEB 2026 Oficial"}
</span>
{"\n"}
</div>
{"\n"}
<div className="landing-badge-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"GPT-6 Luna & DeepSeek R1"}
</span>
{"\n"}
</div>
{"\n"}
<div className="landing-badge-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n"}
<span>
{"Motor Word (.docx) Nativo"}
</span>
{"\n"}
</div>
{"\n"}
<div className="landing-badge-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n"}
<span>
{"Privado y Seguro"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
{"\n"}
<div className="landing-hero-preview landing-lesson-visual" role="img" aria-label="Ejemplo de planificación: elegir competencias y capacidades, revisar la sesión y llevarla a Word o PDF.">
{"\n"}
<div className="lesson-scene" aria-hidden="true">
{"\n"}
<div className="lesson-dot-grid">

</div>
{"\n"}
<div className="lesson-mini-app">
{"\n"}
<div className="lesson-mini-top">
<span>
<svg className="ui-icon">
<use href="#icon-folder">

</use>
</svg>
{" Tu próxima clase"}
</span>
<span className="lesson-mini-saved">
<i>

</i>
{" Guardado"}
</span>
</div>
{"\n"}
<div className="lesson-mini-body">
{"\n"}
<div className="lesson-mini-steps">
<span>
<svg className="ui-icon">
<use href="#icon-check">

</use>
</svg>
{" Datos"}
</span>
<strong>
{"2 Aprendizajes"}
</strong>
<span>
{"3 Revisión"}
</span>
</div>
{"\n"}
<span className="lesson-mini-context">
{"MATEMÁTICA · 2.° DE SECUNDARIA"}
</span>
{"\n"}
<h2>
{"Aprender también"}
<br/>
{"empieza con elegir."}
</h2>
{"\n"}
<p>
{"¿Qué trabajarán tus estudiantes?"}
</p>
{"\n"}
<div className="lesson-mini-option selected">
<span className="lesson-mini-check">
<svg className="ui-icon">
<use href="#icon-check">

</use>
</svg>
</span>
<span>
{"Resuelve problemas de cantidad"}
<small>
{"4 capacidades disponibles"}
</small>
</span>
</div>
{"\n"}
<div className="lesson-mini-option">
<span className="lesson-mini-box">

</span>
<span>
{"Resuelve problemas de regularidad,"}
<br/>
{"equivalencia y cambio"}
</span>
</div>
{"\n"}
<div className="lesson-mini-capacity">
<svg className="ui-icon">
<use href="#icon-check">

</use>
</svg>
{" Traduce cantidades a expresiones numéricas"}
</div>
{"\n"}
<div className="lesson-mini-capacity">
<svg className="ui-icon">
<use href="#icon-check">

</use>
</svg>
{" Argumenta sus procedimientos"}
</div>
{"\n"}
<div className="lesson-mini-bottom">
{"Tu sesión va tomando forma"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="lesson-floating-paper">
<span className="lesson-paper-label">
<svg className="ui-icon">
<use href="#icon-file">

</use>
</svg>
{" TU SESIÓN, LISTA PARA EL AULA"}
</span>
<div className="lesson-paper-lines">
<i>

</i>
<i>

</i>
<i>

</i>
</div>
<div className="lesson-paper-table">
<span>
{"Inicio"}
</span>
<i>

</i>
<span>
{"Desarrollo"}
</span>
<i>

</i>
<span>
{"Cierre"}
</span>
<i>

</i>
</div>
<div className="lesson-paper-formats">
{"WORD "}
<span>
{"·"}
</span>
{" PDF "}
<svg className="ui-icon">
<use href="#icon-check">

</use>
</svg>
</div>
</div>
{"\n"}
<div className="lesson-teacher-note">
<svg className="ui-icon">
<use href="#icon-sparkles">

</use>
</svg>
<span>
{"La IA propone."}
<br/>
<strong>
{"Tú le das tu toque."}
</strong>
</span>
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section id="como-funciona" className="landing-section">
{"\n"}
<div className="landing-section-header">
{"\n"}
<span className="landing-section-eyebrow">
{"Flujo Pedagógico"}
</span>
{"\n"}
<h2 className="landing-section-title">
{"¿Cómo Funciona en 3 Simples Pasos?"}
</h2>
{"\n"}
<p className="landing-section-desc">
{"Diseñado para ahorrarte horas de trabajo administrativo y enfocarte en la enseñanza."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-steps-grid">
{"\n"}
<div className="landing-step-card">
{"\n"}
<span className="landing-step-number">
{"1"}
</span>
{"\n"}
<h3 className="landing-step-title">
{"Configuración Curricular CNEB"}
</h3>
{"\n"}
<p className="landing-step-text">
{"Elige tu nivel educativo (Inicial, Primaria o Secundaria), área, grado, competencias y capacidades precargadas del CNEB de forma automática."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-step-card">
{"\n"}
<span className="landing-step-number">
{"2"}
</span>
{"\n"}
<h3 className="landing-step-title">
{"Generación Pedagógica con IA"}
</h3>
{"\n"}
<p className="landing-step-text">
{"Los modelos de IA (GPT-6 Luna, DeepSeek R1 o Gemini) redactan situaciones significativas, la secuencia didáctica completa (Inicio, Desarrollo, Cierre) y los criterios de evaluación."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-step-card">
{"\n"}
<span className="landing-step-number">
{"3"}
</span>
{"\n"}
<h3 className="landing-step-title">
{"Compilación Nativa con Motor Local"}
</h3>
{"\n"}
<p className="landing-step-text">
{"Descarga el motor de escritorio para compilar Word (.docx) nativo con tablas CNEB perfectas, fórmulas matemáticas OMML editables y membretes oficiales sin descuadres."}
</p>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section id="motor-local" className="landing-section">
{"\n"}
<div className="landing-section-header">
{"\n"}
<span className="landing-section-eyebrow">
{"Arquitectura Híbrida"}
</span>
{"\n"}
<h2 className="landing-section-title">
{"¿Por qué Space Lab Incluye un Motor Local?"}
</h2>
{"\n"}
<p className="landing-section-desc">
{"Unificamos la flexibilidad de la web con la potencia del compilador nativo de escritorio para documentos Word (.docx) de máxima fidelidad."}
</p>
{"\n"}
</div>
{"\n"}
<div className="motor-local-card">
{"\n"}
<div className="motor-local-info">
{"\n"}
<div className="motor-local-badge">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"Fidelidad Documental 100%"}
</span>
{"\n"}
</div>
{"\n"}
<h3 className="motor-local-title">
{"Motor Local de Exportación para Windows"}
</h3>
{"\n"}
<p className="motor-local-desc">
{"\n                        Los navegadores web no pueden crear de forma nativa documentos de Microsoft Word con tablas anidadas multinivel, márgenes físicos A4 de imprenta ni fórmulas matemáticas editables (OMML). Por eso creamos "}
<strong>
{"pablitopyhost.exe"}
</strong>
{": un motor ultraligero que corre en tu PC y se comunica de forma transparente y segura con esta aplicación web a través de "}
<code>
{"localhost:8000"}
</code>
{".\n                    "}
</p>
{"\n"}
<div className="motor-local-features">
{"\n"}
<div className="motor-feature-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"Tablas CNEB oficiales sin celdas descuadradas"}
</span>
{"\n"}
</div>
{"\n"}
<div className="motor-feature-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"Ecuaciones matemáticas editables en formato OMML"}
</span>
{"\n"}
</div>
{"\n"}
<div className="motor-feature-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"Membretes institucionales de DRE y UGEL"}
</span>
{"\n"}
</div>
{"\n"}
<div className="motor-feature-item">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
<span>
{"Exportación instantánea sin límites de memoria web"}
</span>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="motor-local-actions">
{"\n"}
<a href="descargas_landing.html" className="landing-btn-lg landing-btn-primary" aria-label="Ir a la página de descarga del motor local">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{"\n"}
<span>
{"Descargar Motor Local (.exe)"}
</span>
{"\n"}
</a>
{"\n"}
<a href="conexion.html" className="landing-btn-lg landing-btn-ghost" aria-label="Ver estado de conexión del motor">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-refresh">

</use>
</svg>
{"\n"}
<span>
{"Verificar Estado de Conexión"}
</span>
{"\n"}
</a>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section id="modelos-ia" className="landing-section">
{"\n"}
<div className="landing-section-header">
{"\n"}
<span className="landing-section-eyebrow">
{"Tecnología de Vanguardia"}
</span>
{"\n"}
<h2 className="landing-section-title">
{"Impulsado por los Mejores Modelos de IA"}
</h2>
{"\n"}
<p className="landing-section-desc">
{"Elige el motor de inteligencia artificial que mejor se adapte a tu estilo pedagógico."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-models-grid">
{"\n"}
<div className="landing-model-card">
{"\n"}
<span className="landing-model-badge">
{"Nuevo"}
</span>
{"\n"}
<div className="landing-model-icon">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
</div>
{"\n"}
<h3 className="landing-model-title">
{"GPT-6 Luna"}
</h3>
{"\n"}
<span className="landing-model-provider">
{"OpenAI Router"}
</span>
{"\n"}
<p className="landing-model-desc">
{"Máxima agilidad y creatividad en el planteamiento de situaciones significativas contextualizadas a la realidad y coyuntura peruana."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-model-card">
{"\n"}
<span className="landing-model-badge" style={{"background": "rgba(123, 97, 255, 0.15)", "color": "#7b61ff", "borderColor": "rgba(123, 97, 255, 0.3)"} as CSSProperties}>
{"Recomendado"}
</span>
{"\n"}
<div className="landing-model-icon" style={{"color": "#7b61ff"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"\n"}
</div>
{"\n"}
<h3 className="landing-model-title">
{"DeepSeek R1 / V3"}
</h3>
{"\n"}
<span className="landing-model-provider">
{"DeepSeek Router"}
</span>
{"\n"}
<p className="landing-model-desc">
{"Razonamiento pedagógico profundo, coherencia estricta en la alineación de propósitos y diseño de instrumentos de evaluación formativa."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-model-card">
{"\n"}
<span className="landing-model-badge" style={{"background": "rgba(16, 185, 129, 0.15)", "color": "#10b981", "borderColor": "rgba(16, 185, 129, 0.3)"} as CSSProperties}>
{"Rápido"}
</span>
{"\n"}
<div className="landing-model-icon" style={{"color": "#10b981"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n"}
</div>
{"\n"}
<h3 className="landing-model-title">
{"Gemini 2.5 Flash"}
</h3>
{"\n"}
<span className="landing-model-provider">
{"Google DeepMind"}
</span>
{"\n"}
<p className="landing-model-desc">
{"Velocidad instantánea para actividades prácticas de inicio, desarrollo y cierre, fichas de trabajo y adaptación a distintos ritmos de aprendizaje."}
</p>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section id="preguntas-frecuentes" className="landing-section">
{"\n"}
<div className="landing-section-header">
{"\n"}
<span className="landing-section-eyebrow">
{"Respuestas Claras"}
</span>
{"\n"}
<h2 className="landing-section-title">
{"Preguntas Frecuentes para Docentes"}
</h2>
{"\n"}
<p className="landing-section-desc">
{"Todo lo que necesitas saber sobre la plataforma, el motor local y el currículo."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-container">
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{"\n                        ¿Qué es el Motor Local y por qué debo descargarlo?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"Para que tus sesiones se descarguen en Microsoft Word (.docx) con las tablas oficiales del MINEDU, márgenes exactos, listas de cotejo y fórmulas matemáticas editables (OMML) sin que se mueva ninguna celda, desarrollamos un motor nativo ("}
<code>
{"pablitopyhost.exe"}
</code>
{"). Se ejecuta en segundo plano en tu computadora y procesa el documento con máxima fidelidad."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n                        ¿Puedo usar la plataforma sin descargar el motor local?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"Sí. Puedes diseñar, redactar, editar, guardar en la nube o localmente, y utilizar todos los modelos de Inteligencia Artificial directamente en tu navegador. El motor local solo es necesario cuando deseas compilar y descargar tus sesiones en formato Word (.docx) editable de alta fidelidad."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"\n                        ¿Cómo se alinea al Currículo Nacional de la Educación Básica (CNEB)?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"Toda la base de datos de competencias, capacidades, desempeños por grado y ciclo (Inicial, Primaria y Secundaria), enfoques transversales e instrumentos de evaluación está completamente estructurada según las directivas curriculares vigentes del Ministerio de Educación del Perú (MINEDU)."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n                        ¿Qué modelos de Inteligencia Artificial están disponibles?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"Dispones de una arquitectura multi-modelo conectada a través de routers seguros: GPT-6 Luna de OpenAI, DeepSeek V3 y Reasoner R1 para razonamiento pedagógico profundo, y Google Gemini 2.5 Flash para generación ultrarrápida de actividades y criterios."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sliders">

</use>
</svg>
{"\n                        ¿Cómo funciona el sistema de créditos y monetización automatizada?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"La plataforma cuenta con un sistema de créditos automatizado gestionado en la nube con Supabase. No requiere procesos manuales de verificación: tus créditos de IA se recargan y acreditan de forma automática para que puedas seguir planificando sin interrupciones."}
</p>
{"\n"}
</div>
{"\n"}
<div className="landing-faq-item">
{"\n"}
<h3 className="landing-faq-question">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n                        ¿Mis sesiones y datos personales están seguros?\n                    "}
</h3>
{"\n"}
<p className="landing-faq-answer">
{"Totalmente seguros. Tus sesiones se guardan localmente en tu propio dispositivo (LocalStorage e IndexedDB) y, si inicias sesión, se sincronizan en la nube mediante Supabase con políticas de seguridad de nivel de fila (RLS). Tu información docente nunca se comparte con terceros."}
</p>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section className="landing-cta-banner">
{"\n"}
<div className="landing-cta-card">
{"\n"}
<h2 className="landing-cta-title">
{"¿Listo para Planificar tu Próxima Sesión?"}
</h2>
{"\n"}
<p className="landing-cta-text">
{"Únete a los docentes que ya optimizan su tiempo administrativo con inteligencia artificial curricular."}
</p>
{"\n"}
<button type="button" className="landing-btn-lg landing-btn-primary" data-action="enter-app" aria-label="Entrar al editor y planificar sesión ahora">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
<span>
{"Entrar al Editor y Crear mi Sesión Ahora"}
</span>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-arrow-right">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<section id="contacto" className="landing-contact-section">
{"\n"}
<div className="landing-contact-content">
{"\n"}
<h2 className="landing-contact-title">
{"ESTABLECER ENLACE"}
</h2>
{"\n"}
<div className="landing-contact-divider">

</div>
{"\n"}
<p className="landing-contact-desc">
{"\n                    ¿Tienes un proyecto en mente o necesitas una solución digital? Transmite tus requerimientos por cualquiera de estos canales.\n                "}
</p>
{"\n"}
<div className="landing-contact-buttons">
{"\n"}
<a href="https://wa.me/51918165428" target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-whatsapp" aria-label="Contactar por WhatsApp al 918165428">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-whatsapp">

</use>
</svg>
{"\n"}
<span>
{"WHATSAPP"}
</span>
{"\n"}
</a>
{"\n"}
<a href="mailto:pabloclsa87@gmail.com" className="contact-btn contact-btn-email" aria-label="Enviar correo a pabloclsa87@gmail.com">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-mail">

</use>
</svg>
{"\n"}
<span>
{"EMAIL"}
</span>
{"\n"}
</a>
{"\n"}
<a href="https://space.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="contact-btn contact-btn-web" aria-label="Visitar sitio personal space.sypablitodp.site">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-globe">

</use>
</svg>
{"\n"}
<span>
{"WEB PERSONAL"}
</span>
{"\n"}
</a>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
{"\n"}
<footer className="landing-footer">
{"\n"}
<div className="landing-creator-box">
{"\n"}
<div className="landing-creator-icon" aria-hidden="true">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n"}
</div>
{"\n"}
<p className="landing-creator-text">
{"\n                    SISTEMA CREADO CON "}
<svg className="ui-icon icon-heart" aria-hidden="true">
<use href="#icon-heart">

</use>
</svg>
{" POR "}
<a href="https://space.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="creator-highlight">
{"SAMUEL PABLO CLAUDIO"}
</a>
{"\n"}
</p>
{"\n"}
<span className="landing-classified-tag">
{"© 2026 PABLITO_DP — ACCESO CLASIFICADO"}
</span>
{"\n"}
</div>
{"\n"}
<div className="landing-footer-links">
{"\n"}
<a href="https://space.sypablitodp.site" target="_blank" rel="noopener noreferrer" className="landing-footer-link">
{"space.sypablitodp.site"}
</a>
{"\n"}
<a href="descargas_landing.html" className="landing-footer-link">
{"Motor Local de Word"}
</a>
{"\n"}
<a href="conexion.html" className="landing-footer-link">
{"Estado de Conexión"}
</a>
{"\n"}
<a href="#" id="link-terms-footer" className="landing-footer-link">
{"Términos y Privacidad"}
</a>
{"\n"}
<a href="#/app" className="landing-footer-link" data-action="enter-app">
{"Ir al Editor"}
</a>
{"\n"}
</div>
{"\n"}
</footer>
{"\n"}
</div>
{"\n"}
    </>;
}
