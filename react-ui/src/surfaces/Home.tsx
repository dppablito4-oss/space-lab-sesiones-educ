import {ArrowRight, ArrowUpRight, BookOpen, Check, CircleHelp, FileText, LogOut, Monitor, Plus, ShieldCheck, Sparkles, WandSparkles} from 'lucide-react';
import {SessionCards} from '../live';

export function Home() {
    return <>
<div id="home-view" className="home-view hidden">
    <header className="home-header">
        <button type="button" className="home-brand" data-action="view-home" aria-label="Ir a Mi espacio">
            <span className="home-brand-mark"><img src="assets/favicon.svg" alt="" aria-hidden="true"/></span>
            <span><strong>Mi espacio</strong><small>Todo listo para tu próxima clase</small></span>
        </button>
        <nav className="home-nav" aria-label="Navegación del espacio"><a href="#/home" className="home-nav-link active">Mi espacio</a><a href="#/sessions" className="home-nav-link">Mis sesiones</a></nav>
        <div className="home-account">
            <a className="home-support" href="mailto:pabloclsa87@gmail.com" aria-label="Contactar con soporte"><CircleHelp size={18}/><span>Soporte</span></a>
            <label className="theme-picker" title="Tema de la aplicación"><Monitor size={16} aria-hidden="true"/><span className="sr-only">Tema de la aplicación</span><select data-theme-selector="" aria-label="Tema de la aplicación"><option value="system">Sistema</option><option value="light">Claro</option><option value="dark">Oscuro</option></select></label>
            <div className="home-account-copy"><strong id="home-account-name">Docente</strong><span id="home-account-plan">Plan docente</span></div>
            <span id="home-account-avatar" className="home-account-avatar" aria-hidden="true">D</span>
            <button type="button" id="home-logout" className="btn btn-ghost btn-sm" aria-label="Cerrar sesión"><LogOut size={17}/><span>Salir</span></button>
        </div>
    </header>
    <main className="home-main" id="home-main">
        <section className="home-welcome" aria-labelledby="home-welcome-title">
            <div className="home-welcome-copy">
                <span className="home-eyebrow"><span className="home-live-dot"/>TU CENTRO DE PLANIFICACIÓN</span>
                <h1 id="home-welcome-title">Bienvenido a tu espacio docente</h1>
                <p>Una idea para tu aula. Un espacio para darle forma.<br/>Crea, organiza y continúa tus próximas clases.</p>
                <div className="home-primary-actions">
                    <button type="button" className="btn btn-primary home-primary-button" data-home-action="new-session"><Plus size={19}/>Crear nueva sesión<ArrowUpRight size={17}/></button>
                    <button type="button" id="home-continue-session" className="btn btn-ghost home-secondary-button hidden" data-home-action="continue-session"><BookOpen size={17}/>Continuar último borrador<ArrowRight size={16}/></button>
                </div>
                <span className="home-welcome-note"><Check size={14}/>Tus ideas, tus decisiones. La IA te acompaña.</span>
            </div>
            <aside className="home-guide" aria-label="Guía para comenzar">
                <div className="home-guide-art" aria-hidden="true"><span className="home-orbit orbit-one"/><span className="home-orbit orbit-two"/><span className="home-guide-spark"><WandSparkles size={32}/></span><span className="home-orbit-star"><Sparkles size={18}/></span></div>
                <div className="home-guide-heading"><span className="home-guide-icon"><Sparkles size={18}/></span><div><span>DE LA IDEA AL AULA</span><strong>Tu próxima clase, paso a paso</strong></div></div>
                <ol className="home-guide-steps"><li><span>1</span><p><strong>Completa los datos</strong>Indica nivel, área y propósito.</p></li><li><span>2</span><p><strong>Genera con IA</strong>Obtén una propuesta alineada al CNEB.</p></li><li><span>3</span><p><strong>Revisa y exporta</strong>Edita libremente y descarga tu documento.</p></li></ol>
            </aside>
        </section>
        <section className="home-summary" aria-label="Resumen de la cuenta">
            <article className="home-summary-card"><span className="home-summary-icon"><FileText size={21}/></span><div><strong id="home-session-count">0</strong><span>Sesiones guardadas</span></div><span className="home-stat-caption">Tu trabajo, a mano</span></article>
            <article className="home-summary-card"><span className="home-summary-icon accent-purple"><Sparkles size={21}/></span><div><strong id="home-credit-count">--</strong><span>Créditos de IA</span></div><span className="home-stat-caption">Para tus próximas ideas</span></article>
            <article className="home-summary-card home-plan-summary"><span className="home-summary-icon accent-green"><ShieldCheck size={21}/></span><div className="home-plan-summary-copy"><strong id="home-plan-name">Docente</strong><span>Plan actual</span></div><button type="button" className="home-plan-link" data-home-action="view-plans">Ver planes<ArrowRight size={15}/></button></article>
        </section>
<section className="home-section" aria-labelledby="home-tools-title">
{"\n"}
<div className="home-section-heading">
{"\n"}
<div>
{"\n"}
<span className="home-eyebrow">
{"Herramientas"}
</span>
{"\n"}
<h2 id="home-tools-title">
{"¿Qué deseas preparar?"}
</h2>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
<div className="home-tool-grid">
{"\n"}
<article className="home-tool-card home-tool-card-active">
{"\n"}
<span className="home-tool-icon">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
</span>
{"\n"}
<div className="home-tool-copy">
{"\n"}
<span className="home-tool-status">
{"Disponible"}
</span>
{"\n"}
<h3>
{"Sesión individual"}
</h3>
{"\n"}
<p>
{"Diseña, genera y exporta sesiones alineadas al CNEB para Inicial, Primaria y Secundaria."}
</p>
{"\n"}
</div>
{"\n"}
<button type="button" className="home-tool-action" data-home-action="new-session">
{"\n                            Crear sesión "}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-arrow-right">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</article>
{"\n"}
<article className="home-tool-card home-tool-card-active" aria-label="Planificación articulada">
{"\n"}
<span className="home-tool-icon">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-folder">

</use>
</svg>
</span>
{"\n"}
<div className="home-tool-copy">
{"\n"}
<span className="home-tool-status">
{"Beta"}
</span>
{"\n"}
<h3>
{"Planificación articulada"}
</h3>
{"\n"}
<p>
{"Experiencias, Unidades y Proyectos de aprendizaje. Construye y guarda tu mapa paso a paso."}
</p>
{"\n"}
</div>
{"\n"}
<button type="button" className="home-tool-action" data-open-planning="">
{"Abrir planificaciones"}
</button>
{"\n"}
</article>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
<section id="home-sessions-section" className="home-section home-sessions-section" aria-labelledby="home-sessions-title">
{"\n"}
<div className="home-section-heading">
{"\n"}
<div>
{"\n"}
<span className="home-eyebrow">
{"Biblioteca personal"}
</span>
{"\n"}
<h2 id="home-sessions-title">
{"Mis sesiones"}
</h2>
{"\n"}
</div>
{"\n"}
<button type="button" id="home-toggle-all-sessions" className="btn btn-ghost btn-sm hidden">
{"Ver todas"}
</button>
{"\n"}
</div>
{"\n"}
<div id="home-session-list" className="home-session-list" aria-live="polite"><SessionCards/></div>
</section>
{"\n"}
</main>
{"\n"}
<dialog id="home-plans-dialog" className="home-plans-dialog" aria-labelledby="home-plans-title" aria-describedby="home-plans-description">
{"\n"}
<div className="home-plans-shell">
{"\n"}
<header className="home-plans-header">
{"\n"}
<div>
{"\n"}
<span className="home-eyebrow">
{"Comparación de planes"}
</span>
{"\n"}
<h2 id="home-plans-title">
{"Conoce qué incluye cada plan"}
</h2>
{"\n"}
<p id="home-plans-description">
{"Conoce las diferencias antes de decidir. Los cambios de plan y los pagos todavía no están habilitados."}
</p>
{"\n"}
</div>
{"\n"}
<button type="button" className="home-plans-close" data-home-action="close-plans" aria-label="Cerrar comparación de planes">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
{"\n"}
</button>
{"\n"}
</header>
{"\n"}
<div className="home-plans-grid">
{"\n"}
<article className="home-plan-card" data-plan-code="free">
{"\n"}
<div className="home-plan-card-heading">
{"\n"}
<div>
<span className="home-plan-kicker">
{"Para comenzar"}
</span>
<h3>
{"Gratuito"}
</h3>
</div>
{"\n"}
<span className="home-plan-current-badge" hidden={true}>
{"Tu plan actual"}
</span>
{"\n"}
</div>
{"\n"}
<p className="home-plan-description">
{"Lo esencial para crear y guardar tus primeras sesiones."}
</p>
{"\n"}
<p className="home-plan-credits">
<strong>
{"30"}
</strong>
<span>
{"créditos de IA por ciclo"}
</span>
</p>
{"\n"}
<ul className="home-plan-benefits">
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Crear sesiones con IA"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Guardar tus planificaciones"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Exportar a Word y PDF"}
</li>
{"\n"}
</ul>
{"\n"}
<span className="home-plan-status">
{"En desarrollo"}
</span>
{"\n"}
</article>
{"\n"}
<article className="home-plan-card" data-plan-code="beta_teacher">
{"\n"}
<div className="home-plan-card-heading">
{"\n"}
<div>
<span className="home-plan-kicker">
{"Acceso anticipado"}
</span>
<h3>
{"Docente Beta"}
</h3>
</div>
{"\n"}
<span className="home-plan-current-badge" hidden={true}>
{"Tu plan actual"}
</span>
{"\n"}
</div>
{"\n"}
<p className="home-plan-description">
{"Para docentes que prueban y ayudan a mejorar Space Lab."}
</p>
{"\n"}
<p className="home-plan-credits">
<strong>
{"100"}
</strong>
<span>
{"créditos de IA por ciclo"}
</span>
</p>
{"\n"}
<ul className="home-plan-benefits">
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Todo lo incluido en Gratuito"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Adjuntar fuentes al copiloto"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Acceso anticipado a novedades"}
</li>
{"\n"}
</ul>
{"\n"}
<span className="home-plan-status">
{"En desarrollo"}
</span>
{"\n"}
</article>
{"\n"}
<article className="home-plan-card home-plan-card-featured" data-plan-code="teacher">
{"\n"}
<div className="home-plan-card-heading">
{"\n"}
<div>
<span className="home-plan-kicker">
{"Para el día a día"}
</span>
<h3>
{"Docente Plus"}
</h3>
</div>
{"\n"}
<span className="home-plan-current-badge" hidden={true}>
{"Tu plan actual"}
</span>
{"\n"}
</div>
{"\n"}
<p className="home-plan-description">
{"Más capacidad y herramientas para una planificación frecuente."}
</p>
{"\n"}
<p className="home-plan-credits">
<strong>
{"150"}
</strong>
<span>
{"créditos de IA por ciclo"}
</span>
</p>
{"\n"}
<ul className="home-plan-benefits">
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Todo lo incluido en Gratuito"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Archivos y calidad equilibrada"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Plantillas personalizadas"}
</li>
{"\n"}
</ul>
{"\n"}
<span className="home-plan-status">
{"En desarrollo"}
</span>
{"\n"}
</article>
{"\n"}
<article className="home-plan-card" data-plan-code="pro">
{"\n"}
<div className="home-plan-card-heading">
{"\n"}
<div>
<span className="home-plan-kicker">
{"Máxima capacidad"}
</span>
<h3>
{"Docente Pro"}
</h3>
</div>
{"\n"}
<span className="home-plan-current-badge" hidden={true}>
{"Tu plan actual"}
</span>
{"\n"}
</div>
{"\n"}
<p className="home-plan-description">
{"Para un uso intensivo y las capacidades más avanzadas."}
</p>
{"\n"}
<p className="home-plan-credits">
<strong>
{"400"}
</strong>
<span>
{"créditos de IA por ciclo"}
</span>
</p>
{"\n"}
<ul className="home-plan-benefits">
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Todo lo incluido en Plus"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Calidad máxima de IA"}
</li>
{"\n"}
<li>
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"Acceso previsto a planificación avanzada"}
</li>
{"\n"}
</ul>
{"\n"}
<span className="home-plan-status">
{"En desarrollo"}
</span>
{"\n"}
</article>
{"\n"}
</div>
{"\n"}
<footer className="home-plans-footer">
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n"}
<p>
<strong>
{"Vista informativa."}
</strong>
{" No se realizará ningún cobro ni cambio de plan desde esta pantalla."}
</p>
{"\n"}
</footer>
{"\n"}
</div>
{"\n"}
</dialog>
{"\n"}
</div>
{"\n"}
    </>;
}
