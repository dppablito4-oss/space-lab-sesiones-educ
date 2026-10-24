/** Moves live form controls, never copies them: both modes have one source of truth. */
window.SpaceLabQuickSession = (() => {
    'use strict';
    const byId = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const model = window.QuickSessionModel;
    const cache = new Map();
    function json(path) {
        if (!cache.has(path)) cache.set(path, fetch(path).then(r => {
            if (!r.ok) throw new Error(`Catálogo no disponible: ${path}`);
            return r.json();
        }).catch(error => { cache.delete(path); throw error; }));
        return cache.get(path);
    }
    function create({form, getSession, openSidebar}) {
        const root = byId('quick-session');
        let mode = 'advanced', step = 1, profiles = [], scopeKey = '', request = 0;
        const placements = [];
        const value = id => byId(id)?.value.trim() || '';
        const data = () => ({nivel: value('input-nivel'), grado: value('input-grado'), area: value('input-area'), titulo: value('input-titulo'), duracion: value('input-duracion'), competencia: value('input-competencia'), capacidad: value('input-capacidad'), desempeno: value('input-desempeno'), criterio: value('input-session-criteria')});
        function mount(node, target) {
            const anchor = document.createComment('quick-session: original position');
            node.before(anchor);
            placements.push({node, anchor, target});
        }
        ['input-nivel', 'input-grado', 'input-titulo', 'input-area', 'input-duracion'].forEach(id => mount(byId(id).closest('.form-group'), 'quick-data-fields'));
        // Capture parents only after recording the child anchors. Restore parents first.
        Array.from(byId('tab-general').children).filter(el => !el.matches('header')).forEach(node => mount(node, 'quick-institution-fields'));
        Array.from(byId('tab-propositos').children).filter(el => !el.matches('header')).forEach(node => mount(node, node.id === 'session-proposals' ? 'quick-proposal-fields' : 'quick-learning-fields'));
        [['tab-ai','quick-ai-options'], ['tab-design','quick-design-options'], ['tab-alumnos','quick-student-options'], ['tab-fichas','quick-worksheet-options']].forEach(([id, slot]) => {
            Array.from(byId(id).children).filter(el => !el.matches('.planner-section-heading')).forEach(node => mount(node, slot));
        });
        function syncGrades() {
            const allowed = model.grades(value('input-nivel'));
            const select = byId('input-grado');
            // Keep incompatible imported values visible and flag them; do not silently discard data.
            Array.from(select.options).forEach(option => {
                const compatible = !option.value || allowed.includes(option.value);
                option.hidden = !compatible && option.value !== select.value;
                option.disabled = !compatible && option.value !== select.value;
            });
            const label = form.querySelector('label[for="input-grado"]');
            label.textContent = value('input-nivel') === 'INICIAL' ? 'Edad' : 'Grado';
        }
        function showStep(next, focus = true) {
            step = next;
            root.querySelectorAll('[data-quick-panel]').forEach(panel => { panel.hidden = Number(panel.dataset.quickPanel) !== step; });
            root.querySelectorAll('[data-quick-step]').forEach(button => {
                if (Number(button.dataset.quickStep) === step) button.setAttribute('aria-current', 'step');
                else button.removeAttribute('aria-current');
            });
            byId('quick-back').disabled = step === 1;
            byId('quick-next').hidden = step === 3;
            byId('quick-step-status').textContent = `Paso ${step} de 3 · ${['Datos','Aprendizajes','Revisar y generar'][step - 1]}`;
            document.body.classList.toggle('session-quick-review', mode === 'quick' && step === 3);
            review();
            if (mode === 'quick' && focus) {
                form.scrollTo({top: 0, behavior: 'instant'});
                byId(`quick-title-${step}`).focus({preventScroll: true});
            }
        }
        function validate() {
            if (mode !== 'quick') return true;
            const errors = model.validate(data());
            ['input-nivel','input-grado','input-area','input-titulo','input-duracion'].forEach(id => byId(id).removeAttribute('aria-invalid'));
            byId('quick-errors').hidden = !errors.length;
            byId('quick-errors').textContent = errors.map(e => e.message).join(' ');
            if (!errors.length) return true;
            showStep(1, false);
            errors.forEach(error => byId(error.id).setAttribute('aria-invalid', 'true'));
            byId(errors[0].id).focus();
            return false;
        }
        function review() {
            const d = data();
            const facts = [['Título',d.titulo], ['Grupo',[d.nivel,d.grado,d.area].filter(Boolean).join(' · ')], ['Duración',d.duracion], ['Competencias',d.competencia], ['Capacidades',d.capacidad], ['Desempeño por verificar',d.desempeno], ['Criterios propuestos',d.criterio], ['Evidencia propuesta',value('input-session-evidence')], ['Actividades propuestas',value('input-session-activities')]];
            byId('quick-review').innerHTML = facts.map(([label,text]) => `<div><dt>${label}</dt><dd>${escape(text || 'Por definir')}</dd></div>`).join('');
            const {matching, warnings} = model.coherence(d, profiles);
            if (getSession()?.planning?.mode === 'linked' || window.getPendingPlanningLink?.()) warnings.push('Sesión vinculada: se conservará el contexto heredado de la unidad o proyecto.');
            if (!value('textarea-alumnos')) warnings.push('Sin alumnos registrados: puedes generar la sesión y añadir la lista después.');
            byId('quick-warnings').innerHTML = warnings.map(w => `<li>${escape(w)}</li>`).join('') || '<li>Las selecciones coinciden con el catálogo disponible. Revisa su pertinencia pedagógica.</li>';
            byId('quick-official-performances').innerHTML = matching.length ? matching.map(p => `<section><strong>${escape(p.competency.officialName)}</strong><p>Perfil ${escape(p.status)} · ${escape(p.provenance?.sourceRefs?.join(', '))}</p><p>${escape(p.provenance?.reviewNote || 'Verifica la fuente curricular.')}</p><ul>${(p.performancesByGrade?.[d.grado.match(/\d+/)?.[0]] || []).map(item => `<li>${escape(item.description)}</li>`).join('')}</ul></section>`).join('') : '<p>No hay desempeños verificados para la selección actual. No se inventarán desempeños oficiales.</p>';
        }
        async function refreshCurriculum() {
            const d = data();
            const key = [d.nivel,d.grado,d.area].join('|');
            if (key === scopeKey) return;
            scopeKey = key;
            const token = ++request;
            profiles = [];
            byId('quick-curriculum-status').textContent = 'Comprobando cobertura curricular…';
            window.SpaceLabCurriculumPicker?.setScope([]);
            try {
                const catalog = await json('data/pedagogy/catalog.json');
                const level = {INICIAL:'initial',PRIMARIA:'primary',SECUNDARIA:'secondary'}[d.nivel];
                const grade = d.grado.match(/\d+/)?.[0];
                const cycle = Number(grade) <= 2 ? 'vi' : 'vii';
                const refs = (catalog.curriculumProfiles || []).filter(ref => ref.status !== 'archived' && ref.path.startsWith(`curriculum/${level}/`) && (level !== 'secondary' || ref.path.includes(`/cycle-${cycle}/`)));
                const fetched = await Promise.all(refs.map(ref => json(`data/pedagogy/${ref.path}`)));
                if (token !== request || mode !== 'quick') return;
                profiles = fetched.filter(p => p.scope?.level === level && p.scope.grades.includes(grade) && model.key(p.scope.area.officialName) === model.key(d.area));
                byId('quick-curriculum-status').textContent = profiles.length ? 'Catálogo curricular con procedencia · perfiles piloto, sujetos a revisión docente.' : 'Cobertura oficial por nivel y grado no disponible. Puedes aportar los aprendizajes manualmente y cotejarlos con tu programa curricular.';
            } catch {
                if (token !== request || mode !== 'quick') return;
                byId('quick-curriculum-status').textContent = 'No se pudo comprobar el catálogo. Revisa manualmente el programa curricular.';
            }
            window.SpaceLabCurriculumPicker?.setScope(profiles);
            review();
            window.dispatchEvent(new CustomEvent('spacelab:quick-curriculum-updated'));
        }
        function setMode(next, focus = true) {
            mode = next;
            if (mode === 'quick') placements.forEach(({node,target}) => byId(target).append(node));
            else placements.slice().reverse().forEach(({node,anchor}) => anchor.after(node));
            document.body.classList.toggle('session-quick-mode', mode === 'quick');
            root.hidden = mode !== 'quick';
            byId('session-mode-quick').setAttribute('aria-pressed', String(mode === 'quick'));
            byId('session-mode-advanced').setAttribute('aria-pressed', String(mode === 'advanced'));
            byId('quick-errors').hidden = true;
            if (mode === 'quick') {
                syncGrades(); scopeKey = ''; refreshCurriculum(); showStep(step, focus);
            } else {
                ++request;
                Array.from(byId('input-grado').options).forEach(option => { option.disabled = false; option.hidden = false; });
                window.SpaceLabCurriculumPicker?.setScope(null);
                form.querySelector('label[for="input-grado"]').textContent = 'Grado';
                document.body.classList.remove('session-quick-review');
                if (focus) byId('session-mode-advanced').focus();
            }
        }
        byId('quick-open-planner').addEventListener('click', () => { openSidebar({focusClose:false}); showStep(step); });
        byId('session-mode-quick').addEventListener('click', () => setMode('quick'));
        byId('session-mode-advanced').addEventListener('click', () => setMode('advanced'));
        byId('quick-next').addEventListener('click', () => { if (validate()) showStep(Math.min(3, step + 1)); });
        byId('quick-back').addEventListener('click', () => showStep(Math.max(1, step - 1)));
        root.querySelectorAll('[data-quick-step]').forEach(button => button.addEventListener('click', () => {
            const next = Number(button.dataset.quickStep);
            if (next < step || validate()) showStep(next);
        }));
        const refresh = () => {
            if (mode !== 'quick') return;
            syncGrades(); refreshCurriculum(); review();
        };
        form.addEventListener('input', refresh);
        form.addEventListener('change', refresh);
        window.addEventListener('spacelab:session-loaded', refresh);
        window.addEventListener('spacelab:session-generated', refresh);
        window.addEventListener('spacelab:profile-defaults-loaded', refresh);
        window.addEventListener('spacelab:session-cleared', () => { scopeKey = ''; showStep(1, false); refresh(); });
        return {validate, refresh, setMode, getCurriculum: () => profiles, focusStep: () => showStep(step), isQuick: () => mode === 'quick'};
    }
    return {create};
})();
