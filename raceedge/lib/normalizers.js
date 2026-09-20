const text = value => value == null ? null : String(value).trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : null;
const firstNumber = (...values) => {
  for (const value of values) {
    const parsed = number(value);
    if (parsed != null) return parsed;
  }
  return null;
};

export function normalizeRaceCode(value) {
  const code = String(value ?? '').toUpperCase();
  if (['R','HORSE','THOROUGHBRED'].includes(code)) return 'R';
  if (['G','GREYHOUND','GREYHOUNDS'].includes(code)) return 'G';
  if (['H','HARNESS'].includes(code)) return 'H';
  return code || null;
}

const datePart = value => {
  const raw=text(value);
  return raw && raw.length >= 10 ? raw.slice(0,10) : raw;
};

export function normalizeMeeting(raw={}) {
  const venueObject = raw.venue && typeof raw.venue === 'object' ? raw.venue : {};
  const venueName = typeof raw.venue === 'string' ? raw.venue : null;
  return {
    providerId:text(raw.meeting_id??raw.venue_id??raw.id??raw.event_id),
    code:normalizeRaceCode(raw.category??raw.code??raw.race_type??raw.type),
    name:text(raw.venue_canonical??venueName??raw.venue_name??raw.track_name??raw.name??venueObject.name),
    state:text(raw.state??venueObject.state??raw.region),
    date:datePart(raw.date??raw.meeting_date??raw.start_date??raw.start_time),
    condition:text(raw.track_condition??raw.condition??raw.going),
    status:text(raw.status)??'Open'
  };
}

function extractRaceEdgeFactors(raw={}) {
  const stats = raw.stats ?? raw.statistics ?? raw.form_stats ?? {};
  const ratings = raw.ratings ?? raw.rating ?? {};
  const factors = {
    form: firstNumber(raw.form_rating, ratings.form, stats.form_rating),
    speed: firstNumber(raw.speed_rating, ratings.speed, stats.speed_rating, raw.speed),
    classRating: firstNumber(raw.class_rating, ratings.class, stats.class_rating, raw.class),
    pace: firstNumber(raw.pace_rating, ratings.pace, stats.pace_rating, raw.pace),
    conditions: firstNumber(raw.conditions_rating, ratings.conditions, stats.conditions_rating, stats.track_condition_rating, raw.track_rating),
    barrier: firstNumber(raw.barrier_rating, ratings.barrier, stats.barrier_rating, raw.box_rating, raw.draw_rating)
  };
  const sources = Object.fromEntries(Object.entries(factors).map(([key,value]) => [key, value == null ? null : 'provider']));
  return { factors, sources };
}

function bestWinPrice(raw={}) {
  const books=Array.isArray(raw.bookmakers)?raw.bookmakers:[];
  const prices=books.filter(book=>!book?.stale).map(book=>number(book?.win_price)).filter(value=>value!=null&&value>1);
  return prices.length ? Math.max(...prices) : firstNumber(raw.price,raw.odds,raw.fixed_odds,raw.win_price);
}

export function normalizeRunner(raw={}) {
  const mapped = extractRaceEdgeFactors(raw);
  return {
    providerId:text(raw.runner_ref??raw.id??raw.runner_id??raw.competitor_id),
    number:number(raw.number??raw.runner_number??raw.tab_number),
    name:text(raw.name??raw.runner_name??raw.horse_name??raw.greyhound_name),
    barrier:number(raw.barrier??raw.box??raw.draw),
    weight:firstNumber(raw.weight_kg,raw.weight),
    jockey:text(raw.jockey??raw.driver),
    trainer:text(raw.trainer),
    price:bestWinPrice(raw),
    scratched:Boolean(raw.scratched??raw.is_scratched??false),
    form:mapped.factors.form,
    speed:mapped.factors.speed,
    classRating:mapped.factors.classRating,
    pace:mapped.factors.pace,
    conditions:mapped.factors.conditions,
    barrierRating:mapped.factors.barrier,
    factorSources:mapped.sources,
    rawFactorCoverage:Object.values(mapped.factors).filter(value=>value!=null).length
  };
}

export function normalizeRace(raw={}) {
  const sourceRunners=raw.runners??raw.acceptances??raw.competitors??[];
  const scratchings=Array.isArray(raw.scratchings)?raw.scratchings:[];
  const scratchedNumbers=new Set(scratchings.map(item=>number(item?.number)).filter(value=>value!=null));
  const scratchedNames=new Set(scratchings.map(item=>text(item?.name)?.toLowerCase()).filter(Boolean));
  const runners=(Array.isArray(sourceRunners)?sourceRunners:[]).map(normalizeRunner).map(runner=>({
    ...runner,
    scratched:Boolean(runner.scratched || (runner.number!=null&&scratchedNumbers.has(runner.number)) || (runner.name&&scratchedNames.has(runner.name.toLowerCase())))
  }));
  return {
    providerId:text(raw.race_id??raw.id??raw.event_id),
    raceNo:number(raw.race_number??raw.race_no??raw.number),
    name:text(raw.race_name??raw.name),
    distance:firstNumber(raw.distance_m,raw.distance_metres,raw.distance),
    startTime:text(raw.start_time??raw.startTime??raw.advertised_start),
    status:text(raw.market_status??raw.status)??'Open',
    runners
  };
}

