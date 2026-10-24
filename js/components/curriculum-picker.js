/* Checkbox controls over the existing curriculum fields; session storage stays unchanged. */
window.SpaceLabCurriculumPicker = (() => {
    'use strict';
    const byId = id => document.getElementById(id);
    const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const entries = value => String(value || '').split(/[;\n]+/).map(v => v.trim().replace(/^[•*]\s*/, '')).filter(Boolean);
    const count = (n, noun, plural = `${noun}s`) => `${n} ${n === 1 ? noun : plural}`;
    const key = value => String(value).trim().replace(/[.。]+$/u,'').replace(/\s+/g,' ').toLocaleLowerCase('es');
    const has = (values, name) => values.some(value => key(value) === key(name));
    let scopedProfiles = null;
    let catalog = null, loaded = false, lastMarkup = '', initialized = false;

    function areaCompetencies() {
        if (scopedProfiles !== null) return scopedProfiles.map(p => ({nombre:p.competency.officialName, capacidades:p.capacities.map(c => c.officialName)}));
        return catalog?.areas?.[byId('input-area')?.value]?.competencias || [];
    }

    function summary() {
        if (!byId('planning-summary-title')) return;
        const value = id => byId(id)?.value.trim() || '';
        byId('planning-summary-title').textContent = value('input-titulo') || 'Tu próxima clase';
        byId('planning-summary-context').textContent = [value('input-area'),value('input-grado'),value('input-nivel')].filter(Boolean).join(' · ') || 'Completa los datos de tu sesión.';
        const duration = value('input-duracion');
        const method = byId('select-methodology');
        const facts = [
            ['Duración', duration ? duration + (/^\d+$/.test(duration) ? ' minutos' : '') : 'Por definir'],
            ['Aprendizajes', `${count(entries(value('input-competencia')).length,'competencia')} · ${count(entries(value('input-capacidad')).length,'capacidad','capacidades')}`],
            ['Método', method?.value ? method.selectedOptions[0]?.textContent : 'Según el área elegida'],
            ['Docente', value('input-docente') || 'Por completar']
        ];
        byId('planning-summary-facts').innerHTML = facts.map(([label,text]) => `<div><dt>${label}</dt><dd>${escape(text)}</dd></div>`).join('');
    }

    function refresh() {
        summary();
        const host = byId('curriculum-picker');
        if (!host) return;
        const competencies = areaCompetencies();
        const selected = entries(byId('input-competencia')?.value);
        const capacities = entries(byId('input-capacidad')?.value);
        let markup;
        if (!loaded) markup = '<p class="curriculum-help" role="status">Cargando el catálogo de aprendizajes…</p>';
        else if (!competencies.length) {
            markup = '<p class="curriculum-help">No hay competencias verificadas para esta selección. Puedes aportar aprendizajes manualmente; verifica su correspondencia con tu programa curricular.</p>';
            byId('curriculum-manual').open = true;
        } else markup = '<p class="curriculum-help">Marca las competencias y luego las capacidades que trabajarás en esta sesión.</p>' + competencies.map((c,i) => {
            const checked = has(selected,c.nombre);
            return `<section class="curriculum-item"><label class="curriculum-competency"><input id="curriculum-competency-${i}" type="checkbox" data-curriculum-competency="${i}"${checked ? ' checked' : ''}><span>${escape(c.nombre)}</span></label>${checked ? `<div class="curriculum-capacities" role="group" aria-label="Capacidades de ${escape(c.nombre)}"><div class="curriculum-capacity-heading"><span>CAPACIDADES</span><button type="button" class="curriculum-select-all" data-curriculum-all="${i}">${c.capacidades.every(cap => has(capacities,cap)) ? 'Desmarcar todas' : 'Marcar todas'}</button></div>${c.capacidades.map((cap,j) => `<label class="curriculum-capacity"><input id="curriculum-capacity-${i}-${j}" type="checkbox" data-curriculum-capacity="${i}:${j}"${has(capacities,cap) ? ' checked' : ''}><span>${escape(cap)}</span></label>`).join('')}</div>` : ''}</section>`;
        }).join('');
        if (markup === lastMarkup) return;
        const focusedId = host.contains(document.activeElement) ? document.activeElement.id : '';
        const scroll = byId('session-form').scrollTop;
        host.innerHTML = markup; lastMarkup = markup;
        if (focusedId) byId(focusedId)?.focus({preventScroll:true});
        byId('session-form').scrollTop = scroll;
    }

    function write(id, values) {
        const field = byId(id);
        const seen = new Set();
        field.value = values.filter(value => {
            const normalized = key(value);
            if (seen.has(normalized)) return false;
            seen.add(normalized); return true;
        }).join('; ');
        field.dispatchEvent(new Event('input',{bubbles:true}));
    }

    function change(event) {
        const el = event.target;
        const competencies = areaCompetencies();
        if (el.hasAttribute('data-curriculum-competency')) {
            const c = competencies[Number(el.dataset.curriculumCompetency)];
            if (!c) return;
            const existing = entries(byId('input-competencia').value);
            write('input-competencia', el.checked ? [...existing,c.nombre] : existing.filter(name => key(name) !== key(c.nombre)));
            if (!el.checked) {
                const remaining = entries(byId('input-competencia').value);
                const used = competencies.filter(item => has(remaining,item.nombre)).flatMap(item => item.capacidades);
                write('input-capacidad',entries(byId('input-capacidad').value).filter(cap => !has(c.capacidades,cap) || has(used,cap)));
            }
        } else if (el.hasAttribute('data-curriculum-capacity')) {
            const [i,j] = el.dataset.curriculumCapacity.split(':').map(Number);
            const cap = competencies[i]?.capacidades[j];
            if (!cap) return;
            const existing = entries(byId('input-capacidad').value);
            write('input-capacidad',el.checked ? [...existing,cap] : existing.filter(name => key(name) !== key(cap)));
        }
        refresh();
    }

    function setCatalog(value) {
        catalog = value; loaded = true;
        document.documentElement.classList.add('curriculum-picker-ready');
        const names = areaCompetencies().map(c => c.nombre);
        const custom = entries(byId('input-competencia')?.value).some(name => !has(names,name));
        const manual = byId('curriculum-manual');
        if (manual && names.length && !custom) manual.open = false;
        refresh();
    }

    function init() {
        if (initialized || !byId('curriculum-picker')) return;
        initialized = true;
        byId('curriculum-picker').addEventListener('change',change);
        byId('curriculum-picker').addEventListener('click',event => {
            const button = event.target.closest('[data-curriculum-all]');
            if (!button) return;
            const capacities = areaCompetencies()[Number(button.dataset.curriculumAll)]?.capacidades;
            if (!capacities) return;
            const existing = entries(byId('input-capacidad').value);
            const all = capacities.every(cap => has(existing,cap));
            write('input-capacidad',all ? existing.filter(cap => !has(capacities,cap)) : [...existing,...capacities]);
            refresh();
            byId('curriculum-picker').querySelector(`[data-curriculum-all="${button.dataset.curriculumAll}"]`)?.focus({preventScroll:true});
        });
        byId('session-form').addEventListener('input',refresh);
        byId('session-form').addEventListener('change',refresh);
        window.addEventListener('spacelab:session-loaded',refresh);
        window.addEventListener('spacelab:session-cleared',refresh);
        refresh();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
    return Object.freeze({refresh,setCatalog,setScope(profiles) { scopedProfiles = profiles; lastMarkup = ''; refresh(); }});
})();
