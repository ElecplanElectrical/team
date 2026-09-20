import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');

test('historical race table and capture path exist',()=>{
  assert.match(source,/CREATE TABLE IF NOT EXISTS raceedge_race_history/);
  assert.match(source,/saveHistoricalLiveEvents/);
  assert.match(source,/ON CONFLICT\(provider_id\)/);
  assert.match(source,/await saveHistoricalLiveEvents\(payload\.events\)/);
});

test('historical settlement and backtest admin routes exist',()=>{
  assert.match(source,/\/api\/v1\/admin\/history\/results\/sync/);
  assert.match(source,/settleHistoricalResults/);
  assert.match(source,/\/api\/v1\/admin\/history\/status/);
  assert.match(source,/\/api\/v1\/admin\/history\/backtest/);
  assert.match(source,/evaluateHistoricalRaces\(races\)/);
});
