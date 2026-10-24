import * as Accordion from '@radix-ui/react-accordion';
import {ChevronDown, type LucideIcon} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Bridge, Choice, Field, Snapshot} from './bridge';

export function Disclosure({title, children, icon:Icon, note}:{title:string; children:ReactNode; icon?:LucideIcon; note?:string}) {
    return <Accordion.Root className="sl-disclosure" type="single" collapsible>
        <Accordion.Item value="content"><Accordion.Header><Accordion.Trigger className="sl-disclosure-trigger">
            {Icon && <Icon size={18}/>}<span>{title}{note && <small>{note}</small>}</span><ChevronDown size={17} className="sl-chevron"/>
        </Accordion.Trigger></Accordion.Header><Accordion.Content className="sl-disclosure-content"><div>{children}</div></Accordion.Content></Accordion.Item>
    </Accordion.Root>;
}
interface FieldProps {name:Field; label:string; state:Snapshot; bridge:Bridge; placeholder?:string; error?:string; hint?:string; rows?:number; options?:Choice[]; wide?:boolean}
export function FormField({name,label,state,bridge,placeholder,error,hint,rows,options,wide}:FieldProps) {
    const id=`react-${name}`;
    const shared={id, value:state.fields[name], onChange:(event:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>bridge.setField(name,event.target.value),
        'aria-invalid':error ? true : undefined, 'aria-describedby':error || hint ? `${id}-hint` : undefined};
    return <div className={`sl-field${wide ? ' sl-wide' : ''}`}>
        <label htmlFor={id}>{label}</label>
        {options ? <div className="sl-select-wrap"><select {...shared}>
            {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select><ChevronDown size={17} aria-hidden="true"/></div>
            : rows ? <textarea {...shared} rows={rows} maxLength={2000} placeholder={placeholder}/>
            : <input {...shared} maxLength={name === 'titulo' ? 240 : 300} placeholder={placeholder}/>}
        {(error || hint) && <small id={`${id}-hint`} className={error ? 'sl-field-error' : ''}>{error || hint}</small>}
    </div>;
}
export function SectionHeading({eyebrow,title,description,icon:Icon}:{eyebrow:string;title:string;description:string;icon:LucideIcon}) {
    return <div className="sl-card-heading"><span className="sl-card-icon"><Icon size={23}/></span><div><span className="sl-eyebrow">{eyebrow}</span><h2 id="react-step-heading" tabIndex={-1}>{title}</h2><p>{description}</p></div></div>;
}
