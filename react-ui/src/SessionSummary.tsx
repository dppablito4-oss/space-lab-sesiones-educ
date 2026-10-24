import {ArrowUpRight, BookOpen, Check, Clock3, FileText, GraduationCap, Layers3, ShieldCheck, Target} from 'lucide-react';
import {entries, type Snapshot} from './bridge';

export function SessionSummary({state}:{state:Snapshot}) {
    const f=state.fields;
    return <aside className="sl-summary" aria-label="Resumen de tu sesión">
        <div className="sl-session-preview"><div className="sl-preview-pattern" aria-hidden="true"><span/><span/><span/><BookOpen size={44}/></div>
            <span className="sl-preview-kicker">ASÍ VA TU SESIÓN</span>
            <h3 className={!f.titulo ? 'empty' : ''}>{f.titulo || 'Una idea que se convierte en aprendizaje'}</h3>
            <div className="sl-preview-tags"><span><GraduationCap size={14}/>{f.grado || 'Tu grupo'}</span><span><Clock3 size={14}/>{f.duracion || 'Tu tiempo'}</span></div>
            <div className="sl-preview-area"><span>{f.area || 'Elige un área curricular'}</span><ArrowUpRight size={17}/></div>
        </div>
        <div className="sl-summary-details"><div className="sl-section-label"><h3>Una clase con propósito</h3><span className="sl-status-dot"/></div>
            {[
                {Icon:Target,title:'Aprendizajes claros',text:entries(f.competencia).length ? `${entries(f.competencia).length} competencias seleccionadas` : 'Competencias y criterios de evaluación'},
                {Icon:Layers3,title:'Una secuencia completa',text:'Inicio, desarrollo y cierre'},
                {Icon:FileText,title:'Lista para trabajar',text:'Revisa, edita y exporta a Word o PDF'}
            ].map(({Icon,title,text})=><div className="sl-summary-item" key={title}><span><Icon size={18}/></span><div><strong>{title}</strong><p>{text}</p></div><Check size={14}/></div>)}
        </div>
        <div className="sl-teacher-note"><ShieldCheck size={20}/><div><strong>Tu criterio, siempre al centro.</strong><p>La IA propone. Tú revisas y adaptas cada aprendizaje a tu aula.</p></div></div>
    </aside>;
}
