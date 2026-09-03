/* ═══════════════════════════════════════════════════
   AI COPILOT — Integración con IA
   Adaptado de pablitoexpo GlobalAiCopilot + mibitacora SpaceCopilot
   ═══════════════════════════════════════════════════ */

const AiCopilot = (() => {

    // ─── CONFIGURACIÓN ───
    const CONFIG = {
        // Provider credentials are held only by Supabase Edge Functions.
        model: 'openai-gpt-5.6-luna'
    };

    const PROVIDERS = {
        'openai-gpt-5.6-luna': { router: 'openai-router', kind: 'openai', model: 'gpt-5.6-luna' },
        'openai-gpt-5.4-mini': { router: 'openai-router', kind: 'openai', model: 'gpt-5.4-mini' },
        'gemini-2.5-flash': { router: 'gemini-router', kind: 'gemini', model: 'gemini-2.5-flash' },
        'deepseek-v3': { router: 'deepseek-router', kind: 'deepseek', model: 'deepseek-chat' }
    };

    function resolveProvider(provider) {
        const aliases = { openai: 'openai-gpt-5.6-luna', gemini: 'gemini-2.5-flash', deepseek: 'deepseek-v3' };
        return PROVIDERS[aliases[provider] || provider] || PROVIDERS['openai-gpt-5.6-luna'];
    }

    async function hasAuthenticatedUser() {
        if (!window.SupabaseClient || !SupabaseClient.client) return false;
        try { return Boolean(await SupabaseClient.getCurrentUser()); } catch { return false; }
    }

    function prepareSourceFile(sourceFile, provider) {
        if (!sourceFile) return null;
        const base = { name: sourceFile.name || 'archivo-adjunto', type: sourceFile.type || 'application/octet-stream' };
        const maxBase64Chars = 4 * 1024 * 1024;

        if (provider.kind === 'gemini' && sourceFile.base64) {
            if (sourceFile.base64.length > maxBase64Chars) throw new Error('El archivo adjunto supera el límite permitido para IA.');
            return { ...base, base64: sourceFile.base64 };
        }
        if (sourceFile.textContent) return { ...base, textContent: String(sourceFile.textContent).slice(0, 30000) };
        if (base.type.startsWith('image/') && sourceFile.base64) {
            if (sourceFile.base64.length > maxBase64Chars) throw new Error('La imagen adjunta supera el límite permitido para IA.');
            return { ...base, base64: sourceFile.base64 };
        }
        return null;
    }

    /**
     * Set API configuration
     */
    function configure({ model } = {}) {
        if (model) CONFIG.model = model;

        // Persist config (without sensitive keys shown)
        localStorage.setItem('spacelab_ai_config', JSON.stringify({
            model: CONFIG.model
        }));
    }

    function setProvider(provider) {
        CONFIG.model = provider;
    }

    /**
     * Load saved config
     */
    function loadConfig() {
        try {
            const saved = localStorage.getItem('spacelab_ai_config');
            if (saved) {
                const c = JSON.parse(saved);
                CONFIG.model = c.model || CONFIG.model;
                localStorage.setItem('spacelab_ai_config', JSON.stringify({ model: CONFIG.model }));
            }
        } catch { /* ignore */ }
    }

    // ─── METODOLOGÍAS DIDÁCTICAS PROMPTS ───
    const METHODOLOGY_PROMPTS = {
        polya: `La secuencia didáctica del momento de DESARROLLO debe estructurarse rigurosamente bajo los procesos didácticos oficiales de Matemática de MINEDU:
1. **Familiarización con el problema:** Los estudiantes leen de forma colectiva el reto, identifican datos y comprenden la situación.
2. **Búsqueda y ejecución de estrategias:** Los alumnos proponen planes, eligen herramientas, organizan equipos y ejecutan soluciones.
3. **Socialización de representaciones:** Los estudiantes comparten e intercambian en la pizarra sus representaciones (gráficas, simbólicas, concretas).
4. **Reflexión y Formalización:** Momento donde el docente consolida conceptualmente el aprendizaje y los estudiantes reflexionan sobre sus dificultades y aciertos.
Asegúrate de crear exactamente cuatro objetos dentro de momentos.desarrollo.procesos, con los ids "familiarizacion", "busqueda_estrategias", "socializacion" y "formalizacion_reflexion", en ese orden.`,

        erca: `La secuencia didáctica del momento de DESARROLLO debe estructurarse estrictamente bajo el ciclo ERCA:
1. **Experiencia:** Actividad vivencial, exploración física, o recuperación de una situación real relacionada al tema.
2. **Reflexión:** Los estudiantes analizan lo experimentado, exponen sus puntos de vista, y discuten las primeras interrogantes.
3. **Conceptualización:** Sistematización teórica de los conceptos claves científicos, reglas o ideas principales guiados por el docente.
4. **Aplicación:** Resolución de retos prácticos, ejercicios o situaciones cotidianas donde apliquen lo aprendido.
Asegúrate de crear exactamente cuatro objetos dentro de momentos.desarrollo.procesos, con los ids "experiencia", "reflexion", "conceptualizacion" y "aplicacion", en ese orden.`,

        abp: `La secuencia didáctica del momento de DESARROLLO debe estructurarse bajo los principios del Aprendizaje Basado en Proyectos (ABP):
1. **Lanzamiento / Desafío:** Planteamiento del reto, pregunta orientadora o necesidad real del proyecto.
2. **Indagación / Investigación:** Búsqueda activa de información, lectura o recolección de datos sobre la problemática.
3. **Desarrollo del Producto:** Trabajo colaborativo donde los estudiantes diseñan, crean o esbozan el entregable/producto del proyecto.
4. **Difusión y Evaluación:** Espacio donde socializan sus productos y reciben retroalimentación crítica constructiva de sus pares.
Asegúrate de crear exactamente cuatro objetos dentro de momentos.desarrollo.procesos, con los ids "lanzamiento", "indagacion", "desarrollo_producto" y "difusion_evaluacion", en ese orden.`,

        flipped: `La secuencia didáctica del momento de DESARROLLO debe estructurarse bajo el enfoque de Aula Invertida (Flipped Classroom):
1. **Conexión de saberes externos:** Puesta en común del contenido estudiado autónomamente antes de la clase (videos, lecturas previas).
2. **Aplicación guiada / Taller activo:** Dinámica de alta exigencia cognitiva donde se resuelven dudas complejas y se trabaja en proyectos o retos colaborativos.
3. **Consolidación y retroalimentación interactiva:** Sistematización del saber aplicado en el taller y evaluación formativa en vivo.
Asegúrate de crear exactamente tres objetos dentro de momentos.desarrollo.procesos, con los ids "conexion_externa", "aplicacion_guiada" y "consolidacion_retroalimentacion", en ese orden.`,

        indagacion: `La secuencia didáctica del momento de DESARROLLO debe estructurarse siguiendo el Método de Indagación Científica (STEAM/Ciencia):
1. **Problematización de situaciones:** Formulación de preguntas investigables e hipótesis explicativas.
2. **Diseño de estrategias para hacer indagación:** Elaboración del plan de acción experimental o metodológico.
3. **Generación, registro y análisis de datos:** Actividad práctica de experimentación, observación directa o recolección de evidencia empírica.
4. **Estructuración del saber construido y comunicación:** Contraste de hipótesis, síntesis de conclusiones y comunicación de aprendizajes.
Asegúrate de crear exactamente cuatro objetos dentro de momentos.desarrollo.procesos, con los ids "problematizacion", "diseno_estrategias", "generacion_analisis_datos" y "estructuracion_comunicacion", en ese orden.`,

        cooperativo: `La secuencia didáctica del momento de DESARROLLO debe centrarse en el Aprendizaje Cooperativo:
1. **Organización de equipos y roles:** Formación de grupos heterogéneos y asignación de roles (coordinador, secretario, portavoz, gestor del tiempo).
2. **Interdependencia positiva:** Actividades diseñadas para que los estudiantes se necesiten mutuamente para lograr el éxito grupal (ej: rompecabezas, lectura compartida).
3. **Interacción promotora:** Fomentar el diálogo cercano y la explicación mutua de conceptos entre compañeros.
4. **Autoevaluación grupal:** Reflexión final sobre el desempeño cooperativo del equipo.
Asegúrate de crear exactamente cuatro objetos dentro de momentos.desarrollo.procesos, con los ids "organizacion_roles", "interdependencia_positiva", "interaccion_promotora" y "autoevaluacion_grupal", en ese orden.`
    };

    // ─── SYSTEM PROMPT ───
    const SYSTEM_PROMPT = `Eres un asistente educativo experto en el diseño de sesiones de aprendizaje de educación básica (Inicial, Primaria, Secundaria) según el Currículo Nacional del Perú (MINEDU) y el CNEB. Tu tarea es generar la planificación de una sesión de aprendizaje detallada, extensa e interactiva.

REGLAS DE FORMATO Y CONTENIDO:
1. Responde ÚNICAMENTE en formato JSON válido. No envíes explicaciones, código markdown ni backticks \`\`\`.
2. Las actividades de los momentos (inicio, desarrollo, cierre) deben contener marcado HTML básico (como <strong>, <ul>, <li>, <p>, <br>) para estructurar el texto, listas y preguntas con excelente visualización. No uses etiquetas como <html>, <body>, ni clases CSS complejas.
3. El desarrollo de la sesión debe dividirse rigurosamente en objetos separados dentro del array momentos.desarrollo.procesos. Explaya detalladamente las interacciones pedagógicas, preguntas clave y dinámicas en cada proceso didáctico. No escatimes en la longitud del contenido, el formato de destino soporta textos extensos.
4. Genera múltiples capacidades y criterios de evaluación adecuados a la competencia.
5. Adapta la complejidad y tono de las actividades al Grado, Nivel (Inicial, Primaria, Secundaria) y Área curricular indicados.
6. No entregues frases genéricas ni marcadores como "...". En cada proceso indica acciones concretas del docente, acciones de los estudiantes, preguntas mediadoras, organización, recursos y producto o evidencia parcial.
7. Genera como mínimo 3 capacidades, entre 3 y 5 criterios observables, 4 procesos de inicio, todos los procesos propios de la metodología y 3 procesos de cierre.

FORMATO DE RESPUESTA (SessionDocument v1, JSON):
{
  "schemaVersion": "1.0",
  "metadata": {"institucion":"", "dre":"", "ugel":"", "docente":"", "director":"", "fecha":"", "nivel":"", "grado":"", "seccion":"", "area":"", "numeroSesion":"", "duracionMinutos":90, "unidad":"", "titulo":"Frase de acción retadora"},
  "proposito": {
    "texto": "Propósito de aprendizaje comunicado al estudiante",
    "competencia": "Nombre oficial de la competencia (ej. Resuelve problemas de cantidad)",
    "estandar": "Texto completo del Estándar de Aprendizaje del ciclo correspondiente",
    "capacidades": [
      "Capacidad oficial 1",
      "Capacidad oficial 2",
      "Capacidad oficial 3"
    ],
    "criterios": [
      "Criterio de evaluación específico 1",
      "Criterio de evaluación específico 2",
      "Criterio de evaluación específico 3"
    ],
    "evidencia": "Descripción detallada del producto o evidencia de aprendizaje",
    "instrumento": "Lista de Cotejo / Rúbrica",
    "conocimientos": "Conceptos clave, temas y subtemas que se abordarán",
    "desempeno": "Desempeño precisado y contextualizado"
  },
  "competenciasTransversales": [
    {"titulo":"Se desenvuelve en los entornos virtuales generados por las TIC", "desempenos":["Desempeño contextualizado 1", "Desempeño contextualizado 2"]},
    {"titulo":"Gestiona su aprendizaje de manera autónoma", "desempenos":["Desempeño contextualizado 1", "Desempeño contextualizado 2"]}
  ],
  "enfoquesTransversales": [
    {
      "nombre": "Nombre del Enfoque Transversal 1 (ej. Enfoque de derechos)",
      "valor": "Valor del enfoque 1 (ej. Conciencia de derechos)",
      "actitudes": "Actitudes o acciones observables del docente y estudiantes"
    },
    {
      "nombre": "Nombre del Enfoque Transversal 2 (ej. Enfoque Ambiental)",
      "valor": "Valor del enfoque 2 (ej. Solidaridad planetaria)",
      "actitudes": "Actitudes o acciones observables del docente y estudiantes"
    }
  ],
  "recursos": {
    "enlaces": "Referencias bibliográficas, libros de texto de MINEDU, enlaces web oficiales",
    "materiales": "Fichas de trabajo, papelotes, plumones, material concreto, proyector",
    "refuerzo": "Ficha N° XX y título de la actividad de refuerzo escolar (opcional)"
  },
  "momentos": {
    "inicio": {
      "tiempoMinutos": 15,
      "procesos": [
        {"id":"motivacion", "orden":1, "titulo":"Motivación", "contenido":{"format":"html", "value":"<p>Actividad motivadora y retadora...</p>"}},
        {"id":"saberes_previos", "orden":2, "titulo":"Saberes previos", "contenido":{"format":"html", "value":"<p>Preguntas y respuestas esperadas...</p>"}},
        {"id":"problematizacion", "orden":3, "titulo":"Problematización", "contenido":{"format":"html", "value":"<p>Conflicto cognitivo o reto...</p>"}},
        {"id":"proposito_organizacion", "orden":4, "titulo":"Propósito y organización", "contenido":{"format":"html", "value":"<p>Propósito, criterios y organización...</p>"}}
      ]
    },
    "desarrollo": {
      "tiempoMinutos": 65,
      "procesos": [
        {"id":"id_metodologico", "orden":1, "titulo":"Nombre del proceso didáctico", "contenido":{"format":"html", "value":"<p>Desarrollo amplio y específico...</p><ul><li>Interacción concreta...</li><li>Preguntas mediadoras...</li></ul>"}}
      ]
    },
    "cierre": {
      "tiempoMinutos": 10,
      "procesos": [
        {"id":"metacognicion", "orden":1, "titulo":"Metacognición", "contenido":{"format":"html", "value":"<p>Preguntas reflexivas contextualizadas...</p>"}},
        {"id":"evaluacion_formativa", "orden":2, "titulo":"Evaluación formativa", "contenido":{"format":"html", "value":"<p>Revisión de criterios, evidencias y retroalimentación...</p>"}},
        {"id":"extension", "orden":3, "titulo":"Extensión", "contenido":{"format":"html", "value":"<p>Aplicación significativa fuera del aula...</p>"}}
      ]
    }
  },
  "evaluacion": {
    "criterioConsolidado": "Criterio de evaluación consolidado",
    "evidencia": "Evidencia/producto esperado",
    "instrumento": "Lista de Cotejo / Rúbrica"
  },
  "fichaTrabajo": null,
  "juegoLibreSectores": null,
  "listaCotejo": {"alumnos":[], "criterios":["Los mismos criterios observables de proposito.criterios"]}
}

FORMATO MATEMÁTICO (LaTeX con KaTeX):
Cuando el área es Matemática o la sesión incluya operaciones, ecuaciones, fracciones, exponentes o cualquier expresión matemática, escríbelas siempre en notación LaTeX rodeada de delimitadores. La app las renderizará automáticamente como tipografía matemática profesional.

REGLAS DE NOTACIÓN:
- Expresión en línea (dentro de un párrafo): $expresión$ → Ej: "El valor de $x = 8$"
- Expresión centrada/destacada (en su propia línea): $$expresión$$ → Ej: $$2x + 5 = 21$$
- Fracciones: \frac{numerador}{denominador} → Ej: $$\frac{25 - a}{21 - a} = \frac{5}{4}$$
- Flecha de implicación / "entonces": \Rightarrow → Ej: $$2x = 16 \Rightarrow x = 8$$
- Raíz cuadrada: \sqrt{expresión} → Ej: $\sqrt{b^2 - 4ac}$
- Potencia: x^{n} → Ej: $x^2 + 5x + 6 = 0$
- Subíndice: x_{n} → Ej: $x_1, x_2$
- Fórmula general: $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$
- Suma/resta con alineación de pasos: usar $$...$$ en líneas separadas para cada paso del proceso

CUÁNDO USAR LATEX:
✅ En los pasos de resolución de problemas (proceso 2, proceso 3, proceso 4 del desarrollo)
✅ En situaciones de problematización cuando se plantee una ecuación
✅ En la formalización/reflexión al mostrar el procedimiento consolidado
✅ En preguntas de inicio si involucran cifras matemáticas operadas
❌ NO uses LaTeX en textos de gestión del aula, instrucciones organizativas ni preguntas de metacognición
`;

    async function generateSession(metadata) {
        const userPrompt = buildPrompt(metadata);

        // Construir prompt de sistema dinámico basado en la metodología didáctica elegida
        let dynamicSystemPrompt = SYSTEM_PROMPT;
        if (metadata.methodology && METHODOLOGY_PROMPTS[metadata.methodology]) {
            dynamicSystemPrompt += `\n\nMETODOLOGÍA DIDÁCTICA OBLIGATORIA:\n${METHODOLOGY_PROMPTS[metadata.methodology]}`;
        }

        if (metadata.template === 'inicial') {
            dynamicSystemPrompt += `\n\n⚠️ INSTRUCCIÓN DE FORMATO ESPECIAL PARA EDUCACIÓN INICIAL:
La sesión que vas a generar es de nivel EDUCACIÓN INICIAL (para niños de 3 a 5 años). Por lo tanto:
1. Adapta el lenguaje y las dinámicas para que sean sumamente lúdicas, vivenciales y concretas (uso de títeres, juegos de rol, asambleas cortas, manipulación de material concreto, dibujo y expresión plástica).
2. Debes incluir OBLIGATORIAMENTE dos campos adicionales en la raíz del JSON de respuesta:
   - "juegoLibreSectores": Objeto con los 6 pasos didácticos del juego libre en los sectores, detallados para este tema específico:
     {
       "planificacion": "Detalle de la asamblea y la elección libre del sector.",
       "organizacion": "Cómo se agrupan los niños y distribuyen los roles en los sectores.",
       "ejecucion": "Juego libre y cómo el docente acompaña y media en el aprendizaje.",
       "orden": "Estrategias lúdicas o canciones para guardar los materiales.",
       "socializacion": "Preguntas que el docente hará para conversar sobre la experiencia del juego.",
       "representacion": "Detalle de la producción gráfica, modelado o dramatización posterior al juego."
     }
   - "fichaTrabajo": Objeto con una propuesta de hoja de aplicación/ficha práctica autónoma para el estudiante:
     {
       "titulo": "Título corto y llamativo para el niño (ej. ¡A contar maestras!)",
       "indicaciones": "Instrucciones de la actividad descritas de forma sumamente sencilla (para la docente/padre).",
       "actividades": "Código HTML detallado con la estructura visual de la ficha. Usa contenedores con estilos en línea (bordes punteados, recuadros grandes para dibujar, números grandes para delinear con puntitos, dibujos simples representados con símbolos o formas como círculos/estrellas). Debe ser súper interactiva, atractiva y lista para imprimir y colorear/trazar."
     }
Asegúrate de que la estructura JSON contenga estos dos nuevos campos en su raíz.`;
        }

        if (metadata.nivel === 'PRIMARIA' || (metadata.nivel && metadata.nivel.toUpperCase() === 'PRIMARIA')) {
            dynamicSystemPrompt += `\n\n⚠️ INSTRUCCIÓN DE FORMATO ESPECIAL PARA EDUCACIÓN PRIMARIA (1° A 6° GRADO):
La sesión que vas a generar es de nivel EDUCACIÓN PRIMARIA. Por lo tanto, debes incluir OBLIGATORIAMENTE un campo adicional en la raíz del JSON de respuesta llamado "fichaTrabajo" para proponer una ficha de aplicación/trabajo autónoma adaptada de forma rigurosa al grado indicado (${metadata.grado || 'del grado correspondiente'}):
{
  "fichaTrabajo": {
    "titulo": "Título de la actividad para el estudiante (ej. ¡Jugamos y resolvemos sumando!)",
    "indicaciones": "Instrucciones cortas directas al estudiante (máximo 40 palabras).",
    "actividades": "Código HTML detallado con la estructura de la ficha. Usa tablas, recuadros punteados o listas con estilos CSS en línea para simular una hoja de trabajo física y atractiva. Adapta el contenido al grado indicado de forma estricta:
      - 1° y 2° grado (Ciclo III): Actividades muy visuales, trazado de palabras, problemas sencillos usando dibujos sencillos representados con caracteres o tablas, y sumas/restas ilustradas con contenedores grandes para dibujar.
      - 3° y 4° grado (Ciclo IV): Textos breves para comprensión con preguntas de opción múltiple, problemas matemáticos de dos operaciones con esquemas de solución y crucigramas/sopas de letras básicos.
      - 5° y 6° grado (Ciclo V): Preguntas reflexivas y críticas, problemas lógicos complejos (fracciones, porcentajes, etc.), organizadores visuales vacíos (ej. mapas conceptuales creados con tablas HTML vacías con bordes) para completar, y tareas de redacción corta."
  }
}
Asegúrate de que la estructura JSON contenga este nuevo campo "fichaTrabajo" en su raíz.`;
        }

        // 1. Intentar llamar a la Edge Function de Supabase si está disponible

        if (await hasAuthenticatedUser()) {
            try {
                const provider = resolveProvider(metadata.ai_provider);
                const functionName = provider.router;
                const selectedModel = provider.model;
                const sourceFile = prepareSourceFile(metadata.sourceFile, provider);

                console.log(`[AI] Llamando a Edge Function ${functionName} con modelo ${selectedModel}...`);
                const data = await SupabaseClient.invokeFunction(functionName, {
                    prompt: userPrompt,
                    systemPrompt: dynamicSystemPrompt,
                    model: selectedModel,
                    sourceFile
                });

                // Si la función retorna un string de JSON
                let resultObj = data;
                if (typeof data === 'string') {
                    resultObj = parseAIResponse(data);
                } else if (data && typeof data === 'object') {
                    // Si ya viene como objeto parsed
                    resultObj = normalizeSessionData(deepCleanStrings(data));
                }

                if (resultObj) {
                    return resultObj;
                }
            } catch (err) {
                console.error('[AI] Error en Edge Function:', err);
                throw err;
            }
        }

        throw new Error('Debes iniciar sesión para generar contenido con IA.');
    }

    /**
     * Build the user prompt from metadata
     */
    function buildPrompt(m) {
        const parts = [];

        parts.push(`Genera una sesión de aprendizaje con estos datos:`);

        if (m.nivel) parts.push(`- Nivel educativo: ${m.nivel}`);
        if (m.area) parts.push(`- Área curricular: ${m.area}`);
        if (m.grado) parts.push(`- Grado: ${m.grado}`);
        if (m.numero_sesion) parts.push(`- Número de sesión: ${m.numero_sesion}`);
        if (m.titulo) parts.push(`- Tema/Título: ${m.titulo}`);
        if (m.duracion) parts.push(`- Duración total: ${m.duracion}`);
        if (m.competencia) parts.push(`- Competencia sugerida: ${m.competencia}`);
        if (m.capacidad) parts.push(`- Capacidad sugerida: ${m.capacidad}`);
        if (m.desempeno) parts.push(`- Desempeño sugerido: ${m.desempeno}`);
        if (m.enfoque) parts.push(`- Enfoque transversal 1: ${m.enfoque}`);
        if (m.enfoque2) parts.push(`- Enfoque transversal 2: ${m.enfoque2}`);

        if (m.sourceFile) {
            if (m.sourceFile.textContent) {
                parts.push(`\n--- CONTENIDO DEL ARCHIVO DE REFERENCIA (${m.sourceFile.name}) ---\n${m.sourceFile.textContent}\n--- FIN DEL ARCHIVO DE REFERENCIA ---`);
                parts.push(`\n⚠️ INSTRUCCIÓN OBLIGATORIA SOBRE EL ARCHIVO DE REFERENCIA:`);
                parts.push(`- Utiliza el contenido del archivo de referencia adjunto arriba como la base teórica, pedagógica y práctica principal de la sesión.`);
                parts.push(`- Extrae del archivo los conceptos clave, problemas, lecturas, actividades o secuencias y utilízalos para dar forma a los momentos didácticos (Inicio, Desarrollo, Cierre) y a la Ficha de Trabajo.`);
                parts.push(`- Si el tema o título proporcionado se relaciona con este archivo, alinea toda la sesión para que desarrolle el contenido de este archivo enfocado en dicho tema.`);
            } else if (m.sourceFile.base64) {
                parts.push(`\n[Archivo adjunto de referencia: ${m.sourceFile.name} (tipo: ${m.sourceFile.type}). Utiliza esta fuente de referencia para basar las actividades, conceptos y el diseño pedagógico de la sesión de aprendizaje.]`);
            }
        }

        parts.push(`\n⚠️ INSTRUCCIÓN DE RESPETO DE ENTRADAS DEL DOCENTE:`);
        parts.push(`- Si el docente ha proporcionado un 'Tema/Título' (${m.titulo ? `"${m.titulo}"` : 'NO PROVISTO'}), úsalo de forma obligatoria y estricta en la sesión. Si está vacío o NO PROVISTO, dedúcelo de manera creativa a partir del contexto del archivo de referencia adjunto y devuélvelo en "metadata.titulo".`);
        parts.push(`- Si el docente ha proporcionado una 'Competencia sugerida' (${m.competencia ? `"${m.competencia}"` : 'NO PROVISTO'}), úsala exactamente tal cual. Si está vacía o NO PROVISTO, dedúcela del contexto del archivo o área curricular.`);
        parts.push(`- Si el docente ha proporcionado una 'Capacidad sugerida' (${m.capacidad ? `"${m.capacidad}"` : 'NO PROVISTO'}), úsala. Si está vacía o NO PROVISTO, dedúcela del contexto del archivo.`);
        parts.push(`- Si el docente ha proporcionado un 'Desempeño sugerido' (${m.desempeno ? `"${m.desempeno}"` : 'NO PROVISTO'}), úsalo. Si está vacío o NO PROVISTO, dedúcelo del contexto del archivo.`);

        // ─── Enfoque pedagógico específico del docente (del mini-chat) ───
        // Solo se añade si el docente usó el panel de briefing. Es compacto (~80 palabras)
        // y NO repite área/grado/título (ya están arriba). Instrucción de alta prioridad.
        if (m.pedagogyBrief && m.pedagogyBrief.trim()) {
            parts.push(`\n⚠️ ENFOQUE PEDAGÓGICO ESPECÍFICO DEL DOCENTE (INSTRUCCIÓN DE ALTA PRIORIDAD):\n${m.pedagogyBrief.trim()}\nAsegúrate de que los momentos, actividades y ejemplos de la sesión reflejen exactamente este enfoque.`);
        }

        if (m.qualityFeedback) {
            parts.push(`\n⚠️ CORRECCIÓN OBLIGATORIA: Un intento anterior fue rechazado por contenido incompleto. Corrige todos estos puntos en una respuesta nueva y completa:\n- ${m.qualityFeedback.join('\n- ')}`);
        }

        parts.push(`\nIMPORTANTE: Responde SOLO con el JSON, sin explicaciones.`);

        return parts.join('\n');
    }

    /**
     * Parse and clean AI response
     */
    function parseAIResponse(rawContent) {
        // Clean common AI response artifacts
        let cleaned = rawContent
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^\s*[\r\n]+/, '')
            .replace(/[\r\n]+\s*$/, '')
            .trim();

        // Try to extract JSON if wrapped in text
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(cleaned);

            // Clean excessive newlines from all string values
            return normalizeSessionData(deepCleanStrings(parsed));
        } catch {
            console.error('[AI] Failed to parse JSON:', cleaned);
            throw new Error('La IA devolvió una respuesta con formato incorrecto. Intenta de nuevo.');
        }
    }

    /**
     * Recursively clean strings in an object
     */
    function deepCleanStrings(obj) {
        if (typeof obj === 'string') {
            return obj
                .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
                .replace(/^\s+|\s+$/g, '')   // Trim
                .replace(/•\s*/g, '• ');     // Normalize bullet points
        }
        if (Array.isArray(obj)) {
            return obj.map(deepCleanStrings);
        }
        if (obj && typeof obj === 'object') {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = deepCleanStrings(value);
            }
            return result;
        }
        return obj;
    }

    /**
     * Normalize dynamic session keys (e.g. momentos.desarrollo proceso_X_ keys)
     * Also handles AI-specific formats:
     * - titulo_sesion_retador → metadata.titulo
     * - competencias_transversales as object {tic, autonoma} → keep for templates
     * - enfoques (short key) → enfoques (already handled by templates.js)
     * - recursos.paginas_consulta → recursos.paginas_consulta (kept for web view)
     * - momentos.inicio sub-moments (motivacion, saberes_previos, etc.)
     * - momentos.cierre.actividades text → kept as-is for web rendering
     */
    function normalizeSessionData(obj) {
        if (!obj || typeof obj !== 'object') return obj;

        // 1. Map titulo_sesion_retador to metadata.titulo if missing
        if (obj.titulo_sesion_retador && !obj.metadata?.titulo) {
            if (!obj.metadata) obj.metadata = {};
            obj.metadata.titulo = obj.titulo_sesion_retador;
        }

        // 2. Map 'enfoques' shorthand to top-level (templates.js reads data.enfoques)
        if (obj.enfoques && !Array.isArray(obj.enfoques_transversales)) {
            // Keep as 'enfoques' for templates.js which reads data.enfoques
        }

        // 3. Normalize competencias_transversales
        //    AI sends: { tic: [...], autonoma: [...] }
        //    Templates.js reads: { tic: [...], autonoma: [...] } — same format, keep as-is
        //    No conversion needed for frontend, backend handles its own conversion

        // 4. Map recursos keys for frontend compatibility
        if (obj.recursos && typeof obj.recursos === 'object') {
            if (obj.recursos.paginas_consulta && !obj.recursos.enlaces) {
                obj.recursos.enlaces = obj.recursos.paginas_consulta;
            }
            if (obj.recursos.actividades_refuerzo && !obj.recursos.refuerzo) {
                obj.recursos.refuerzo = obj.recursos.actividades_refuerzo;
            }
        }

        // 5. Normalize desarrollo process keys
        if (obj.momentos && obj.momentos.desarrollo && typeof obj.momentos.desarrollo === 'object') {
            const desarrollo = obj.momentos.desarrollo;

            // SessionDocument v1 already uses an ordered `procesos` array.
            // Legacy normalization must never rename or discard that array.
            if (Array.isArray(desarrollo.procesos)) {
                return obj;
            }

            const newDesarrollo = {};
            let index = 1;

            // Copy standard non-process keys
            if (desarrollo.tiempo_total) newDesarrollo.tiempo_total = desarrollo.tiempo_total;
            if (desarrollo.actividades) newDesarrollo.actividades = desarrollo.actividades;

            // Identify and sort process/step keys
            const otherKeys = Object.keys(desarrollo).filter(k => k !== 'tiempo_total' && k !== 'actividades');

            otherKeys.sort((a, b) => {
                const numA = parseInt(a.replace(/^\D+/g, ''), 10);
                const numB = parseInt(b.replace(/^\D+/g, ''), 10);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.localeCompare(b);
            });

            // Normalize keys to 'proceso_X_[name]' format
            otherKeys.forEach(key => {
                const val = desarrollo[key];
                const cleanKey = key
                    .replace(/^(proceso|paso)_\d+_/, '')
                    .replace(/^(proceso|paso)_/, '');

                const standardKey = `proceso_${index}_${cleanKey}`;
                newDesarrollo[standardKey] = val;
                index++;
            });

            obj.momentos.desarrollo = newDesarrollo;
        }

        return obj;
    }

    /**
     * Show API configuration prompt
     */
    /**
     * Run a generic prompt through an authenticated Supabase Edge Function.
     */
    async function runPrompt(systemPrompt, userPrompt) {
        const provider = resolveProvider(CONFIG.model);
        // 1. Try to invoke Supabase Edge Function if available
        if (await hasAuthenticatedUser()) {
            try {
                const functionName = provider.router;

                console.log(`[AI Helper] Invoking edge function ${functionName} for generic prompt...`);
                const data = await SupabaseClient.invokeFunction(functionName, {
                    prompt: userPrompt,
                    systemPrompt: systemPrompt,
                    model: provider.model
                });

                let text = data;
                if (data && typeof data === 'object') {
                    text = data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
                }
                if (text) return text;
                throw new Error('La función de IA no devolvió contenido.');
            } catch (err) {
                console.warn('[AI Helper] Edge function failed:', err);
                throw err;
            }
        }

        throw new Error('Debes iniciar sesión para usar las funciones de IA.');
    }

    /**
     * Generate evaluation criteria / rubric indicators based on session content.
     */
    async function generateCriterios(competencia, tema, grado, area) {
        const systemPrompt = `Eres un asesor pedagógico experto en el Currículo Nacional de Educación Básica (CNEB) del Perú. 
Tu tarea es generar exactamente entre 3 y 5 criterios de evaluación en formato de elementos de lista HTML básico (usando viñetas <li>...</li>).
Cada criterio debe ser claro, preciso, medible y redactado en tercera persona (por ejemplo: "Identifica información explícita...", "Explica el propósito...", etc.), vinculando el área curricular, competencia y grado provistos.
Devuelve ÚNICAMENTE los elementos <li> sin etiquetas de lista <ul> ni explicaciones adicionales, ni introducciones, ni marcas de código markdown de bloque como \`\`\`html. Devuelve código HTML plano listo para insertar en una lista.`;

        const userPrompt = `Área Curricular: ${area || 'General'}
Competencia: ${competencia || 'Competencia general'}
Tema/Propósito: ${tema || 'Actividad de aprendizaje'}
Grado: ${grado || 'General'}`;

        const result = await runPrompt(systemPrompt, userPrompt);
        return result.trim().replace(/^```html|```$/g, '');
    }

    async function improveText(text, instruction) {
        const systemPrompt = `Eres un asesor pedagógico y experto redactor del Currículo Nacional del Perú. Tu tarea es reescribir y refinar el fragmento de texto de la sesión de aprendizaje proporcionado por el docente, basándote ESTRICTAMENTE en la instrucción de estilo indicada.
        
REGLAS CRÍTICAS:
1. Aplica la instrucción de refinamiento al texto de forma precisa.
2. Devuelve ÚNICAMENTE el texto procesado resultante.
3. NO agregues introducciones, preámbulos, explicaciones, notas, comentarios de autor ni comillas de apertura/cierre.
4. Respeta y conserva el marcado HTML básico si el texto original lo contiene (como <strong>, <br>, <li>, <ul>).`;

        const userPrompt = `Texto original:
"${text}"

Instrucción de refinamiento:
${instruction}`;

        const result = await runPrompt(systemPrompt, userPrompt);
        return result.trim();
    }

    // ── SessionDocument v1 facade ──
    /**
     * Convierte datos legacy (salida IA o formulario) a SessionDocument v1.
     * @param {Object} legacyData - JSON legacy de la sesión.
     * @param {Object} [formMeta] - Metadata adicional del formulario del docente.
     * @returns {{ document: Object, warnings: string[], valid: boolean, errors: string[] }}
     */
    function toV1(legacyData, formMeta = {}) {
        if (typeof SessionAdapter === 'undefined') {
            console.warn('[AiCopilot] SessionAdapter no cargado, devolviendo datos sin adaptar.');
            return { document: legacyData, warnings: ['SessionAdapter no disponible'], valid: false, errors: ['SessionAdapter no cargado'] };
        }
        const { document, warnings } = SessionAdapter.adaptLegacyToV1(legacyData, formMeta);

        // Validar si SessionValidator está disponible
        let valid = true, errors = [];
        if (typeof SessionValidator !== 'undefined') {
            const result = SessionValidator.validate(document);
            valid = result.valid;
            errors = result.errors;
            if (result.warnings.length > 0) {
                warnings.push(...result.warnings);
            }
        }

        if (warnings.length > 0) {
            console.log('[AiCopilot] toV1 warnings:', warnings);
        }
        if (!valid) {
            console.warn('[AiCopilot] toV1 validation errors:', errors);
        }

        return { document, warnings, valid, errors };
    }

    // Initialize
    loadConfig();

    return {
        generateSession,
        configure,
        setProvider,
        loadConfig,
        generateCriterios,
        improveText,
        toV1
    };
})();

window.AiCopilot = AiCopilot;
