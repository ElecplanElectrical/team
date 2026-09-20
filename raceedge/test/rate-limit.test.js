import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('public API has bounded per-client rate limiting',()=>{
  assert.match(source,/const publicRateLimit=120/);
  assert.match(source,/app\.use\('\/api\/v1',publicApiRateLimit\)/);
  assert.match(source,/status\(429\)\.json\(\{error:'Too many requests'\}\)/);
  assert.match(source,/Retry-After/);
});
