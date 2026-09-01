/**
 * Test del Session Adapter — Verifica conversión legacy → v1.
 * Ejecutar: node tests/test_adapter_v1.js
 */
const SessionAdapter = require('../js/ai/session-adapter.js');
const SessionValidator = require('../js/ai/session-validator.js');

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (!condition) {
        console.error(`  ✗ FAIL: ${msg}`);
        failed++;
    } else {
        console.log(`  ✓ ${msg}`);
        passed++;
    }
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Legacy IA format (como lo produce el system prompt)
// ═══════════════════════════════════════════════════════════════
function testLegacyAIFormat() {
    console.log('\n[1/6] Formato legacy de IA con sub-momentos y proceso_X_...');

    const legacyAI = {
        titulo_sesion_retador: "Resolvemos problemas con ecuaciones",
        proposito: {
            competencia: "Resuelve problemas de regularidad",
            estandar: "Resuelve problemas referidos a...",
            capacidades: ["Cap 1", "Cap 2"],
            criterios_evaluacion: ["Criterio 1", "Criterio 2"],
            producto_evidencia: "Ficha resuelta",
            instrumento: "Lista de Cotejo",
            conocimientos: "Ecuaciones lineales"
        },
        competencias_transversales: {
            tic: ["Navega en plataformas digitales", "Organiza información"],
            autonoma: ["Determina metas de aprendizaje"]
        },
        enfoques: [
            { nombre: "Enfoque Ambiental", valor: "Justicia", actitudes: "Promueve estilos de vida" }
        ],
        recursos: {
            paginas_consulta: "https://perueduca.pe",
            materiales: "Pizarra, plumones",
            actividades_refuerzo: "Ficha N° 04"
        },
        momentos: {
            inicio: {
                motivacion: "El docente saluda y presenta un caso.",
                saberes_previos: "¿Qué es una incógnita?",
                problematizacion: "¿Cómo resolver dos ecuaciones?",
                proposito_organizacion: "Hoy aprenderemos sistemas de ecuaciones.",
                tiempo_total: "15 min"
            },
            desarrollo: {
                proceso_1_familiarizacion: "<p>Los estudiantes leen el problema.</p>",
                proceso_2_busqueda_estrategias: "<p>Proponen representaciones algebraicas.</p>",
                proceso_3_socializacion: "<p>Exponen en la pizarra.</p>",
                proceso_4_formalizacion_reflexion: "<p>El docente sintetiza.</p>",
                tiempo_total: "65 min"
            },
            cierre: {
                actividades: "Metacognición: ¿Qué aprendimos?\nEvaluación formativa: autoevaluación\nExtensión: resolver página 45",
                tiempo_total: "10 min"
            }
        },
        evaluacion: {
            criterio: "Criterio consolidado",
            evidencia: "Ficha resuelta",
            instrumento: "Lista de Cotejo"
        }
    };

    const { document: doc, warnings } = SessionAdapter.adaptLegacyToV1(legacyAI);

    // Validar con SessionValidator
    const validation = SessionValidator.validate(doc);
    assert(validation.valid, `Resultado es válido v1 (errors: ${validation.errors.join('; ')})`);

    // Metadata
    assert(doc.metadata.titulo === "Resolvemos problemas con ecuaciones", "titulo_sesion_retador → metadata.titulo");

    // Proposito
    assert(doc.proposito.criterios.length === 2, "criterios_evaluacion → proposito.criterios");
    assert(doc.proposito.evidencia === "Ficha resuelta", "producto_evidencia → proposito.evidencia");

    // Competencias transversales
    assert(doc.competenciasTransversales.length === 2, "CT object → array de 2");
    assert(doc.competenciasTransversales[0].titulo.includes('TIC'), "CT[0] = TIC");
    assert(doc.competenciasTransversales[0].desempenos.length === 2, "CT[0] tiene 2 desempenos");
    assert(doc.competenciasTransversales[1].titulo.includes('autónoma'), "CT[1] = autónoma");

    // Enfoques
    assert(doc.enfoquesTransversales.length === 1, "enfoques → enfoquesTransversales");
    assert(doc.enfoquesTransversales[0].nombre === "Enfoque Ambiental", "enfoque.nombre OK");

    // Recursos
    assert(doc.recursos.enlaces === "https://perueduca.pe", "paginas_consulta → enlaces");
    assert(doc.recursos.refuerzo === "Ficha N° 04", "actividades_refuerzo → refuerzo");

    // Inicio sub-momentos → procesos
    assert(doc.momentos.inicio.procesos.length === 4, "4 sub-momentos inicio");
    assert(doc.momentos.inicio.procesos[0].id === "motivacion", "inicio[0].id = motivacion");
    assert(doc.momentos.inicio.procesos[1].id === "saberes_previos", "inicio[1].id = saberes_previos");
    assert(doc.momentos.inicio.tiempoMinutos === 15, "inicio.tiempoMinutos = 15");

    // Desarrollo flat keys → procesos
    assert(doc.momentos.desarrollo.procesos.length === 4, "4 procesos desarrollo");
    assert(doc.momentos.desarrollo.procesos[0].id === "familiarizacion", "desarrollo[0].id = familiarizacion");
    assert(doc.momentos.desarrollo.procesos[0].contenido.format === "html", "desarrollo[0] format = html");

    // Cierre text → procesos tipados
    assert(doc.momentos.cierre.procesos.length >= 1, "cierre tiene al menos 1 proceso");
    assert(doc.momentos.cierre.tiempoMinutos === 10, "cierre.tiempoMinutos = 10");

    // Evaluación NO eliminada
    assert(doc.evaluacion.criterioConsolidado === "Criterio consolidado", "evaluacion.criterio → criterioConsolidado");
    assert(doc.evaluacion.instrumento === "Lista de Cotejo", "evaluacion.instrumento preservado");
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: Frontend format (como lo produce getFormDataJSON)
// ═══════════════════════════════════════════════════════════════
function testFrontendFormat() {
    console.log('\n[2/6] Formato frontend con procesos como array...');

    const frontendData = {
        metadata: { titulo: "Sesión de primaria", nivel: "PRIMARIA", grado: "3°", area: "Comunicación" },
        proposito: { competencia: "Escribe...", criterios: ["C1", "C2"] },
        competencias_transversales: [
            { titulo: "Gestiona su aprendizaje", desempenos: ["D1"] }
        ],
        enfoques_transversales: [
            { nombre: "Enfoque de Derechos", valor: "Diálogo", actitudes: "Los estudiantes dialogan" }
        ],
        recursos: { enlaces: "Libro pág 32", materiales: "Hojas", refuerzo: "" },
        momentos: {
            inicio: { tiempo_total: "15", actividades: ["Saludo", "Motivación con cuento"] },
            desarrollo: {
                tiempo_total: "60",
                procesos: [
                    { clave: "planificacion", titulo: "Planificación", contenido: ["Deciden a quién escribir"] },
                    { clave: "textualizacion", titulo: "Textualización", contenido: ["Escriben borrador"] }
                ]
            },
            cierre: {
                tiempo_total: "15",
                metacognicion: ["¿Qué aprendimos?"],
                evaluacion: ["Autoevaluación"],
                extension: ["Escribir carta a un amigo"]
            }
        },
        ficha_trabajo: {
            titulo: "Mi carta familiar",
            indicaciones: "Escribe una carta",
            actividades: "<table>...</table>"
        },
        alumnos: ["ALUMNO 1", "ALUMNO 2"]
    };

    const { document: doc } = SessionAdapter.adaptLegacyToV1(frontendData);
    const validation = SessionValidator.validate(doc);
    assert(validation.valid, `Frontend format → v1 válido (errors: ${validation.errors.join('; ')})`);

    // Desarrollo: procesos array con clave/contenido string[] → v1
    assert(doc.momentos.desarrollo.procesos.length === 2, "2 procesos desarrollo");
    assert(doc.momentos.desarrollo.procesos[0].id === "planificacion", "desarrollo[0].id = planificacion");
    assert(doc.momentos.desarrollo.procesos[0].contenido.format === "html", "contenido convertido a html");

    // Cierre structured
    assert(doc.momentos.cierre.procesos.length === 3, "cierre: metacognicion + evaluacion + extension = 3");
    assert(doc.momentos.cierre.procesos[0].id === "metacognicion", "cierre[0] = metacognicion");

    // Ficha
    assert(doc.fichaTrabajo !== null, "fichaTrabajo preservada");
    assert(doc.fichaTrabajo.titulo === "Mi carta familiar", "fichaTrabajo.titulo OK");

    // Lista cotejo
    assert(doc.listaCotejo.alumnos.length === 2, "alumnos → listaCotejo.alumnos");
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: Passthrough para documentos ya v1
// ═══════════════════════════════════════════════════════════════
function testV1Passthrough() {
    console.log('\n[3/6] Passthrough para documentos ya v1...');

    const v1Doc = {
        schemaVersion: '1.0',
        metadata: { titulo: 'Ya es v1', nivel: 'SECUNDARIA' },
        proposito: { competencia: 'Test' },
        momentos: {
            inicio: { tiempoMinutos: 10, procesos: [{ id: 'motivacion', titulo: 'Motivación', contenido: { format: 'html', value: '<p>Test</p>' } }] },
            desarrollo: { tiempoMinutos: 60, procesos: [] },
            cierre: { tiempoMinutos: 10, procesos: [] }
        }
    };

    const { document: doc, warnings } = SessionAdapter.adaptLegacyToV1(v1Doc);
    assert(doc === v1Doc, "v1 devuelto sin modificar (referencia idéntica)");
    assert(warnings.length === 0, "Sin warnings para v1");
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: Campos desconocidos generan warnings
// ═══════════════════════════════════════════════════════════════
function testUnknownFieldsWarned() {
    console.log('\n[4/6] Campos desconocidos generan warnings...');

    const weird = {
        titulo_sesion_retador: "Test",
        proposito: { competencia: "Test" },
        momentos: { inicio: {}, desarrollo: {}, cierre: {} },
        campo_raro: "valor raro",
        otro_campo: 123
    };

    const { warnings } = SessionAdapter.adaptLegacyToV1(weird);
    const unknownWarns = warnings.filter(w => w.includes('no reconocido'));
    assert(unknownWarns.length >= 2, `${unknownWarns.length} campos desconocidos detectados`);
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: Inicial con juego_libre_sectores
// ═══════════════════════════════════════════════════════════════
function testInicialWithJLS() {
    console.log('\n[5/6] Formato Inicial con juego_libre_sectores...');

    const inicialData = {
        titulo_sesion_retador: "Creamos cuentos",
        proposito: { competencia: "Se comunica oralmente" },
        momentos: {
            inicio: { motivacion: "Canción de bienvenida", tiempo_total: "10" },
            desarrollo: { proceso_1_creacion: "Creamos un cuento juntos", tiempo_total: "25" },
            cierre: { actividades: "Metacognición: ¿Qué cuento creamos?", tiempo_total: "10" }
        },
        juego_libre_sectores: {
            planificacion: "Los niños eligen sector",
            organizacion: "Se organizan en grupos",
            ejecucion: "Juegan libremente",
            orden: "Guardan materiales",
            socializacion: "Comparten lo que hicieron",
            representacion: "Dibujan su experiencia"
        }
    };

    const { document: doc } = SessionAdapter.adaptLegacyToV1(inicialData);
    const validation = SessionValidator.validate(doc);
    assert(validation.valid, `Inicial v1 válido (errors: ${validation.errors.join('; ')})`);

    assert(doc.juegoLibreSectores !== null, "juegoLibreSectores preservado");
    assert(doc.juegoLibreSectores.planificacion === "Los niños eligen sector", "JLS.planificacion OK");
    assert(doc.juegoLibreSectores.representacion === "Dibujan su experiencia", "JLS.representacion OK");
}

// ═══════════════════════════════════════════════════════════════
// TEST 6: Respuesta etiquetada v1 pero con desarrollo legacy
// ═══════════════════════════════════════════════════════════════
function testMalformedV1IsRepaired() {
    console.log('\n[6/6] V1 parcial de IA se repara antes de validar...');

    const partialV1 = {
        schemaVersion: '1.0',
        metadata: { titulo: 'Sesión parcialmente v1', duracionMinutos: 90 },
        proposito: { competencia: 'Resuelve problemas', capacidades: [], criterios: [] },
        momentos: {
            inicio: { tiempoMinutos: 15, procesos: [] },
            desarrollo: {
                tiempoMinutos: 65,
                proceso_1_exploracion: '<p>Los estudiantes exploran el reto.</p>'
            },
            cierre: { tiempoMinutos: 10, procesos: [] }
        }
    };

    const { document: doc, warnings } = SessionAdapter.adaptLegacyToV1(partialV1);
    const validation = SessionValidator.validate(doc);
    assert(validation.valid, `V1 parcial reparado (errors: ${validation.errors.join('; ')})`);
    assert(Array.isArray(doc.momentos.desarrollo.procesos), 'desarrollo.procesos restaurado como array');
    assert(doc.momentos.desarrollo.procesos.length === 1, 'proceso legacy preservado');
    assert(warnings.some(w => w.includes('V1 REPAIR')), 'reparación registrada como warning');
}

// ── Ejecutar ──
console.log('='.repeat(60));
console.log('TEST SESSION ADAPTER — Legacy → v1');
console.log('='.repeat(60));

testLegacyAIFormat();
testFrontendFormat();
testV1Passthrough();
testUnknownFieldsWarned();
testInicialWithJLS();
testMalformedV1IsRepaired();

console.log('\n' + '='.repeat(60));
if (failed > 0) {
    console.log(`RESULTADO: ${passed} passed, ${failed} FAILED`);
    process.exit(1);
} else {
    console.log(`>>> TODOS LOS ${passed} TESTS DEL ADAPTER PASARON <<<`);
}
console.log('='.repeat(60));
