import {BookOpen, Building2, Clock3, GraduationCap, Sprout} from 'lucide-react';
import {Disclosure, FormField, SectionHeading} from './components';
import type {Bridge, Field, Snapshot} from './bridge';

export function DataStep({state,bridge,errors}:{state:Snapshot;bridge:Bridge;errors:Partial<Record<Field,string>>}) {
    const levelNames:Record<string,string>={INICIAL:'Inicial',PRIMARIA:'Primaria',SECUNDARIA:'Secundaria'};
    const validGrade=state.grades.includes(state.fields.grado);
    const grades=[{value:'',label:state.fields.nivel==='INICIAL' ? 'Selecciona la edad' : 'Selecciona el grado'},
        ...state.grades.map(value=>({value,label:value.includes('años') ? value : `${value.replace('°','.º')} grado`}))];
    if (state.fields.grado && !validGrade) grades.push({value:state.fields.grado,label:`${state.fields.grado} · revisa el nivel`});
    return <section className="sl-card sl-main-card" aria-labelledby="react-step-heading">
        <SectionHeading icon={GraduationCap} eyebrow="EL PUNTO DE PARTIDA" title="Cuéntanos sobre tu clase" description="Solo lo esencial para crear una sesión que conecte con tus estudiantes."/>
        <div className="sl-form-body">
            <fieldset className="sl-level-field"><legend>Nivel educativo</legend><div className="sl-levels">
                {([{value:'INICIAL',Icon:Sprout},{value:'PRIMARIA',Icon:BookOpen},{value:'SECUNDARIA',Icon:GraduationCap}]).map(({value,Icon}) =>
                    <button key={value} type="button" className={state.fields.nivel===value ? 'sl-level selected' : 'sl-level'} aria-pressed={state.fields.nivel===value} onClick={()=>bridge.setField('nivel',value)}><Icon size={22}/><span>{levelNames[value]}</span><span className="sl-radio-dot"/></button>)}
            </div></fieldset>
            <div className="sl-field-grid">
                <FormField name="grado" label={state.fields.nivel==='INICIAL' ? 'Edad de tus estudiantes' : 'Grado de tus estudiantes'} state={state} bridge={bridge} options={grades} error={errors.grado}/>
                <FormField name="area" label="Área curricular" state={state} bridge={bridge} options={state.areas.map(o=>o.value ? o : {...o,label:'Selecciona un área'})} error={errors.area}/>
                <FormField name="titulo" label="¿Qué aprenderán hoy?" state={state} bridge={bridge} placeholder="Ej. Descubrimos las matemáticas en nuestro mercado" hint="Dale un título que describa el aprendizaje de la sesión." error={errors.titulo} wide/>
                <div className="sl-duration sl-wide"><div className="sl-duration-heading"><Clock3 size={17}/><span>Tiempo para aprender</span></div>
                    <div className="sl-duration-options">{[45,60,90,120].map(minutes=><button type="button" key={minutes} aria-pressed={parseInt(state.fields.duracion)===minutes} className={parseInt(state.fields.duracion)===minutes ? 'selected' : ''} onClick={()=>bridge.setField('duracion',`${minutes} min`)}>{minutes}<small> min</small></button>)}
                        <FormField name="duracion" label="Duración personalizada" state={state} bridge={bridge} placeholder="Ej. 80 min" error={errors.duracion}/>
                    </div>
                </div>
            </div>
            <Disclosure icon={Building2} title="Tu institución y tu aula" note="Opcional · puedes completarlo después">
                <div className="sl-field-grid"><FormField name="institucion" label="Institución educativa" state={state} bridge={bridge} wide/>
                    <FormField name="docente" label="Docente" state={state} bridge={bridge}/><FormField name="seccion" label="Sección" state={state} bridge={bridge} placeholder="Ej. A"/>
                    <FormField name="director" label="Director/a" state={state} bridge={bridge}/><FormField name="ugel" label="UGEL" state={state} bridge={bridge}/>
                </div><p className="sl-small-note">Usamos los datos disponibles de tu perfil sin reemplazar lo que ya escribiste.</p>
            </Disclosure>
        </div>
    </section>;
}
