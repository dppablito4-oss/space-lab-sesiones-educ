const assert = require('node:assert/strict');
const fs = require('node:fs');

const migration = fs.readFileSync('supabase/migrations/202609270001_planning_map_ai_action.sql', 'utf8');
assert.match(migration, /'planning\.map\.generate', 8, TRUE/);
assert.match(migration, /'beta_teacher', 'planning\.ai', TRUE/);
assert.match(migration, /'pro', 'planning\.ai', TRUE/);
assert.match(migration, /'free', 'planning\.ai', FALSE/);
assert.match(migration, /ON CONFLICT \(action\) DO UPDATE/);
assert.match(migration, /ON CONFLICT \(plan_code, feature_key\) DO UPDATE/);
assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN/i);

for (const router of ['gemini-router', 'deepseek-router', 'openai-router']) {
    const source = fs.readFileSync(`supabase/functions/${router}/index.ts`, 'utf8');
    assert.match(source, /aiRequest\.expectsJson/);
    assert.match(source, /JSON\.parse\(reply\)/);
    assert.match(source, /reserveAiCredits/);
}

console.log('planning-map-ai-action.test.js: OK');
