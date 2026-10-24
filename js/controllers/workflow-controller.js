/** Continuous planner navigation: normal scrolling plus persistent section shortcuts. */
window.SpaceLabWorkflowController = (() => {
    'use strict';

    function create(dependencies) {
        const { state: AppState, dom: DOM, query: $, queryAll: $$, openSidebar } = dependencies;

        const buttons = Array.from($$('.sidebar-tab'));
        const sections = Array.from(DOM.form.querySelectorAll('.tab-pane'));
        const visited = AppState.visitedWorkflowSections;
        let scrollFrame = null;
        
        function syncSessionContextTitle() {
            const contextTitle = $('#session-context-title');
            if (!contextTitle) return;
            contextTitle.textContent = DOM.inputTitulo?.value.trim() || 'Nueva sesión';
        }
        
        function updateWorkflowUi(activeSectionId) {
            if (!sections.some(section => section.id === activeSectionId)) return;
            visited.add(activeSectionId);
            buttons.forEach(button => {
                const active = button.dataset.tab === activeSectionId;
                const seen = visited.has(button.dataset.tab) && !active;
                const name = button.querySelector('.tab-text')?.textContent || 'Sección';
                const state = active ? 'En curso' : seen ? 'Visitado' : 'Pendiente';
                button.classList.toggle('active',active);
                button.classList.toggle('visited',seen);
                button.classList.remove('completed');
                button.setAttribute('tabindex','0');
                button.setAttribute('aria-label',`${name}, ${state.toLowerCase()}`);
                if (active) button.setAttribute('aria-current','step');
                else button.removeAttribute('aria-current');
                const label = button.querySelector('.tab-state');
                if (label) label.textContent = state;
            });
            sections.forEach(section => section.classList.toggle('active',section.id === activeSectionId));
            DOM.sidebar.dataset.activeTab = activeSectionId;
        }

        function syncFromScroll() {
            if (document.body.classList.contains('session-quick-mode')) return;
            if (!DOM.sidebar.classList.contains('open') || !DOM.form.clientHeight) return;
            const marker = DOM.form.getBoundingClientRect().top + Math.min(120,DOM.form.clientHeight * .25);
            let current = sections[0];
            for (const section of sections) {
                if (section.getBoundingClientRect().top <= marker) current = section;
                else break;
            }
            if (DOM.form.scrollTop > 0 && DOM.form.scrollHeight - DOM.form.scrollTop - DOM.form.clientHeight < 4) {
                current = sections[sections.length - 1];
            }
            if (current) updateWorkflowUi(current.id);
        }

        function scheduleScrollSync() {
            if (scrollFrame !== null) return;
            scrollFrame = window.requestAnimationFrame(() => {
                scrollFrame = null;
                syncFromScroll();
            });
        }

        function activateWorkflowTab(button) {
            const section = sections.find(item => item.id === button?.dataset.tab);
            if (!section) return;
            openSidebar({focusClose:false});
            const top = DOM.form.scrollTop + section.getBoundingClientRect().top - DOM.form.getBoundingClientRect().top - 28;
            DOM.form.scrollTo({top:Math.max(0,top),behavior:'instant'});
            updateWorkflowUi(section.id);
        }

        DOM.form.addEventListener('scroll',scheduleScrollSync,{passive:true});
        window.addEventListener('resize',scheduleScrollSync);
        window.addEventListener('spacelab:session-cleared',() => {
            visited.clear();
            DOM.form.scrollTop = 0;
            updateWorkflowUi(sections[0]?.id);
        });
        return { syncSessionContextTitle, updateWorkflowUi, activateWorkflowTab };
    }

    return { create };
})();