function normalizeFlatRaces(races=[]) {
  const grouped=new Map();
  for(const raw of races){
    const meeting=normalizeMeeting(raw);
    const key=[meeting.providerId??meeting.name??'meeting',meeting.date??'date',meeting.code??'code'].join('|');
    if(!grouped.has(key)) grouped.set(key,{meeting,races:[]});
    grouped.get(key).races.push(normalizeRace(raw));
  }
  return [...grouped.values()].map(event=>({...event,races:event.races.sort((a,b)=>(a.raceNo??999)-(b.raceNo??999))}));
}

export function normalizeProviderPayload(payload={}) {
  if(Array.isArray(payload)){
    const looksFlat=payload.some(item=>item && (item.race_id!=null || item.race_number!=null) && !Array.isArray(item.races));
    return looksFlat ? normalizeFlatRaces(payload) : payload.map(item=>({meeting:normalizeMeeting(item),races:(item.races??item.events??[]).map(normalizeRace)}));
  }
  const source=payload.events??payload.meetings??payload.data??[];
  if(!Array.isArray(source)) return [];
  const looksFlat=source.some(item=>item && (item.race_id!=null || item.race_number!=null) && !Array.isArray(item.races));
  return looksFlat ? normalizeFlatRaces(source) : source.map(item=>({meeting:normalizeMeeting(item),races:(item.races??item.events??[]).map(normalizeRace)}));
}

export function normalizeChanges(payload={}) {
  if(Array.isArray(payload?.races)){
    return payload.races.flatMap(race=>{
      const scratchings=Array.isArray(race.scratchings)?race.scratchings:[];
      return scratchings.map(raw=>({
        providerId:text([race.race_id,raw.number??raw.name,raw.scratched_at??payload.server_time].filter(Boolean).join(':')),
        meetingId:null,
        raceId:text(race.race_id),
        raceNo:number(race.race_number),
        runnerId:text(raw.runner_ref),
        runnerNumber:number(raw.number),
        runnerName:text(raw.name),
        type:'scratching',
        scratched:true,
        timestamp:text(raw.scratched_at??payload.server_time)
      }));
    });
  }
  const source=Array.isArray(payload)?payload:payload.changes??payload.data??payload.events??[];
  return (Array.isArray(source)?source:[]).map(raw=>({
    providerId:text(raw.id??raw.change_id),
    meetingId:text(raw.meeting_id??raw.meetingId),
    raceId:text(raw.race_id??raw.raceId??raw.event_id),
    raceNo:number(raw.race_no??raw.race_number),
    runnerId:text(raw.runner_id??raw.competitor_id),
    runnerNumber:number(raw.runner_number??raw.number??raw.tab_number),
    runnerName:text(raw.runner_name??raw.name),
    type:text(raw.type??raw.change_type??(raw.scratched?'scratching':null)),
    scratched:Boolean(raw.scratched??raw.is_scratched??String(raw.type??'').toLowerCase().includes('scratch')),
    timestamp:text(raw.updated_at??raw.timestamp??raw.created_at)
  }));
}

export function applyChangesToRace(race, changes=[]) {
  if (!race?.runners) return race;
  const relevant=changes.filter(change=>(!change.raceId||!race.providerId||change.raceId===race.providerId)&&(!change.raceNo||!race.raceNo||Number(change.raceNo)===Number(race.raceNo)));
  return {...race,runners:race.runners.map(runner=>{
    const change=relevant.find(c=>(c.runnerId&&runner.providerId&&c.runnerId===runner.providerId)||(c.runnerNumber!=null&&runner.number!=null&&Number(c.runnerNumber)===Number(runner.number))||(c.runnerName&&runner.name&&c.runnerName.toLowerCase()===runner.name.toLowerCase()));
    return change?.scratched?{...runner,scratched:true}:runner;
  }),scratchingsChecked:true};
}

export function applyChangesToEvents(events=[], changes=[]) {
  return (Array.isArray(events)?events:[]).map(event=>({...event,races:(event.races??[]).map(race=>applyChangesToRace(race,changes.filter(change=>!change.meetingId||!event.meeting?.providerId||change.meetingId===event.meeting.providerId)))}));
}

export function normalizeResults(payload={}) {
  const source=Array.isArray(payload)?payload:payload.results??payload.data??payload.events??[];
  return (Array.isArray(source)?source:[]).flatMap(raw=>{
    const meeting=normalizeMeeting(raw);
    const races=raw.races??raw.results??(raw.race?[raw.race]:[]);
    if(Array.isArray(races)&&races.length) return races.map(race=>({meeting,providerId:text(race.race_id??race.id),raceNo:number(race.race_number??race.race_no??race.number),status:text(race.status),winnerNumber:number(race.winner_number??race.winner?.number??race.first?.number),winnerName:text(race.winner_name??race.winner?.name??race.first?.name),results:Array.isArray(race.runners??race.results)?(race.runners??race.results).map(r=>({number:number(r.number??r.runner_number),name:text(r.name??r.runner_name),position:number(r.position??r.place),price:firstNumber(r.price,r.odds,r.starting_price)})):[]}));
    const placings=Array.isArray(raw.placings)?raw.placings:[];
    const first=placings.find(p=>Number(p.position??p.place)===1)??placings[0];
    return [{meeting,providerId:text(raw.race_id??raw.id),raceNo:number(raw.race_number??raw.race_no),status:text(raw.status),winnerNumber:number(first?.number??raw.winner_number??raw.winner?.number),winnerName:text(first?.name??raw.winner_name??raw.winner?.name),results:Array.isArray(raw.runners)?raw.runners.map(r=>({number:number(r.number??r.runner_number),name:text(r.name??r.runner_name),position:number(r.position??r.place),price:firstNumber(r.price,r.odds,r.starting_price)})):[]}];
  });
}
