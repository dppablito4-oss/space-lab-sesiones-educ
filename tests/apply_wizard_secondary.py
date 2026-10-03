"""Actualiza js/planning/planning-wizard.js con los campos de Secundaria y la Tabla Dual."""
from pathlib import Path

wizard_path = Path("js/planning/planning-wizard.js")
content = wizard_path.read_text(encoding="utf-8").replace("\r\n", "\n")

# 1. Update write function to safely initialize missing objects
old_write = """        const write = (path, value) => {
            const keys = path.split('.');
            const last = keys.pop();
            keys.reduce((obj, key) => obj[key], draft)[last] = value;
        };"""

new_write = """        const write = (path, value) => {
            const keys = path.split('.');
            const last = keys.pop();
            const target = keys.reduce((obj, key) => {
                if (!obj[key] || typeof obj[key] !== 'object') obj[key] = {};
                return obj[key];
            }, draft);
            target[last] = value;
        };"""

assert old_write in content, "old_write not found in planning-wizard.js"
content = content.replace(old_write, new_write)

# 2. Update Case 0 (Comunidad educativa -> Ficha Técnica de Secundaria)
old_case_0 = """            case 0:
                return `${sectionCard('Contexto general', `${draft.identity.grade}.º de Secundaria · Ciclo ${draft.identity.cycle}. El ciclo se resuelve automáticamente desde el grado.`,
                    `<div class="planning-grid">${field('identity.title', 'Título')}${field('identity.grade', 'Grado', 'text', [['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º']])}${field('identity.duration.value', 'Duración en semanas', 'number')}${field('identity.startDate', 'Fecha de inicio', 'date')}${field('identity.endDate', 'Fecha de fin', 'date')}</div>`)}
                    ${sectionCard('Comunidad educativa', 'Registra los datos que ayudan a situar la experiencia.',
                    `<div class="planning-grid">${field('administrativeContext.institution', 'Institución')}${field('administrativeContext.teacher', 'Docente')}${field('administrativeContext.sections', 'Secciones (una por línea)', 'lines')}</div>`)}
                    ${sectionCard('Conoce al grupo', 'Resume necesidades, intereses y oportunidades del contexto.',
                    `<div class="planning-grid">${field('learnerContext.students', 'Contexto del grupo', 'textarea')}${field('learnerContext.diagnosis', 'Necesidades', 'textarea')}${field('learnerContext.interests', 'Intereses (uno por línea)', 'lines')}${field('learnerContext.localContext', 'Situación local', 'textarea')}</div>`)}`;"""

new_case_0 = """            case 0:
                return `${sectionCard('Contexto general', `${draft.identity.grade}.º de Secundaria · Ciclo ${draft.identity.cycle}. El ciclo se resuelve automáticamente desde el grado.`,
                    `<div class="planning-grid">${field('identity.title', 'Título')}${field('identity.grade', 'Grado', 'text', [['1', '1.º'], ['2', '2.º'], ['3', '3.º'], ['4', '4.º'], ['5', '5.º']])}${field('identity.duration.value', 'Duración en semanas', 'number')}${field('identity.startDate', 'Fecha de inicio', 'date')}${field('identity.endDate', 'Fecha de fin', 'date')}</div>`)}
                    ${sectionCard('Comunidad educativa y Gestión Pedagógica (Secundaria)', 'Registra los datos institucionales de la I.E. y el equipo pedagógico.',
                    `<div class="planning-grid">
                        ${field('administrativeContext.institution', 'Institución Educativa')}
                        ${field('administrativeContext.director', 'Director(a)')}
                        ${field('administrativeContext.coordinator', 'Coordinador(a) Pedagógico(a) JEC')}
                        ${field('administrativeContext.teacher', 'Docente Responsable')}
                        ${field('administrativeContext.dre', 'DRE')}
                        ${field('administrativeContext.ugel', 'UGEL')}
                        ${field('administrativeContext.period', 'Periodo / Bimestre')}
                        ${field('administrativeContext.sections', 'Secciones (una por línea)', 'lines')}
                    </div>`)}
                    ${sectionCard('Conoce al grupo', 'Resume necesidades, intereses y oportunidades del contexto.',
                    `<div class="planning-grid">${field('learnerContext.students', 'Contexto del grupo', 'textarea')}${field('learnerContext.diagnosis', 'Necesidades', 'textarea')}${field('learnerContext.interests', 'Intereses (uno por línea)', 'lines')}${field('learnerContext.localContext', 'Situación local', 'textarea')}</div>`)}`;"""

assert old_case_0 in content, "old_case_0 not found in planning-wizard.js"
content = content.replace(old_case_0, new_case_0)

# 3. Update Case 1 (Situación y Propósito + Producto Integrador Dual)
old_case_1 = """            case 1:
                return `${sectionCard('Situación significativa', 'Describe el contexto real y el desafío que movilizará los aprendizajes.',
                    field('significantSituation.context', 'Contexto', 'textarea') + field('significantSituation.problemOrOpportunity', 'Problema u oportunidad', 'textarea'))}
                    ${sectionCard('Propósito de aprendizaje', 'Formula una pregunta movilizadora y el aprendizaje esperado.',
                    field('drivingQuestion', 'Pregunta retadora', 'textarea') + field('purpose.summary', 'Propósito de aprendizaje', 'textarea'))}`;"""

new_case_1 = """            case 1:
                if (!draft.finalProduct) {
                    draft.finalProduct = { id: uid('product'), title: '', description: '', type: '', expectedComponents: [], audience: '', criterionRefs: [] };
                }
                return `${sectionCard('Situación significativa y Reto', 'Describe el contexto real y el desafío que movilizará los aprendizajes de Secundaria.',
                    field('significantSituation.context', 'Contexto y Diagnóstico', 'textarea') + field('significantSituation.problemOrOpportunity', 'Problema o Reto de la comunidad', 'textarea') + field('drivingQuestion', 'Pregunta retadora', 'textarea'))}
                    ${sectionCard('Propósito de la Unidad y Producto Integrador (Tabla Dual)', 'Define el aprendizaje global esperado y el producto final que lo evidencia.',
                    `<div class="planning-grid">
                        ${field('purpose.summary', 'Propósito de Aprendizaje', 'textarea')}
                        ${field('finalProduct.title', 'Producto Final Integrador')}
                        ${field('finalProduct.description', 'Descripción y características del producto', 'textarea')}
                    </div>`)}`;"""

assert old_case_1 in content, "old_case_1 not found in planning-wizard.js"
content = content.replace(old_case_1, new_case_1)

# 4. Update criteria in Case 2 (C1-C4 guidance)
old_crit = "${field(`curriculumMap.${index}.criteria`, 'Criterios (uno por línea)', 'descriptions')}"
new_crit = "${field(`curriculumMap.${index}.criteria`, 'Criterios de Evaluación (C1, C2, C3, C4 - uno por línea)', 'descriptions')}"
assert old_crit in content, "old_crit not found in planning-wizard.js"
content = content.replace(old_crit, new_crit)

wizard_path.write_text(content, encoding="utf-8")
print("✓ planning-wizard.js successfully adapted for secondary official structure!")
