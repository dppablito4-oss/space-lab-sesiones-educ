/** Planning pilot editor. Persistence and validation stay in Planning Core. */
const PlanningWizard = (() => {
    'use strict';
    const core = typeof module !== 'undefined' && module.exports
        ? require('./planning-container-v2.js') : window.PlanningContainerV2;
    const mapGenerator = typeof module !== 'undefined' && module.exports
        ? require('./planning-map-generator.js') : window.PlanningMapGenerator;
    const copy = value => JSON.parse(JSON.stringify(value));
    const uid = prefix => `${prefix}-${globalThis.crypto.randomUUID()}`;
    const types = { learning_experience: 'Experiencia de aprendizaje', unit: 'Unidad', project: 'Proyecto' };
    const steps = ['Contexto', 'Propósito', 'Currículo', 'Metodología', 'Producto / evidencias', 'Secuencia', 'Revisión'];
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
        if (!profiles?.pedagogical || !profiles?.didactic) missing.push('perfiles pedagógicos');
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
            profiles: {
                pedagogical: copy(profiles.pedagogical),
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

    function create(type, id = uid('plan')) {
        if (!types[type]) throw new Error('Selecciona un tipo de planificación.');
        return core.createDraft({ id, identity: { title: `Nueva ${types[type].toLowerCase()}`, planningType: type, cycle: 'VI', grade: '2' } });
    }

    function addCurriculum(draft, profile) {
        if (draft.curriculumMap.length) return;
        const scope = profile.scope;
        draft.curriculumMap.push({ id: uid('map'), area: copy(scope.area), competency: copy(scope.competency),
            capacities: copy(scope.capacities), standard: { description: '', sourceRef: '' },
            performances: [], criteria: [], expectedEvidence: [], curricularSourceRefs: [] });
        const entry = draft.curriculumMap[0];
        draft.sequence.forEach(item => {
            item.curriculumMapRefs = [entry.id]; item.competencyRefs = [entry.competency.id];
            item.capacityRefs = entry.capacities.map(c => c.id);
        });
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
        let profiles = null;
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
            const attrs = `id="${id}" data-path="${path}" data-kind="${kind}"`;
            let control;
            if (choices) control = `<select ${attrs}>${choices.map(([v, text]) => `<option value="${esc(v)}" ${String(value ?? '') === String(v) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select>`;
            else if (['textarea', 'lines', 'descriptions', 'labels'].includes(kind)) {
                const content = kind === 'lines' ? value.join('\n') : kind === 'descriptions' ? value.map(v => v.description).join('\n') : kind === 'labels' ? value.map(v => v.label).join('\n') : value;
                control = `<textarea ${attrs} rows="3">${esc(content)}</textarea>`;
            } else control = `<input ${attrs} type="${kind}" value="${esc(value)}" ${kind === 'number' ? 'min="0" step="1"' : ''}>`;
            return `<label class="planning-field" for="${id}"><span>${esc(label)}</span>${control}</label>`;
        }
        function notice(message, error = false) {
            const element = dialog.querySelector('#planning-notice');
            element.textContent = message;
            element.setAttribute('role', error ? 'alert' : 'status');
            if (error) element.focus();
        }
        function shell(content) {
            dialog.innerHTML = `<div class="planning-shell"><header class="planning-header"><div><span class="home-eyebrow">Beta · Secundaria, ciclo VI</span><h2 id="planning-title">Planificación articulada</h2></div>${button('close', 'Cerrar')}</header><p id="planning-notice" tabindex="-1" role="status"></p>${content}</div>`;
        }
        function library() {
            draft = null; previous = null; dirty = false; creationMode = 'manual'; aiProposal = null; generating = false;
            const plans = repository.list().filter(p => p.schemaVersion === '2.0' && ['draft', 'reviewed'].includes(p.status)
                && p.identity.level === 'secondary' && p.identity.cycle === 'VI' && types[p.identity.planningType]);
            shell(`<h3>¿Qué quieres crear?</h3><p>Construye tu planificación paso a paso. Puedes guardar un borrador en cualquier momento.</p><div class="planning-actions">${Object.entries(types).map(([type, label]) => button('create', esc(label), `data-type="${type}"`)).join('')}</div><h3>Mis planificaciones</h3><div class="planning-library">${plans.length ? plans.map(p => `<article class="planning-card"><div><strong>${esc(p.identity.title || 'Sin título')}</strong><p>${types[p.identity.planningType]} · ${p.status === 'reviewed' ? 'Revisada' : 'Borrador'} · Revisión ${p.revision}</p></div>${button('open', 'Abrir', `data-id="${esc(p.id)}"`)}</article>`).join('') : '<p>Aún no tienes planificaciones guardadas para este piloto.</p>'}</div>${button('sync', 'Sincronizar con mi cuenta')}`);
        }
        async function loadProfiles() {
            if (profiles) return;
            const codes = ['project_based_learning', 'problem_based_learning', 'challenge_based_learning', 'game_based_learning', 'custom'];
            const paths = ['didactics/secondary/cycle-vi/mathematics/quantity', 'pedagogical/secondary-cycle-vi', ...codes.map(c => `methodologies/${c}`)];
            const results = await Promise.all(paths.map(async path => {
                const response = await fetch(`data/pedagogy/${path}.json`);
                if (!response.ok) throw new Error('No se pudieron cargar los perfiles. Intenta abrir nuevamente.');
                return response.json();
            }));
            profiles = { didactic: results[0], pedagogical: results[1], methodologies: results.slice(2) };
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
        function content() {
            switch (step) {
            case 0: return `<p>Piloto: Secundaria · Ciclo VI · Matemática.</p><div class="planning-grid">${field('identity.title', 'Título')}${field('identity.grade', 'Grado', 'text', [['1', '1.º'], ['2', '2.º']])}${field('administrativeContext.institution', 'Institución')}${field('administrativeContext.teacher', 'Docente')}${field('administrativeContext.sections', 'Secciones (una por línea)', 'lines')}${field('identity.duration.value', 'Duración en semanas', 'number')}${field('identity.startDate', 'Fecha de inicio', 'date')}${field('identity.endDate', 'Fecha de fin', 'date')}${field('learnerContext.students', 'Contexto del grupo', 'textarea')}${field('learnerContext.diagnosis', 'Necesidades', 'textarea')}${field('learnerContext.interests', 'Intereses (uno por línea)', 'lines')}${field('learnerContext.localContext', 'Situación local', 'textarea')}</div>`;
            case 1: return field('significantSituation.context', 'Situación significativa: contexto', 'textarea') + field('significantSituation.problemOrOpportunity', 'Problema u oportunidad', 'textarea') + field('drivingQuestion', 'Pregunta retadora', 'textarea') + field('purpose.summary', 'Propósito de aprendizaje', 'textarea');
            case 2: return draft.curriculumMap.length ? draft.curriculumMap.map((entry, i) => `<article class="planning-card"><h3>${esc(entry.area.officialName)} · ${esc(entry.competency.officialName)}</h3><p>Capacidades: ${entry.capacities.map(c => esc(c.officialName)).join('; ')}.</p>${field(`curriculumMap.${i}.standard.description`, 'Estándar (consigna el correspondiente al ciclo)', 'textarea')}${field(`curriculumMap.${i}.performances`, 'Desempeños (uno por línea)', 'descriptions')}${field(`curriculumMap.${i}.criteria`, 'Criterios (uno por línea)', 'descriptions')}${field(`curriculumMap.${i}.expectedEvidence`, 'Evidencias esperadas (una por línea)', 'descriptions')}</article>`).join('') : `<p>El piloto trabaja Matemática: Resuelve problemas de cantidad.</p>${button('curriculum', 'Agregar competencia del piloto')}`;
            case 3: return `<label class="planning-field"><span>Metodología principal</span><select id="planning-methodology"><option value="">Por definir</option>${profiles.methodologies.map(p => `<option value="${p.code}" ${draft.methodologyConfig.primary?.code === p.code ? 'selected' : ''}>${esc(p.displayName)}</option>`).join('')}</select></label>${draft.methodologyConfig.primary?.code === 'custom' ? field('methodologyConfig.custom.name', 'Nombre de la metodología') : ''}`;
            case 4: return `${draft.finalProduct ? field('finalProduct.title', 'Producto final') + field('finalProduct.description', 'Descripción del producto final', 'textarea') + field('finalProduct.audience', 'Destinatarios') : button('product', 'Definir producto final')}<p>Las evidencias se definen en Currículo y en cada sesión; los productos parciales se definen en la secuencia.</p>${field('assessmentPlan.formativeAssessment', 'Evaluación formativa', 'textarea')}${field('assessmentPlan.feedbackApproach', 'Retroalimentación', 'textarea')}`;
            case 5: return `${button('milestone', 'Agregar hito')}${draft.milestones.map((m, i) => `<article class="planning-card">${field(`milestones.${i}.title`, 'Hito')}${field(`milestones.${i}.phase`, 'Fase metodológica')}${field(`milestones.${i}.objective`, 'Objetivo', 'textarea')}</article>`).join('')}${button('session', 'Agregar sesión al mapa')}<p>Define la secuencia manual. Cada sesión referencia las capacidades y criterios del mapa curricular.</p>${draft.sequence.map((s, i) => `<article class="planning-card"><h3>Sesión ${i + 1}</h3><div class="planning-grid">${field(`sequence.${i}.title`, 'Título de sesión')}${field(`sequence.${i}.week`, 'Semana', 'number')}${field(`sequence.${i}.date`, 'Fecha', 'date')}${field(`sequence.${i}.duration.value`, 'Duración en minutos', 'number')}${field(`sequence.${i}.milestoneId`, 'Hito', 'text', [['', 'Sin hito'], ...draft.milestones.map(m => [m.id, m.title])])}${field(`sequence.${i}.knowledge`, 'Conocimientos (uno por línea)', 'lines')}${field(`sequence.${i}.evidence`, 'Evidencias (una por línea)', 'descriptions')}${field(`sequence.${i}.assessmentInstruments`, 'Instrumentos (uno por línea)', 'labels')}</div>${s.partialProduct ? field(`sequence.${i}.partialProduct.title`, 'Producto parcial') + field(`sequence.${i}.partialProduct.description`, 'Descripción del producto parcial', 'textarea') : button('partial', 'Definir producto parcial', `data-index="${i}"`)}<div class="planning-actions">${button('up', 'Subir', `data-index="${i}" ${i === 0 ? 'disabled' : ''}`)}${button('down', 'Bajar', `data-index="${i}" ${i === draft.sequence.length - 1 ? 'disabled' : ''}`)}${button('remove', 'Quitar sesión', `data-index="${i}"`)}</div></article>`).join('')}`;
            default: return review();
            }
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
            const reviewResult = profiles && draft ? core.validate(draft, {
                forReview: true,
                pedagogicalProfile: profiles.pedagogical,
                methodologyProfile: profiles.methodologies.find(p => p.code === draft.methodologyConfig.primary?.code)
            }) : { valid: false };
            const alreadyReviewed = draft?.status === 'reviewed' && !dirty;
            const reviewAction = step === 6
                ? `<button type="button" class="btn btn-primary" data-planning-action="review" aria-describedby="planning-review-help" ${reviewResult.valid && !alreadyReviewed ? '' : 'disabled'}>${alreadyReviewed ? 'Planificación revisada' : 'Marcar como revisada'}</button>`
                    + `<span id="planning-review-help" class="planning-action-help">${alreadyReviewed ? 'Edita algún campo para crear una revisión nueva.' : reviewResult.valid ? 'La planificación cumple los requisitos de revisión.' : 'Completa los campos indicados para habilitar la revisión.'}</span>`
                : '';
            shell(`${aiPanel()}<nav class="planning-steps" aria-label="Pasos de planificación">${steps.map((label, i) => button('step', `${i + 1}. ${label}`, `data-step="${i}" ${i === step ? 'aria-current="step"' : ''}`)).join('')}</nav><h3 id="planning-step-title" tabindex="-1">${step + 1}. ${steps[step]}</h3><div class="planning-content">${content()}</div><footer class="planning-actions">${button('library', 'Mis planificaciones')}${button('previous', 'Anterior', step === 0 ? 'disabled' : '')}${step < 6 ? button('next', 'Siguiente') : ''}<button type="button" class="btn btn-ghost" data-planning-action="save" ${dirty ? '' : 'disabled'}>Guardar borrador</button>${reviewAction}</footer>`);
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
            updateAiAvailability();
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
            if (path.endsWith('.criteria')) {
                const ids = draft.curriculumMap.flatMap(e => e.criteria.map(c => c.id));
                draft.sequence.forEach(s => { s.criterionRefs = [...ids]; });
                if (draft.finalProduct) draft.finalProduct.criterionRefs = [...ids];
            }
            if (path.endsWith('.milestoneId')) draft.milestones.forEach(m => { m.sequenceItemIds = draft.sequence.filter(s => s.milestoneId === m.id).map(s => s.id); });
            markDirty();
        });
        dialog.addEventListener('change', event => {
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
                if (action === 'create' || action === 'open') {
                    busy = true;
                    if (action === 'create') {
                        const entitlements = await window.SupabaseClient?.getUserEntitlements?.();
                        if (!canCreate(target.dataset.type, entitlements)) throw new Error('No se pudo habilitar esta opción con los permisos de tu cuenta. Comprueba tu conexión y el acceso a planificación de tu plan. Puedes seguir abriendo tus borradores guardados.');
                    }
                    await loadProfiles();
                    const loaded = action === 'open' ? repository.get(target.dataset.id) : create(target.dataset.type);
                    if (!loaded || !core.validate(loaded).valid) throw new Error('No se pudo abrir este borrador.');
                    draft = copy(loaded); previous = action === 'open' ? copy(loaded) : null; step = 0; dirty = action === 'create';
                    creationMode = action === 'create' ? 'choose' : 'manual'; aiProposal = null; generating = false;
                } else if (action === 'step') step = Number(target.dataset.step);
                else if (action === 'next') step = Math.min(6, step + 1);
                else if (action === 'previous') step = Math.max(0, step - 1);
                else {
                    markDirty();
                    if (action === 'curriculum') addCurriculum(draft, profiles.didactic);
                    if (action === 'session') addSession(draft);
                    if (action === 'up' || action === 'down') reorder(draft, index, action === 'up' ? -1 : 1);
                    if (action === 'remove') removeSession(draft, index);
                    if (action === 'partial') draft.sequence[index].partialProduct = { id: uid('partial'), title: 'Producto parcial', description: '' };
                    if (action === 'product') draft.finalProduct = { id: uid('product'), title: 'Producto final', description: '', type: '', expectedComponents: [], audience: '', criterionRefs: draft.curriculumMap.flatMap(e => e.criteria.map(c => c.id)) };
                    if (action === 'milestone') draft.milestones.push({ id: uid('milestone'), title: `Hito ${draft.milestones.length + 1}`, phase: '', objective: '', partialProduct: null, sequenceItemIds: [], completionCriteria: [] });
                }
                render();
                (dialog.querySelector('#planning-mode-title') || dialog.querySelector('#planning-step-title'))?.focus();
            } catch (error) { notice(error.message, true); }
            finally { busy = false; target.disabled = false; }
        });
        dialog.addEventListener('cancel', event => { if (busy || !mayLeave()) event.preventDefault(); else dirty = false; });
        window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
        document.querySelectorAll('[data-open-planning]').forEach(button => button.addEventListener('click', () => { library(); dialog.showModal(); }));
    }
    if (typeof window !== 'undefined') window.addEventListener('DOMContentLoaded', mount, { once: true });
    return { create, canCreate, addCurriculum, addSession, reorder, removeSession, prepareSave, prepareReview,
        generationReadiness, buildGenerationInput, hasMeaningfulManualContent, acceptGeneratedProposal,
        formatAiError, generateProposal };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningWizard;
