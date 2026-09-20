import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('iOS production API remains HTTPS-only without ATS bypasses',()=>{
  const plist=readFileSync(new URL('../ios/RaceEdge/Info.plist',import.meta.url),'utf8');
  const api=readFileSync(new URL('../ios/RaceEdgeAPI.swift',import.meta.url),'utf8');
  assert.match(plist,/https:\/\/raceedge-v1-production\.up\.railway\.app/);
  assert.doesNotMatch(plist,/NSAllowsArbitraryLoads/);
  assert.doesNotMatch(plist,/NSExceptionAllowsInsecureHTTPLoads/);
  assert.doesNotMatch(api,/http:\/\//);
});
