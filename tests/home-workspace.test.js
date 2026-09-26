const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const router = fs.readFileSync('js/landing.js', 'utf8');
const home = fs.readFileSync('js/home.js', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const auth = fs.readFileSync('js/auth-ui.js', 'utf8');

assert.match(html, /id="home-view"/);
assert.match(html, /id="landing-view" class="landing-view"/);
assert.doesNotMatch(html, /id="landing-view" class="landing-view hidden"/);
assert.match(html, /id="home-session-list"/);
assert.match(html, /data-home-action="new-session"/);
assert.match(html, /Proyectos de aprendizaje/);
assert.ok(html.indexOf('id="home-view"') < html.indexOf('id="app-view"'));

const plansDialog = html.slice(
    html.indexOf('id="home-plans-dialog"'),
    html.indexOf('<!--', html.indexOf('id="home-plans-dialog"')),
);
assert.match(plansDialog, /Comparación de planes/);
assert.equal((plansDialog.match(/data-plan-code=/g) || []).length, 4);
assert.match(plansDialog, /30[\s\S]*100[\s\S]*150[\s\S]*400/);
assert.match(plansDialog, /No se realizará ningún cobro ni cambio de plan/);
assert.doesNotMatch(plansDialog, /Comprar|checkout|Suscribirme/i);

assert.match(router, /#\/home/);
assert.match(router, /#\/sessions\/new/);
assert.match(router, /#\\\/sessions\\\/\[\^\/\]\+\\\/edit/);
assert.match(router, /showHome\(false/);
assert.match(router, /hash === '#\/app' \|\| hash === '#\/editor'/);
assert.match(router, /getCurrentUser/);
assert.match(router, /getSessionUser/);
assert.match(router, /persist:\s*false/);
assert.match(router, /DOMContentLoaded['"],\s*startLandingRouter/);

const startupScripts = html.slice(html.indexOf('<!-- Scripts -->'));
assert.doesNotMatch(startupScripts, /html-docx-js/);
assert.equal(
    (startupScripts.match(/<script defer/g) || []).length,
    (startupScripts.match(/<script /g) || []).length,
    'Los scripts de arranque deben descargarse sin bloquear el primer render',
);

assert.match(home, /StorageManager\.getAllSessions/);
assert.match(home, /getAiCreditBalance/);
assert.match(home, /getCommercialPlan/);
assert.doesNotMatch(home, /wallet\?\.planId/);
assert.match(home, /showModal\(\)/);
assert.match(home, /card\.dataset\.planCode === currentPlanCode/);
assert.match(home, /isCurrent \? 'Plan actual' : 'En desarrollo'/);
assert.match(home, /escapeHTML\(sessionTitle\(session\)\)/);
assert.match(home, /RECENT_LIMIT = 5/);
assert.match(app, /window\.appOpenSession/);
assert.match(app, /window\.appStartNewSession/);
assert.match(auth, /LandingRouter\.showHome/);

console.log('home-workspace.test.js: OK');
