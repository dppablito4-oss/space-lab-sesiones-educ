type JsonRecord = Record<string, unknown>;

function asObject(value: unknown, label: string): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} no es válido.`);
  return value as JsonRecord;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function sequenceSummary(value: unknown): JsonRecord {
  const item = asObject(value, "SequenceItem");
  return {
    id: item.id, index: item.index, type: item.type, title: item.title,
    milestoneId: item.milestoneId, status: item.status,
  };
}

/** Rebuilds client planning context from the authenticated user's current reviewed record. */
export function createTrustedLinkedSnapshot(containerValue: unknown, requestedValue: unknown): JsonRecord {
  const container = asObject(containerValue, "PlanningContainer");
  const requested = asObject(requestedValue, "inheritedContextSnapshot");
  if (container.schemaVersion !== "2.0" || container.status !== "reviewed") {
    throw new Error("Solo una planificación revisada puede generar sesiones vinculadas.");
  }
  if (requested.planningContainerId !== container.id || requested.planningRevision !== container.revision) {
    throw new Error("La revisión solicitada no coincide con la planificación revisada actual.");
  }
  const capturedAt = typeof requested.capturedAt === "string" ? requested.capturedAt : "";
  if (!capturedAt || Number.isNaN(Date.parse(capturedAt))) throw new Error("La fecha del snapshot no es válida.");
  const sequence = asArray(container.sequence).map(value => asObject(value, "SequenceItem"));
  const item = sequence.find(value => value.id === requested.sequenceItemId);
  if (!item || item.index !== requested.sequenceIndex) throw new Error("La sesión solicitada no coincide con la secuencia revisada.");
  if (item.type !== "session" || item.status !== "planned" || item.linkedDocumentRef !== null) {
    throw new Error("Esta actividad no puede generar una sesión vinculada.");
  }
  const milestones = asArray(container.milestones).map(value => asObject(value, "Milestone"));
  const milestone = item.milestoneId ? milestones.find(value => value.id === item.milestoneId) || null : null;
  const curriculumRefs = new Set(asArray(item.curriculumMapRefs));
  const curriculumMap = asArray(container.curriculumMap)
    .map(value => asObject(value, "CurriculumMap"))
    .filter(value => curriculumRefs.has(value.id));
  return clone({
    schemaVersion: "2.0", planningContainerId: container.id, planningRevision: container.revision,
    sequenceItemId: item.id, sequenceIndex: item.index, capturedAt,
    identity: container.identity, administrativeContext: container.administrativeContext,
    learnerContext: container.learnerContext, significantSituation: container.significantSituation,
    drivingQuestion: container.drivingQuestion, purpose: container.purpose,
    methodologyConfig: container.methodologyConfig, curriculumMap,
    transversalElements: container.transversalElements, finalProduct: container.finalProduct,
    milestone, sequenceItem: item, assessmentPlan: container.assessmentPlan,
    precedingSequence: sequence.filter(value => Number(value.index) < Number(item.index)).map(sequenceSummary),
    followingSequence: sequence.filter(value => Number(value.index) > Number(item.index)).map(sequenceSummary),
  });
}

export function requestedLinkedSnapshot(payloadValue: unknown): JsonRecord | null {
  if (!payloadValue || typeof payloadValue !== "object" || Array.isArray(payloadValue)) return null;
  const payload = payloadValue as JsonRecord;
  if (payload.action !== "generate_session") return null;
  const input = payload.input as JsonRecord | undefined;
  const metadata = input?.metadata as JsonRecord | undefined;
  const snapshot = metadata?.inheritedContextSnapshot;
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? snapshot as JsonRecord : null;
}

export function replaceLinkedSnapshot(payloadValue: unknown, snapshot: JsonRecord): JsonRecord {
  const payload = asObject(payloadValue, "Solicitud");
  const input = asObject(payload.input, "input");
  const metadata = asObject(input.metadata, "input.metadata");
  return clone({ ...payload, input: { ...input, metadata: { ...metadata, inheritedContextSnapshot: snapshot } } });
}
