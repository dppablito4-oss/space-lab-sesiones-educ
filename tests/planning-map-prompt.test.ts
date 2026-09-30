import { buildPromptRequest, PROMPT_VERSION } from "../supabase/functions/_shared/prompt-builder.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertThrows(fn: () => unknown, expected: RegExp) {
  try { fn(); } catch (error) {
    assert(error instanceof Error && expected.test(error.message), `Unexpected error: ${String(error)}`);
    return;
  }
  throw new Error('Expected function to throw');
}

const REQUEST_ID = '896a0f93-1234-4abc-8def-1234567890ab';
const profile = (id: string, extra: Record<string, unknown> = {}) => ({ id, profileVersion: '2026.1', ...extra });
const validInput = {
  planningType: 'unit', level: 'secondary', cycle: 'VI', grade: '2',
  areas: ['Matemática'], duration: { value: 3, unit: 'weeks' },
  teacherContext: { institution: 'IE piloto', teacher: 'Docente' },
  learnerContext: { students: 'Segundo grado', interests: ['economía familiar'] },
  significantSituationInput: { context: 'Comparamos promociones locales.' },
  methodology: { code: 'project_based_learning' },
  curriculumReferences: [{
    id: 'map-quantity',
    area: { id: 'mathematics', officialName: 'Matemática' },
    competency: { id: 'solves-quantity-problems', officialName: 'Resuelve problemas de cantidad' },
    capacities: [{ id: 'translates-quantities', officialName: 'Traduce cantidades' }],
    standard: { description: 'Estándar oficial', sourceRef: 'minedu-source' },
    performances: [{ id: 'performance-1', description: 'Desempeño oficial' }],
    criteria: [], expectedEvidence: [], curricularSourceRefs: ['minedu-source'],
  }],
  area: { id: 'mathematics', officialName: 'Matemática' },
  competency: { id: 'solves-quantity-problems', officialName: 'Resuelve problemas de cantidad' },
  capacities: [{ id: 'translates-quantities', officialName: 'Traduce cantidades' }],
  standard: { description: 'Estándar oficial', sourceRef: 'minedu-source' },
  performances: [{ id: 'performance-1', description: 'Desempeño oficial' }],
  curricularSourceRefs: ['minedu-source'],
  profiles: {
    pedagogical: profile('secondary-cycle-vi'),
    curriculum: profile('secondary-cycle-vi-mathematics-quantity-curriculum'),
    didactic: profile('secondary-cycle-vi-mathematics-quantity'),
    methodology: profile('project-based-learning', { code: 'project_based_learning' }),
  },
};

Deno.test('planning.map.generate uses a versioned protected JSON prompt', () => {
  const result = buildPromptRequest({ action: 'planning.map.generate', requestId: REQUEST_ID, input: validInput });
  assert(result.action === 'planning.map.generate', 'wrong action');
  assert(result.requestId === REQUEST_ID && result.promptVersion === PROMPT_VERSION, 'request metadata missing');
  assert(result.expectsJson && result.maxOutputTokens === 16_000, 'map output contract missing');
  assert(result.systemPrompt.includes('PlanningContainer 2.0'), 'container contract missing');
  assert(result.systemPrompt.includes('No inventes'), 'official-reference protection missing');
  assert(result.userPrompt.includes('solves-quantity-problems'), 'resolved curriculum missing');
  assert(!result.systemPrompt.includes('IE piloto'), 'teacher data leaked into system rules');
});

Deno.test('planning.map.generate rejects unresolved profiles and curriculum', () => {
  assertThrows(() => buildPromptRequest({
    action: 'planning.map.generate', requestId: REQUEST_ID,
    input: { ...validInput, profiles: { ...validInput.profiles, didactic: {} } },
  }), /perfil 'didactic'/i);
  assertThrows(() => buildPromptRequest({
    action: 'planning.map.generate', requestId: REQUEST_ID,
    input: { ...validInput, curriculumReferences: [] },
  }), /referencia curricular/i);
});
