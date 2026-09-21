/** Document presentation, logo editing, and logo drag/drop controller. */
window.SpaceLabDesignController = (() => {
    'use strict';

    function create(dependencies) {
        const {
            state: AppState,
            dom: DOM,
            saveCurrentState,
            getOrCreateResizeHandle,
            hideResizeHandle,
            openLogosGalleryModal,
            swapLogos
        } = dependencies;

        function applyDesignStyles(design) {
            const sheet = DOM.sessionSheet;
            if (!sheet) return;
        
            // If no design object is provided, read current values from inputs
            const d = DocumentPresentation.normalize(design || {
                preset: DOM.designPreset?.value,
                themeColor: DOM.designColor.value,
                accentColor: DOM.designAccentColor?.value,
                fontFamily: DOM.designFontFamily.value,
                fontSize: DOM.designFontSize.value,
                padding: DOM.designPadding.value,
                lineHeight: DOM.designLineHeight.value,
                headerBg: DOM.designHeaderBg.value
            });
            const cssDesign = DocumentPresentation.toCss(d);
        
            // Sync Sidebar inputs
            DOM.designColor.value = d.primaryColor;
            DOM.designColorHex.value = d.primaryColor;
            if (DOM.designPreset) DOM.designPreset.value = d.preset;
            if (DOM.designAccentColor) DOM.designAccentColor.value = d.accentColor;
            if (DOM.designFontFamily) DOM.designFontFamily.value = cssDesign.fontFamily;
            DOM.designFontSize.value = cssDesign.fontSize;
            DOM.designPadding.value = cssDesign.padding;
            DOM.designLineHeight.value = cssDesign.lineHeight;
            DOM.designHeaderBg.value = d.headerBackground;
        
            // Sync Ribbon inputs
            if (DOM.ribbonColor) DOM.ribbonColor.value = d.primaryColor;
            if (DOM.ribbonFontFamily) DOM.ribbonFontFamily.value = cssDesign.fontFamily;
            if (DOM.ribbonFontSize) DOM.ribbonFontSize.value = cssDesign.fontSize;
            if (DOM.ribbonPadding) DOM.ribbonPadding.value = cssDesign.padding;
            if (DOM.ribbonLineHeight) DOM.ribbonLineHeight.value = cssDesign.lineHeight;
            if (DOM.ribbonHeaderBg) DOM.ribbonHeaderBg.value = d.headerBackground;
        
            sheet.style.setProperty('--theme-border-color', d.primaryColor);
            sheet.style.setProperty('--theme-primary-color', d.primaryColor);
            sheet.style.setProperty('--theme-accent-color', d.accentColor);
            sheet.style.setProperty('--session-font-family', cssDesign.fontFamily);
            sheet.style.setProperty('--session-font-size', cssDesign.fontSize);
            sheet.style.setProperty('--session-cell-padding', cssDesign.padding);
            sheet.style.setProperty('--session-line-height', cssDesign.lineHeight);
            sheet.style.setProperty('--theme-label-bg', d.headerBackground);
            sheet.style.setProperty('--theme-accent-soft', cssDesign.accentSoft);
            sheet.style.setProperty('--theme-value-bg', cssDesign.valueBackground);
        
            if (AppState.currentSession) {
                AppState.currentSession.presentation = d;
            }
        }
        
        async function applyLogoToDocument(url, targetId) {
            let id = targetId || AppState.activeLogoTarget;
        
            if (!id) {
                addLogoToHeader(url);
                return;
            }
        
            const logoImg = document.getElementById(id);
            if (logoImg) {
                logoImg.src = url;
                logoImg.style.display = 'block';
        
                // Highlight effect
                logoImg.style.transform = 'scale(1.15)';
                setTimeout(() => {
                    logoImg.style.transform = '';
                }, 300);
        
                // Close popover if open
                const popover = document.getElementById('logo-editor-popover');
                if (popover) {
                    popover.classList.add('hidden');
                }
        
                // Save state
                saveCurrentState();
                Toast.success('Logo actualizado');
            } else {
                // Fallback to adding it
                addLogoToHeader(url);
            }
        }
        
        function addLogoToHeader(url) {
            const logosList = document.getElementById('official-header-logos-list');
            if (!logosList) {
                Toast.warning('Genera la sesión primero para poder añadir logos');
                return;
            }
        
            const placeholder = document.getElementById('btn-add-header-logo');
            const id = `header-logo-${Date.now()}`;
            const newLogoHtml = `
                <div class="official-logo-item" draggable="true">
                    <img id="${id}" src="${url}" class="official-logo-img" onerror="this.src='assets/logo.png'; this.onerror=function(){this.style.display='none';};" style="width: 65px; height: auto; object-fit: contain; cursor: pointer;" title="Haz clic para editar, arrastra para reordenar" draggable="false">
                    <button type="button" class="btn-remove-logo no-print" title="Eliminar logo" aria-label="Eliminar logo" onclick="this.parentElement.remove(); window.dispatchEvent(new CustomEvent('logo-removed'));"><svg class="ui-icon" aria-hidden="true"><use href="#icon-close"></use></svg></button>
                </div>
            `;
        
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newLogoHtml.trim();
            const newLogoNode = tempDiv.firstChild;
        
            if (placeholder) {
                logosList.insertBefore(newLogoNode, placeholder);
            } else {
                logosList.appendChild(newLogoNode);
            }
        
            saveCurrentState();
            Toast.success('Logo añadido al encabezado');
        
            // Open editor popover on the newly added logo immediately so they can adjust size
            const img = newLogoNode.querySelector('img');
            if (img) {
                setTimeout(() => {
                    openLogoEditor(img);
                }, 100);
            }
        }
        
        function openLogoEditor(target) {
            if (!target) return;
            AppState.activeLogoTarget = target.id;
        
            const popover = document.getElementById('logo-editor-popover');
            const widthSlider = document.getElementById('logo-editor-width-slider');
            const widthVal = document.getElementById('logo-editor-width-val');
            const heightSlider = document.getElementById('logo-editor-height-slider');
            const heightVal = document.getElementById('logo-editor-height-val');
            const heightContainer = document.getElementById('logo-editor-height-container');
            const fitContainer = document.getElementById('logo-editor-fit-container');
            const aspectRatioCheckbox = document.getElementById('logo-editor-aspect-ratio');
            const fitBtns = popover.querySelectorAll('.btn-fit');
        
            if (!popover) return;
        
            // 1. Position the popover relative to the image
            popover.style.display = 'block';
            popover.classList.remove('hidden');
        
            const rect = target.getBoundingClientRect();
            let top = window.scrollY + rect.bottom + 10;
            let left = window.scrollX + rect.left + (rect.width / 2) - (popover.offsetWidth / 2);
        
            if (left < 10) left = 10;
            if (left + popover.offsetWidth > window.innerWidth - 10) {
                left = window.innerWidth - popover.offsetWidth - 10;
            }
        
            popover.style.top = `${top}px`;
            popover.style.left = `${left}px`;
        
            // 2. Load current values
            let currentWidth = parseInt(target.style.width, 10);
            if (isNaN(currentWidth)) {
                currentWidth = target.offsetWidth || 65;
            }
            widthSlider.value = currentWidth;
            widthVal.textContent = `${currentWidth}px`;
        
            let currentHeight = target.style.height;
            let isAutoHeight = !currentHeight || currentHeight === 'auto';
        
            aspectRatioCheckbox.checked = isAutoHeight;
        
            if (isAutoHeight) {
                heightContainer.classList.add('hidden');
                heightContainer.style.display = 'none';
                fitContainer.classList.add('hidden');
                fitContainer.style.display = 'none';
            } else {
                heightContainer.classList.remove('hidden');
                heightContainer.style.display = 'flex';
                fitContainer.classList.remove('hidden');
                fitContainer.style.display = 'flex';
                let numericHeight = parseInt(currentHeight, 10);
                if (isNaN(numericHeight)) {
                    numericHeight = target.offsetHeight || 65;
                }
                heightSlider.value = numericHeight;
                heightVal.textContent = `${numericHeight}px`;
            }
        
            const currentFit = target.style.objectFit || 'contain';
            fitBtns.forEach(btn => {
                if (btn.dataset.fit === currentFit) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        
            // 3. Position the Resize Handle
            const handle = getOrCreateResizeHandle();
            handle.style.display = 'block';
            handle.style.top = `${window.scrollY + rect.bottom - 5}px`;
            handle.style.left = `${window.scrollX + rect.right - 5}px`;
        }
        
        function initLogoEditorListeners() {
            const popover = document.getElementById('logo-editor-popover');
            if (!popover) return;
        
            const closeBtn = document.getElementById('logo-editor-close');
            const galleryTrigger = document.getElementById('logo-editor-gallery-trigger');
            const swapBtn = document.getElementById('logo-editor-swap');
            const deleteBtn = document.getElementById('logo-editor-delete');
            const widthSlider = document.getElementById('logo-editor-width-slider');
            const widthVal = document.getElementById('logo-editor-width-val');
            const heightSlider = document.getElementById('logo-editor-height-slider');
            const heightVal = document.getElementById('logo-editor-height-val');
            const heightContainer = document.getElementById('logo-editor-height-container');
            const fitContainer = document.getElementById('logo-editor-fit-container');
            const aspectRatioCheckbox = document.getElementById('logo-editor-aspect-ratio');
            const fitBtns = popover.querySelectorAll('.btn-fit');
            const resetBtn = document.getElementById('logo-editor-reset');
        
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    popover.style.display = 'none';
                    popover.classList.add('hidden');
                    hideResizeHandle();
                });
            }
        
            if (galleryTrigger) {
                galleryTrigger.addEventListener('click', () => {
                    openLogosGalleryModal();
                });
            }
        
            if (swapBtn) {
                swapBtn.addEventListener('click', () => {
                    swapLogos();
                });
            }
        
            widthSlider.addEventListener('input', () => {
                if (!AppState.activeLogoTarget) return;
                const target = document.getElementById(AppState.activeLogoTarget);
                if (!target) return;
        
                const w = widthSlider.value;
                widthVal.textContent = `${w}px`;
                target.style.width = `${w}px`;
                target.style.maxWidth = 'none';
                target.style.maxHeight = 'none';
        
                if (aspectRatioCheckbox.checked) {
                    target.style.height = 'auto';
                } else {
                    target.style.height = `${heightSlider.value}px`;
                }
        
                // Reposition handle dynamically when width changes
                const rect = target.getBoundingClientRect();
                const handle = document.getElementById('logo-resize-handle');
                if (handle) {
                    handle.style.top = `${window.scrollY + rect.bottom - 5}px`;
                    handle.style.left = `${window.scrollX + rect.right - 5}px`;
                }
                saveCurrentState();
            });
        
            heightSlider.addEventListener('input', () => {
                if (!AppState.activeLogoTarget) return;
                const target = document.getElementById(AppState.activeLogoTarget);
                if (!target) return;
        
                const h = heightSlider.value;
                heightVal.textContent = `${h}px`;
                target.style.height = `${h}px`;
                target.style.maxWidth = 'none';
                target.style.maxHeight = 'none';
        
                // Reposition handle dynamically when height changes
                const rect = target.getBoundingClientRect();
                const handle = document.getElementById('logo-resize-handle');
                if (handle) {
                    handle.style.top = `${window.scrollY + rect.bottom - 5}px`;
                    handle.style.left = `${window.scrollX + rect.right - 5}px`;
                }
                saveCurrentState();
            });
        
            aspectRatioCheckbox.addEventListener('change', () => {
                if (!AppState.activeLogoTarget) return;
                const target = document.getElementById(AppState.activeLogoTarget);
                if (!target) return;
        
                if (aspectRatioCheckbox.checked) {
                    heightContainer.classList.add('hidden');
                    heightContainer.style.display = 'none';
                    fitContainer.classList.add('hidden');
                    fitContainer.style.display = 'none';
                    target.style.height = 'auto';
                    target.style.objectFit = 'contain';
                } else {
                    heightContainer.classList.remove('hidden');
                    heightContainer.style.display = 'flex';
                    fitContainer.classList.remove('hidden');
                    fitContainer.style.display = 'flex';
                    const h = heightSlider.value;
                    heightVal.textContent = `${h}px`;
                    target.style.height = `${h}px`;
        
                    const activeBtn = popover.querySelector('.btn-fit.active');
                    target.style.objectFit = activeBtn ? activeBtn.dataset.fit : 'contain';
                }
        
                // Reposition handle dynamically
                const rect = target.getBoundingClientRect();
                const handle = document.getElementById('logo-resize-handle');
                if (handle) {
                    handle.style.top = `${window.scrollY + rect.bottom - 5}px`;
                    handle.style.left = `${window.scrollX + rect.right - 5}px`;
                }
                saveCurrentState();
            });
        
            fitBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (!AppState.activeLogoTarget) return;
                    const target = document.getElementById(AppState.activeLogoTarget);
                    if (!target) return;
        
                    fitBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
        
                    target.style.objectFit = btn.dataset.fit;
                    saveCurrentState();
                });
            });
        
            deleteBtn.addEventListener('click', () => {
                if (!AppState.activeLogoTarget) return;
                const target = document.getElementById(AppState.activeLogoTarget);
                if (!target) return;
        
                const item = target.closest('.official-logo-item');
                if (item) {
                    item.remove();
                } else {
                    target.style.display = 'none';
                }
        
                popover.style.display = 'none';
                popover.classList.add('hidden');
                hideResizeHandle();
                saveCurrentState();
                Toast.success('Logo removido');
            });
        
            resetBtn.addEventListener('click', () => {
                if (!AppState.activeLogoTarget) return;
                const target = document.getElementById(AppState.activeLogoTarget);
                if (!target) return;
        
                if (AppState.activeLogoTarget === 'header-logo-left') {
                    target.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Escudo_Nacional_del_Per%C3%BA.svg/130px-Escudo_Nacional_del_Per%C3%BA.svg.png';
                } else {
                    target.src = 'https://sesiones.sypablitodp.site/assets/logo.png';
                }
        
                target.style.width = '65px';
                target.style.height = 'auto';
                target.style.objectFit = 'contain';
                target.style.display = 'block';
                target.removeAttribute('style');
                target.style.cursor = 'pointer';
        
                popover.style.display = 'none';
                popover.classList.add('hidden');
                hideResizeHandle();
                saveCurrentState();
                Toast.success('Valores restablecidos');
            });
        
            window.addEventListener('click', (e) => {
                if (!popover.classList.contains('hidden') && !popover.contains(e.target)) {
                    const clickedLogo = e.target.classList.contains('official-logo-img');
                    const clickedRibbonLeft = e.target.id === 'btn-ribbon-logo-left';
                    const clickedRibbonRight = e.target.id === 'btn-ribbon-logo-right';
                    const clickedResizeHandle = e.target.id === 'logo-resize-handle' || e.target.classList.contains('logo-resize-handle');
                    const clickedContextMenu = e.target.closest('#editor-context-menu');
                    const clickedModal = e.target.closest('#logos-gallery-modal');
                    if (!clickedLogo && !clickedRibbonLeft && !clickedRibbonRight && !clickedResizeHandle && !clickedContextMenu && !clickedModal) {
                        popover.style.display = 'none';
                        popover.classList.add('hidden');
                        hideResizeHandle();
                    }
                }
            });
        }
        
        function setupDragAndDrop() {
            const sheet = DOM.sessionSheet;
            if (!sheet) return;
        
            // Helper to find closest element during drag reordering
            function getDragAfterElement(container, x) {
                const draggableElements = [...container.querySelectorAll('.official-logo-item:not(.dragging)')];
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = x - box.left - box.width / 2;
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }
        
            // Drag start delegation
            sheet.addEventListener('dragstart', (e) => {
                const logoItem = e.target.closest('.official-logo-item');
                if (logoItem) {
                    logoItem.classList.add('dragging');
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', logoItem.querySelector('img').id);
                }
            });
        
            // Drag over delegation
            sheet.addEventListener('dragover', (e) => {
                const logosList = e.target.closest('#official-header-logos-list');
                if (logosList) {
                    const dragging = sheet.querySelector('.official-logo-item.dragging');
                    if (dragging) {
                        e.preventDefault();
                        const afterElement = getDragAfterElement(logosList, e.clientX);
                        const placeholder = document.getElementById('btn-add-header-logo');
                        if (afterElement == null) {
                            if (placeholder) {
                                logosList.insertBefore(dragging, placeholder);
                            } else {
                                logosList.appendChild(dragging);
                            }
                        } else {
                            logosList.insertBefore(dragging, afterElement);
                        }
                    } else {
                        // Check if dragging gallery logo
                        const isUrl = e.dataTransfer.types.includes('text/uri-list') || e.dataTransfer.types.includes('text/plain');
                        if (isUrl) {
                            e.preventDefault();
                            logosList.style.outline = '2px dashed var(--accent)';
                        }
                    }
                }
            });
        
            // Drag leave delegation
            sheet.addEventListener('dragleave', (e) => {
                const logosList = e.target.closest('#official-header-logos-list');
                if (logosList && !logosList.contains(e.relatedTarget)) {
                    logosList.style.outline = '';
                }
            });
        
            // Drop delegation
            sheet.addEventListener('drop', (e) => {
                const logosList = e.target.closest('#official-header-logos-list');
                if (logosList) {
                    logosList.style.outline = '';
                    const dragging = sheet.querySelector('.official-logo-item.dragging');
                    if (dragging) {
                        e.preventDefault();
                        dragging.classList.remove('dragging');
                        saveCurrentState();
                    } else {
                        // Drop gallery URL
                        const url = e.dataTransfer.getData('text/plain');
                        if (url) {
                            e.preventDefault();
                            addLogoToHeader(url);
                        }
                    }
                }
            });
        
            // Drag end delegation
            sheet.addEventListener('dragend', (e) => {
                const dragging = sheet.querySelector('.official-logo-item.dragging');
                if (dragging) {
                    dragging.classList.remove('dragging');
                }
            });
        }
        
        // ═══════════════════════════════════════
        // SOURCE FILE UPLOAD & PARSING
        // ═══════════════════════════════════════
        
        
        return {
            applyDesignStyles,
            applyLogoToDocument,
            addLogoToHeader,
            openLogoEditor,
            initLogoEditorListeners,
            setupDragAndDrop
        };
    }

    return { create };
})();
