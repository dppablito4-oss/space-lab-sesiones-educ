/**
 * Test de contrato JS — Valida fixtures v1 con SessionValidator.
 * Ejecutar: node tests/test_contract_v1.js
 */
const fs = require('fs');
const path = require('path');
const SessionValidator = require('../js/ai/session-validator.js');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadFixtures() {
    const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.v1.json'));
    if (files.length === 0) throw new Error(`No se encontraron fixtures en ${FIXTURES_DIR}`);
    return files.map(f => ({
        name: f,
        data: JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), 'utf-8'))
    }));
}

function testValidatorAcceptsAllFixtures() {
    console.log('\n[1/4] Validación JS de fixtures...');
    const fixtures = loadFixtures();

    for (const { name, data } of fixtures) {
        const result = SessionValidator.validate(data);
        if (!result.valid) {
            console.error(`  ✗ FAIL: ${name}`);
            result.errors.forEach(e => console.error(`    ERROR: ${e}`));
            process.exit(1);
        }
        if (result.warnings.length > 0) {
            result.warnings.forEach(w => console.log(`    WARN: ${w}`));
        }
        console.log(`  ✓ Validator OK: ${name}`);
    }
}

function testSchemaVersionRequired() {
    console.log('\n[2/4] schemaVersion requerido...');
    const result = SessionValidator.validate({});
    if (result.valid) {
        console.error('  ✗ FAIL: Documento vacío no debería ser válido');
        process.exit(1);
    }
    const hasVersionError = result.errors.some(e => e.includes('schemaVersion'));
    if (!hasVersionError) {
        console.error('  ✗ FAIL: Debería reportar error de schemaVersion');
        process.exit(1);
    }
    console.log('  ✓ schemaVersion requerido OK');
}

function testUnknownFieldsWarned() {
    console.log('\n[3/4] Campos desconocidos generan warning...');
    const fixture = loadFixtures()[0];
    const docWithExtra = { ...fixture.data, campoInventado: 'valor', otroCampo: 123 };
    const result = SessionValidator.validate(docWithExtra);

    const unknownWarnings = result.warnings.filter(w => w.includes('no reconocido'));
    if (unknownWarnings.length < 2) {
        console.error('  ✗ FAIL: Debería advertir sobre campos desconocidos');
        console.error('  Warnings:', result.warnings);
        process.exit(1);
    }
    console.log('  ✓ Campos desconocidos advertidos OK');
}

function testProcessValidation() {
    console.log('\n[4/4] Procesos requieren id, titulo, contenido...');
    const badDoc = {
        schemaVersion: '1.0',
        metadata: { titulo: 'Test' },
        proposito: { competencia: 'Test' },
        momentos: {
            inicio: {
                tiempoMinutos: 10,
                procesos: [
                    { titulo: 'Sin ID', contenido: { format: 'html', value: '<p>test</p>' } }
                ]
            },
            desarrollo: { tiempoMinutos: 60, procesos: [] },
            cierre: { tiempoMinutos: 10, procesos: [] }
        }
    };
    const result = SessionValidator.validate(badDoc);
    const hasIdError = result.errors.some(e => e.includes('.id'));
    if (!hasIdError) {
        console.error('  ✗ FAIL: Debería reportar error de proceso sin id');
        console.error('  Errors:', result.errors);
        process.exit(1);
    }
    console.log('  ✓ Validación de procesos OK');
}

// ── Ejecutar ──
console.log('='.repeat(60));
console.log('TEST DE CONTRATO JS — SessionDocument v1');
console.log('='.repeat(60));

testValidatorAcceptsAllFixtures();
testSchemaVersionRequired();
testUnknownFieldsWarned();
testProcessValidation();

console.log('\n' + '='.repeat(60));
console.log('>>> TODOS LOS TESTS JS DE CONTRATO PASARON <<<');
console.log('='.repeat(60));
