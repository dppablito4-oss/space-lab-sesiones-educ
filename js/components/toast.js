/* ═══════════════════════════════════════════════════
   TOAST COMPONENT — Vanilla JS
   Adaptado de mibitacora Toast.jsx
   ═══════════════════════════════════════════════════ */

const Toast = (() => {
    let container = null;
    const DURATION = 3500;

    function getContainer() {
        if (!container) {
            container = document.getElementById('toast-container');
            if (!container) {
                container = document.body;
            }
        }
        return container;
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {'success'|'error'|'info'|'warning'} type - Toast type
     * @param {number} duration - Duration in ms (default 3500)
     */
    function show(message, type = 'info', duration = DURATION) {
        const icons = {
            success: '<svg class="ui-icon" aria-hidden="true"><use href="#icon-check"></use></svg>',
            error: '<svg class="ui-icon" aria-hidden="true"><use href="#icon-close"></use></svg>',
            info: '<svg class="ui-icon" aria-hidden="true"><use href="#icon-sparkles"></use></svg>',
            warning: '<svg class="ui-icon" aria-hidden="true"><use href="#icon-alert"></use></svg>'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-msg">${message}</span>
        `;

        getContainer().appendChild(toast);

        // Auto remove after duration
        const timer = setTimeout(() => remove(toast), duration);

        // Click to dismiss
        toast.addEventListener('click', () => {
            clearTimeout(timer);
            remove(toast);
        });
    }

    function remove(toast) {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }

    function success(msg, duration) { show(msg, 'success', duration); }
    function error(msg, duration)   { show(msg, 'error', duration); }
    function info(msg, duration)    { show(msg, 'info', duration); }
    function warning(msg, duration) { show(msg, 'warning', duration); }

    return { show, success, error, info, warning };
})();
