"use client";

import { useActionState, useEffect, useState } from "react";
import { submitPrediction } from "@/app/actions/predictions";
import { getPredictionDeadline } from "@/lib/match-utils";
import PointsBadge from "@/components/PointsBadge";
import { formatPointsLabel } from "@/utils/scoring";

/**
 * Format a kickoff timestamp for display in the user's local timezone.
 */
function formatKickoff(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Single match card with frontend time lockout and prediction form.
 *
 * FRONTEND TIME CHECK:
 *   - Before kickoff → show editable score inputs + submit button
 *   - After kickoff  → hide form, show 🔒 Locked + existing prediction
 *   - After finish   → show final score and points earned
 */
export default function MatchCard({ match, prediction }) {
  const [state, formAction, isPending] = useActionState(submitPrediction, null);

  // Track client-side time so the UI locks when kickoff passes without a refresh
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const deadline = getPredictionDeadline(match);
    if (now >= deadline) return;

    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, [match, now]);

  const deadline = getPredictionDeadline(match);
  const isLocked = now >= deadline;
  const isFinished = match.is_finished;

  const predHome = prediction?.pred_home ?? 0;
  const predAway = prediction?.pred_away ?? 0;

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700">
      {/* Match header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white">
            {match.home_team}{" "}
            <span className="font-normal text-zinc-500">vs</span>{" "}
            {match.away_team}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Kickoff: {formatKickoff(match.match_time)}
          </p>
          {match.prediction_deadline && (
            <p className="text-xs text-zinc-600">
              Predictions close: {formatKickoff(match.prediction_deadline)}
            </p>
          )}
        </div>

        {/* Status badge */}
        <div className="flex flex-wrap items-center gap-2">
          {isFinished && prediction && (
            <PointsBadge points={prediction.points} />
          )}
          {isFinished && (
            <span className="rounded-full bg-amber-900/50 px-3 py-0.5 text-xs font-medium text-amber-300">
              Full Time
            </span>
          )}
          {isLocked && !isFinished && (
            <span className="rounded-full bg-red-900/40 px-3 py-0.5 text-xs font-medium text-red-300">
              🔒 Locked
            </span>
          )}
          {!isLocked && (
            <span className="rounded-full bg-emerald-900/40 px-3 py-0.5 text-xs font-medium text-emerald-300">
              Open for predictions
            </span>
          )}
        </div>
      </div>

      {/* Finished match: show final score + points */}
      {isFinished && (
        <div className="mb-4 rounded-xl bg-zinc-800/60 p-4">
          <p className="text-center text-2xl font-bold text-white">
            {match.home_score} – {match.away_score}
          </p>
          <p className="mt-1 text-center text-xs text-zinc-500">Final Score</p>

          {prediction ? (
            <div className="mt-3 border-t border-zinc-700 pt-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm text-zinc-400">
                  Your prediction:{" "}
                  <span className="font-medium text-white">
                    {predHome} – {predAway}
                  </span>
                </p>
                <PointsBadge points={prediction.points} />
              </div>
              <p className="mt-1 text-sm font-semibold text-amber-400">
                {formatPointsLabel(prediction.points)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-center text-sm text-zinc-500">
              No prediction submitted
            </p>
          )}
        </div>
      )}

      {/* Pre-kickoff: editable prediction form */}
      {!isLocked && !isFinished && (
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="matchId" value={match.id} />

          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <label className="mb-1 block text-xs text-zinc-500">
                {match.home_team}
              </label>
              <input
                type="number"
                name="predHome"
                min="0"
                max="20"
                defaultValue={prediction?.pred_home ?? 0}
                required
                className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-center text-lg font-bold text-white outline-none focus:border-emerald-500"
              />
            </div>
            <span className="pt-5 text-zinc-600">–</span>
            <div className="text-center">
              <label className="mb-1 block text-xs text-zinc-500">
                {match.away_team}
              </label>
              <input
                type="number"
                name="predAway"
                min="0"
                max="20"
                defaultValue={prediction?.pred_away ?? 0}
                required
                className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-center text-lg font-bold text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-900/40 px-3 py-2 text-center text-sm text-red-300">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="rounded-lg bg-emerald-900/40 px-3 py-2 text-center text-sm text-emerald-300">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending
              ? "Saving…"
              : prediction
                ? "Update Prediction"
                : "Submit Prediction"}
          </button>
        </form>
      )}

      {/* Post-kickoff (not finished): show locked prediction read-only */}
      {isLocked && !isFinished && (
        <div className="rounded-xl border border-red-900/30 bg-red-950/20 p-4 text-center">
          <p className="text-sm font-medium text-red-300">🔒 Predictions Locked</p>
          {prediction ? (
            <p className="mt-2 text-sm text-zinc-400">
              Your pick:{" "}
              <span className="font-bold text-white">
                {predHome} – {predAway}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-500">
              You did not submit a prediction before kickoff.
            </p>
          )}
        </div>
      )}
    </article>
  );
}
