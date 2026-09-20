/* Shared interaction behavior for the application shell. */
;(function () {
    'use strict';

    function initCommandMenus() {
        const menus = [...document.querySelectorAll('details.command-menu')];
        if (!menus.length) return;

        const closeMenus = (except = null) => {
            menus.forEach(menu => {
                if (menu !== except) menu.open = false;
            });
        };

        menus.forEach(menu => {
            menu.addEventListener('toggle', () => {
                if (menu.open) closeMenus(menu);
            });

            menu.querySelectorAll('.command-menu-panel button, .command-menu-panel a').forEach(action => {
                action.addEventListener('click', () => {
                    menu.open = false;
                });
            });
        });

        document.addEventListener('click', event => {
            if (!event.target.closest('details.command-menu')) closeMenus();
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            const openMenu = menus.find(menu => menu.open);
            if (!openMenu) return;
            openMenu.open = false;
            openMenu.querySelector('summary')?.focus();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCommandMenus, { once: true });
    } else {
        initCommandMenus();
    }
})();
