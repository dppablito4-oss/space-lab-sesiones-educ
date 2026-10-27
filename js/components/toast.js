/* Notification facade: React owns text, dismissal and notification lifetimes. */
const Toast = (() => {
    const show = (message, type = 'info', duration = 3500) => window.SpaceLabReactUI?.toast(message, type, duration);
    return {show, success:(msg,duration)=>show(msg,'success',duration),
        error:(msg,duration)=>show(msg,'error',duration), info:(msg,duration)=>show(msg,'info',duration),
        warning:(msg,duration)=>show(msg,'warning',duration)};
})();
window.Toast = Toast;
