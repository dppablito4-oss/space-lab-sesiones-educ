/** Student roster controller. */
window.SpaceLabStudentsController = (() => {
    'use strict';

    function create(dependencies) {
        const { state: AppState, dom: DOM, renderSession } = dependencies;

        async function loadRosterForCurrentClass() {
            const nivel = DOM.inputNivel.value;
            const grado = DOM.inputGrado.value;
            const seccion = DOM.inputSeccion.value.trim().toUpperCase();
        
            const textareaAlumnos = document.getElementById('textarea-alumnos');
            if (!textareaAlumnos) return;
        
            if (!nivel || !grado || !seccion) {
                return;
            }
        
            if (window.SupabaseClient) {
                try {
                    const alumnos = await SupabaseClient.getAlumnos(nivel, grado, seccion);
                    if (alumnos.length > 0) {
                        textareaAlumnos.value = alumnos.join('\n');
                    } else {
                        textareaAlumnos.value = '';
                    }
                } catch (err) {
                    console.warn('Error al cargar roster:', err);
                }
            }
        }
        
        async function handleSaveAlumnos() {
            const btnSave = document.getElementById('btn-save-alumnos');
            const textareaAlumnos = document.getElementById('textarea-alumnos');
            if (!btnSave || !textareaAlumnos) return;
        
            const nivel = DOM.inputNivel.value;
            const grado = DOM.inputGrado.value;
            const seccion = DOM.inputSeccion.value.trim().toUpperCase();
        
            if (!nivel || !grado || !seccion) {
                Toast.warning('Por favor especifica Nivel, Grado y Sección en la pestaña Datos antes de guardar.');
                return;
            }
        
            const nombresArray = textareaAlumnos.value.split('\n')
                .map(n => n.trim())
                .filter(n => n.length > 0);
        
            btnSave.disabled = true;
            btnSave.textContent = 'Guardando...';
        
            try {
                if (window.SupabaseClient) {
                    const user = await SupabaseClient.getCurrentUser();
                    if (!user) {
                        Toast.warning('Debes iniciar sesión con Supabase para guardar la lista de alumnos.');
                        return;
                    }
        
                    await SupabaseClient.saveAlumnos(nivel, grado, seccion, nombresArray);
                    Toast.success(`Lista de alumnos guardada con éxito para ${grado} "${seccion}" (${nivel})`);
        
                    // Actualizar la sesión activa con los nuevos alumnos y re-renderizar
                    if (AppState.currentSession) {
                        AppState.currentSession.alumnos = nombresArray;
                        renderSession(AppState.currentSession);
                    }
                } else {
                    Toast.error('Supabase no está disponible.');
                }
            } catch (error) {
                Toast.error('Error al guardar alumnos: ' + error.message);
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = 'Guardar Alumnos';
            }
        }
        
        // ═══════════════════════════════════════
        // FORM DATA COLLECTION
        // ═══════════════════════════════════════
        
        
        
        return { loadRosterForCurrentClass, handleSaveAlumnos };
    }

    return { create };
})();
