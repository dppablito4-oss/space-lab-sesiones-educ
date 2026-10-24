import {BookOpenCheck, Lightbulb, PencilLine, Sparkles, TriangleAlert} from 'lucide-react';
import {Disclosure, FormField, SectionHeading} from './components';
import {includes, type Bridge, type Snapshot} from './bridge';

export function LearningStep({state,bridge}:{state:Snapshot;bridge:Bridge}) {
    const selected=state.profiles.filter(profile=>includes(state.fields.competencia,profile.competency.officialName));
    return <section className="sl-card sl-main-card" aria-labelledby="react-step-heading">
        <SectionHeading icon={BookOpenCheck} eyebrow="CON INTENCIÓN PEDAGÓGICA" title="Define los aprendizajes" description="Elige qué trabajarán tus estudiantes y aporta tus ideas para la clase."/>
        <div className="sl-form-body">
            <div className={state.profiles.length ? 'sl-inline-info' : 'sl-inline-info caution'}><TriangleAlert size={19}/><p>{state.profiles.length ? 'Referencias curriculares de perfiles piloto. Revisa su correspondencia con tu programa curricular.' : state.curriculumStatus || 'Comprobando la cobertura curricular…'}</p></div>
            <div className="sl-section-label"><h3>Competencias y capacidades</h3><span className="sl-count">{selected.length} seleccionadas</span></div>
            <div className="sl-competencies">{state.profiles.map((profile,index)=> {
                const checked=includes(state.fields.competencia,profile.competency.officialName);
                return <div key={profile.id} className={`sl-competency${checked ? ' selected' : ''}`}>
                    <label className="sl-competency-label"><input type="checkbox" checked={checked} onChange={()=>bridge.toggleCompetency(index)}/><span>{profile.competency.officialName}</span></label>
                    {checked && <div className="sl-capacities">{profile.capacities.map((capacity,capacityIndex)=><label key={capacity.officialName}><input type="checkbox" checked={includes(state.fields.capacidad,capacity.officialName)} onChange={()=>bridge.toggleCapacity(index,capacityIndex)}/><span>{capacity.officialName}</span></label>)}</div>}
                </div>;
            })}</div>
            <Disclosure icon={PencilLine} title={state.profiles.length ? 'Ajustar o aportar aprendizajes manualmente' : 'Añadir aprendizajes de tu programa curricular'}>
                <FormField name="competencia" label="Competencias" state={state} bridge={bridge} rows={3} hint="Una por línea o separadas por punto y coma."/>
                <FormField name="capacidad" label="Capacidades" state={state} bridge={bridge} rows={3}/>
            </Disclosure>
            <FormField name="desempeno" label="Desempeño precisado" state={state} bridge={bridge} rows={3} placeholder="¿Qué desempeño observable esperas en esta sesión?" hint="Aporta el desempeño de tu programa curricular y contextualízalo para tu aula."/>
            {selected.length>0 && <Disclosure icon={BookOpenCheck} title="Consultar desempeños de referencia">
                {selected.map(profile=><div className="sl-reference" key={profile.id}><strong>{profile.competency.officialName}</strong><p>{profile.provenance?.reviewNote || 'Referencia piloto sujeta a cotejo con el programa curricular del MINEDU.'}</p><ul>{(profile.performancesByGrade?.[state.fields.grado.match(/\d+/)?.[0] || ''] || []).map(item=><li key={item.description}>{item.description}</li>)}</ul></div>)}
            </Disclosure>}
            <div className="sl-ideas-card"><div className="sl-ideas-heading"><span><Lightbulb size={21}/></span><div><h3>Tus ideas hacen la diferencia</h3><p>Propuestas editables, separadas de las referencias curriculares.</p></div><Sparkles size={19}/></div>
                <FormField name="activities" label="Actividades que te gustaría incluir" state={state} bridge={bridge} rows={3} placeholder="Ej. Explorar precios del mercado y comparar cantidades en equipos"/>
                <FormField name="criteria" label="Criterios de evaluación" state={state} bridge={bridge} rows={3} placeholder="¿Cómo reconocerás que están aprendiendo? Un criterio por línea."/>
                <FormField name="evidence" label="Evidencia de aprendizaje" state={state} bridge={bridge} rows={2} placeholder="¿Qué producirán o demostrarán tus estudiantes?"/>
                <p className="sl-small-note">Si dejas estas propuestas vacías, podrás revisar las que complete la IA al generar. No se presentarán como textos curriculares oficiales.</p>
            </div>
        </div>
    </section>;
}
