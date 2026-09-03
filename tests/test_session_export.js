const assert = require('node:assert/strict');
const SessionExport = require('../js/ai/session-export.js');

const source = {
    id: 'ui-only',
    htmlContent: '<div>vista</div>',
    schemaVersion: '1.0',
    metadata: { institucion: 'Original', titulo: 'Álgebra' },
    proposito: { texto: 'Resolver', criterios: ['Argumenta'] },
    momentos: {
        inicio: { tiempoMinutos: 10, procesos: [] },
        desarrollo: {
            tiempoMinutos: 60,
            procesos: [{
                id: 'formalizacion', orden: 2, titulo: 'Formalización',
                methodology: 'polya',
                contenido: { format: 'html', value: '<p><strong>x + 1</strong></p><ul><li>Explica</li></ul>' }
            }]
        },
        cierre: { tiempoMinutos: 20, procesos: [] }
    },
    listaCotejo: { alumnos: ['Ana'], criterios: ['Argumenta'] },
    presentation: { preset: 'minedu' }
};

const payload = SessionExport.buildCanonicalPayload(source, {
    metadata: { institucion: 'Editada' }, alumnos: ['Luis'], token: 'abc'
});

assert.equal(payload.metadata.institucion, 'Editada');
assert.equal(payload.momentos.desarrollo.procesos[0].titulo, 'Formalización');
assert.equal(payload.momentos.desarrollo.procesos[0].methodology, 'polya');
assert.equal(payload.momentos.desarrollo.procesos[0].contenido.value,
    '<p><strong>x + 1</strong></p><ul><li>Explica</li></ul>');
assert.deepEqual(payload.listaCotejo.alumnos, ['Luis']);
assert.equal(payload.token, 'abc');
assert.equal(payload.id, undefined);
assert.equal(payload.htmlContent, undefined);
assert.equal(source.metadata.institucion, 'Original', 'No debe mutar AppState');

console.log('✓ SessionExport conserva el contrato canónico sin aplanar contenido');
