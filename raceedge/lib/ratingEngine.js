export const prototypeWeights = Object.freeze({
  form: 0.25,
  speed: 0.20,
  classRating: 0.15,
  pace: 0.15,
  conditions: 0.15,
  barrier: 0.10
});

const numeric = (value, fallback = 50) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = value => Math.max(0, Math.min(100, value));
const hasNumeric = value => Number.isFinite(Number(value));

export function ratingCoverage(runner = {}, weights = prototypeWeights) {
  const keys = Object.keys(weights);
  const supplied = keys.filter(key => hasNumeric(runner[key]));
  const suppliedWeight = supplied.reduce((sum, key) => sum + weights[key], 0);
  return {
    suppliedComponents: supplied,
    missingComponents: keys.filter(key => !supplied.includes(key)),
    componentCoverage: Number((supplied.length / keys.length).toFixed(2)),
    weightedCoverage: Number(suppliedWeight.toFixed(2))
  };
}

export function scoreRunner(runner = {}, weights = prototypeWeights) {
  const coverage = ratingCoverage(runner, weights);
  const components = Object.fromEntries(Object.keys(weights).map(key => [key, clamp(numeric(runner[key]))]));
  const score = Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0));
  return { score, components, coverage, weights, prototype: true, backtested: false };
}

function fairProbability(score, fieldScores = []) {
  const exponent = Math.exp((score - 70) / 12);
  const denominator = fieldScores.reduce((sum, value) => sum + Math.exp((value - 70) / 12), 0);
  return denominator > 0 ? exponent / denominator : 0;
}

export function rateField(runners = [], weights = prototypeWeights) {
  const active = runners.filter(runner => !runner.scratched);
  const scored = active.map(runner => {
    const rating = scoreRunner(runner, weights);
    return { ...runner, raceEdgeRating: rating.score, ratingComponents: rating.components, ratingCoverage: rating.coverage };
  });
  const fieldEligibleForFairPrices = scored.length > 1 && scored.every(runner => runner.ratingCoverage.weightedCoverage >= 0.65);
  const scores = scored.map(runner => runner.raceEdgeRating);
  const rated = scored.map(runner => {
    if (!fieldEligibleForFairPrices) {
      return { ...runner, estimatedProbability: null, estimatedFairPrice: null, valueEdge: null, analysisReady: false };
    }
    const probability = fairProbability(runner.raceEdgeRating, scores);
    const fairPrice = probability > 0 ? 1 / probability : null;
    const marketPrice = Number(runner.price);
    const valueEdge = fairPrice && marketPrice > 1 ? ((marketPrice / fairPrice) - 1) * 100 : null;
    return { ...runner, estimatedProbability: Number((probability * 100).toFixed(1)), estimatedFairPrice: fairPrice ? Number(fairPrice.toFixed(2)) : null, valueEdge: valueEdge == null ? null : Number(valueEdge.toFixed(1)), analysisReady: true };
  }).sort((a,b) => b.raceEdgeRating - a.raceEdgeRating).map((runner,index) => ({...runner,rank:index+1}));
  return {
    scratchingsChecked:true,
    prototype:true,
    backtested:false,
    analysisReady:fieldEligibleForFairPrices,
    dataWarning:fieldEligibleForFairPrices?null:'Insufficient rating-component coverage for fair-price/value analysis.',
    runners:rated,
    selections:rated.slice(0,3)
  };
}

export function buildSelectionSummary(ratedField = []) {
  const [topPick, second, third] = ratedField;
  const valueCandidates = ratedField.filter(r => r.analysisReady && r.valueEdge != null && r.valueEdge >= 10).sort((a,b) => b.valueEdge - a.valueEdge);
  const ready = Boolean(topPick?.analysisReady);
  return {
    topPick: topPick ?? null,
    dangers: [second, third].filter(Boolean),
    valueSelection: ready ? (valueCandidates[0] ?? null) : null,
    confidence: ready && topPick ? confidenceBand(topPick.raceEdgeRating) : null,
    analysisReady: ready,
    note: ready
      ? 'Fair prices and value edges are prototype analytical estimates until historical back-testing is completed.'
      : 'Selections are provisional because live rating-component coverage is incomplete.'
  };
}

export function confidenceBand(score) {
  if (score >= 88) return 'High';
  if (score >= 78) return 'Medium';
  return 'Low';
}
