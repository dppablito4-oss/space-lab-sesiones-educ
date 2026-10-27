import type {CSSProperties} from 'react';

export function TermsDialog() {
    return <>
{" "}
{"\n"}
<div id="terms-modal" className="load-modal hidden" style={{"zIndex": "10000"} as CSSProperties}>
{"\n"}
<div className="load-modal-content glass-card" style={{"maxWidth": "720px", "padding": "2rem", "textAlign": "left", "maxHeight": "85vh", "overflowY": "auto"} as CSSProperties}>
{"\n"}
<div className="load-modal-header" style={{"borderBottom": "1px solid var(--border)", "paddingBottom": "0.75rem", "marginBottom": "1.25rem", "display": "flex", "justifyContent": "space-between", "alignItems": "center"} as CSSProperties}>
{"\n"}
<div style={{"display": "flex", "alignItems": "center", "gap": "0.6rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" style={{"color": "var(--accent)", "width": "22px", "height": "22px"} as CSSProperties} aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n"}
<h3 style={{"fontSize": "1.2rem", "fontWeight": "800", "color": "var(--color-foreground)", "margin": "0"} as CSSProperties}>
{"\n                        Términos, Condiciones de Uso y Políticas de Privacidad — Space Lab\n                    "}
</h3>
{"\n"}
</div>
{"\n"}
<button id="btn-close-terms" className="btn btn-ghost btn-sm" style={{"fontSize": "1.1rem", "padding": "4px 8px"} as CSSProperties} aria-label="Cerrar">
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-close">

</use>
</svg>
</button>
{"\n"}
</div>
{"\n"}
<div style={{"fontSize": "0.85rem", "lineHeight": "1.6", "color": "var(--text-primary)", "display": "flex", "flexDirection": "column", "gap": "1.1rem"} as CSSProperties}>
{"\n"}
<div style={{"background": "rgba(0, 210, 255, 0.06)", "border": "1px solid rgba(0, 210, 255, 0.2)", "borderRadius": "8px", "padding": "0.85rem 1rem", "fontSize": "0.82rem"} as CSSProperties}>
{"\n"}
<strong>
{"Última actualización: Octubre de 2026"}
</strong>
{" | Versión del Sistema: "}
<strong>
{"Space Lab 2.0 (Motor v1.4.1)"}
</strong>
<br/>
{"\n                    Desarrollado y operado por "}
<strong>
{"Samuel Y. Pablo Claudio (pablitodp)"}
</strong>
{" — Huánuco, Perú.\n                "}
</div>
{"\n"}
<p>
{"Bienvenido a "}
<strong>
{"Space Lab"}
</strong>
{" ("}
<code>
{"sesiones.sypablitodp.site"}
</code>
{"). Esta plataforma de asistencia pedagógica, planificación curricular y exportación documental está diseñada para facilitar el trabajo técnico-pedagógico de los docentes de Educación Básica Regular (Inicial, Primaria y Secundaria) del Perú. Al acceder, registrarte y utilizar nuestros servicios, aceptas en su totalidad los siguientes Términos y Condiciones y la Política de Privacidad conforme a la legislación vigente de la República del Perú."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-user">

</use>
</svg>
{"\n                    1. REGISTRO, SEGURIDAD Y AUTENTICACIÓN\n                "}
</h4>
{"\n"}
<p>
{"El registro en Space Lab es de carácter personal e intransferible. El usuario es responsable de mantener la confidencialidad de sus credenciales. La plataforma utiliza infraestructura segura en la nube (Supabase Auth) con contraseñas encriptadas mediante algoritmos criptográficos robustos y políticas de seguridad a nivel de fila (Row Level Security - RLS). Cada docente tiene acceso exclusivo y privado a sus propias sesiones, perfiles y datos."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-download">

</use>
</svg>
{"\n                    2. ARQUITECTURA DEL MOTOR LOCAL (pablitohost.exe / pablitopyhost.exe) Y PRIVACIDAD TOTAL DE TU PC\n                "}
</h4>
{"\n"}
<div style={{"background": "var(--bg-card)", "border": "1px solid var(--border)", "borderRadius": "8px", "padding": "1rem", "display": "flex", "flexDirection": "column", "gap": "0.75rem"} as CSSProperties}>
{"\n"}
<p>
<strong>
{"¿Por qué se descarga el ejecutable local?"}
</strong>
<br/>
{"\n                    Los navegadores web estándar tienen limitaciones técnicas estrictas: no pueden generar de forma nativa documentos de Microsoft Word (.docx) con estructuras complejas como tablas anidadas con anchos milimétricos del MINEDU, listas de cotejo con formato oficial de evaluación formativa y fórmulas matemáticas o científicas editables en formato OMML (Office Math Markup Language). Para lograr una calidad de impresión física 100% idéntica a la normativa de UGEL/DRE y "}
<strong>
{"sin subir tus documentos pedagógicos a servidores o convertidores externos en la nube"}
</strong>
{", se desarrolló el motor local "}
<code>
{"pablitohost.exe"}
</code>
{" (también denominado "}
<code>
{"pablitopyhost.exe"}
</code>
{")."}
</p>
{"\n"}
<p>
<strong>
{"Arquitectura técnica en Python:"}
</strong>
<br/>
{"\n                    El motor es un micro-servicio local programado íntegramente en "}
<strong>
{"Python"}
</strong>
{" utilizando un servidor asíncrono ultraligero (FastAPI / Uvicorn) y bibliotecas especializadas de manipulación XML/docx. Se ejecuta de forma aislada en segundo plano en tu propia computadora escuchando únicamente en el puerto local "}
<code>
{"http://127.0.0.1:8000"}
</code>
{"."}
</p>
{"\n"}
<p>
<strong>
{"Comunicación segura mediante Tokens Autorizados:"}
</strong>
<br/>
{"\n                    La aplicación web se conecta con el motor local a través del estándar de seguridad "}
<strong>
{"Private Network Access (PNA)"}
</strong>
{". Toda petición requiere obligatoriamente un "}
<strong>
{"token criptográfico de vinculación"}
</strong>
{" generado al iniciar el programa. Asimismo, el motor cuenta con validación estricta de origen (CORS): únicamente procesa solicitudes emitidas desde el dominio oficial verificado ("}
<code>
{"https://sesiones.sypablitodp.site"}
</code>
{") o el entorno local de desarrollo. Cualquier solicitud proveniente de páginas web no autorizadas o scripts de terceros es rechazada automáticamente."}
</p>
{"\n"}
<p>
<strong>
{"Garantía de Privacidad y Aislamiento (No intrusión en tu sistema):"}
</strong>
</p>
{"\n"}
<ul style={{"margin": "0", "paddingLeft": "1.2rem", "display": "flex", "flexDirection": "column", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<li>
<strong>
{"Sin exploración de documentos personales:"}
</strong>
{" El motor no busca ni recopila tus fotos, documentos o archivos personales. Utiliza sus recursos de aplicación y el contenido que el navegador le envía para exportar."}
</li>
{"\n"}
<li>
<strong>
{"Cero telemetría invasiva:"}
</strong>
{" No monitorea la actividad de tu PC, no registra pulsaciones de teclado, ni accede a periféricos, micrófonos o cámaras."}
</li>
{"\n"}
<li>
<strong>
{"Exportación local:"}
</strong>
{" Recibe el contenido de la sesión o planificación desde el navegador y devuelve el archivo Word o PDF. Según el formato, puede utilizar archivos temporales durante la conversión."}
</li>
{"\n"}
</ul>
{"\n"}
</div>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-sparkles">

</use>
</svg>
{"\n                    3. ASISTENCIA PEDAGÓGICA CON INTELIGENCIA ARTIFICIAL Y CRÉDITOS\n                "}
</h4>
{"\n"}
<p>
{"Space Lab utiliza OpenAI, Google Gemini y DeepSeek para asistir en la redacción pedagógica. Al solicitar una función de IA, el contenido necesario de tu solicitud y, si los adjuntas, textos o imágenes, se envía mediante las funciones de Supabase al proveedor seleccionado. Estos proveedores procesan ese contenido según sus propias condiciones. Los nombres de alumnos no son necesarios para generar una sesión: evita incluir datos personales de estudiantes en instrucciones y adjuntos. Las claves de los proveedores permanecen en los secretos del servidor y no se entregan al navegador. El uso de IA se registra mediante un "}
<strong>
{"sistema de créditos"}
</strong>
{"."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-file">

</use>
</svg>
{"\n                    4. PROPIEDAD INTELECTUAL Y TITULARIDAD DOCENTE\n                "}
</h4>
{"\n"}
<p>
{"Todas las sesiones de aprendizaje, programaciones curriculares, fichas de aplicación, rúbricas y materiales creados o editados en la plataforma son "}
<strong>
{"propiedad intelectual exclusiva del docente que los elabora"}
</strong>
{". Space Lab no se atribuye ningún derecho de autor sobre los contenidos pedagógicos generados por sus usuarios."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-target">

</use>
</svg>
{"\n                    5. RESPONSABILIDAD Y AUTONOMÍA PEDAGÓGICA\n                "}
</h4>
{"\n"}
<p>
{"La inteligencia artificial y los asistentes de Space Lab actúan como herramientas de apoyo para agilizar la labor administrativa y brindar sugerencias curriculares basadas en el CNEB. Es responsabilidad exclusiva del docente revisar, adecuar a su contexto real y validar pedagógicamente cada sesión antes de su desarrollo en el aula o presentación formal ante la dirección de su institución educativa, UGEL o DRE."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-shield">

</use>
</svg>
{"\n                    6. PROTECCIÓN DE DATOS PERSONALES (LEY N° 29733) Y DERECHOS ARCO\n                "}
</h4>
{"\n"}
<p>
{"Supabase gestiona la autenticación y el almacenamiento de perfiles, sesiones, planificaciones y listas de alumnos que guardas en tu cuenta. El navegador conserva copias y borradores locales; en equipos compartidos, cada cuenta dispone de un espacio local separado. La información necesaria para las funciones de IA se procesa como se describe en la sección anterior. No vendemos ni alquilamos tus datos. Para solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos, o la eliminación de tu cuenta y contenido, utiliza el canal oficial de soporte indicado a continuación. El alcance y los plazos de conservación y eliminación deben confirmarse con soporte durante la beta."}
</p>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-mail">

</use>
</svg>
{"\n                    7. CANALES DE CONTACTO Y SOPORTE OFICIAL\n                "}
</h4>
{"\n"}
<p>
{"Para consultas técnicas, asistencia con el motor local, dudas sobre privacidad o reportes, puedes comunicarte directamente con el desarrollador:"}
</p>
{"\n"}
<div style={{"display": "flex", "flexWrap": "wrap", "gap": "0.6rem", "fontSize": "0.82rem"} as CSSProperties}>
{"\n"}
<a href="mailto:pabloclsa87@gmail.com" style={{"display": "inline-flex", "alignItems": "center", "gap": "4px", "padding": "4px 10px", "background": "rgba(255,255,255,0.05)", "border": "1px solid var(--border)", "borderRadius": "6px", "color": "var(--color-foreground)", "textDecoration": "none"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-mail">

</use>
</svg>
{" pabloclsa87@gmail.com\n                    "}
</a>
{"\n"}
<a href="https://wa.me/51918165428" target="_blank" rel="noopener noreferrer" style={{"display": "inline-flex", "alignItems": "center", "gap": "4px", "padding": "4px 10px", "background": "rgba(37, 211, 102, 0.1)", "border": "1px solid rgba(37, 211, 102, 0.3)", "borderRadius": "6px", "color": "#25d366", "textDecoration": "none"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-whatsapp">

</use>
</svg>
{" WhatsApp: 918 165 428\n                    "}
</a>
{"\n"}
<a href="https://space.sypablitodp.site" target="_blank" rel="noopener noreferrer" style={{"display": "inline-flex", "alignItems": "center", "gap": "4px", "padding": "4px 10px", "background": "rgba(0, 210, 255, 0.1)", "border": "1px solid rgba(0, 210, 255, 0.3)", "borderRadius": "6px", "color": "#00d2ff", "textDecoration": "none"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-globe">

</use>
</svg>
{" space.sypablitodp.site\n                    "}
</a>
{"\n"}
</div>
{"\n"}
<h4 style={{"color": "var(--accent)", "fontWeight": "700", "marginTop": "0.5rem", "display": "flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-building">

</use>
</svg>
{"\n                    8. LEGISLACIÓN APLICABLE Y JURISDICCIÓN\n                "}
</h4>
{"\n"}
<p>
{"Los presentes Términos y Condiciones se rigen e interpretan según las leyes de la República del Perú. Para cualquier controversia, las partes se someten voluntariamente a la competencia exclusiva de los jueces y tribunales del distrito judicial de "}
<strong>
{"Huánuco, Perú"}
</strong>
{"."}
</p>
{"\n"}
</div>
{"\n"}
<div style={{"marginTop": "1.5rem", "paddingTop": "1rem", "borderTop": "1px solid var(--border)", "display": "flex", "justifyContent": "flex-end", "gap": "0.75rem"} as CSSProperties}>
{"\n"}
<button id="btn-accept-terms-modal" className="btn btn-primary" style={{"padding": "0.6rem 1.4rem", "fontWeight": "600", "display": "inline-flex", "alignItems": "center", "gap": "0.4rem"} as CSSProperties}>
{"\n"}
<svg className="ui-icon" aria-hidden="true">
<use href="#icon-check">

</use>
</svg>
{"\n                    Entendido y Aceptar\n                "}
</button>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
</div>
{"\n"}
    </>;
}
