/**
 * Test de Auditoría: Flujo de Generación de Sesiones Vinculadas para Secundaria (CNEB / JEC)
 */
const assert = require('node:assert/strict');
const PlanningContainerV2 = require('../js/planning/planning-container-v2.js');
const PlanningRepository = require('../js/planning/planning-repository.js');
const PlanningLinkedSession = require('../js/planning/linked-session.js');

const values = new Map();
global.localStorage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
};

const capturedAt = new Date().toISOString();

// 1. Crear unidad revisada con datos de Secundaria JEC
const unit = PlanningContainerV2.createDraft({
    id: 'unit-sec-audit',
    identity: {
        title: 'Unidad de Emprendimiento Sostenible 3.° Secundaria',
        level: 'secondary',
        cycle: 'VII',
        grade: '3',
        duration: { value: 4, unit: 'weeks' }
    }
}, capturedAt);

unit.administrativeContext = {
    institution: 'I.E. Agropecuario JEC N.° 05',
    dre: 'DRE Ucayali',
    ugel: 'UGEL Padre Abad',
    teacher: 'Prof. Carlos Mendoza',
    director: 'Mg. Roberto Silva',
    coordinator: 'Mg. Gladys Flores (Coordinadora Pedagógica)',
    academicYear: '2026',
    period: 'Bimestre I',
    sections: ['A', 'B', 'C']
};

unit.significantSituation = {
    context: 'En la provincia de Padre Abad existe alta producción de cacao y plátano.',
    problemOrOpportunity: 'Los agricultores locales comercializan materia prima sin valor agregado.',
    affectedActors: ['Estudiantes', 'Familias'],
    relevance: 'Desarrollo económico local',
    studentRole: 'Emprendedores',
    expectedResponse: 'Crear propuestas de valor sostenibles'
};

unit.drivingQuestion = '¿Cómo transformamos los recursos agrícolas locales en productos con valor agregado?';
unit.purpose = { summary: 'Gestionar proyectos de emprendimiento económico y social sostenibles.' };
unit.methodologyConfig = {
    primary: {
        profileId: 'project-based-learning',
        profileVersion: '1.0.0',
        code: 'project_based_learning'
    },
    supportingStrategies: [],
    custom: null,
    challenge: null
};
const critId = 'crit-gestion-1';
unit.finalProduct = {
    id: 'prod-01',
    title: 'Plan de negocio y prototipo de producto agroindustrial con valor agregado',
    description: 'Informe técnico financiero y prototipo validado.',
    expectedComponents: ['Estudio de mercado', 'Prototipo', 'Estructura de costos'],
    criterionRefs: [critId]
};

unit.curriculumMap = [{
    id: 'map-ept-1',
    area: { id: 'work-education', officialName: 'Educación para el Trabajo' },
    competency: { id: 'manages-projects', officialName: 'Gestiona proyectos de emprendimiento económico o social' },
    capacities: [
        { id: 'cap-1', officialName: 'Crea propuestas de valor' },
        { id: 'cap-2', officialName: 'Aplica habilidades técnicas' }
    ],
    standard: { description: 'Gestiona proyectos de emprendimiento económico o social...', sourceRef: 'CNEB 2016' },
    performances: [{ id: 'perf-1', description: 'Formula propuestas de valor basadas en necesidades locales.' }],
    criteria: [{ id: critId, description: 'Diseña y valida la propuesta de valor con usuarios locales.' }],
    expectedEvidence: [{ id: 'evid-1', description: 'Lienzo Lean Canvas validado' }],
    curricularSourceRefs: ['minedu-cneb-ept']
}];

