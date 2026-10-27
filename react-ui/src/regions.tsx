import {createElement,Fragment,type CSSProperties,type ReactNode} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {flushSync} from 'react-dom';

const roots=new Map<Element,{root:Root;revision:number}>();
const blocked=new Set(['script','iframe','object','embed','base','link','meta','style']);
const booleans=new Set(['disabled','hidden','required','multiple','open','readonly','autofocus','checked']);
const names:Record<string,string>={class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',
    autofocus:'autoFocus',colspan:'colSpan',rowspan:'rowSpan',maxlength:'maxLength',minlength:'minLength',
    contenteditable:'contentEditable',spellcheck:'spellCheck',autocomplete:'autoComplete',
    'stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin'};
const camel=(value:string)=>value.replace(/-([a-z])/g,(_,letter:string)=>letter.toUpperCase());

/** Adapt the existing escaped view-builder output to React nodes. User document
 * HTML remains owned by the editing/export engine. No raw HTML enters React.
 * Parse in an inert template, reject active content, and escape all text via React.
 */
function nodeFor(node:Node,key:number):ReactNode {
    if(node.nodeType===Node.TEXT_NODE)return node.textContent;
    if(!(node instanceof Element)||blocked.has(node.localName))return null;
    const tag=node.localName;
    const props:Record<string,unknown>={key};
    for(const {name,value} of Array.from(node.attributes)) {
        if(name.startsWith('on')||['srcdoc','style','selected'].includes(name))continue;
        if(['href','src','xlink:href','action','formaction'].includes(name)) {
            if(tag==='use'&&!/^#[\w-]+$/.test(value))continue;
            try {
                const protocol=new URL(value,location.href).protocol;
                if(!['http:','https:','mailto:','blob:'].includes(protocol)&&!/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value))continue;
            } catch {continue;}
        }
        if(name==='value'&&['input','textarea'].includes(tag))props.defaultValue=value;
        else if(name==='checked')props.defaultChecked=true;
        else props[names[name]||name]=booleans.has(name)?true:value;
    }
    if(node instanceof HTMLElement) {
        const style:Record<string,string>={};
        for(const property of Array.from(node.style)) {
            const value=node.style.getPropertyValue(property);
            if(!/(?:url\s*\(|expression\s*\(|javascript\s*:)/i.test(value))style[property.startsWith('--')?property:camel(property)]=value;
        }
        props.style=style as CSSProperties;
    }
    if(tag==='select') {
        const selected=Array.from(node.querySelectorAll('option[selected]')).map(option=>option.getAttribute('value')||option.textContent||'');
        if(selected.length)props.defaultValue=props.multiple?selected:selected[0];
    }
    if(tag==='textarea'){props.defaultValue=node.textContent||'';return createElement(tag,props);}
    if(['input','img','br','hr','area','col','source','wbr'].includes(tag))return createElement(tag,props);
    return createElement(tag,props,...Array.from(node.childNodes,nodeFor));
}

export function renderRegion(target:Element,markup:string) {
    for(const [element,value] of roots) {
        if(element!==target&&target.contains(element)){value.root.unmount();roots.delete(element);}
    }
    let entry=roots.get(target);
    if(!entry){entry={root:createRoot(target),revision:0};roots.set(target,entry);}
    const template=document.createElement('template');
    template.innerHTML=String(markup);
    const nodes=Array.from(template.content.childNodes,nodeFor);
    const current=entry;
    flushSync(()=>current.root.render(createElement(Fragment,{key:++current.revision},...nodes)));
    return markup;
}

export function observeRegionCleanup() {
    const observer=new MutationObserver(()=>{
        for(const [element,value] of roots) {
            if(!element.isConnected){value.root.unmount();roots.delete(element);}
        }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{observer.disconnect();roots.forEach(value=>value.root.unmount());roots.clear();};
}
