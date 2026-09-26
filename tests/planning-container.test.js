const assert = require('node:assert/strict');
const PlanningContainer = require('../js/planning/planning-container.js');

const NOW = '2026-09-26T18:00:00.000Z';
const input = {
    id: 'plan-matematica-vi-001',
    identity: {
        title: 'Decidimos con cantidades', planningType: 'unit', level: 'secondary',
        cycle: 'VI', grade: '1', age: null, duration: { value: 3, unit: 'weeks' }
    },
    context: {
        institution: 'IE piloto', teacher: 'Docente', classroom: '1 A', students: '30 estudiantes',
        diagnosis: 'El grupo necesita argumentar sus procedimientos.',
        interests: ['emprendimientos locales'], localContext: 'Mercado de la comunidad'
    },
    curriculumAreas: [{
        area: { id: 'matematica', officialName: 'Matemática' },
        competencies: [{
            id: 'resuelve-problemas-de-cantidad', officialName: 'Resuelve problemas de cantidad',
            capacityRefs: ['traduce-cantidades', 'comunica-comprension']
        }]
    }],
    significantSituation: {
        description: 'Las familias comparan precios y cantidades en el mercado local.',
        challenge: '¿Cómo sustentamos una decisión de compra conveniente?'
    },
    learningPurpose: {
        summary: 'Resolver y explicar situaciones de cantidad vinculadas con decisiones de compra.',
        transversalApproaches: ['Orientación al bien común']
    },
    assessment: {
        criteria: ['Explica la estrategia empleada.'], evidence: ['Resolución argumentada.'],
        products: ['Recomendación de compra.'], instruments: ['Rúbrica analítica.']
    },
    sequence: [
        {
            id: 'sesion-01', index: 1, kind: 'session', activityType: null,
            title: 'Comparamos cantidades', areaRef: 'matematica',
            competencyRefs: ['resuelve-problemas-de-cantidad'],
            purpose: 'Representar y comparar cantidades.', status: 'planned', generatedDocumentId: null
        },
        {
            id: 'sesion-02', index: 2, kind: 'session', activityType: null,
            title: 'Sustentamos decisiones', areaRef: 'matematica',
            competencyRefs: ['resuelve-problemas-de-cantidad'],
            purpose: 'Argumentar una decisión usando cantidades.', status: 'planned', generatedDocumentId: null
        }
    ]
};

const revision1 = PlanningContainer.createDraft(input, NOW);
assert.deepEqual(PlanningContainer.validate(revision1).errors, []);
assert.equal(revision1.revision, 1);
assert.equal(revision1.status, 'draft');

const linked = PlanningContainer.createLinkedSessionLink(revision1, 'sesion-02', '2026-09-26T18:05:00.000Z');
assert.equal(linked.mode, 'linked');
assert.equal(linked.planningRevision, 1);
assert.equal(linked.inheritedContextSnapshot.precedingSequence.length, 1);
assert.equal(Object.isFrozen(linked.inheritedContextSnapshot), true);

const revision2 = PlanningContainer.revise(revision1, {
    significantSituation: {
        description: 'La comunidad organizará una feria escolar.',
        challenge: '¿Cómo elaboramos un presupuesto responsable?'
    }
}, '2026-09-26T19:00:00.000Z');
assert.equal(revision2.revision, 2);
assert.equal(revision1.significantSituation.description, 'Las familias comparan precios y cantidades en el mercado local.');
assert.equal(linked.inheritedContextSnapshot.significantSituation.description, 'Las familias comparan precios y cantidades en el mercado local.');

const standalone = PlanningContainer.createStandaloneLink();
assert.deepEqual(standalone, {
    mode: 'standalone', planningContainerId: null, planningRevision: null,
    sequenceEntryId: null, sequenceIndex: null, inheritedContextSnapshot: null
});

const document = { schemaVersion: '1.0', metadata: { title: 'Sesión' } };
const envelope = PlanningContainer.attachSessionLink({ id: 'session-001', data: document }, linked);
assert.deepEqual(envelope.data, document, 'El contrato pedagógico no debe entrar en SessionDocumentV1.');
assert.equal(envelope.planning.planningContainerId, revision1.id);
assert.equal(PlanningContainer.validateSessionLink(linked).valid, true);
assert.throws(() => PlanningContainer.attachSessionLink(
    { id: 'session-002', data: document },
    { ...linked, planningRevision: 9 }
), /snapshot heredado/);

const invalidOrder = structuredClone(revision1);
invalidOrder.sequence[1].index = 1;
assert.equal(PlanningContainer.validate(invalidOrder).valid, false);

const archived = { ...structuredClone(revision1), status: 'archived' };
assert.throws(() => PlanningContainer.revise(archived, {}), /archivada/);
assert.throws(() => PlanningContainer.createLinkedSessionLink(revision1, 'sesion-inexistente'), /No existe/);

console.log('planning-container.test.js: OK');
