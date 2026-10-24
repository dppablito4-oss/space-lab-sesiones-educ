/** Optional React prototype adapter. The existing form remains the source of truth. */
window.SpaceLabReactSessionBridge = (() => {
    'use strict';
    const fields = {
        nivel:'input-nivel', grado:'input-grado', area:'input-area', titulo:'input-titulo', duracion:'input-duracion',
        institucion:'input-institucion', docente:'input-docente', director:'input-director', dre:'input-dre', ugel:'input-ugel',
        fecha:'input-fecha', seccion:'input-seccion', competencia:'input-competencia', capacidad:'input-capacidad', desempeno:'input-desempeno',
        activities:'input-session-activities', criteria:'input-session-criteria', evidence:'input-session-evidence',
        quality:'select-ai-provider', methodology:'select-methodology', template:'select-template', alumnos:'textarea-alumnos',
        sourceInstruction:'input-source-instruction', designPreset:'select-design-preset'
    };
    function create({form, quickSession, getSession, getSourceFile, generate, openSidebar, closeSidebar}) {
        const byId = id => document.getElementById(id);
        const isReady = () => byId('react-preview-root')?.dataset.ready === 'true';
        const listeners = new Set();
        let busy = false, generated = 0, snapshot, legacyDestination = 'landing', planningRoute = '';
        const options = id => Array.from(byId(id)?.options || []).filter(option => !option.hidden || option.selected)
            .map(option => ({value:option.value, label:option.textContent.trim(), disabled:option.disabled}));
        function read() {
            const values = Object.fromEntries(Object.entries(fields).map(([name,id]) => [name,byId(id)?.value || '']));
            const profiles = quickSession.getCurriculum();
            const user = window.SupabaseClient?.getSessionUserSync?.();
            const data = {...values, criterio:values.criteria};
            const {warnings} = window.QuickSessionModel.coherence(data, profiles);
            if (getSession()?.planning?.mode === 'linked' || window.getPendingPlanningLink?.()) warnings.push('Esta sesión conserva el contexto y la secuencia de su unidad o experiencia.');
            return {
                fields:values, profiles, warnings, busy, generated, legacyDestination,
                view:document.body.dataset.reactPreview || 'legacy',
                curriculumStatus:byId('quick-curriculum-status')?.textContent || '',
                qualities:options('select-ai-provider'), methodologies:options('select-methodology'), templates:options('select-template'),
                areas:options('input-area'), presets:options('select-design-preset'),
                grades:window.QuickSessionModel.grades(values.nivel),
                sourceFile:getSourceFile()?.name || '',
                hasDocument:Boolean(getSession()?.id),
                linked:Boolean(getSession()?.planning?.mode === 'linked' || window.getPendingPlanningLink?.()),
                account:{signedIn:Boolean(user), name:user ? byId('header-user-name')?.textContent?.trim() || 'Mi cuenta' : 'Ingresar',
                    credits:user ? byId('header-user-credits')?.textContent?.trim() || '' : ''},
                theme:window.SpaceLabTheme?.getResolvedTheme?.() || 'light'
            };
        }
        function emit() { snapshot=read(); listeners.forEach(listener => listener()); }
        function setField(name, value) {
            const field = byId(fields[name]);
            if (!field || typeof value !== 'string') throw new Error('Campo de edición inválido');
            field.value = value;
            field.dispatchEvent(new Event('input', {bubbles:true}));
            field.dispatchEvent(new Event('change', {bubbles:true}));
            emit();
        }
        function showLegacy(destination = 'document') {
            if (document.body.dataset.reactPreview === 'planning' && !window.SpaceLabPlanningStudio.leave()) return;
            legacyDestination = destination;
            document.body.dataset.reactPreview = 'legacy';
            if (destination === 'home' || destination === 'library') {
                closeSidebar(false);
                window.LandingRouter.showHome(false, {scrollToSessions:destination === 'library'});
                history.replaceState(null, '', destination === 'library' ? '#/sessions' : '#/home');
            } else {
                window.LandingRouter.showApp(false);
                if (destination === 'advanced') { quickSession.setMode('advanced', false); openSidebar({focusClose:true}); }
                else closeSidebar(false);
            }
            emit();
        }
        function prepare() {
            if (document.body.dataset.reactPreview === 'planning' && !window.SpaceLabPlanningStudio.leave()) return;
            document.body.dataset.reactPreview = 'wizard';
            quickSession.setMode('quick', false);
            closeSidebar(false);
            emit();
        }
        function showPlanning() {
            planningRoute = window.location.hash;
            document.body.dataset.reactPreview = 'planning';
            closeSidebar(false);
            emit();
        }
        function route() {
            if (!isReady()) return;
            if (document.body.dataset.reactPreview === 'planning' && !window.SpaceLabPlanningStudio.leave()) {
                history.replaceState(null, '', planningRoute || '#/app');
                return;
            }
            if (['#/landing','#/home','#/sessions'].includes(window.location.hash)) {
                document.body.dataset.reactPreview = 'legacy';
                emit();
            } else if (['#/sessions/new','#/app','#/editor'].includes(window.location.hash)) prepare();
        }
        window.addEventListener('hashchange', route);
        window.addEventListener('spacelab:view-changed', event => {
            if (!isReady() || document.body.dataset.reactPreview === 'planning') return;
            if (event.detail.view === 'landing' || event.detail.view === 'home') {
                legacyDestination = event.detail.view;
                document.body.dataset.reactPreview = 'legacy';
                emit();
            }
        });
        byId('planning-dialog')?.addEventListener('close', () => {
            if (document.body.dataset.reactPreview === 'planning') showLegacy('home');
        });
        form.addEventListener('input', emit);
        form.addEventListener('change', emit);
        const events = ['spacelab:session-loaded','spacelab:session-cleared','spacelab:profile-defaults-loaded',
            'spacelab:account-changed','spacelab:quick-curriculum-updated','spacelab:themechange'];
        events.forEach(name => window.addEventListener(name, emit));
        window.addEventListener('spacelab:session-generated', () => { generated++; showLegacy(); });
        const observer = new MutationObserver(emit);
        observer.observe(form, {subtree:true, childList:true, attributes:true, attributeFilter:['disabled','hidden']});
        ['header-user-badge','source-file-info'].forEach(id => {
            if (byId(id)) observer.observe(byId(id), {subtree:true,childList:true,attributes:true});
        });
        if (['#/landing','#/home','#/sessions'].includes(window.location.hash)) document.body.dataset.reactPreview = 'legacy';
        snapshot=read();
        return Object.freeze({
            isReady,
            getSnapshot:() => snapshot,
            subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
            setField, prepare, showLegacy, showPlanning,
            openPlanning:() => window.SpaceLabPlanningStudio.open(),
            async newSession() {
                if (document.body.dataset.reactPreview === 'planning' && !window.SpaceLabPlanningStudio.leave()) return false;
                const result = await window.appStartNewSession();
                if (result) prepare();
                return result;
            },
            validate:() => window.QuickSessionModel.validate(read().fields),
            toggleCompetency(index) { byId('curriculum-picker').querySelector(`[data-curriculum-competency="${index}"]`)?.click(); emit(); },
            toggleCapacity(index, capacity) { byId('curriculum-picker').querySelector(`[data-curriculum-capacity="${index}:${capacity}"]`)?.click(); emit(); },
            async refreshAvailability() { await window.SpaceLabAiAvailability.refresh(); emit(); },
            async generate() {
                if (busy) return;
                busy=true; emit();
                try { await generate(); } finally { busy=false; emit(); }
            },
            setAttachment(file) {
                const transfer = new DataTransfer(); transfer.items.add(file);
                const input=byId('input-source-file'); input.files=transfer.files;
                input.dispatchEvent(new Event('change', {bubbles:true}));
            },
            removeAttachment() { byId('btn-remove-source-file').click(); emit(); },
            signIn() { window.AuthUi.openModal(); },
            toggleTheme() { window.SpaceLabTheme.setPreference(snapshot.theme === 'dark' ? 'light' : 'dark'); }
        });
    }
    return {create};
})();
