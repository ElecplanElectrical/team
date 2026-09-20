import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('live racing cache defaults to 60 seconds with bounded override',()=>{
 const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 assert.match(source,/RACEEDGE_LIVE_CACHE_MS/);
 assert.match(source,/:60000/);
 assert.match(source,/withCache\('live:today',liveCacheMs/);
});
