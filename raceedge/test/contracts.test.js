import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichLiveRace, enrichLiveEvents } from '../lib/liveAnalysis.js';
import { normalizeMeeting, normalizeRace, normalizeRunner, normalizeChanges } from '../lib/normalizers.js';

const completeRunner = (overrides = {}) => ({
  providerId:'runner-1',
  number:4,
  name:'Northern Edge',
  barrier:3,
  price:3.4,
  scratched:false,
  form:94,
  speed:91,
  classRating:88,
  pace:92,
  conditions:90,
  barrierRating:90,
  ...overrides
});

test('normalized meeting shape matches iOS LiveMeeting contract', () => {
  const meeting = normalizeMeeting({ id:'m1', race_type:'R', name:'Flemington', state:'VIC', track_condition:'Good 4', status:'Open' });
  assert.deepEqual(Object.keys(meeting).sort(), ['code','condition','date','name','providerId','state','status'].sort());
  assert.equal(meeting.providerId,'m1');
  assert.equal(meeting.code,'R');
  assert.equal(meeting.name,'Flemington');
});

test('normalized runner shape exposes fields consumed by iOS LiveRunner', () => {
  const runner = normalizeRunner({ id:'r1', runner_number:7, runner_name:'Ocean State', barrier:6, weight:56.5, jockey:'A Rider', trainer:'A Trainer', price:6.5, scratched:false });
  for (const key of ['providerId','number','name','barrier','weight','jockey','trainer','price','scratched']) {
    assert.ok(Object.hasOwn(runner,key), `missing ${key}`);
  }
  assert.equal(runner.number,7);
  assert.equal(runner.name,'Ocean State');
});

test('normalized race shape matches iOS LiveRace contract', () => {
  const race = normalizeRace({ id:'race-5', race_number:5, race_name:'Sprint', distance:1200, start_time:'2026-09-18T05:00:00Z', status:'Open', runners:[{ number:1, name:'A' }] });
  for (const key of ['providerId','raceNo','name','distance','startTime','status','runners']) {
    assert.ok(Object.hasOwn(race,key), `missing ${key}`);
  }
  assert.equal(race.raceNo,5);
  assert.equal(Array.isArray(race.runners),true);
});

test('live enrichment supplies analysis payload consumed by race UI', () => {
  const enriched = enrichLiveRace({ providerId:'race-1', raceNo:1, runners:[completeRunner(), completeRunner({providerId:'runner-2',number:2,name:'Second',price:4.2,form:86,speed:84}), completeRunner({providerId:'runner-3',number:3,name:'Third',price:6.0,form:80,speed:82})] });
  assert.equal(enriched.scratchingsChecked,true);
  assert.equal(enriched.analysisReady,true);
  assert.ok(Array.isArray(enriched.selections));
  assert.ok(enriched.selections.length > 0);
  assert.ok(enriched.analysis);
  assert.ok(Object.hasOwn(enriched.analysis,'topPick'));
  assert.ok(Object.hasOwn(enriched.analysis,'dangers'));
  assert.ok(Object.hasOwn(enriched.analysis,'valueSelection'));
  assert.ok(Object.hasOwn(enriched.analysis,'confidence'));
});

test('live event enrichment preserves meeting and enriches each race', () => {
  const events = enrichLiveEvents([{ meeting:{ providerId:'m1', code:'R', name:'Flemington', state:'VIC' }, races:[{ providerId:'race-1', raceNo:1, runners:[completeRunner()] }] }]);
  assert.equal(events.length,1);
  assert.equal(events[0].meeting.name,'Flemington');
  assert.equal(events[0].races[0].prototype,true);
  assert.equal(events[0].races[0].backtested,false);
});

test('normalized racing changes match iOS RacingChange contract', () => {
  const changes = normalizeChanges({ changes:[{ id:'c1', meeting_id:'m1', race_id:'race-1', race_number:3, runner_id:'r1', runner_number:4, runner_name:'Northern Edge', type:'scratching', scratched:true, updated_at:'2026-09-18T05:00:00Z' }] });
  assert.equal(changes.length,1);
  const change = changes[0];
  for (const key of ['providerId','meetingId','raceId','raceNo','runnerId','runnerNumber','runnerName','type','scratched','timestamp']) {
    assert.ok(Object.hasOwn(change,key), `missing ${key}`);
  }
  assert.equal(change.scratched,true);
});
