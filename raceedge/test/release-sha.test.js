import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('health exposes Railway deployment commit SHA',()=>{
 const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(source,/releaseSha:process\.env\.RAILWAY_GIT_COMMIT_SHA\?\?null/);
});
