import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('provider diagnostics are protected by admin auth', () => {
  const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  assert.match(source, /app\.use\('\/api\/v1\/provider',requireAdmin\)/);
});

test('baseline security headers are configured', () => {
  const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
  for (const header of ['X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy']) {
    assert.ok(source.includes(header), header);
  }
});
