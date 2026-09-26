const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const router = fs.readFileSync('js/landing.js', 'utf8');
const home = fs.readFileSync('js/home.js', 'utf8');
const app = fs.readFileSync('js/app.js', 'utf8');
const auth = fs.readFileSync('js/auth-ui.js', 'utf8');

assert.match(html, /id="home-view"/);
assert.match(html, /id="home-session-list"/);
assert.match(html, /data-home-action="new-session"/);
assert.match(html, /Proyectos de aprendizaje/);
assert.ok(html.indexOf('id="home-view"') < html.indexOf('id="app-view"'));

assert.match(router, /#\/home/);
assert.match(router, /#\/sessions\/new/);
assert.match(router, /#\\\/sessions\\\/\[\^\/\]\+\\\/edit/);
assert.match(router, /showHome\(false/);
assert.match(router, /hash === '#\/app' \|\| hash === '#\/editor'/);
assert.match(router, /getCurrentUser/);

assert.match(home, /StorageManager\.getAllSessions/);
assert.match(home, /getAiCreditBalance/);
assert.match(home, /escapeHTML\(sessionTitle\(session\)\)/);
assert.match(home, /RECENT_LIMIT = 5/);
assert.match(app, /window\.appOpenSession/);
assert.match(app, /window\.appStartNewSession/);
assert.match(auth, /LandingRouter\.showHome/);

console.log('home-workspace.test.js: OK');
