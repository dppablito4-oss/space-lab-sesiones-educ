export type Field = 'nivel'|'grado'|'area'|'titulo'|'duracion'|'institucion'|'docente'|'director'|'dre'|'ugel'|'fecha'|'seccion'|'competencia'|'capacidad'|'desempeno'|'activities'|'criteria'|'evidence'|'quality'|'methodology'|'template'|'alumnos'|'sourceInstruction'|'designPreset';
export interface Choice {value:string; label:string; disabled?:boolean}
export interface Profile {
    id:string; status:string; competency:{officialName:string}; capacities:{officialName:string}[];
    performancesByGrade?:Record<string,{description:string}[]>;
    provenance?:{reviewNote?:string; sourceRefs?:string[]};
}
export interface Snapshot {
    fields:Record<Field,string>; profiles:Profile[]; warnings:string[]; grades:string[];
    qualities:Choice[]; methodologies:Choice[]; templates:Choice[]; areas:Choice[]; presets:Choice[];
    curriculumStatus:string; sourceFile:string; busy:boolean; generated:number; hasDocument:boolean; linked:boolean;
    account:{signedIn:boolean; name:string; credits:string}; theme:string; view:string; legacyDestination:string;
}
export interface Bridge {
    getSnapshot:() => Snapshot;
    subscribe:(listener:()=>void) => () => void;
    setField:(field:Field,value:string) => void;
    prepare:()=>void;
    showPlanning:()=>void;
    openPlanning:()=>boolean;
    showLegacy:(destination?:'document'|'advanced'|'home'|'library')=>void;
    newSession:()=>Promise<boolean>;
    validate:()=>{id:string;message:string}[];
    toggleCompetency:(index:number)=>void;
    toggleCapacity:(index:number,capacity:number)=>void;
    refreshAvailability:()=>Promise<void>;
    generate:()=>Promise<void>;
    setAttachment:(file:File)=>void;
    removeAttachment:()=>void;
    signIn:()=>void;
    toggleTheme:()=>void;
}
declare global {interface Window {SpaceLabReactBridge?:Bridge}}
export const entries = (value:string) => value.split(/[;\n]+/).map(v=>v.trim().replace(/^[•*]\s*/, '')).filter(Boolean);
export const key = (value:string) => value.trim().replace(/[.。]+$/u,'').replace(/\s+/g,' ').toLocaleLowerCase('es');
export const includes = (value:string, name:string) => entries(value).some(v => key(v) === key(name));
