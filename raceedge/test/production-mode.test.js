import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('production responses do not expose demo meetings or tips', () => {
  assert.match(source, /const isProduction=process\.env\.NODE_ENV==='production'/);
  assert.match(source, /meetings:isProduction\?\[\]:demoMeetings/);
  assert.match(source, /tips:isProduction\?\[\]:demoTips/);
});

test('demo race detail is disabled in production', () => {
  assert.match(source, /if\(isProduction\)return res\.status\(404\)\.json\(\{error:'Race detail is available from the live feed\.'\}\)/);
});
