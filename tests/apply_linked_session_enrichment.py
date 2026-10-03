"""Enriquece PlanningLinkedSession con campos de Secundaria (coordinador, criterios, evidencias, instrumentos)."""
from pathlib import Path

# 1. Update linked-session.js
p_linked = Path("js/planning/linked-session.js")
content = p_linked.read_text(encoding="utf-8").replace("\r\n", "\n")

old_block = """        const duration = item.duration?.value ? `${item.duration.value} minutos` : '';
        return Object.freeze({
            link,
            metadata: Object.freeze({
                institucion: administration.institution || '',
                dre: administration.dre || '',
                ugel: administration.ugel || '',
                docente: administration.teacher || '',
                director: administration.director || '',
                fecha: item.date || '',
                nivel: LEVELS[identity.level] || String(identity.level || '').toUpperCase(),
                grado: identity.grade ? (identity.level === 'initial' ? `${identity.grade} años` : `${identity.grade}°`) : '',
                seccion: (administration.sections || []).join(', '),
                area: maps.map(entry => entry.area?.officialName).filter(Boolean).join(' / '),
                numero_sesion: String(item.index),
                duracion: duration,
                unidad: identity.title || '',
                titulo: item.title || '',
                competencia: competencies.join('; '),
                capacidad: capacities.join('; '),
                desempeno: performances.join('; '),
                enfoque: approaches[0] || '',
                enfoque2: approaches[1] || '',
                methodology: snapshot.methodologyConfig?.primary?.code || '',
                inheritedContextSnapshot: snapshot
            })
        });"""

new_block = """        const duration = item.duration?.value ? `${item.duration.value} minutos` : '';
        const criteria = maps.flatMap(entry => humanNames(entry.criteria, item.criterionRefs?.length ? item.criterionRefs : undefined));
        const evidenceStr = Array.isArray(item.evidence) ? item.evidence.map(e => e.description || e.label || String(e)).filter(Boolean).join('; ') : '';
        const instrumentStr = Array.isArray(item.assessmentInstruments) ? item.assessmentInstruments.map(i => i.label || i.description || String(i)).filter(Boolean).join('; ') : '';
        const knowledgeStr = Array.isArray(item.knowledge) ? item.knowledge.join('; ') : '';

        return Object.freeze({
            link,
            metadata: Object.freeze({
                institucion: administration.institution || '',
                dre: administration.dre || '',
                ugel: administration.ugel || '',
                docente: administration.teacher || '',
                director: administration.director || '',
                coordinador: administration.coordinator || '',
                fecha: item.date || '',
                nivel: LEVELS[identity.level] || String(identity.level || '').toUpperCase(),
                grado: identity.grade ? (identity.level === 'initial' ? `${identity.grade} años` : `${identity.grade}°`) : '',
                seccion: (administration.sections || []).join(', '),
                area: maps.map(entry => entry.area?.officialName).filter(Boolean).join(' / '),
                numero_sesion: String(item.index),
                duracion: duration,
                unidad: identity.title || '',
                titulo: item.title || '',
                competencia: competencies.join('; '),
                capacidad: capacities.join('; '),
                desempeno: performances.join('; '),
                criterios: criteria,
                criterio: criteria.join('; '),
                producto_evidencia: evidenceStr,
                instrumento: instrumentStr,
                conocimientos: knowledgeStr,
                enfoque: approaches[0] || '',
                enfoque2: approaches[1] || '',
                methodology: snapshot.methodologyConfig?.primary?.code || '',
                inheritedContextSnapshot: snapshot
            })
        });"""

assert old_block in content, "old_block not found in linked-session.js"
content = content.replace(old_block, new_block)
p_linked.write_text(content, encoding="utf-8")
print("linked-session.js updated successfully")

# 2. Update js/app.js
p_app = Path("js/app.js")
content_app = p_app.read_text(encoding="utf-8").replace("\r\n", "\n")

old_app_block = """        populateForm({
            template: 'estandar',
            metadata: {
                ...metadata,
                numeroSesion: metadata.numero_sesion,
                duracionMinutos: parseMinutes(metadata.duracion) || 90
            },
            proposito: {
                competencia: metadata.competencia,
                capacidades: String(metadata.capacidad || '').split(';').map(value => value.trim()).filter(Boolean),
                desempeno: metadata.desempeno,
                enfoque: metadata.enfoque,
                enfoque2: metadata.enfoque2
            }
        });"""

new_app_block = """        populateForm({
            template: 'estandar',
            metadata: {
                ...metadata,
                numeroSesion: metadata.numero_sesion,
                duracionMinutos: parseMinutes(metadata.duracion) || 90
            },
            proposito: {
                competencia: metadata.competencia,
                capacidades: String(metadata.capacidad || '').split(';').map(value => value.trim()).filter(Boolean),
                desempeno: metadata.desempeno,
                criterios: Array.isArray(metadata.criterios) && metadata.criterios.length ? metadata.criterios : String(metadata.criterio || '').split(';').map(v => v.trim()).filter(Boolean),
                producto_evidencia: metadata.producto_evidencia || '',
                instrumento: metadata.instrumento || '',
                conocimientos: metadata.conocimientos || '',
                enfoque: metadata.enfoque,
                enfoque2: metadata.enfoque2
            }
        });"""

assert old_app_block in content_app, "old_app_block not found in js/app.js"
content_app = content_app.replace(old_app_block, new_app_block)
p_app.write_text(content_app, encoding="utf-8")
print("js/app.js updated successfully")
