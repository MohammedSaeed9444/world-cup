/**
 * Resolve the prediction lock timestamp for a match row.
 * Falls back to match_time when prediction_deadline is unset (legacy rows).
 * @param {{ match_time: string, prediction_deadline?: string | null }} match
 */
export function getPredictionDeadline(match) {
  const deadline = match.prediction_deadline ?? match.match_time;
  return new Date(deadline);
}
