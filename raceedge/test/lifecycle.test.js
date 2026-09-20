import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProviderPayload, normalizeChanges, applyChangesToEvents, normalizeResults } from '../lib/normalizers.js';
import { enrichLiveEvents } from '../lib/liveAnalysis.js';

const runner = (id, number, name, form, speed, price) => ({
  runner_ref:id,
  number,
  name,
  price,
  form_rating:form,
  speed_rating:speed,
  class_rating:82,
  pace_rating:84,
  conditions_rating:86,
  barrier_rating:80
});

test('race-day lifecycle survives a late scratching and result settlement normalization', () => {
  const events = normalizeProviderPayload([{
    race_id:'race-life-1',
    venue:'Flemington',
    venue_id:'venue-life-1',
    race_number:5,
    category:'R',
    start_time:'2026-09-20T05:00:00Z',
    race_name:'Lifecycle Stakes',
    distance_m:1200,
    runners:[
      runner('runner-a',1,'Alpha',95,94,2.8),
      runner('runner-b',2,'Bravo',90,89,3.5),
      runner('runner-c',3,'Charlie',84,85,5.0)
    ]
  }]);

  const before = enrichLiveEvents(events);
  assert.equal(before[0].races[0].analysisReady,true);
  assert.equal(before[0].races[0].analysis.topPick.name,'Alpha');

  const changes = normalizeChanges({
    server_time:'2026-09-20T04:55:00Z',
    races:[{
      race_id:'race-life-1',
      race_number:5,
      scratchings:[{
        runner_ref:'runner-a',
        number:1,
        name:'Alpha',
        scratched_at:'2026-09-20T04:54:30Z'
      }]
    }]
  });

  const after = enrichLiveEvents(applyChangesToEvents(events,changes));
  const race = after[0].races[0];
  assert.equal(race.scratchingsChecked,true);
  assert.equal(race.runners.some(r => r.name === 'Alpha'),false);
  assert.equal(race.analysis.topPick.name,'Bravo');
  assert.equal(race.selections.some(r => r.scratched),false);

  const settled = normalizeResults([{
    race_id:'race-life-1',
    venue:'Flemington',
    venue_id:'venue-life-1',
    race_number:5,
    category:'R',
    start_time:'2026-09-20T05:00:00Z',
    status:'FINAL',
    placings:[
      {position:1,number:2,name:'Bravo'},
      {position:2,number:3,name:'Charlie'}
    ]
  }]);

  assert.equal(settled.length,1);
  assert.equal(settled[0].providerId,'race-life-1');
  assert.equal(settled[0].raceNo,5);
  assert.equal(settled[0].winnerNumber,2);
  assert.equal(settled[0].winnerName,'Bravo');
});
