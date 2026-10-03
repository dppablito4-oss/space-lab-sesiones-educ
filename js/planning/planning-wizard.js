/** Planning pilot editor. Persistence and validation stay in Planning Core. */
const PlanningWizard = (() => {
    'use strict';
    const core = typeof module !== 'undefined' && module.exports
        ? require('./planning-container-v2.js') : window.PlanningContainerV2;
    const mapGenerator = typeof module !== 'undefined' && module.exports
        ? require('./planning-map-generator.js') : window.PlanningMapGenerator;
    const contextResolver = typeof module !== 'undefined' && module.exports
        ? require('../pedagogy/context-resolver.js') : window.PedagogicalContextResolver;
    const copy = value => JSON.parse(JSON.stringify(value));
    const uid = prefix => `${prefix}-${globalThis.crypto.randomUUID()}`;
    const types = { learning_experience: 'Experiencia de aprendizaje', unit: 'Unidad', project: 'Proyecto' };
    const steps = ['Datos y contexto', 'Situación y propósito', 'Currículo', 'Metodología', 'Producto y evaluación', 'Secuencia', 'Revisión'];
    const stepDescriptions = [
        'Define los datos generales y conoce el punto de partida de tu grupo.',
        'Conecta una situación significativa con un propósito claro.',
        'Selecciona los referentes curriculares y criterios de evaluación.',
        'Elige cómo se organizará la experiencia de aprendizaje.',
        'Aclara el producto, las evidencias y la estrategia de evaluación.',
        'Organiza las sesiones, hitos y productos parciales.',
        'Comprueba que todo esté listo antes de marcarla como revisada.'
    ];

    function requiredCompletion(draft) {
        const requirements = [
            [0, 'identity.title', Boolean(draft?.identity?.title?.trim())],
            [0, 'identity.cycle', Boolean(draft?.identity?.cycle?.trim())],
            [0, 'identity.duration', Number.isInteger(draft?.identity?.duration?.value) && draft.identity.duration.value > 0],
            [1, 'significantSituation.context', Boolean(draft?.significantSituation?.context?.trim())],
            [1, 'significantSituation.problemOrOpportunity', Boolean(draft?.significantSituation?.problemOrOpportunity?.trim())],
            [1, 'drivingQuestion', Boolean(draft?.drivingQuestion?.trim())],
            [1, 'purpose.summary', Boolean(draft?.purpose?.summary?.trim())],
            [2, 'curriculumMap', Boolean(draft?.curriculumMap?.length)],
            [2, 'curriculumMap.criteria', Boolean(draft?.curriculumMap?.some(entry => entry.criteria?.length))],
            [3, 'methodologyConfig.primary', Boolean(draft?.methodologyConfig?.primary)],
            [5, 'sequence', Boolean(draft?.sequence?.length)]
        ];
        const completed = requirements.filter(([, , ready]) => ready).length;
        const byStep = steps.map((_, index) => requirements.filter(([target]) => target === index));
        return {
            completed, total: requirements.length,
            percentage: Math.round((completed / requirements.length) * 100),
            byStep: byStep.map(fields => ({ total: fields.length, complete: fields.length > 0 && fields.every(([, , ready]) => ready) }))
        };
    }
    const AI_ERROR_MESSAGES = {
        GATEWAY_UNAVAILABLE: 'No se pudo conectar con el servicio de IA. Comprueba tu sesión y conexión.',
        INVALID_INPUT: 'Completa el contexto mínimo antes de generar la propuesta.',
        PROFILE_NOT_FOUND: 'No se encontró el perfil pedagógico necesario para esta planificación.',
        METHODOLOGY_NOT_FOUND: 'Selecciona una metodología disponible antes de generar.',
        CURRICULUM_NOT_FOUND: 'Agrega el contexto curricular piloto antes de generar.',
        INVALID_PROVIDER_JSON: 'La IA devolvió una respuesta incompleta. Intenta generar una propuesta nueva.',
        INVALID_CURRICULUM_REFERENCES: 'La propuesta alteró referencias curriculares protegidas y fue rechazada.',
        INVALID_PLANNING_MAP: 'La propuesta no cumple la estructura pedagógica requerida. Intenta nuevamente.',
        QUOTA_EXCEEDED: 'Alcanzaste la cuota disponible para generar planificaciones.',
        DAILY_LIMIT_REACHED: 'Alcanzaste el límite diario de generación.',
        ENTITLEMENT_DENIED: 'Tu plan actual no incluye la generación de mapas con IA.',
        RATE_LIMITED: 'Hay demasiadas solicitudes en este momento. Espera un momento e intenta nuevamente.',
        PROVIDER_ERROR: 'El proveedor de IA no pudo completar la propuesta. Intenta nuevamente.',
        PLANNING_MAP_GENERATION_FAILED: 'No se pudo generar la propuesta pedagógica. Intenta nuevamente.'
    };

    function methodologyProfileFor(draft, profiles) {
        return profiles?.methodologies?.find(profile => profile.code === draft?.methodologyConfig?.primary?.code) || null;
    }

    function generationReadiness(draft, profiles) {
        const missing = [];
        if (!types[draft?.identity?.planningType]) missing.push('tipo de planificación');
        if (!draft?.identity?.level) missing.push('nivel');
        if (!draft?.identity?.cycle) missing.push('ciclo');
        if (!draft?.identity?.grade) missing.push('grado');
        if (!Number.isInteger(draft?.identity?.duration?.value) || draft.identity.duration.value < 1) missing.push('duración');
        const curriculumReady = Array.isArray(draft?.curriculumMap) && draft.curriculumMap.length > 0
            && draft.curriculumMap.every(entry => entry?.area?.id && entry?.competency?.id && entry?.capacities?.length);
        if (!curriculumReady) missing.push('área y competencia');
        if (!methodologyProfileFor(draft, profiles)) missing.push('metodología');
        if (!profiles?.pedagogical || !profiles?.curriculum || !profiles?.didactic) missing.push('perfiles pedagógicos y curriculares');
        return { ready: missing.length === 0, missing };
    }

    function buildGenerationInput(draft, profiles) {
        const methodologyProfile = methodologyProfileFor(draft, profiles);
        const input = {
            planningType: draft.identity.planningType,
            level: draft.identity.level,
            cycle: draft.identity.cycle,
            grade: draft.identity.grade,
            areas: draft.curriculumMap.map(entry => entry.area.officialName),
            duration: copy(draft.identity.duration),
            teacherContext: copy(draft.administrativeContext),
            learnerContext: copy(draft.learnerContext),
            significantSituationInput: copy(draft.significantSituation),
            methodology: { code: draft.methodologyConfig.primary?.code || '' },
            curriculumReferences: copy(draft.curriculumMap),
            area: copy(draft.curriculumMap[0].area),
            competency: copy(draft.curriculumMap[0].competency),
            capacities: copy(draft.curriculumMap[0].capacities),
            standard: copy(draft.curriculumMap[0].standard),
            performances: copy(draft.curriculumMap[0].performances),
            curricularSourceRefs: copy(draft.curriculumMap[0].curricularSourceRefs),
            profiles: {
                pedagogical: copy(profiles.pedagogical),
                curriculum: {
                    id: profiles.curriculum.id,
                    profileVersion: profiles.curriculum.profileVersion,
                    status: profiles.curriculum.status
                },
                didactic: copy(profiles.didactic),
                methodology: methodologyProfile ? copy(methodologyProfile) : null
            }
        };
        mapGenerator.validateInput(input);
        return input;
    }

    function hasMeaningfulManualContent(draft) {
        const defaultTitle = `Nueva ${types[draft?.identity?.planningType]?.toLowerCase() || ''}`;
        const text = [draft?.identity?.title !== defaultTitle ? draft?.identity?.title : '',
            draft?.administrativeContext?.institution, draft?.administrativeContext?.teacher,
            draft?.learnerContext?.students, draft?.learnerContext?.diagnosis, draft?.learnerContext?.localContext,
            draft?.significantSituation?.context, draft?.significantSituation?.problemOrOpportunity,
            draft?.drivingQuestion, draft?.purpose?.summary, draft?.finalProduct?.title];
        return text.some(value => typeof value === 'string' && value.trim())
            || Boolean(draft?.sequence?.length || draft?.milestones?.length);
    }

    function acceptGeneratedProposal(currentDraft, proposal) {
        const accepted = copy(proposal);
        accepted.id = currentDraft.id;
        accepted.revision = currentDraft.revision;
        accepted.status = 'draft';
        if (currentDraft.audit?.createdAt && accepted.audit) accepted.audit.createdAt = currentDraft.audit.createdAt;
        return accepted;
    }

    function aiErrorCode(error) {
        const explicit = String(error?.code || '').toUpperCase();
        if (AI_ERROR_MESSAGES[explicit] && explicit !== 'PLANNING_MAP_GENERATION_FAILED') return explicit;
        const message = String(error?.message || '').toLowerCase();
        if (/entitlement|no incluye|no habilitad|plan superior/.test(message)) return 'ENTITLEMENT_DENIED';
        if (/quota|cuota|límite diario|limite diario/.test(message)) return 'QUOTA_EXCEEDED';
        if (/rate|429|demasiadas solicitudes/.test(message)) return 'RATE_LIMITED';
        if (/network|fetch|conexión|conexion|supabase/.test(message)) return 'GATEWAY_UNAVAILABLE';
        if (/proveedor/.test(message)) return 'PROVIDER_ERROR';
        return explicit || 'PROVIDER_ERROR';
    }

    function formatAiError(error) {
        return AI_ERROR_MESSAGES[aiErrorCode(error)] || AI_ERROR_MESSAGES.PROVIDER_ERROR;
    }

    async function generateProposal(draft, profiles, invoke, generator = mapGenerator) {
        const input = buildGenerationInput(draft, profiles);
        return generator.generate(input, { invoke, quality: 'automatic' });
    }
    function canCreate(type, entitlements) {
        const feature = type === 'unit' ? 'planning.unit' : 'planning.experience';
        return Boolean(types[type] && entitlements?.ok === true && entitlements.features?.[feature] === true);
    }

    function create(type, id = uid('plan'), grade = '2') {
        if (!types[type]) throw new Error('Selecciona un tipo de planificación.');
        const cycle = contextResolver.resolveSecondaryCycle(grade);
        return core.createDraft({ id, identity: { title: `Nueva ${types[type].toLowerCase()}`, planningType: type, cycle, grade: String(grade) } });
    }

    function curriculumEntry(draft, profile, curriculum = null, previous = null) {
        const grade = String(draft.identity.grade);
        return {
            id: previous?.id || uid('map'),
            area: copy(curriculum?.scope.area || profile.scope.area),
            competency: copy(curriculum?.competency || profile.scope.competency),
            capacities: copy(curriculum?.capacities || profile.scope.capacities),
            standard: copy(curriculum?.standard || { description: '', sourceRef: '' }),
            performances: copy(curriculum?.performancesByGrade?.[grade] || []),
            criteria: copy(previous?.criteria || []), expectedEvidence: copy(previous?.expectedEvidence || []),
            curricularSourceRefs: copy(curriculum?.provenance.sourceRefs || [])
        };
    }

    function addCurriculum(draft, profile, curriculum = null) {
        if (draft.curriculumMap.length) return;
        draft.curriculumMap.push(curriculumEntry(draft, profile, curriculum));
        const entry = draft.curriculumMap[0];
        draft.sequence.forEach(item => {
            item.curriculumMapRefs = [entry.id]; item.competencyRefs = [entry.competency.id];
            item.capacityRefs = entry.capacities.map(c => c.id);
        });
    }

    function resolvePlanningProfiles(identity, catalogs) {
        const methodology = identity.methodology || catalogs?.methodologyProfiles?.[0]?.code;
        const competency = identity.competency || 'solves-quantity-problems';
        const matchedCurriculum = (catalogs?.curriculumProfiles || []).find(p =>
            p.competency.id === competency || p.competency.alias === competency
        );
        const area = identity.area || identity.subject || matchedCurriculum?.scope.area.id || 'mathematics';
        const result = contextResolver.resolve({
            level: identity.level, cycle: identity.cycle, grade: identity.grade,
            area, competency,
            planningType: identity.planningType, methodology
        }, catalogs);
        if (!result.resolved) {
            const error = new Error(result.errors[0]?.message || 'No se pudo resolver el contexto pedagógico.');
            error.code = result.errors[0]?.code || 'profile_not_found';
            throw error;
        }
        const refs = result.context.profiles;
        return {
            pedagogical: catalogs.pedagogicalProfiles.find(profile => profile.id === refs.pedagogical.id),
            curriculum: catalogs.curriculumProfiles.find(profile => profile.id === refs.curriculum.id),
            didactic: catalogs.didacticProfiles.find(profile => profile.id === refs.didactic.id),
            methodologies: catalogs.methodologyProfiles,
            context: result.context
        };
    }

    function setCurriculumCompetency(draft, competencyId, catalogs) {
        draft.identity.cycle = contextResolver.resolveSecondaryCycle(draft.identity.grade);
        const resolved = resolvePlanningProfiles({
            ...draft.identity,
            competency: competencyId,
            methodology: draft.methodologyConfig.primary?.code
        }, catalogs);
        const previousEntry = draft.curriculumMap[0] ? { ...draft.curriculumMap[0] } : null;
        draft.curriculumMap = [curriculumEntry(draft, resolved.didactic, resolved.curriculum, previousEntry)];
        const entry = draft.curriculumMap[0];
        draft.sequence.forEach(item => {
            item.curriculumMapRefs = [entry.id];
            item.competencyRefs = [entry.competency.id];
            item.capacityRefs = entry.capacities.map(c => c.id);
        });
        return resolved;
    }

    function addSession(draft) {
        const entries = draft.curriculumMap;
        draft.sequence.push({ id: uid('session'), index: draft.sequence.length + 1, type: 'session',
            title: `Sesión ${draft.sequence.length + 1}`, week: 1, date: null,
            duration: { value: 90, unit: 'minutes' }, milestoneId: null,
            curriculumMapRefs: entries.map(e => e.id), competencyRefs: entries.map(e => e.competency.id),
            capacityRefs: entries.flatMap(e => e.capacities.map(c => c.id)),
            criterionRefs: entries.flatMap(e => e.criteria.map(c => c.id)),
            knowledge: [], activities: [], evidence: [], partialProduct: null,
            assessmentInstruments: [], linkedDocumentRef: null, status: 'planned' });
    }

    function reorder(draft, index, direction) {
        const target = index + direction;
        if (target < 0 || target >= draft.sequence.length) return;
        [draft.sequence[index], draft.sequence[target]] = [draft.sequence[target], draft.sequence[index]];
        draft.sequence.forEach((item, i) => { item.index = i + 1; });
    }

    function removeSession(draft, index) {
        const [removed] = draft.sequence.splice(index, 1);
        draft.milestones.forEach(m => { m.sequenceItemIds = m.sequenceItemIds.filter(id => id !== removed.id); });
        draft.sequence.forEach((item, i) => { item.index = i + 1; });
    }

    function assertSaveable(changes) {
        if (!changes.identity.title.trim()) throw new Error('Escribe un título para guardar la planificación. Puedes cambiarlo después.');
        for (const item of changes.sequence) {
            if (!item.title.trim()) throw new Error('Cada sesión necesita un título. Revísalo en Secuencia.');
            if (item.week !== null && (!Number.isInteger(item.week) || item.week < 1)) throw new Error('La semana debe ser un entero mayor que cero. Revísala en Secuencia.');
            if (!Number.isInteger(item.duration.value) || item.duration.value < 0) throw new Error('La duración de cada sesión debe ser un entero no negativo.');
        }
        if (changes.milestones.some(m => !m.title.trim())) throw new Error('Cada hito necesita un título.');
        if (changes.finalProduct && !changes.finalProduct.title.trim()) throw new Error('El producto final necesita un título.');
        if (changes.sequence.some(s => s.partialProduct && !s.partialProduct.title.trim())) throw new Error('Cada producto parcial necesita un título.');
    }

    function prepareSave(draft, previous) {
        const changes = copy(draft);
        assertSaveable(changes);
        if (previous && JSON.stringify(changes) === JSON.stringify(previous)) return copy(previous);
        changes.status = 'draft';
        if (previous) return core.revise(previous, changes);
        return core.createDraft(changes);
    }

    function prepareReview(draft, previous, validationOptions = {}) {
        const changes = { ...copy(draft), status: 'reviewed' };
        assertSaveable(changes);
        const reviewBase = previous || core.createDraft({ ...changes, status: 'draft' });
        const reviewed = core.revise(reviewBase, changes, undefined, {
            ...validationOptions,
            forReview: true
        });
        return reviewed;
    }

    function mount() {
        const dialog = document.getElementById('planning-dialog');
        if (!dialog) return;
        const repository = window.PlanningRepository.create({ validator: core });
        let draft = null, previous = null, step = 0, dirty = false, busy = false;
        let creationMode = 'manual', aiProposal = null, generating = false;
        let returnToView = false;
        let profiles = null, catalogs = null;
        let previewMode = 'summary', previewOpen = false, previewTimer = null, showValidation = false;
        const requiredPaths = new Set(['identity.title', 'identity.duration.value', 'significantSituation.context',
            'significantSituation.problemOrOpportunity', 'drivingQuestion', 'purpose.summary']);
        const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
        const read = path => path.split('.').reduce((obj, key) => obj?.[key], draft);
        const write = (path, value) => {
            const keys = path.split('.');
            const last = keys.pop();
            keys.reduce((obj, key) => obj[key], draft)[last] = value;
        };
        const button = (action, label, extra = '') => `<button type="button" class="btn btn-ghost" data-planning-action="${action}" ${extra}>${label}</button>`;
        function field(path, label, kind = 'text', choices = null) {
            const value = read(path);
            const id = `planning-${path.replaceAll('.', '-')}`;
            const required = requiredPaths.has(path);
            const validationPath = path === 'identity.duration.value' ? 'identity.duration'
                : /^curriculumMap\.\d+\.criteria$/.test(path) ? 'curriculumMap.criteria' : path;
            const error = showValidation && profiles ? core.validate(draft, { forReview: true,
                pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(profile => profile.code === draft.methodologyConfig.primary?.code)
            }).errors.find(item => item.path === validationPath) : null;
            const attrs = `id="${id}" data-path="${path}" data-kind="${kind}" ${required ? 'aria-required="true"' : ''} ${error ? `aria-invalid="true" aria-describedby="${id}-error"` : ''}`;
            let control;
            if (choices) control = `<select ${attrs}>${choices.map(([v, text]) => `<option value="${esc(v)}" ${String(value ?? '') === String(v) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select>`;
            else if (['textarea', 'lines', 'descriptions', 'labels'].includes(kind)) {
                const content = kind === 'lines' ? value.join('\n') : kind === 'descriptions' ? value.map(v => v.description).join('\n') : kind === 'labels' ? value.map(v => v.label).join('\n') : value;
                control = `<textarea ${attrs} rows="3">${esc(content)}</textarea>`;
            } else control = `<input ${attrs} type="${kind}" value="${esc(value)}" ${kind === 'number' ? 'min="0" step="1"' : ''}>`;
            return `<label class="planning-field" for="${id}"><span>${esc(label)}${required ? '<span class="planning-required" aria-hidden="true"> *</span>' : ''}</span>${control}${error ? `<small id="${id}-error" class="planning-field-error">${esc(error.message)}</small>` : ''}</label>`;
        }
        function notice(message, error = false) {
            const element = dialog.querySelector('#planning-notice');
            element.textContent = message;
            element.setAttribute('role', error ? 'alert' : 'status');
            if (error) element.focus();
        }
        function shell(content) {
            dialog.innerHTML = `<div class="planning-shell"><header class="planning-header"><div><span class="home-eyebrow">Beta · Secundaria, ciclos VI y VII</span><h2 id="planning-title">Planificación articulada</h2></div>${button('close', 'Cerrar')}</header><p id="planning-notice" tabindex="-1" role="status"></p>${content}</div>`;
        }
        function library() {
            draft = null; previous = null; dirty = false; creationMode = 'manual'; aiProposal = null; generating = false; returnToView = false;
            const plans = repository.list().filter(p => p.schemaVersion === '2.0' && ['draft', 'reviewed'].includes(p.status)
                && p.identity.level === 'secondary' && ['VI', 'VII'].includes(p.identity.cycle) && types[p.identity.planningType]);
            shell(`<h3>¿Qué quieres crear?</h3><p>Construye tu planificación paso a paso. Puedes guardar un borrador en cualquier momento.</p><div class="planning-actions">${Object.entries(types).map(([type, label]) => button('create', esc(label), `data-type="${type}"`)).join('')}</div><h3>Mis planificaciones</h3><div class="planning-library">${plans.length ? plans.map(p => `<article class="planning-card"><div><strong>${esc(p.identity.title || 'Sin título')}</strong><p>${types[p.identity.planningType]} · ${p.status === 'reviewed' ? 'Revisada' : 'Borrador'} · Revisión ${p.revision}</p></div>${button('open', 'Abrir', `data-id="${esc(p.id)}"`)}</article>`).join('') : '<p>Aún no tienes planificaciones guardadas para este piloto.</p>'}</div>${button('sync', 'Sincronizar con mi cuenta')}`);
        }
        async function loadProfiles() {
            if (catalogs) return;
            const catalogResponse = await fetch('data/pedagogy/catalog.json');
            if (!catalogResponse.ok) throw new Error('No se pudo cargar el catálogo pedagógico.');
            const catalog = await catalogResponse.json();
            async function loadGroup(group) {
                return Promise.all((catalog[group] || []).map(async entry => {
                    const response = await fetch(`data/pedagogy/${entry.path}`);
                    if (!response.ok) throw new Error('No se pudieron cargar los perfiles. Intenta abrir nuevamente.');
                    return response.json();
                }));
            }
            const [pedagogicalProfiles, curriculumProfiles, didacticProfiles, methodologyProfiles] = await Promise.all([
                loadGroup('pedagogicalProfiles'), loadGroup('curriculumProfiles'), loadGroup('didacticProfiles'), loadGroup('methodologyProfiles')
            ]);
            catalogs = { pedagogicalProfiles, curriculumProfiles, didacticProfiles, methodologyProfiles };
        }
        async function editExisting(containerId) {
            await loadProfiles();
            const loaded = repository.get(containerId);
            if (!loaded || !core.validate(loaded).valid) throw new Error('No se pudo abrir esta planificación para editarla.');
            draft = copy(loaded); previous = copy(loaded); step = 0; dirty = false; showValidation = false;
            profiles = resolvePlanningProfiles({ ...draft.identity, competency: draft.curriculumMap[0]?.competency?.id, methodology: draft.methodologyConfig.primary?.code }, catalogs);
            creationMode = 'manual'; aiProposal = null; generating = false; returnToView = true;
            render();
            dialog.querySelector('#planning-step-title')?.focus();
        }
        function review() {
            const result = core.validate(draft, { forReview: true, pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(p => p.code === draft.methodologyConfig.primary?.code) });
            const labels = { 'identity.title': [0, 'Título'], 'identity.cycle': [0, 'Ciclo'],
                'identity.duration': [0, 'Duración'], 'identity.endDate': [0, 'Fecha de fin'],
                'significantSituation.context': [1, 'Contexto de la situación significativa'],
                'significantSituation.problemOrOpportunity': [1, 'Problema u oportunidad'],
                drivingQuestion: [1, 'Pregunta retadora'], 'purpose.summary': [1, 'Propósito de aprendizaje'],
                curriculumMap: [2, 'Currículo'], 'curriculumMap.criteria': [2, 'Criterios de evaluación'],
                'methodologyConfig.primary': [3, 'Metodología'], sequence: [5, 'Secuencia'] };
            const pending = result.errors.map(error => {
                const [targetStep, label] = labels[error.path] || [step, 'Planificación'];
                return `<li>${button('step', esc(label), `data-step="${targetStep}"`)}: ${esc(error.message)}</li>`;
            }).join('');
            return `<h3>${esc(draft.identity.title || 'Sin título')}</h3><p>${types[draft.identity.planningType]} · ${draft.identity.duration.value} semanas · ${draft.sequence.length} sesiones</p><p>${esc(draft.purpose.summary)}</p><h4>Producto final</h4><p>${esc(draft.finalProduct?.title || 'Por definir')}</p><ol>${draft.sequence.map(s => `<li>Semana ${s.week || '—'}: ${esc(s.title)}${s.date ? ` · ${esc(s.date)}` : ''}</li>`).join('')}</ol><h4>${result.valid ? 'Campos de revisión completos' : 'Pendiente de completar'}</h4><ul>${pending}</ul><h4>Orientaciones metodológicas</h4><ul>${[...result.warnings, ...result.suggestions].map(e => `<li>${esc(e.message)}</li>`).join('') || '<li>Sin observaciones.</li>'}</ul><p>Se guardará como borrador editable. Las orientaciones no bloquean el guardado.</p>`;
        }
        function sectionCard(title, description, body, extraClass = '') {
            return `<section class="planning-form-card ${extraClass}"><header><h4>${esc(title)}</h4><p>${esc(description)}</p></header>${body}</section>`;
        }
        function reviewResult() {
            return core.validate(draft, { forReview: true, pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(p => p.code === draft.methodologyConfig.primary?.code) });
        }
        function reviewContent() {
            const result = reviewResult();
            const completion = requiredCompletion(draft);
            const labels = { 'identity.title': [0, 'Contexto'], 'identity.cycle': [0, 'Contexto'],
                'identity.duration': [0, 'Contexto'], 'identity.endDate': [0, 'Contexto'],
                'significantSituation.context': [1, 'Propósito'],
                'significantSituation.problemOrOpportunity': [1, 'Propósito'], drivingQuestion: [1, 'Propósito'],
                'purpose.summary': [1, 'Propósito'], curriculumMap: [2, 'Currículo'],
                'curriculumMap.criteria': [2, 'Currículo'], 'methodologyConfig.primary': [3, 'Metodología'], sequence: [5, 'Secuencia'] };
            const checklist = steps.slice(0, 6).map((label, index) => {
                const matching = result.errors.filter(error => (labels[error.path]?.[0] ?? -1) === index);
                const complete = completion.byStep[index].complete && !matching.length;
                return `<li class="planning-review-item ${complete ? 'is-complete' : 'has-warning'}">
                    <span aria-hidden="true">${complete ? '✓' : '!'}</span><div><strong>${esc(label)}</strong>
                    <p>${complete ? 'Listo para revisión' : esc(matching[0]?.message || 'Puedes completar esta sección.')}</p></div>
                    ${complete ? '' : button('step', 'Revisar', `data-step="${index}" aria-label="Revisar ${esc(label)}"`)}</li>`;
            }).join('');
            const observations = [...result.warnings, ...result.suggestions];
            return `${sectionCard('Resumen de validación', result.valid ? 'Campos de revisión completos' : 'Revisa los puntos pendientes antes de finalizar.',
                `<ul class="planning-review-list">${checklist}</ul>`, 'planning-review-card')}
                ${sectionCard('Orientaciones metodológicas', 'Estas recomendaciones no bloquean el guardado.',
                    `<ul class="planning-observations">${observations.map(item => `<li>${esc(item.message)}</li>`).join('') || '<li>Sin observaciones.</li>'}</ul>`)}`;
        }
        function content() {
            switch (step) {
            case 0:
                return `${sectionCard('Contexto general', `${draft.identity.grade}.º de Secundaria · Ciclo ${draft.identity.cycle}. El ciclo se resuelve automáticamente desde el grado.`,
                    `<div class="planning-grid">${field('identity.title', 'Título')}${field('identity.grade', 'Grado', 'text', [['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º']])}${field('identity.duration.value', 'Duración en semanas', 'number')}${field('identity.startDate', 'Fecha de inicio', 'date')}${field('identity.endDate', 'Fecha de fin', 'date')}</div>`)}
                    ${sectionCard('Comunidad educativa', 'Registra los datos que ayudan a situar la experiencia.',
                    `<div class="planning-grid">${field('administrativeContext.institution', 'Institución')}${field('administrativeContext.teacher', 'Docente')}${field('administrativeContext.sections', 'Secciones (una por línea)', 'lines')}</div>`)}
                    ${sectionCard('Conoce al grupo', 'Resume necesidades, intereses y oportunidades del contexto.',
                    `<div class="planning-grid">${field('learnerContext.students', 'Contexto del grupo', 'textarea')}${field('learnerContext.diagnosis', 'Necesidades', 'textarea')}${field('learnerContext.interests', 'Intereses (uno por línea)', 'lines')}${field('learnerContext.localContext', 'Situación local', 'textarea')}</div>`)}`;
            case 1:
                return `${sectionCard('Situación significativa', 'Describe el contexto real y el desafío que movilizará los aprendizajes.',
                    field('significantSituation.context', 'Contexto', 'textarea') + field('significantSituation.problemOrOpportunity', 'Problema u oportunidad', 'textarea'))}
                    ${sectionCard('Propósito de aprendizaje', 'Formula una pregunta movilizadora y el aprendizaje esperado.',
                    field('drivingQuestion', 'Pregunta retadora', 'textarea') + field('purpose.summary', 'Propósito de aprendizaje', 'textarea'))}`;
            case 2: {
                const availableCurricula = (catalogs?.curriculumProfiles || []).filter(p =>
                    p.scope.level === draft.identity.level &&
                    p.scope.cycle === draft.identity.cycle &&
                    p.scope.grades.includes(String(draft.identity.grade))
                );
                const currentCompId = draft.curriculumMap[0]?.competency?.id || profiles?.curriculum?.competency?.id || availableCurricula[0]?.competency?.id;
                const selector = availableCurricula.length > 0 ? `
                    <div class="planning-field planning-competency-select">
                        <label for="planning-competency"><span>Competencia curricular</span></label>
                        <select id="planning-competency" data-planning-action="competency" aria-label="Competencia curricular">
                            ${[...new Set(['mathematics', 'communication', 'science-technology', 'social-sciences', 'dpcc', ...availableCurricula.map(p => p.scope.area.id)])].map(areaId => {
                                const areaCurricula = availableCurricula.filter(p => p.scope.area.id === areaId);
                                if (!areaCurricula.length) return '';
                                const areaName = areaCurricula[0].scope.area.officialName;
                                return `<optgroup label="${esc(areaName)}">${areaCurricula.map(p =>
                                    `<option value="${p.competency.id}" ${currentCompId === p.competency.id ? 'selected' : ''}>${esc(p.competency.officialName)}</option>`
                                ).join('')}</optgroup>`;
                            }).join('')}
                        </select>
                    </div>` : '';
                return draft.curriculumMap.length ? draft.curriculumMap.map((entry, index) => sectionCard(
                    entry.area.officialName, entry.competency.officialName,
                    `${selector}<div class="planning-capabilities"><strong>Capacidades</strong><ul>${entry.capacities.map(capacity => `<li><span aria-hidden="true">✓</span>${esc(capacity.officialName)}</li>`).join('')}</ul></div>
                    <details class="planning-details" open><summary>Referentes y evaluación</summary>
                    <section data-curriculum-standard><strong>Estándar del ciclo ${esc(draft.identity.cycle)}</strong><p>${esc(entry.standard?.description || '')}</p></section>
                    <section data-curriculum-performances><strong>Desempeños de ${esc(draft.identity.grade)}.º</strong><ul>${entry.performances.map(performance => `<li>${esc(performance.description)}</li>`).join('')}</ul></section>
                    <div class="planning-grid">${field(`curriculumMap.${index}.criteria`, 'Criterios (uno por línea)', 'descriptions')}${field(`curriculumMap.${index}.expectedEvidence`, 'Evidencias esperadas (una por línea)', 'descriptions')}</div></details>`, 'planning-curriculum-editor')).join('')
                    : `<div class="planning-empty-state"><span class="planning-empty-icon" aria-hidden="true">◎</span><h4>Conecta el currículo</h4><p>Selecciona una competencia para tu planificación.</p>${selector}${button('curriculum', 'Agregar competencia')}</div>`;
            }
            case 3:
                return sectionCard('Metodología principal', 'Elige el enfoque que guiará la secuencia. Los códigos internos se conservan sin cambios.',
                    `<label class="planning-field planning-methodology-select"><span>Metodología</span><select id="planning-methodology"><option value="">Por definir</option>${profiles.methodologies.map(profile => `<option value="${profile.code}" ${draft.methodologyConfig.primary?.code === profile.code ? 'selected' : ''}>${esc(profile.displayName)}</option>`).join('')}</select></label>
                    <div class="planning-methodology-grid" role="list" aria-label="Metodologías disponibles">${profiles.methodologies.map(profile => {
                        const selected = draft.methodologyConfig.primary?.code === profile.code;
                        return `<button type="button" class="planning-methodology-option ${selected ? 'is-selected' : ''}" data-planning-action="methodology" data-code="${esc(profile.code)}" role="listitem" aria-pressed="${selected}"><span class="planning-methodology-mark" aria-hidden="true">${selected ? '✓' : '○'}</span><strong>${esc(profile.displayName)}</strong></button>`;
                    }).join('')}</div>${draft.methodologyConfig.primary?.code === 'custom' ? field('methodologyConfig.custom.name', 'Nombre de la metodología') : ''}`);
            case 4:
                return `<div class="planning-product-grid">${sectionCard('Producto final', 'Resultado integrador que presentará el grupo.',
                    draft.finalProduct ? field('finalProduct.title', 'Nombre del producto') + field('finalProduct.description', 'Descripción', 'textarea') + field('finalProduct.audience', 'Destinatarios') : `<div class="planning-empty-inline"><p>Aún no has definido el producto final.</p>${button('product', 'Definir producto final')}</div>`)}
                    ${sectionCard('Productos parciales', 'Se construyen dentro de cada sesión de la secuencia.', `<p class="planning-muted">${draft.sequence.filter(item => item.partialProduct).length} productos parciales definidos.</p>${button('goto-sequence', 'Ir a secuencia')}`)}
                    ${sectionCard('Evidencias', 'Se mantienen vinculadas al currículo y a cada sesión.', `<p class="planning-muted">${draft.curriculumMap.flatMap(entry => entry.expectedEvidence || []).length} evidencias curriculares · ${draft.sequence.flatMap(item => item.evidence || []).length} evidencias de sesión.</p>`)}
                    ${sectionCard('Evaluación', 'Define cómo acompañarás el aprendizaje.', field('assessmentPlan.formativeAssessment', 'Evaluación formativa', 'textarea') + field('assessmentPlan.feedbackApproach', 'Retroalimentación', 'textarea'))}</div>`;
            case 5:
                return `<div class="planning-sequence-toolbar"><div><strong>Mapa de sesiones</strong><p>Organiza la progresión sin cambiar la estructura de SequenceItem.</p></div><div class="planning-actions">${button('milestone', '+ Añadir hito')}${button('session', '+ Añadir sesión')}</div></div>
                    ${draft.milestones.map((milestone, index) => sectionCard(`Hito ${index + 1}`, 'Punto de avance metodológico.', `<div class="planning-grid">${field(`milestones.${index}.title`, 'Nombre del hito')}${field(`milestones.${index}.phase`, 'Fase metodológica')}${field(`milestones.${index}.objective`, 'Objetivo', 'textarea')}</div>`, 'planning-milestone-editor')).join('')}
                    <div class="planning-sequence-editor">${draft.sequence.map((item, index) => `<article class="planning-session-card" data-sequence-editor-id="${esc(item.id)}">
                        <header class="planning-session-header"><span class="planning-session-number">${String(index + 1).padStart(2, '0')}</span><div><span class="planning-session-week">SEMANA ${item.week || '—'}</span><h4>${esc(item.title || `Sesión ${index + 1}`)}</h4></div><span class="planning-item-status">${item.status === 'generated' ? 'Generada' : 'Planeada'}</span></header>
                        <div class="planning-session-summary"><span>${item.duration.value} min</span><span>${esc(draft.milestones.find(entry => entry.id === item.milestoneId)?.phase || 'Sin fase')}</span></div>
                        <details class="planning-session-details" open><summary>Editar sesión</summary><div class="planning-grid">${field(`sequence.${index}.title`, 'Título de sesión')}${field(`sequence.${index}.week`, 'Semana', 'number')}${field(`sequence.${index}.date`, 'Fecha', 'date')}${field(`sequence.${index}.duration.value`, 'Duración en minutos', 'number')}${field(`sequence.${index}.milestoneId`, 'Hito', 'text', [['', 'Sin hito'], ...draft.milestones.map(milestone => [milestone.id, milestone.title])])}${field(`sequence.${index}.knowledge`, 'Conocimientos (uno por línea)', 'lines')}${field(`sequence.${index}.evidence`, 'Evidencias (una por línea)', 'descriptions')}${field(`sequence.${index}.assessmentInstruments`, 'Instrumentos (uno por línea)', 'labels')}</div>
                        <div class="planning-partial-product">${item.partialProduct ? field(`sequence.${index}.partialProduct.title`, 'Producto parcial') + field(`sequence.${index}.partialProduct.description`, 'Descripción del producto parcial', 'textarea') : button('partial', 'Definir producto parcial', `data-index="${index}"`)}</div></details>
                        <footer class="planning-session-actions" aria-label="Acciones de la sesión ${index + 1}">${button('up', '↑ Subir', `data-index="${index}" aria-label="Subir sesión ${index + 1}" ${index === 0 ? 'disabled' : ''}`)}${button('down', '↓ Bajar', `data-index="${index}" aria-label="Bajar sesión ${index + 1}" ${index === draft.sequence.length - 1 ? 'disabled' : ''}`)}${button('remove', 'Quitar', `data-index="${index}" aria-label="Quitar sesión ${index + 1}"`)}</footer>
                    </article>`).join('') || '<div class="planning-empty-state"><h4>Construye la secuencia</h4><p>Añade la primera sesión para comenzar el mapa.</p></div>'}</div>`;
            default: return reviewContent();
            }
        }
        function previewMarkup() {
            const title = esc(draft.identity.title || 'Planificación sin título');
            const situation = esc(draft.significantSituation.context || 'La situación significativa aparecerá aquí.');
            const purpose = esc(draft.purpose.summary || 'El propósito de aprendizaje aparecerá aquí.');
            const product = esc(draft.finalProduct?.title || 'Por definir');
            const meta = `Secundaria · ${draft.identity.grade ? `${esc(draft.identity.grade)}.º` : 'grado por definir'} · ${draft.identity.duration.value || 0} semanas`;
            if (previewMode === 'document') return `<article class="planning-document-preview"><span class="planning-document-kicker">${esc(types[draft.identity.planningType]).toUpperCase()}</span><h3>${title}</h3><p class="planning-document-meta">${meta}</p><hr><h4>Situación significativa</h4><p>${situation}</p><h4>Pregunta retadora</h4><p>${esc(draft.drivingQuestion || 'Por definir')}</p><h4>Propósito</h4><p>${purpose}</p><h4>Producto final</h4><p>${product}</p><h4>Secuencia</h4><ol>${draft.sequence.map(item => `<li>${esc(item.title)}</li>`).join('') || '<li>Sin sesiones todavía.</li>'}</ol></article>`;
            return `<article class="planning-summary-preview"><span class="planning-document-kicker">${esc(types[draft.identity.planningType]).toUpperCase()}</span><h3>${title}</h3><p class="planning-document-meta">${meta}</p><dl><div><dt>Situación significativa</dt><dd>${situation}</dd></div><div><dt>Propósito</dt><dd>${purpose}</dd></div><div><dt>Producto final</dt><dd>${product}</dd></div><div><dt>Secuencia</dt><dd>${draft.sequence.length} ${draft.sequence.length === 1 ? 'sesión' : 'sesiones'}</dd></div></dl></article>`;
        }
        function modeChoice() {
            return `<section class="planning-ai-choice" aria-labelledby="planning-mode-title"><h3 id="planning-mode-title" tabindex="-1">¿Cómo quieres comenzar?</h3><p>${esc(types[draft.identity.planningType])}. Puedes construirla paso a paso o preparar el contexto mínimo para recibir una propuesta con IA.</p><div class="planning-actions">${button('mode-manual', 'Crear manualmente')}<button type="button" class="btn btn-primary" data-planning-action="mode-ai">Generar propuesta con IA</button></div><p class="planning-action-help">La IA siempre crea un borrador editable y nunca marca la planificación como revisada.</p></section>`;
        }
        function aiPanel() {
            if (creationMode !== 'ai') {
                return `<aside class="planning-ai-panel"><div><strong>¿Prefieres partir de una propuesta?</strong><p>Tu trabajo actual no será reemplazado sin confirmación.</p></div>${button('mode-ai', 'Generar propuesta con IA')}</aside>`;
            }
            const readiness = generationReadiness(draft, profiles);
            const help = readiness.ready
                ? 'El contexto mínimo está completo. La propuesta se mostrará antes de reemplazar el borrador.'
                : `Falta completar: ${readiness.missing.join(', ')}.`;
            return `<aside class="planning-ai-panel" aria-labelledby="planning-ai-title"><div><strong id="planning-ai-title">Generación asistida</strong><p id="planning-ai-help">${esc(help)}</p></div><div class="planning-actions">${button('mode-manual', 'Seguir manualmente')}<button type="button" class="btn btn-primary" data-planning-action="generate-ai" aria-describedby="planning-ai-help" ${readiness.ready && !generating ? '' : 'disabled'} ${generating ? 'aria-busy="true"' : ''}>${generating ? 'Generando propuesta pedagógica…' : 'Generar propuesta con IA'}</button></div></aside>`;
        }
        function proposalView() {
            const proposal = aiProposal;
            const sequence = proposal.sequence.map(item => `<li><strong>${esc(item.title)}</strong>${item.evidence?.length ? ` · ${esc(item.evidence.map(value => value.description).join('; '))}` : ''}</li>`).join('');
            shell(`<section class="planning-proposal" aria-labelledby="planning-proposal-title"><span class="home-eyebrow">Propuesta generada · Borrador</span><h3 id="planning-proposal-title" tabindex="-1">${esc(proposal.identity.title)}</h3><h4>Situación significativa</h4><p>${esc(proposal.significantSituation.context)}</p><h4>Pregunta retadora</h4><p>${esc(proposal.drivingQuestion)}</p><h4>Producto final</h4><p>${esc(proposal.finalProduct?.title || 'Por definir')}</p><h4>Secuencia</h4><ol>${sequence}</ol><div class="planning-actions"><button type="button" class="btn btn-primary" data-planning-action="accept-ai">Aceptar y editar</button>${button('regenerate-ai', generating ? 'Generando propuesta pedagógica…' : 'Regenerar propuesta', `${generating ? 'disabled aria-busy="true"' : ''}`)}${button('discard-ai', 'Descartar')}</div><p class="planning-action-help">La propuesta aún no se ha guardado. Puedes descartarla sin perder el contenido anterior.</p></section>`);
        }
        function render() {
            if (creationMode === 'choose') {
                shell(modeChoice());
                return;
            }
            if (aiProposal) {
                proposalView();
                return;
            }
            const validation = profiles && draft ? core.validate(draft, {
                forReview: true,
                pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(p => p.code === draft.methodologyConfig.primary?.code)
            }) : { valid: false };
            const completion = requiredCompletion(draft);
            const alreadyReviewed = draft?.status === 'reviewed' && !dirty;
            const reviewAction = step === 6
                ? `<button type="button" class="btn btn-primary" data-planning-action="review" aria-describedby="planning-review-help" ${validation.valid && !alreadyReviewed ? '' : 'disabled'}>${alreadyReviewed ? 'Planificación revisada' : 'Marcar como revisada'}</button>`
                    + `<span id="planning-review-help" class="planning-action-help">${alreadyReviewed ? 'Edita algún campo para crear una revisión nueva.' : validation.valid ? 'La planificación cumple los requisitos de revisión.' : 'Completa los campos indicados para habilitar la revisión.'}</span>`
                : '';
            const pathSteps = { 'identity.title': 0, 'identity.cycle': 0, 'identity.duration': 0, 'identity.endDate': 0,
                'significantSituation.context': 1, 'significantSituation.problemOrOpportunity': 1, drivingQuestion: 1,
                'purpose.summary': 1, curriculumMap: 2, 'curriculumMap.criteria': 2,
                'methodologyConfig.primary': 3, sequence: 5 };
            const stepper = steps.map((label, index) => {
                const hasError = step === 6 && validation.errors?.some(error => pathSteps[error.path] === index);
                const state = index === step ? 'current' : hasError ? 'error' : completion.byStep[index].complete ? 'complete' : 'pending';
                const icon = state === 'complete' ? '✓' : state === 'current' ? '●' : state === 'error' ? '!' : '○';
                return `<button type="button" class="planning-step" data-planning-action="step" data-step="${index}" data-state="${state}" ${index === step ? 'aria-current="step"' : ''}><span class="planning-step-number">${String(index + 1).padStart(2, '0')}</span><span class="planning-step-label">${esc(label)}</span><span class="planning-step-state" aria-hidden="true">${icon}</span></button>`;
            }).join('');
            const preview = `<aside id="planning-preview" class="planning-preview ${previewOpen ? 'is-open' : ''}" aria-label="Vista previa de la planificación">
                <header class="planning-preview-header"><div><span class="home-eyebrow">Vista previa</span><h3>Documento</h3></div>${button('preview', 'Cerrar', 'aria-label="Cerrar vista previa"')}</header>
                <div class="planning-preview-tabs" role="tablist" aria-label="Formato de vista previa"><button type="button" role="tab" data-planning-action="preview-mode" data-mode="summary" aria-selected="${previewMode === 'summary'}">Resumen</button><button type="button" role="tab" data-planning-action="preview-mode" data-mode="document" aria-selected="${previewMode === 'document'}">Vista documento</button></div>
                <div class="planning-preview-body" aria-live="polite">${previewMarkup()}</div></aside>`;
            shell(`${aiPanel()}<div class="planning-mobile-heading"><span>Paso ${step + 1} de 7</span>${button('preview', 'Vista previa', 'aria-controls="planning-preview" aria-expanded="false"')}</div>
                <div class="planning-studio-layout"><aside class="planning-stepper"><div class="planning-stepper-heading"><span class="home-eyebrow">Planificación</span><strong>Tu ruta de trabajo</strong></div><nav class="planning-steps" aria-label="Pasos de planificación">${stepper}</nav><div class="planning-progress"><div><span>Planificación completada</span><strong data-progress-label>${completion.percentage} %</strong></div><progress max="100" value="${completion.percentage}" aria-label="Planificación completada al ${completion.percentage} por ciento"></progress><small>${completion.completed} de ${completion.total} campos requeridos</small></div>${button('library', 'Mis planificaciones')}</aside>
                <main class="planning-form-pane"><header class="planning-section-heading"><div><span class="planning-step-overline">Paso ${step + 1} de 7</span><h3 id="planning-step-title" tabindex="-1">${esc(steps[step])}</h3><p>${esc(stepDescriptions[step])}</p></div>${button('preview', 'Vista previa', 'aria-controls="planning-preview" aria-expanded="false"')}</header><div class="planning-content">${content()}</div></main>${preview}</div>
                <footer class="planning-studio-actions"><div class="planning-save-state" role="status"><span aria-hidden="true">${dirty ? '●' : '✓'}</span><span data-save-state>${dirty ? 'Cambios sin guardar' : previous ? 'Guardado' : 'Borrador nuevo'}</span></div><div class="planning-footer-buttons">${button('previous', '← Anterior', step === 0 ? 'disabled' : '')}<button type="button" class="btn btn-ghost" data-planning-action="save" ${dirty ? '' : 'disabled'}>Guardar borrador</button>${step < 6 ? button('next', 'Siguiente →') : ''}${reviewAction}</div></footer>`);
        }
        function scheduleStudioUpdate() {
            clearTimeout(previewTimer);
            previewTimer = setTimeout(() => {
                const previewBody = dialog.querySelector('.planning-preview-body');
                if (previewBody) previewBody.innerHTML = previewMarkup();
                const completion = requiredCompletion(draft);
                const progress = dialog.querySelector('.planning-progress progress');
                const label = dialog.querySelector('[data-progress-label]');
                const detail = dialog.querySelector('.planning-progress small');
                if (progress) { progress.value = completion.percentage; progress.setAttribute('aria-label', `Planificación completada al ${completion.percentage} por ciento`); }
                if (label) label.textContent = `${completion.percentage} %`;
                if (detail) detail.textContent = `${completion.completed} de ${completion.total} campos requeridos`;
            }, 80);
        }
        function updateAiAvailability() {
            const generateButton = dialog.querySelector('[data-planning-action="generate-ai"]');
            const help = dialog.querySelector('#planning-ai-help');
            if (!generateButton || !help || creationMode !== 'ai') return;
            const readiness = generationReadiness(draft, profiles);
            generateButton.disabled = generating || !readiness.ready;
            help.textContent = readiness.ready
                ? 'El contexto mínimo está completo. La propuesta se mostrará antes de reemplazar el borrador.'
                : `Falta completar: ${readiness.missing.join(', ')}.`;
        }
        function markDirty() {
            dirty = true;
            const saveButton = dialog.querySelector('[data-planning-action="save"]');
            if (saveButton) saveButton.disabled = false;
            const saveState = dialog.querySelector('[data-save-state]');
            if (saveState) saveState.textContent = 'Cambios sin guardar';
            updateAiAvailability();
            scheduleStudioUpdate();
        }
        function mayLeave() { return !dirty || window.confirm('Hay cambios sin guardar. ¿Quieres descartarlos?'); }
        async function confirmAiReplacement(regenerating = false) {
            if (!hasMeaningfulManualContent(draft) && !(regenerating && dirty)) return true;
            const options = {
                title: regenerating ? 'Regenerar propuesta' : 'Generar propuesta con IA',
                message: 'La propuesta generada puede reemplazar parte del contenido actual. ¿Deseas continuar?',
                confirmText: regenerating ? 'Regenerar' : 'Continuar',
                cancelText: 'Cancelar'
            };
            return window.confirm(`${options.title}\n\n${options.message}`);
        }
        async function requestAiProposal(regenerating = false) {
            const readiness = generationReadiness(draft, profiles);
            if (!readiness.ready) {
                notice(`Completa antes de generar: ${readiness.missing.join(', ')}.`, true);
                return;
            }
            if (!await confirmAiReplacement(regenerating)) return;
            busy = true; generating = true;
            render();
            notice('Generando propuesta pedagógica…');
            try {
                if (!window.SupabaseClient?.invokeFunction) {
                    throw Object.assign(new Error('AI Gateway no disponible.'), { code: 'GATEWAY_UNAVAILABLE' });
                }
                const result = await generateProposal(draft, profiles,
                    (functionName, body) => window.SupabaseClient.invokeFunction(functionName, body));
                aiProposal = result.container;
                generating = false;
                render();
                dialog.querySelector('#planning-proposal-title')?.focus();
            } catch (error) {
                console.error('[PlanningWizard] Falló planning.map.generate:', error);
                generating = false;
                render();
                notice(formatAiError(error), true);
            } finally {
                busy = false;
            }
        }
        async function save(asReviewed = false) {
            if (!asReviewed && previous && !dirty) {
                notice('No hay cambios por guardar.');
                return;
            }
            notice('Guardando…');
            const saveState = dialog.querySelector('[data-save-state]');
            if (saveState) saveState.textContent = 'Guardando…';
            const invalid = [...dialog.querySelectorAll('input')].find(input => !input.checkValidity());
            if (invalid) { invalid.reportValidity(); return; }
            const validationOptions = asReviewed ? {
                pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(p => p.code === draft.methodologyConfig.primary?.code)
            } : {};
            const value = asReviewed ? prepareReview(draft, previous, validationOptions) : prepareSave(draft, previous);
            repository.save(value);
            draft = copy(value); previous = copy(value); dirty = false;
            const label = asReviewed ? 'Planificación revisada' : 'Borrador guardado';
            render();
            notice(`${label} en este dispositivo. Sincronizando…`);
            try {
                const result = await repository.sync();
                notice(result.synced ? `${label} y sincronizado con tu cuenta.` : `${label} en este dispositivo. La nube no está disponible.`);
            } catch (_error) { notice(`${label} en este dispositivo. No se pudo sincronizar; puedes reintentar desde Mis planificaciones.`); }
            if (returnToView && window.PlanningView?.open) await window.PlanningView.open(value.id);
        }
        dialog.addEventListener('input', event => {
            const input = event.target;
            if (!input.dataset.path) return;
            const { path, kind } = input.dataset;
            let value = input.value;
            if (kind === 'number') value = value === '' ? (path.endsWith('.week') ? null : 0) : Number(value);
            if (kind === 'date' || path.endsWith('.milestoneId')) value = value || null;
            if (['lines', 'descriptions', 'labels'].includes(kind)) {
                const lines = value.split('\n').map(v => v.trim()).filter(Boolean);
                const old = read(path);
                value = kind === 'lines' ? [...new Set(lines)] : lines.map((line, i) => ({ id: old[i]?.id || uid('item'), [kind === 'labels' ? 'label' : 'description']: line }));
            }
            write(path, value);
            if (path === 'identity.grade') {
                draft.identity.cycle = contextResolver.resolveSecondaryCycle(value);
                const currentComp = draft.curriculumMap[0]?.competency?.id || 'solves-quantity-problems';
                profiles = resolvePlanningProfiles({ ...draft.identity, competency: currentComp, methodology: draft.methodologyConfig.primary?.code }, catalogs);
                if (draft.curriculumMap.length) {
                    const previousEntry = { ...draft.curriculumMap[0], grade: value };
                    draft.curriculumMap = [curriculumEntry(draft, profiles.didactic, profiles.curriculum, previousEntry)];
                    const entry = draft.curriculumMap[0];
                    draft.sequence.forEach(item => {
                        item.curriculumMapRefs = [entry.id];
                        item.competencyRefs = [entry.competency.id];
                        item.capacityRefs = entry.capacities.map(capacity => capacity.id);
                    });
                }
            }
            if (path.endsWith('.criteria')) {
                const ids = draft.curriculumMap.flatMap(e => e.criteria.map(c => c.id));
                draft.sequence.forEach(s => { s.criterionRefs = [...ids]; });
                if (draft.finalProduct) draft.finalProduct.criterionRefs = [...ids];
            }
            if (path.endsWith('.milestoneId')) draft.milestones.forEach(m => { m.sequenceItemIds = draft.sequence.filter(s => s.milestoneId === m.id).map(s => s.id); });
            markDirty();
            if (path === 'identity.grade') {
                render();
                dialog.querySelector('[data-path="identity.grade"]')?.focus();
            }
        });
        dialog.addEventListener('change', event => {
            if (event.target.id === 'planning-competency') {
                const newCompId = event.target.value;
                profiles = setCurriculumCompetency(draft, newCompId, catalogs);
                markDirty(); render(); dialog.querySelector('#planning-competency')?.focus();
                return;
            }
            if (event.target.id !== 'planning-methodology') return;
            const profile = profiles.methodologies.find(p => p.code === event.target.value);
            draft.methodologyConfig.primary = profile ? { profileId: profile.id, profileVersion: profile.profileVersion, code: profile.code } : null;
            if (profile?.code === 'custom' && !draft.methodologyConfig.custom) draft.methodologyConfig.custom = { name: '', phases: [] };
            markDirty(); render(); dialog.querySelector('#planning-methodology').focus();
        });
        dialog.addEventListener('click', async event => {
            const target = event.target.closest('[data-planning-action]');
            if (!target || busy) return;
            const action = target.dataset.planningAction;
            const index = Number(target.dataset.index);
            try {
                if (action === 'preview') {
                    previewOpen = !previewOpen;
                    dialog.querySelector('#planning-preview')?.classList.toggle('is-open', previewOpen);
                    dialog.querySelectorAll('[aria-controls="planning-preview"]').forEach(control => control.setAttribute('aria-expanded', String(previewOpen)));
                    if (previewOpen) dialog.querySelector('.planning-preview [role="tab"][aria-selected="true"]')?.focus();
                    return;
                }
                if (action === 'preview-mode') {
                    previewMode = target.dataset.mode === 'document' ? 'document' : 'summary';
                    dialog.querySelectorAll('.planning-preview [role="tab"]').forEach(tab => tab.setAttribute('aria-selected', String(tab === target)));
                    const previewBody = dialog.querySelector('.planning-preview-body');
                    if (previewBody) previewBody.innerHTML = previewMarkup();
                    return;
                }
                if (action === 'close') { if (mayLeave()) { dirty = false; dialog.close(); } return; }
                if (action === 'library') { if (mayLeave()) library(); return; }
                if (action === 'mode-manual' || action === 'mode-ai') {
                    creationMode = action === 'mode-ai' ? 'ai' : 'manual';
                    render();
                    dialog.querySelector('#planning-step-title')?.focus();
                    return;
                }
                if (action === 'generate-ai' || action === 'regenerate-ai') {
                    await requestAiProposal(action === 'regenerate-ai');
                    return;
                }
                if (action === 'accept-ai') {
                    draft = acceptGeneratedProposal(draft, aiProposal);
                    aiProposal = null; creationMode = 'manual'; dirty = true; step = 0;
                    render();
                    dialog.querySelector('#planning-step-title')?.focus();
                    return;
                }
                if (action === 'discard-ai') {
                    aiProposal = null; creationMode = 'manual';
                    render();
                    dialog.querySelector('#planning-step-title')?.focus();
                    return;
                }
                if (action === 'sync' || action === 'save' || action === 'review') {
                    busy = true; target.disabled = true;
                    if (action === 'save' || action === 'review') await save(action === 'review');
                    else { const result = await repository.sync(); library(); notice(result.synced ? 'Biblioteca sincronizada.' : 'Sin conexión a tu cuenta. Se muestran los borradores locales.'); }
                    return;
                }
                if (action === 'open') {
                    busy = true;
                    if (!window.PlanningView?.open) throw new Error('La vista de planificación no está disponible.');
                    await window.PlanningView.open(target.dataset.id);
                    return;
                }
                if (action === 'create') {
                    busy = true;
                    const entitlements = await window.SupabaseClient?.getUserEntitlements?.();
                    if (!canCreate(target.dataset.type, entitlements)) throw new Error('No se pudo habilitar esta opción con los permisos de tu cuenta. Comprueba tu conexión y el acceso a planificación de tu plan. Puedes seguir abriendo tus borradores guardados.');
                    await loadProfiles();
                    const loaded = create(target.dataset.type);
                    if (!loaded || !core.validate(loaded).valid) throw new Error('No se pudo abrir este borrador.');
                    draft = copy(loaded); previous = null; step = 0; dirty = true; showValidation = false;
                    const initialComp = draft.curriculumMap[0]?.competency?.id || 'solves-quantity-problems';
                    profiles = resolvePlanningProfiles({ ...draft.identity, competency: initialComp }, catalogs);
                    creationMode = 'choose'; aiProposal = null; generating = false; returnToView = false;
                } else if (action === 'step') step = Number(target.dataset.step);
                else if (action === 'goto-sequence') step = 5;
                else if (action === 'next') step = Math.min(6, step + 1);
                else if (action === 'previous') step = Math.max(0, step - 1);
                else {
                    markDirty();
                    if (action === 'methodology') {
                        const profile = profiles.methodologies.find(entry => entry.code === target.dataset.code);
                        draft.methodologyConfig.primary = profile ? { profileId: profile.id, profileVersion: profile.profileVersion, code: profile.code } : null;
                        if (profile?.code === 'custom' && !draft.methodologyConfig.custom) draft.methodologyConfig.custom = { name: '', phases: [] };
                    }
                    if (action === 'curriculum') {
                        const select = dialog.querySelector('#planning-competency');
                        const targetCompetency = select ? select.value : profiles.curriculum.competency.id;
                        profiles = setCurriculumCompetency(draft, targetCompetency, catalogs);
                    }
                    if (action === 'session') addSession(draft);
                    if (action === 'up' || action === 'down') reorder(draft, index, action === 'up' ? -1 : 1);
                    if (action === 'remove') removeSession(draft, index);
                    if (action === 'partial') draft.sequence[index].partialProduct = { id: uid('partial'), title: 'Producto parcial', description: '' };
                    if (action === 'product') draft.finalProduct = { id: uid('product'), title: 'Producto final', description: '', type: '', expectedComponents: [], audience: '', criterionRefs: draft.curriculumMap.flatMap(e => e.criteria.map(c => c.id)) };
                    if (action === 'milestone') draft.milestones.push({ id: uid('milestone'), title: `Hito ${draft.milestones.length + 1}`, phase: '', objective: '', partialProduct: null, sequenceItemIds: [], completionCriteria: [] });
                }
                if (step === 6) showValidation = true;
                render();
                (dialog.querySelector('#planning-mode-title') || dialog.querySelector('#planning-step-title'))?.focus();
            } catch (error) { notice(error.message, true); }
            finally { busy = false; target.disabled = false; }
        });
        dialog.addEventListener('cancel', event => { if (busy || !mayLeave()) event.preventDefault(); else dirty = false; });
        window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
        window.addEventListener('planning:view-library', () => library());
        window.addEventListener('planning:view-edit', async event => {
            if (busy || !event.detail?.id) return;
            busy = true;
            try { await editExisting(event.detail.id); }
            catch (error) { library(); notice(error.message, true); }
            finally { busy = false; }
        });
        document.querySelectorAll('[data-open-planning]').forEach(button => button.addEventListener('click', () => { library(); dialog.showModal(); }));
    }
    if (typeof window !== 'undefined') window.addEventListener('DOMContentLoaded', mount, { once: true });
    return { create, canCreate, addCurriculum, setCurriculumCompetency, addSession, reorder, removeSession, prepareSave, prepareReview, requiredCompletion,
        generationReadiness, buildGenerationInput, hasMeaningfulManualContent, acceptGeneratedProposal,
        formatAiError, generateProposal, resolvePlanningProfiles };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningWizard;
