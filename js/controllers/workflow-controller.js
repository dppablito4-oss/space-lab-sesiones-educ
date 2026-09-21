/** Workflow navigation controller. */
window.SpaceLabWorkflowController = (() => {
    'use strict';

    function create(dependencies) {
        const { state: AppState, dom: DOM, query: $, queryAll: $$, openSidebar } = dependencies;

        const WORKFLOW_STEPS = {
            'tab-ai': {
                step: 'Paso 01 de 06',
                title: 'Configura el copiloto',
                description: 'Elige el modelo, la plantilla y las referencias para preparar tu sesión.'
            },
            'tab-general': {
                step: 'Paso 02 de 06',
                title: 'Completa los datos',
                description: 'Define la institución, el grado, el área y la identidad de la sesión.'
            },
            'tab-propositos': {
                step: 'Paso 03 de 06',
                title: 'Define los propósitos',
                description: 'Alinea competencias, desempeños, evidencias y criterios de evaluación.'
            },
            'tab-design': {
                step: 'Paso 04 de 06',
                title: 'Personaliza el diseño',
                description: 'Ajusta la presentación que compartirán el editor web y la exportación Word.'
            },
            'tab-alumnos': {
                step: 'Paso 05 de 06',
                title: 'Añade a tus estudiantes',
                description: 'Prepara la lista de cotejo con los nombres del grado y la sección actual.'
            },
            'tab-fichas': {
                step: 'Paso 06 de 06',
                title: 'Fichas didácticas con IA',
                description: 'Genera el prompt especializado para crear la ficha de trabajo para imprimir.'
            }
        };
        
        function syncSessionContextTitle() {
            const contextTitle = $('#session-context-title');
            if (!contextTitle) return;
            contextTitle.textContent = DOM.inputTitulo?.value.trim() || 'Nueva sesión';
        }
        
        function updateWorkflowUi(activeTabId) {
            $$('.sidebar-tab').forEach(tab => {
                const stateLabel = tab.querySelector('.tab-state');
                const tabName = tab.querySelector('.tab-text')?.textContent || 'Etapa';
                const isActive = tab.dataset.tab === activeTabId;
                const isCompleted = AppState.completedWorkflowTabs.has(tab.dataset.tab) && !isActive;
                const state = isActive ? 'En curso' : (isCompleted ? 'Completado' : 'Pendiente');
                tab.classList.toggle('completed', isCompleted);
                tab.setAttribute('tabindex', isActive ? '0' : '-1');
                tab.setAttribute('aria-label', `${tabName}, ${state.toLowerCase()}`);
                if (stateLabel) stateLabel.textContent = state;
            });
        
            const step = WORKFLOW_STEPS[activeTabId];
            if (!step) return;
            DOM.sidebar.dataset.activeTab = activeTabId;
            const stepLabel = $('#inspector-step');
            const title = $('#inspector-title');
            const description = $('#inspector-description');
            if (stepLabel) stepLabel.textContent = step.step;
            if (title) title.textContent = step.title;
            if (description) description.textContent = step.description;
        }
        
        function activateWorkflowTab(tab, markPreviousComplete = true) {
            if (!tab) return;
            const currentTab = $('.sidebar-tab.active');
            if (markPreviousComplete && currentTab && currentTab !== tab) {
                AppState.completedWorkflowTabs.add(currentTab.dataset.tab);
            }
        
            const targetTabId = tab.dataset.tab;
            $$('.sidebar-tab').forEach(item => {
                const isTarget = item === tab;
                item.classList.toggle('active', isTarget);
                item.setAttribute('aria-selected', String(isTarget));
            });
            $$('.tab-pane').forEach(pane => pane.classList.toggle('active', pane.id === targetTabId));
            updateWorkflowUi(targetTabId);
            openSidebar();
        }
        
        // ═══════════════════════════════════════
        // INITIALIZATION
        // ═══════════════════════════════════════
        
        
        return { syncSessionContextTitle, updateWorkflowUi, activateWorkflowTab };
    }

    return { create };
})();
