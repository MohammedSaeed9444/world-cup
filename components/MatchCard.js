"use client";

import { useActionState, useEffect, useState } from "react";
import { submitPrediction } from "@/app/actions/predictions";
import { getPredictionDeadline } from "@/lib/match-utils";
import PointsBadge from "@/components/PointsBadge";
import { formatPointsLabel } from "@/utils/scoring";
import FlagIcon from "@/components/FlagIcon";

function formatKickoff(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MatchCard({ match, prediction }) {
  const [state, formAction, isPending] = useActionState(submitPrediction, null);
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
  const predHome = prediction?.pred_home ?? "";
  const predAway = prediction?.pred_away ?? "";


  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition hover:border-zinc-700">
      {/* Coloured top bar by status */}
      <div
        className={`h-1 w-full ${
          isFinished
            ? "bg-amber-500/60"
            : isLocked
              ? "bg-red-600/60"
              : "bg-emerald-500/60"
        }`}
      />

      <div className="p-5">
        {/* Teams row */}
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <FlagIcon team={match.home_team} size={36} />
            <span className="mt-1.5 text-sm font-semibold text-white leading-tight">
              {match.home_team}
            </span>
          </div>

          {/* Score / VS divider */}
          <div className="flex flex-col items-center gap-1">
            {isFinished ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-white tabular-nums">
                  {match.home_score}
                </span>
                <span className="text-lg text-zinc-500">–</span>
                <span className="text-2xl font-black text-white tabular-nums">
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs font-bold tracking-widest text-zinc-400">
                VS
              </span>
            )}

            {/* Status badge */}
            {isFinished ? (
              <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-xs font-medium text-amber-300">
                Full Time
              </span>
            ) : isLocked ? (
              <span className="rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-300">
                🔒 Locked
              </span>
            ) : (
              <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-300">
                Open
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex min-w-0 flex-1 flex-col items-center text-center">
            <FlagIcon team={match.away_team} size={36} />
            <span className="mt-1.5 text-sm font-semibold text-white leading-tight">
              {match.away_team}
            </span>
          </div>
        </div>

        {/* Kickoff / deadline meta */}
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-0.5">
          <p className="text-xs text-zinc-500">
            🕐 {formatKickoff(match.match_time)}
          </p>
          {!isFinished && match.prediction_deadline && (
            <p className="text-xs text-zinc-600">
              Closes {formatKickoff(match.prediction_deadline)}
            </p>
          )}
        </div>

        {/* Finished: your prediction + points */}
        {isFinished && prediction && (
          <div className="mt-4 flex items-center justify-center gap-3 rounded-xl bg-zinc-800/60 px-4 py-3">
            <span className="text-sm text-zinc-400">
              Your pick:{" "}
              <span className="font-bold text-white">
                {predHome} – {predAway}
              </span>
            </span>
            <PointsBadge points={prediction.points} />
          </div>
        )}
        {isFinished && !prediction && (
          <p className="mt-4 text-center text-xs text-zinc-600">
            No prediction submitted
          </p>
        )}

        {/* Finished: points label */}
        {isFinished && prediction && (
          <p className="mt-1 text-center text-sm font-semibold text-amber-400">
            {formatPointsLabel(prediction.points)}
          </p>
        )}

        {/* Pre-deadline: prediction form */}
        {!isLocked && !isFinished && (
          <form action={formAction} className="mt-4 space-y-3">
            <input type="hidden" name="matchId" value={match.id} />

            <div className="flex items-end justify-center gap-3">
              <div className="text-center">
              <label className="mb-1 flex items-center justify-center gap-1 text-xs text-zinc-500">
                <FlagIcon team={match.home_team} size={14} /> {match.home_team}
              </label>
                <input
                  type="number"
                  name="predHome"
                  min="0"
                  max="20"
                  defaultValue={prediction?.pred_home ?? 0}
                  required
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2.5 text-center text-xl font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>
              <span className="pb-2.5 text-lg text-zinc-600">–</span>
              <div className="text-center">
              <label className="mb-1 flex items-center justify-center gap-1 text-xs text-zinc-500">
                <FlagIcon team={match.away_team} size={14} /> {match.away_team}
              </label>
                <input
                  type="number"
                  name="predAway"
                  min="0"
                  max="20"
                  defaultValue={prediction?.pred_away ?? 0}
                  required
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2.5 text-center text-xl font-bold text-white outline-none focus:border-emerald-500"
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
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending
                ? "Saving…"
                : prediction
                  ? "Update Prediction"
                  : "Submit Prediction"}
            </button>
          </form>
        )}

        {/* Post-deadline, not finished: locked read-only */}
        {isLocked && !isFinished && (
          <div className="mt-4 rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-center">
            <p className="text-sm font-medium text-red-300">
              🔒 Predictions Locked
            </p>
            {prediction ? (
              <p className="mt-1 text-sm text-zinc-400">
                Your pick:{" "}
                <span className="font-bold text-white">
                  {predHome} – {predAway}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                No prediction submitted before the deadline.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
