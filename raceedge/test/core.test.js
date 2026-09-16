import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRunner, rateField, buildSelectionSummary } from '../lib/ratingEngine.js';
import { applyChangesToRace, normalizeResults } from '../lib/normalizers.js';

test('prototype rating returns a bounded score', () => {
  const result = scoreRunner({ form: 90, speed: 88, classRating: 84, pace: 86, conditions: 82, barrier: 80 });
  assert.equal(typeof result.score, 'number');
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.equal(result.coverage.weightedCoverage, 1);
  assert.equal(result.prototype, true);
  assert.equal(result.backtested, false);
});

test('scratched runners are excluded from selections', () => {
  const rated = rateField([
    { number: 1, name: 'A', scratched: true, form: 100, speed: 100, classRating: 100, pace: 100, conditions: 100, barrier: 100 },
    { number: 2, name: 'B', scratched: false, form: 80, speed: 80, classRating: 80, pace: 80, conditions: 80, barrier: 80 },
    { number: 3, name: 'C', scratched: false, form: 70, speed: 70, classRating: 70, pace: 70, conditions: 70, barrier: 70 }
  ]);
  assert.equal(rated.runners.length, 2);
  assert.equal(rated.runners.some(runner => runner.number === 1), false);
  assert.equal(rated.scratchingsChecked, true);
});

test('incomplete component data suppresses fair price, value and confidence', () => {
  const rated = rateField([
    { number: 1, name: 'A', scratched: false, price: 3.0, barrier: 80 },
    { number: 2, name: 'B', scratched: false, price: 4.0, barrier: 60 }
  ]);
  const summary = buildSelectionSummary(rated.runners);
  assert.equal(rated.analysisReady, false);
  assert.equal(rated.runners[0].estimatedFairPrice, null);
  assert.equal(rated.runners[0].valueEdge, null);
  assert.equal(summary.confidence, null);
  assert.equal(summary.valueSelection, null);
});

test('provider scratching changes are applied to matching runner', () => {
  const race = { providerId: 'race-1', raceNo: 3, runners: [{ providerId: 'runner-1', number: 4, name: 'Runner', scratched: false }] };
  const updated = applyChangesToRace(race, [{ raceId: 'race-1', runnerId: 'runner-1', scratched: true }]);
  assert.equal(updated.runners[0].scratched, true);
  assert.equal(updated.scratchingsChecked, true);
});

test('results normalizer extracts winner details', () => {
  const normalized = normalizeResults({ results: [{ name: 'Track', race_type: 'R', races: [{ race_number: 5, winner: { number: 7, name: 'Winner' } }] }] });
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].raceNo, 5);
  assert.equal(normalized[0].winnerNumber, 7);
  assert.equal(normalized[0].winnerName, 'Winner');
});
