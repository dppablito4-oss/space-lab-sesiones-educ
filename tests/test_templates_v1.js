/**
 * Test Templates v1 — Verifica el renderizado de plantillas HTML desde SessionDocument v1 y formatos legacy.
 * Ejecutar: node tests/test_templates_v1.js
 */
const fs = require('fs');
const path = require('path');
const Templates = require('../js/templates.js');

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
// TEST 1: Render v1 Canonical Fixtures
// ═══════════════════════════════════════════════════════════════
function testV1Fixtures() {
    console.log('\n[1/3] Renderizado de fixtures canónicos v1...');

    const fixturesDir = path.join(__dirname, 'fixtures');

    // 1.1 Secundaria Matemática (Polya)
    const secPath = path.join(fixturesDir, 'secundaria-matematica-polya.v1.json');
    const secData = JSON.parse(fs.readFileSync(secPath, 'utf-8'));
    const htmlSec = Templates.render('estandar', secData, false);

    assert(typeof htmlSec === 'string' && htmlSec.length > 500, "Secundaria HTML generado");
    assert(htmlSec.includes("SISTEMAS DE ECUACIONES"), "Título presente en HTML");
    assert(htmlSec.includes("INICIO:"), "Momento INICIO presente");
    assert(htmlSec.includes("DESARROLLO:"), "Momento DESARROLLO presente");
    assert(htmlSec.includes("CIERRE:"), "Momento CIERRE presente");
    assert(!htmlSec.includes("undefined min"), "Sin tiempos 'undefined min'");
    assert(htmlSec.includes('session-info-grid'), "Datos informativos usan la cuadrícula del Word");
    assert(htmlSec.includes('>DRE<') && htmlSec.includes('>UGEL<'), "DRE y UGEL visibles en la vista previa");
    assert(htmlSec.includes('assets/minedu-header.jpg'), "Encabezado MINEDU compartido con el Word");
    assert(htmlSec.includes('LISTA DE COTEJO DE EVALUACIÓN FORMATIVA'), "Lista de cotejo con título oficial");
    assert(htmlSec.includes('checklist-grid'), "Lista de cotejo usa la cuadrícula oficial");

    // 1.2 Inicial
    const iniPath = path.join(fixturesDir, 'inicial.v1.json');
    const iniData = JSON.parse(fs.readFileSync(iniPath, 'utf-8'));
    const htmlIni = Templates.render('inicial', iniData, false);

    assert(typeof htmlIni === 'string' && htmlIni.length > 500, "Inicial HTML generado");
    assert(htmlIni.includes("CREAMOS CUENTOS"), "Título Inicial presente");
    assert(htmlIni.includes("JUEGO LIBRE EN LOS SECTORES"), "Juego Libre en los Sectores presente");
    assert(htmlIni.includes("PLANIFICACIÓN"), "JLS Planificación presente");

    // 1.3 Primaria con Ficha
    const primPath = path.join(fixturesDir, 'primaria-con-ficha.v1.json');
    const primData = JSON.parse(fs.readFileSync(primPath, 'utf-8'));
    const htmlPrim = Templates.render('estandar', primData, false);

    assert(typeof htmlPrim === 'string' && htmlPrim.length > 500, "Primaria HTML generado");
    assert(htmlPrim.includes("ESCRIBIMOS UNA CARTA"), "Título Primaria presente");
    assert(htmlPrim.includes("FICHA DE TRABAJO INDEPENDIENTE"), "Ficha de Trabajo presente");
    assert(htmlPrim.includes("Mi carta familiar"), "Título de Ficha presente");
    assert(htmlPrim.includes("LISTA DE COTEJO"), "Lista de Cotejo presente");
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: Render Legacy Data (Backward Compatibility)
// ═══════════════════════════════════════════════════════════════
function testLegacyCompatibility() {
    console.log('\n[2/3] Compatibilidad con formatos legacy...');

    const legacyData = {
        metadata: {
            institucion: "I.E. 2084",
            docente: "Prof. María López",
            grado: "4°",
            seccion: "B",
            area: "Ciencia y Tecnología",
            titulo: "El sistema digestivo",
            duracion: "90 min"
        },
        proposito: {
            competencia: "Explica el mundo físico...",
            proposito_texto: "Comprender la función del sistema digestivo.",
            criterios_evaluacion: ["Describe los órganos", "Explica la digestión"],
            producto_evidencia: "Maqueta o esquema rotulado"
        },
        enfoques: [
            { nombre: "Enfoque Ambiental", valor: "Solidaridad", actitudes: "Cuidado de la salud" }
        ],
        competencias_transversales: {
            tic: ["Utiliza simuladores digitales"],
            autonoma: ["Organiza su tiempo"]
        },
        recursos: {
            paginas_consulta: "Libro MED pág 45",
            materiales: "Láminas interactivas",
            actividades_refuerzo: "Ficha N° 2"
        },
        momentos: {
            inicio: {
                motivacion: "Video sobre el viaje de una manzana.",
                tiempo_total: "15 min"
            },
            desarrollo: {
                proceso_1_planteamiento_problema: "Pregunta investigable sobre la digestión.",
                proceso_2_analisis_resultados: "Comparación de hipótesis.",
                tiempo_total: "65 min"
            },
            cierre: {
                actividades: "Metacognición y autoevaluación grupal.",
                tiempo_total: "10 min"
            }
        }
    };

    // Estandar
    const htmlEst = Templates.render('estandar', legacyData, true);
    assert(htmlEst.includes("El sistema digestivo"), "Legacy en estándar OK");
    assert(htmlEst.includes("Prof. María López"), "Docente legacy OK");

    // Laboratorio
    const htmlLab = Templates.render('laboratorio', legacyData, true);
    assert(htmlLab.includes("SESIÓN DE LABORATORIO") || htmlLab.includes("El sistema digestivo"), "Legacy en laboratorio OK");

    // Refuerzo
    const htmlRef = Templates.render('refuerzo', legacyData, true);
    assert(htmlRef.includes("El sistema digestivo") || htmlRef.includes("REFUERZO"), "Legacy en refuerzo OK");
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: Edge Cases (empty / partial data)
// ═══════════════════════════════════════════════════════════════
function testEdgeCases() {
    console.log('\n[3/3] Edge cases (datos vacíos o parciales)...');

    const htmlEmpty = Templates.render('estandar', {}, false);
    assert(typeof htmlEmpty === 'string' && htmlEmpty.length > 100, "Render con objeto vacío no crashea");

    const htmlNull = Templates.render('estandar', null, false);
    assert(typeof htmlNull === 'string' && htmlNull.length > 100, "Render con null no crashea");
}

// ── Ejecutar ──
console.log('='.repeat(60));
console.log('TEST TEMPLATES JS — Renderizado v1 y Legacy');
console.log('='.repeat(60));

testV1Fixtures();
testLegacyCompatibility();
testEdgeCases();

console.log('\n' + '='.repeat(60));
if (failed > 0) {
    console.log(`RESULTADO: ${passed} passed, ${failed} FAILED`);
    process.exit(1);
} else {
    console.log(`>>> TODOS LOS ${passed} TESTS DE TEMPLATES PASARON EXITOSAMENTE <<<`);
}
console.log('='.repeat(60));
