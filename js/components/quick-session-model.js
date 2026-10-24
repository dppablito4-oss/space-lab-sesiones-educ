/** Pure rules shared by the quick assistant and its regression tests. */
const QuickSessionModel = (() => {
    'use strict';
    const grades = level => level === 'INICIAL' ? ['3 años', '4 años', '5 años']
        : Array.from({length: level === 'PRIMARIA' ? 6 : level === 'SECUNDARIA' ? 5 : 0}, (_, i) => `${i + 1}°`);
    const entries = value => String(value || '').split(/[;\n]+/).map(v => v.trim().replace(/^[•*]\s*/, '')).filter(Boolean);
    const key = value => String(value || '').trim().replace(/[.。]+$/u, '').replace(/\s+/g, ' ').toLocaleLowerCase('es');
    function validate(data) {
        const errors = [];
        if (!grades(data.nivel).length) errors.push({id: 'input-nivel', message: 'Selecciona un nivel educativo.'});
        if (!grades(data.nivel).includes(data.grado)) errors.push({id: 'input-grado', message: data.nivel === 'INICIAL' ? 'Inicial requiere una edad de 3, 4 o 5 años.' : 'Selecciona un grado compatible con el nivel.'});
        if (!data.area?.trim()) errors.push({id: 'input-area', message: 'Selecciona el área curricular.'});
        if (!data.titulo?.trim()) errors.push({id: 'input-titulo', message: 'Escribe el título de la sesión.'});
        if (!/^\s*[1-9]\d*\s*(?:min(?:utos)?\.?)?\s*$/i.test(data.duracion || '')) errors.push({id: 'input-duracion', message: 'Indica una duración positiva en minutos (por ejemplo, 90 min).'});
        return errors;
    }
    function coherence(data, profiles) {
        const selected = entries(data.competencia);
        const matching = profiles.filter(p => selected.some(c => key(c) === key(p.competency.officialName)));
        const warnings = [];
        if (!profiles.length) warnings.push('No hay cobertura curricular por nivel y grado en el catálogo local. Revisa los aprendizajes en tu programa curricular; no se completarán como información oficial.');
        else if (profiles.some(p => p.status !== 'reviewed')) warnings.push('Los perfiles disponibles son piloto y contienen transcripciones condensadas. Requieren cotejo con la fuente oficial.');
        if (!selected.length) warnings.push('Aún no has seleccionado competencias. La IA podrá proponer aprendizajes que debes revisar; no son una certificación curricular.');
        else if (matching.length !== selected.length) warnings.push('Hay competencias aportadas por el docente sin coincidencia verificable para este nivel, grado y área.');
        const allowed = matching.flatMap(p => p.capacities.map(c => key(c.officialName)));
        if (entries(data.capacidad).some(c => !allowed.includes(key(c)))) warnings.push('Revisa las capacidades: alguna no coincide con las competencias seleccionadas para este alcance.');
        if (!data.desempeno?.trim()) warnings.push('No se ha precisado un desempeño. Cualquier propuesta de IA necesita revisión docente.');
        if (!data.criterio?.trim()) warnings.push('Añade criterios observables o revisa los que proponga la IA después de generar.');
        return {matching, warnings};
    }
    return {grades, entries, key, validate, coherence};
})();
if (typeof window !== 'undefined') window.QuickSessionModel = QuickSessionModel;
if (typeof module !== 'undefined' && module.exports) module.exports = QuickSessionModel;
