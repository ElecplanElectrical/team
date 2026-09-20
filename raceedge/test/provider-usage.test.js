import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('provider usage diagnostics expose plan and credits without credentials',()=>{
  const provider=readFileSync(new URL('../lib/provider.js',import.meta.url),'utf8');
  const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
  assert.match(provider,/getUsage = \(\) => puntersEdgeRequest\('\/v1\/usage'\)/);
  assert.match(server,/\/api\/v1\/admin\/provider-usage/);
  assert.match(server,/creditsRemaining/);
  assert.doesNotMatch(server,/PUNTERSEDGE_API_KEY.*provider-usage/);
});
