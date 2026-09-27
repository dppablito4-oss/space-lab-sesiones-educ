/** Read-only overview for an existing PlanningContainer 2.0. */
const PlanningView = (() => {
    'use strict';
    const core = typeof module !== 'undefined' && module.exports
        ? require('./planning-container-v2.js') : window.PlanningContainerV2;
    const repositoryModule = typeof module !== 'undefined' && module.exports
        ? require('./planning-repository.js') : window.PlanningRepository;
    const TYPES = {
        unit: 'Unidad de aprendizaje',
        learning_experience: 'Experiencia de aprendizaje',
        project: 'Proyecto de aprendizaje'
    };
    const LEVELS = { secondary: 'Secundaria', primary: 'Primaria', initial: 'Inicial' };
    const STATUSES = { draft: 'Borrador', reviewed: 'Revisada', archived: 'Archivada' };
    const ITEM_STATUSES = { planned: 'Planeada', generated: 'Generada', completed: 'Completada' };
    const esc = value => String(value ?? '').replace(/[&<>"']/g,
        char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
    let repository = null;
    let currentId = null;

    function text(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function humanValue(value) {
        if (typeof value === 'string') return text(value);
        if (!value || typeof value !== 'object') return '';
        return text(value.label || value.title || value.description || value.name);
    }

    function list(values) {
        const items = (Array.isArray(values) ? values : []).map(humanValue).filter(Boolean);
        return items.length ? `<ul>${items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : '';
    }

    function detail(label, value) {
        const content = text(value);
        return content ? `<div class="planning-view-detail"><h4>${esc(label)}</h4><p>${esc(content)}</p></div>` : '';
    }

    function section(title, content, className = '') {
        return content ? `<section class="planning-view-section ${className}"><h3>${esc(title)}</h3>${content}</section>` : '';
    }

    function durationLabel(duration) {
        if (!Number.isFinite(duration?.value) || duration.value < 1) return '';
        const units = { weeks: duration.value === 1 ? 'semana' : 'semanas', days: duration.value === 1 ? 'día' : 'días', minutes: 'min' };
        return `${duration.value} ${units[duration.unit] || duration.unit || ''}`.trim();
    }

    function renderHeader(container) {
        const identity = container.identity;
        const type = TYPES[identity.planningType] || 'Planificación';
        const level = LEVELS[identity.level] || identity.level;
        const grade = identity.grade ? `${identity.grade}.º` : '';
        const context = [level, identity.cycle ? `Ciclo ${identity.cycle}` : '', grade].filter(Boolean).join(' · ');
        const duration = durationLabel(identity.duration);
        const status = STATUSES[container.status] || 'Estado no disponible';
        return `<header class="planning-view-header"><span class="home-eyebrow">${esc(type)}</span><h2 id="planning-title" tabindex="-1">${esc(identity.title)}</h2><p>${esc(context)}</p>${duration ? `<p>${esc(duration)}</p>` : ''}<div class="planning-view-badges"><span class="planning-status planning-status-${esc(container.status)}">Estado: ${esc(status)}</span><span>Revisión ${container.revision}</span></div></header>`;
    }

    function renderSituation(container) {
        const situation = container.significantSituation || {};
        const content = detail('Contexto', situation.context)
            + detail('Problema u oportunidad', situation.problemOrOpportunity)
            + detail('Relevancia', situation.relevance)
            + detail('Rol de los estudiantes', situation.studentRole)
            + detail('Respuesta esperada', situation.expectedResponse);
        return section('Situación significativa', content);
    }

    function renderPurpose(container) {
        const purpose = container.purpose || {};
        const content = detail('Síntesis', purpose.summary)
            + detail('Qué aprenderán', purpose.what)
            + detail('Para qué', purpose.why)
            + detail('Contexto', purpose.context);
        return section('Propósito de aprendizaje', content);
    }

    function renderCurriculum(container) {
        const entries = (container.curriculumMap || []).map(entry => {
            const standard = text(entry.standard?.description);
            const content = `<h4>${esc(entry.area?.officialName || 'Área curricular')}</h4>`
                + detail('Competencia', entry.competency?.officialName)
                + (entry.capacities?.length ? `<h5>Capacidades</h5>${list(entry.capacities.map(item => item.officialName))}` : '')
                + (standard ? `<h5>Estándar</h5><p>${esc(standard)}</p>` : '')
                + (entry.performances?.length ? `<h5>Desempeños</h5>${list(entry.performances)}` : '')
                + (entry.criteria?.length ? `<h5>Criterios</h5>${list(entry.criteria)}` : '')
                + (entry.expectedEvidence?.length ? `<h5>Evidencias esperadas</h5>${list(entry.expectedEvidence)}` : '');
            return `<article class="planning-curriculum-card">${content}</article>`;
        }).join('');
        return section('Propósitos curriculares', entries);
    }

    function renderMethodology(container, methodologyProfile) {
        const primary = container.methodologyConfig?.primary;
        if (!primary) return '';
        const displayName = text(methodologyProfile?.displayName || primary.displayName) || 'Metodología configurada';
        const strategies = (container.methodologyConfig.supportingStrategies || []).map(item => humanValue(item)).filter(Boolean);
        const content = `<p class="planning-methodology-name">${esc(displayName)}</p>`
            + (strategies.length ? `<h4>Estrategias complementarias</h4>${list(strategies)}` : '');
        return section('Metodología principal', content);
    }

    function renderProduct(container) {
        const product = container.finalProduct;
        if (!product) return '';
        const content = detail('Producto', product.title)
            + detail('Descripción', product.description)
            + detail('Audiencia', product.audience)
            + (product.expectedComponents?.length ? `<h4>Componentes esperados</h4>${list(product.expectedComponents)}` : '');
        return section('Producto final', content);
    }

    function renderAssessment(container) {
        const assessment = container.assessmentPlan || {};
        const content = detail('Evaluación formativa', assessment.formativeAssessment)
            + detail('Retroalimentación', assessment.feedbackApproach)
            + detail('Autoevaluación', assessment.selfAssessment)
            + detail('Coevaluación', assessment.peerAssessment)
            + detail('Evaluación docente', assessment.teacherAssessment)
            + (assessment.recommendedInstruments?.length ? `<h4>Instrumentos sugeridos</h4>${list(assessment.recommendedInstruments)}` : '');
        return section('Evaluación', content);
    }

    function renderMilestones(container) {
        const milestones = (container.milestones || []).map((milestone, index) => {
            const product = milestone.partialProduct;
            const content = `<span class="home-eyebrow">Fase ${index + 1}</span><h4>${esc(milestone.title)}</h4>`
                + detail('Objetivo', milestone.objective)
                + (product ? detail('Producto parcial', product.title) + detail('Descripción', product.description) : '')
                + (milestone.completionCriteria?.length ? `<h5>Criterios de culminación</h5>${list(milestone.completionCriteria)}` : '');
            return `<article class="planning-milestone">${content}</article>`;
        }).join('');
        return section('Fases e hitos', milestones);
    }

    function sequenceAction(container, item, sessionExists = () => true) {
        if (item.type !== 'session') return { kind: 'none' };
        if (item.status === 'planned' && item.linkedDocumentRef === null) {
            return container.status === 'reviewed'
                ? { kind: 'generate', label: 'Generar sesión' }
                : { kind: 'draft', label: 'Revisa esta planificación para generar sus sesiones.' };
        }
        if (item.status === 'generated' && item.linkedDocumentRef?.id) {
            if (sessionExists(item.linkedDocumentRef.id)) {
                return { kind: 'open', label: 'Abrir sesión', sessionId: item.linkedDocumentRef.id };
            }
            return { kind: 'missing', label: 'Sesión no disponible' };
        }
        return { kind: 'none' };
    }

    function renderSequence(container, options = {}) {
        const sessionExists = typeof options.sessionExists === 'function' ? options.sessionExists : () => true;
        const milestoneById = new Map((container.milestones || []).map(item => [item.id, item]));
        const ordered = [...(container.sequence || [])].sort((left, right) => left.index - right.index);
        const weeks = new Map();
        ordered.forEach(item => {
            const key = Number.isInteger(item.week) ? item.week : null;
            if (!weeks.has(key)) weeks.set(key, []);
            weeks.get(key).push(item);
        });
        const content = [...weeks.entries()].map(([week, items]) => `<section class="planning-week"><h4>${week === null ? 'Secuencia' : `Semana ${week}`}</h4><div class="planning-sequence-list">${items.map(item => {
            const milestone = item.milestoneId ? milestoneById.get(item.milestoneId) : null;
            const status = ITEM_STATUSES[item.status] || humanValue(item.status) || 'Planeada';
            const metadata = [item.date, durationLabel(item.duration)].filter(Boolean).map(value => `<span>${esc(value)}</span>`).join('');
            const evidence = item.evidence?.length ? `<h5>Evidencia</h5>${list(item.evidence)}` : '';
            const partial = item.partialProduct ? detail('Producto parcial', item.partialProduct.title) : '';
            const instruments = item.assessmentInstruments?.length ? `<h5>Instrumentos</h5>${list(item.assessmentInstruments)}` : '';
            const action = sequenceAction(container, item, sessionExists);
            let actionHtml = '';
            if (action.kind === 'generate') {
                actionHtml = `<button type="button" class="btn btn-primary" data-planning-view-action="generate-session" data-sequence-item-id="${esc(item.id)}">${esc(action.label)}</button>`;
            } else if (action.kind === 'open') {
                actionHtml = `<button type="button" class="btn btn-primary" data-planning-view-action="open-session" data-session-id="${esc(action.sessionId)}" data-sequence-item-id="${esc(item.id)}">${esc(action.label)}</button>`;
            } else if (action.kind === 'draft' || action.kind === 'missing') {
                actionHtml = `<p class="planning-sequence-help" role="status">${esc(action.label)}</p>`;
            }
            return `<article class="planning-sequence-item" data-sequence-card-id="${esc(item.id)}" tabindex="-1"><div class="planning-sequence-heading"><span class="planning-sequence-index">${String(item.index).padStart(2, '0')}</span><div><h5>${esc(item.title)}</h5><div class="planning-sequence-meta">${metadata}</div></div><span class="planning-item-status">${esc(status)}</span></div>${milestone ? `<p><strong>Fase:</strong> ${esc(milestone.title)}</p>` : ''}${evidence}${partial}${instruments}${actionHtml ? `<div class="planning-sequence-actions">${actionHtml}</div>` : ''}</article>`;
        }).join('')}</div></section>`).join('');
        return section('Progresión', content || '<p>Aún no se ha definido una secuencia.</p>', 'planning-progression');
    }

    function render(container, options = {}) {
        const validation = core.validate(container);
        if (!validation.valid) throw new TypeError('No se puede mostrar una planificación inválida.');
        const main = renderSituation(container)
            + section('Pregunta retadora', text(container.drivingQuestion) ? `<p>${esc(container.drivingQuestion)}</p>` : '')
            + renderPurpose(container)
            + renderCurriculum(container)
            + renderMethodology(container, options.methodologyProfile)
            + renderProduct(container)
            + renderAssessment(container)
            + renderMilestones(container)
            + renderSequence(container, options);
        return `<div class="planning-shell planning-view-shell">${renderHeader(container)}<div class="planning-view-actions"><button type="button" class="btn btn-ghost" data-planning-view-action="back">← Mis planificaciones</button><button type="button" class="btn btn-primary" data-planning-view-action="edit">Editar planificación</button><button type="button" class="btn btn-ghost" data-planning-view-action="close">Cerrar</button></div><div class="planning-view-layout"><aside class="planning-view-summary" aria-label="Resumen de la planificación"><h3>Resumen</h3><p><strong>${esc(TYPES[container.identity.planningType] || 'Planificación')}</strong></p><p>${esc(STATUSES[container.status] || container.status)}</p><p>Revisión ${container.revision}</p></aside><div class="planning-view-content">${main}</div></div></div>`;
    }

    async function loadMethodologyProfile(container) {
        const code = container.methodologyConfig?.primary?.code;
        if (!code || typeof fetch !== 'function') return null;
        try {
            const response = await fetch(`data/pedagogy/methodologies/${encodeURIComponent(code)}.json`);
            return response.ok ? response.json() : null;
        } catch (_error) {
            return null;
        }
    }

    async function open(containerId, options = {}) {
        const dialog = document.getElementById('planning-dialog');
        if (!dialog) throw new Error('No se encontró la vista de planificación.');
        window.LandingRouter?.showHome?.(false);
        repository ||= repositoryModule.create({ validator: core });
        const container = repository.get(containerId);
        if (!container) throw new Error('No se encontró la planificación solicitada.');
        currentId = containerId;
        dialog.innerHTML = '<div class="planning-shell"><p role="status">Cargando planificación…</p></div>';
        if (!dialog.open) dialog.showModal();
        const methodologyProfile = await loadMethodologyProfile(container);
        const sessionExists = id => Boolean(window.StorageManager?.getSession?.(id));
        dialog.innerHTML = render(container, { methodologyProfile, sessionExists });
        (container.sequence || []).forEach(item => {
            if (item.status === 'generated' && item.linkedDocumentRef?.id && !sessionExists(item.linkedDocumentRef.id)) {
                console.warn('[PlanningView] La sesión vinculada no está disponible:', item.linkedDocumentRef.id);
            }
        });
        const focusTarget = options.focusSequenceItemId
            ? dialog.querySelector(`[data-sequence-card-id="${CSS.escape(options.focusSequenceItemId)}"]`)
            : null;
        if (focusTarget) {
            focusTarget.scrollIntoView({ block: 'center' });
            focusTarget.focus({ preventScroll: true });
        } else {
            dialog.querySelector('#planning-title')?.focus();
        }
        return container;
    }

    function close() {
        currentId = null;
        const dialog = typeof document !== 'undefined' ? document.getElementById('planning-dialog') : null;
        if (dialog?.open) dialog.close();
    }

    function mount() {
        const dialog = document.getElementById('planning-dialog');
        if (!dialog) return;
        dialog.addEventListener('click', async event => {
            const target = event.target.closest('[data-planning-view-action]');
            if (!target) return;
            const action = target.dataset.planningViewAction;
            if (action === 'close') close();
            if (action === 'back') window.dispatchEvent(new CustomEvent('planning:view-library'));
            if (action === 'edit' && currentId) window.dispatchEvent(new CustomEvent('planning:view-edit', { detail: { id: currentId } }));
            if (action === 'generate-session' && currentId) {
                try {
                    const prepared = await window.appStartLinkedSession?.(currentId, target.dataset.sequenceItemId);
                    if (prepared) {
                        close();
                        window.LandingRouter?.showApp?.(false);
                    }
                } catch (error) {
                    console.warn('[PlanningView] No se pudo iniciar la sesión vinculada:', error);
                    window.Toast?.error?.(error.message || 'No se pudo iniciar la sesión.');
                }
            }
            if (action === 'open-session') {
                const sessionId = target.dataset.sessionId;
                if (!window.StorageManager?.getSession?.(sessionId)) {
                    console.warn('[PlanningView] No se abrió una referencia inexistente:', sessionId);
                    await open(currentId, { focusSequenceItemId: target.dataset.sequenceItemId });
                    return;
                }
                window.appOpenSession?.(sessionId);
                close();
                window.LandingRouter?.showApp?.(false);
            }
        });
    }

    if (typeof window !== 'undefined') window.addEventListener('DOMContentLoaded', mount, { once: true });
    return { open, render, close, sequenceAction, renderHeader, renderSituation, renderCurriculum, renderMethodology,
        renderProduct, renderAssessment, renderMilestones, renderSequence };
})();

if (typeof window !== 'undefined') window.PlanningView = PlanningView;
if (typeof module !== 'undefined' && module.exports) module.exports = PlanningView;
