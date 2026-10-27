type Runtime = {hydrated:boolean; ready:boolean; failures:string[]; mode?:string};
declare global {interface Window {SpaceLabFrontend?:Runtime;SpaceLabControllerBoot?:{start:()=>Promise<void>}}}

/** Classic domain modules keep their global contracts, but run only after the
 * React tree owns the DOM. The manifest is also visible to preload/CI tools.
 */
export async function startControllers() {
    const runtime=window.SpaceLabFrontend!;
    if(!window.SpaceLabControllerBoot)throw new Error('No se cargó el arranque de la aplicación.');
    await window.SpaceLabControllerBoot.start();
    // Theme's early head script could not bind controls before hydration.
    document.querySelectorAll<HTMLSelectElement>('[data-theme-selector],#theme-preference').forEach(select=>{
        const theme=(window as unknown as {SpaceLabTheme?:{getPreference:()=>string;setPreference:(value:string)=>void}}).SpaceLabTheme;
        if(theme){select.value=theme.getPreference();select.addEventListener('change',()=>theme.setPreference(select.value));}
    });
    runtime.ready=true;
    window.dispatchEvent(new CustomEvent('spacelab:frontend-ready'));
}

export function installMotion() {
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    let previous:Animation|undefined;
    const animate=(event:Event)=>{
        if(reduced.matches)return;
        const view=(event as CustomEvent<{view?:string}>).detail?.view;
        const target=view ? document.getElementById(`${view}-view`) : document.querySelector<HTMLElement>('.sl-main');
        if(!target || target.classList.contains('hidden'))return;
        previous?.cancel();
        previous=target.animate([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],
            {duration:180,easing:'cubic-bezier(.2,.8,.2,1)'});
    };
    window.addEventListener('spacelab:view-changed',animate);
    window.addEventListener('spacelab:frontend-navigate',animate);
    return ()=>{previous?.cancel();window.removeEventListener('spacelab:view-changed',animate);window.removeEventListener('spacelab:frontend-navigate',animate);};
}
