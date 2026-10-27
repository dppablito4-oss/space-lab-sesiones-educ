
export function QuickSession() {
    return <>
{" "}
<div className="session-mode-switch" role="group" aria-label="Modo del generador">
{"\n"}
<button type="button" className="btn btn-ghost" id="session-mode-quick" aria-pressed="false">
{"Modo rápido · 3 pasos"}
</button>
{"\n"}
<button type="button" className="btn btn-ghost" id="session-mode-advanced" aria-pressed="true">
{"Modo avanzado"}
</button>
{"\n"}
</div>
{"\n"}
<section id="quick-session" hidden={true} aria-label="Asistente rápido de sesiones">
{"\n"}
<nav className="quick-steps" aria-label="Pasos del modo rápido">
{"\n"}
<button type="button" data-quick-step="1" aria-current="step">
{"1. Datos"}
</button>
{"\n"}
<button type="button" data-quick-step="2">
{"2. Aprendizajes"}
</button>
{"\n"}
<button type="button" data-quick-step="3">
{"3. Revisar"}
</button>
{"\n"}
</nav>
{"\n"}
<p id="quick-step-status" className="curriculum-help" role="status">
{"Paso 1 de 3"}
</p>
{"\n"}
<div id="quick-errors" className="quick-notice" role="alert" hidden={true}>

</div>
{"\n"}
<section data-quick-panel="1" aria-labelledby="quick-title-1">
{"\n"}
<h3 id="quick-title-1" tabIndex={-1}>
{"Datos de tu sesión"}
</h3>
{"\n"}
<p>
{"Define qué enseñarás y a quiénes. Los datos de tu institución son opcionales."}
</p>
{"\n"}
<div id="quick-data-fields" className="quick-field-grid">

</div>
{"\n"}
<details className="form-disclosure">
<summary>
{"Datos institucionales y de aula (opcionales)"}
</summary>
<div id="quick-institution-fields" className="form-disclosure-content">

</div>
</details>
{"\n"}
</section>
{"\n"}
<section data-quick-panel="2" hidden={true} aria-labelledby="quick-title-2">
{"\n"}
<h3 id="quick-title-2" tabIndex={-1}>
{"Aprendizajes y propuestas"}
</h3>
{"\n"}
<p id="quick-curriculum-status" role="status">
{"Comprobando cobertura curricular…"}
</p>
{"\n"}
<p>
{"El selector muestra referencias del catálogo. Los textos manuales o completados por IA requieren cotejo y no se convierten automáticamente en información oficial."}
</p>
{"\n"}
<div id="quick-learning-fields">

</div>
{"\n"}
<details className="form-disclosure">
<summary>
{"Desempeños y procedencia del catálogo"}
</summary>
<div id="quick-official-performances" className="form-disclosure-content">

</div>
</details>
{"\n"}
<div id="quick-proposal-fields">

</div>
{"\n"}
</section>
{"\n"}
<section data-quick-panel="3" hidden={true} aria-labelledby="quick-title-3">
{"\n"}
<h3 id="quick-title-3" tabIndex={-1}>
{"Revisar y generar"}
</h3>
{"\n"}
<dl id="quick-review">

</dl>
{"\n"}
<h4>
{"Coherencia curricular y advertencias"}
</h4>
{"\n"}
<ul id="quick-warnings" className="quick-notice">

</ul>
{"\n"}
<p>
{"Las actividades, criterios y evidencias son propuestas para revisión docente. Puedes generar sin registrar alumnos. La generación usa tu cuenta y está sujeta a tus límites y créditos de IA."}
</p>
{"\n"}
<details className="form-disclosure">
<summary>
{"Copiloto, referencias y opciones de generación"}
</summary>
<div id="quick-ai-options" className="form-disclosure-content">

</div>
</details>
{"\n"}
<details className="form-disclosure">
<summary>
{"Diseño del documento"}
</summary>
<div id="quick-design-options" className="form-disclosure-content">

</div>
</details>
{"\n"}
<details className="form-disclosure">
<summary>
{"Alumnos (opcional)"}
</summary>
<div id="quick-student-options" className="form-disclosure-content">

</div>
</details>
{"\n"}
<details className="form-disclosure">
<summary>
{"Fichas y material de aplicación"}
</summary>
<div id="quick-worksheet-options" className="form-disclosure-content">

</div>
</details>
{"\n"}
</section>
{"\n"}
<div className="quick-navigation">
{"\n"}
<button type="button" className="btn btn-ghost" id="quick-back" disabled={true}>
{"Anterior"}
</button>
{"\n"}
<button type="button" className="btn btn-primary" id="quick-next">
{"Continuar"}
</button>
{"\n"}
</div>
{"\n"}
</section>
{"\n"}
    </>;
}
