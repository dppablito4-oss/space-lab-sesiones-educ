/* Deprecated administration entry. Operations moved to the permission-scoped
   React center; never query teacher content or purge documents on page load. */
(() => {
    const root = document.getElementById('admin-root');
    if (!root) window.location.replace('admin.html');
})();
