const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Codes = require('../js/pedagogy/methodology-codes.js');

assert.equal(Codes.normalizeMethodologyCode('abp'), 'project_based_learning');
assert.equal(Codes.normalizeMethodologyCode('project_based_learning'), 'project_based_learning');
assert.equal(Codes.normalizeMethodologyCode('problem_based_learning'), 'problem_based_learning');
assert.equal(Codes.getMethodologyDisplayName('abp'), 'Aprendizaje Basado en Proyectos');
assert.equal(Codes.getMethodologyDisplayName('problem_based_learning'), 'Aprendizaje Basado en Problemas');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
assert.doesNotMatch(html, /option value="abp"/);
assert.match(html, /option value="project_based_learning"/);
assert.match(app, /normalizeMethodologyCode\(DOM\.selectMethodology\.value\)/);
assert.match(app, /normalizeMethodologyCode\(m\.methodology\)/);

console.log('methodology-codes.test.js: OK');
