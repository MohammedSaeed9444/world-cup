/**
 * Scoring utility for World Cup match predictions.
 *
 * Rules:
 *   - Exact score match (e.g. predicted 2-0, final 2-0)  → 25 points
 *   - Correct outcome only (right win/loss/draw, wrong score) → 10 points
 *   - Wrong outcome (including incorrect draw call)         →  0 points
 */

/**
 * Derive match outcome as 'home' | 'away' | 'draw'.
 * @param {number} home
 * @param {number} away
 * @returns {'home' | 'away' | 'draw'}
 */
function getOutcome(home, away) {
  if (home > away) return "home";
  if (home < away) return "away";
  return "draw";
}

/**
 * Calculate points earned for a single prediction vs. the final score.
 *
 * @param {number} predHome  - User's predicted home goals
 * @param {number} predAway  - User's predicted away goals
 * @param {number} finalHome - Actual final home goals
 * @param {number} finalAway - Actual final away goals
 * @returns {25 | 10 | 0}
 */
export function calculatePoints(predHome, predAway, finalHome, finalAway) {
  // Exact score match
  if (predHome === finalHome && predAway === finalAway) {
    return 25;
  }

  // Correct outcome (win / loss / draw direction)
  if (getOutcome(predHome, predAway) === getOutcome(finalHome, finalAway)) {
    return 10;
  }

  // Wrong outcome
  return 0;
}

/**
 * Human-readable label for points earned (used in UI).
 * @param {number} points
 * @returns {string}
 */
export function formatPointsLabel(points) {
  if (points === 25) return "+25 (Exact score!)";
  if (points === 10) return "+10 (Correct outcome)";
  return "0 points";
}
