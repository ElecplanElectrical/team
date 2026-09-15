import { rateField } from './ratingEngine.js';

export function evaluateHistoricalRaces(races = []) {
  const settled = races.filter(race => Array.isArray(race.runners) && race.runners.length && race.winnerNumber != null);
  let racesTested = 0;
  let topPickWins = 0;
  let top3Hits = 0;
  let totalStake = 0;
  let totalReturn = 0;
  const rows = [];

  for (const race of settled) {
    const rated = rateField(race.runners);
    const topPick = rated.selections[0] ?? null;
    const top3 = rated.selections.slice(0, 3);
    if (!topPick) continue;

    racesTested += 1;
    const topPickWon = Number(topPick.number) === Number(race.winnerNumber);
    const top3Hit = top3.some(runner => Number(runner.number) === Number(race.winnerNumber));
    if (topPickWon) topPickWins += 1;
    if (top3Hit) top3Hits += 1;

    totalStake += 1;
    const recordedPrice = Number(topPick.price);
    const raceReturn = topPickWon && recordedPrice > 0 ? recordedPrice : 0;
    totalReturn += raceReturn;

    rows.push({
      raceId: race.id ?? null,
      meeting: race.meeting ?? null,
      raceNo: race.raceNo ?? null,
      winnerNumber: race.winnerNumber,
      topPickNumber: topPick.number,
      topPickName: topPick.name,
      topPickRating: topPick.raceEdgeRating,
      topPickWon,
      top3Hit,
      recordedPrice: recordedPrice || null,
      return: raceReturn
    });
  }

  const profit = totalReturn - totalStake;
  return {
    prototype: true,
    historicalOnly: true,
    racesTested,
    topPickWins,
    top3Hits,
    topPickStrikeRate: racesTested ? Number(((topPickWins / racesTested) * 100).toFixed(2)) : null,
    top3HitRate: racesTested ? Number(((top3Hits / racesTested) * 100).toFixed(2)) : null,
    totalStake,
    totalReturn: Number(totalReturn.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    roi: totalStake ? Number(((profit / totalStake) * 100).toFixed(2)) : null,
    note: 'Backtest results are descriptive historical measurements only and do not establish future predictive performance.',
    rows
  };
}
