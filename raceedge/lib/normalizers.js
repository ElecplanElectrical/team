const text = value => value == null ? null : String(value).trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : null;

export function normalizeRaceCode(value) {
  const code = String(value ?? '').toUpperCase();
  if (['R', 'HORSE', 'THOROUGHBRED'].includes(code)) return 'R';
  if (['G', 'GREYHOUND', 'GREYHOUNDS'].includes(code)) return 'G';
  if (['H', 'HARNESS'].includes(code)) return 'H';
  return code || null;
}

export function normalizeMeeting(raw = {}) {
  const venue = raw.venue ?? raw.track ?? raw.meeting ?? {};
  return {
    providerId: text(raw.id ?? raw.event_id ?? raw.meeting_id),
    code: normalizeRaceCode(raw.code ?? raw.race_type ?? raw.type),
    name: text(raw.name ?? venue.name ?? raw.venue_name ?? raw.track_name),
    state: text(raw.state ?? venue.state ?? raw.region),
    date: text(raw.date ?? raw.meeting_date ?? raw.start_date),
    condition: text(raw.track_condition ?? raw.condition ?? raw.going),
    status: text(raw.status) ?? 'Open'
  };
}

export function normalizeRunner(raw = {}) {
  return {
    providerId: text(raw.id ?? raw.runner_id ?? raw.competitor_id),
    number: number(raw.number ?? raw.runner_number ?? raw.tab_number),
    name: text(raw.name ?? raw.runner_name ?? raw.horse_name ?? raw.greyhound_name),
    barrier: number(raw.barrier ?? raw.box ?? raw.draw),
    weight: number(raw.weight),
    jockey: text(raw.jockey ?? raw.driver),
    trainer: text(raw.trainer),
    price: number(raw.price ?? raw.odds ?? raw.fixed_odds),
    scratched: Boolean(raw.scratched ?? raw.is_scratched ?? false),
    form: number(raw.form_rating ?? raw.form),
    speed: number(raw.speed_rating ?? raw.speed),
    classRating: number(raw.class_rating ?? raw.class),
    pace: number(raw.pace_rating ?? raw.pace),
    conditions: number(raw.conditions_rating ?? raw.track_rating),
    barrierRating: number(raw.barrier_rating)
  };
}

export function normalizeRace(raw = {}) {
  const runners = raw.runners ?? raw.acceptances ?? raw.competitors ?? [];
  return {
    providerId: text(raw.id ?? raw.race_id ?? raw.event_id),
    raceNo: number(raw.race_no ?? raw.race_number ?? raw.number),
    name: text(raw.name ?? raw.race_name),
    distance: number(raw.distance ?? raw.distance_metres),
    startTime: text(raw.start_time ?? raw.startTime ?? raw.advertised_start),
    status: text(raw.status) ?? 'Open',
    runners: Array.isArray(runners) ? runners.map(normalizeRunner) : []
  };
}

export function normalizeProviderPayload(payload = {}) {
  const source = Array.isArray(payload) ? payload : payload.events ?? payload.meetings ?? payload.data ?? [];
  return (Array.isArray(source) ? source : []).map(item => ({
    meeting: normalizeMeeting(item),
    races: (item.races ?? item.events ?? []).map(normalizeRace)
  }));
}
