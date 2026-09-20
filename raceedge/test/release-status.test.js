import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('release status exposes safe V1 readiness without secrets',()=>{
  assert.match(source,/\/api\/v1\/release-status/);
  assert.match(source,/harnessExposed:false/);
  assert.match(source,/wagering:false/);
  assert.match(source,/physicalIphoneQa:true/);
  assert.doesNotMatch(source,/release-status.*PUNTERSEDGE_API_KEY/);
});