unit.sequence = [
    {
        id: 'sess-01',
        index: 1,
        type: 'session',
        title: 'Identificamos oportunidades de negocio con los recursos de Padre Abad',
        week: 1,
        duration: { value: 90, unit: 'minutes' },
        milestoneId: null,
        curriculumMapRefs: ['map-ept-1'],
        competencyRefs: ['manages-projects'],
        capacityRefs: ['cap-1'],
        criterionRefs: [critId],
        knowledge: ['Análisis de mercado local y mapa de empatía'],
        evidence: [{ description: 'Mapa de empatía y definición del problema' }],
        assessmentInstruments: [{ label: 'Rúbrica analítica' }],
        linkedDocumentRef: null,
        status: 'planned'
    }
];

unit.status = 'reviewed';
unit.revision = 1;

// Guardar en el repositorio
const repository = PlanningRepository.create({ validator: PlanningContainerV2, storage: global.localStorage });
repository.save(unit);

// 2. Ejecutar la preparación de la sesión vinculada
const prepared = PlanningLinkedSession.prepare(unit.id, 'sess-01', capturedAt);

console.log('Auditoría de metadatos heredados de la Unidad a la Sesión:');
console.log('  - I.E.:', prepared.metadata.institucion);
console.log('  - Coordinador(a):', prepared.metadata.coordinador);
console.log('  - Director(a):', prepared.metadata.director);
console.log('  - Nivel / Grado:', prepared.metadata.nivel, prepared.metadata.grado);
console.log('  - Competencia:', prepared.metadata.competencia);
console.log('  - Conocimientos:', prepared.metadata.conocimientos);
console.log('  - Criterio:', prepared.metadata.criterio);
console.log('  - Evidencia:', prepared.metadata.producto_evidencia);
console.log('  - Instrumento:', prepared.metadata.instrumento);

// Aserciones de validación
assert.equal(prepared.metadata.institucion, 'I.E. Agropecuario JEC N.° 05');
assert.equal(prepared.metadata.coordinador, 'Mg. Gladys Flores (Coordinadora Pedagógica)');
assert.equal(prepared.metadata.director, 'Mg. Roberto Silva');
assert.equal(prepared.metadata.docente, 'Prof. Carlos Mendoza');
assert.equal(prepared.metadata.grado, '3°');
assert.equal(prepared.metadata.nivel, 'SECUNDARIA');
assert.equal(prepared.metadata.conocimientos, 'Análisis de mercado local y mapa de empatía');
assert.equal(prepared.metadata.producto_evidencia, 'Mapa de empatía y definición del problema');
assert.equal(prepared.metadata.instrumento, 'Rúbrica analítica');
assert.deepEqual(prepared.metadata.criterios, ['Diseña y valida la propuesta de valor con usuarios locales.']);
assert.equal(prepared.metadata.criterio, 'Diseña y valida la propuesta de valor con usuarios locales.');

// 3. Simular la generación de la sesión individual y el guardado
const sessionData = {
    id: 'sesion-individual-01',
    schemaVersion: '1.0',
    revision: 1,
    status: 'draft',
    metadata: { ...prepared.metadata },
    proposito: {
        competencia: prepared.metadata.competencia,
        capacidades: [prepared.metadata.capacidad],
        desempeno: prepared.metadata.desempeno,
        criterios: prepared.metadata.criterios,
        producto_evidencia: prepared.metadata.producto_evidencia,
        instrumento: prepared.metadata.instrumento
    }
};

const attached = PlanningLinkedSession.attachGeneratedSession(sessionData, prepared.link);
assert.equal(attached.planning.mode, 'linked');
assert.equal(attached.planning.sequenceItemId, 'sess-01');

// 4. Actualizar el estado en la unidad (marcar como 'generated')
const updatedUnit = PlanningLinkedSession.recordGeneratedSession(prepared.link, attached, new Date().toISOString());
assert.equal(updatedUnit.sequence[0].status, 'generated');
assert.equal(updatedUnit.sequence[0].linkedDocumentRef.id, 'sesion-individual-01');

console.log('\n============================================================');
console.log('>>> TEST DE FLUJO DE SESIÓN VINCULADA DE SECUNDARIA: ÉXITO TOTAL <<<');
console.log('============================================================');
