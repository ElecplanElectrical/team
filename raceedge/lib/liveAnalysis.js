import { rateField, buildSelectionSummary } from './ratingEngine.js';

export function enrichLiveRace(race = {}) {
  const rated = rateField(race.runners ?? []);
  return {
    ...race,
    runners: rated.runners,
    selections: rated.selections,
    analysis: buildSelectionSummary(rated.runners),
    analysisReady: rated.analysisReady,
    dataWarning: rated.dataWarning,
    scratchingsChecked: rated.scratchingsChecked,
    prototype: true,
    backtested: false
  };
}

export function enrichLiveEvents(events = []) {
  return (Array.isArray(events) ? events : []).map(event => ({
    ...event,
    races: (event.races ?? []).map(enrichLiveRace)
  }));
}
