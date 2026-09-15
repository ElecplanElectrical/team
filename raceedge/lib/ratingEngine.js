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

export function scoreRunner(runner = {}, weights = prototypeWeights) {
  const components = Object.fromEntries(
    Object.keys(weights).map(key => [key, clamp(numeric(runner[key]))])
  );
  const score = Math.round(
    Object.entries(weights).reduce((sum, [key, weight]) => sum + components[key] * weight, 0)
  );
  return { score, components, weights, prototype: true, backtested: false };
}

export function rateField(runners = [], weights = prototypeWeights) {
  const active = runners.filter(runner => !runner.scratched);
  const rated = active
    .map(runner => {
      const rating = scoreRunner(runner, weights);
      return { ...runner, raceEdgeRating: rating.score, ratingComponents: rating.components };
    })
    .sort((a, b) => b.raceEdgeRating - a.raceEdgeRating)
    .map((runner, index) => ({ ...runner, rank: index + 1 }));

  return {
    scratchingsChecked: true,
    prototype: true,
    backtested: false,
    runners: rated,
    selections: rated.slice(0, 3)
  };
}

export function buildSelectionSummary(ratedField = []) {
  const [topPick, second, third] = ratedField;
  return {
    topPick: topPick ?? null,
    dangers: [second, third].filter(Boolean),
    confidence: topPick ? confidenceBand(topPick.raceEdgeRating) : null
  };
}

export function confidenceBand(score) {
  if (score >= 88) return 'High';
  if (score >= 78) return 'Medium';
  return 'Low';
}
