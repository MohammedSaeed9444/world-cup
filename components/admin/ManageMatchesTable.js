"use client";

import { useActionState } from "react";
import { finishMatch, updateMatchDeadline } from "@/app/actions/admin";
import { DEADLINE_OFFSET_OPTIONS } from "@/lib/constants/admin";

const inputClass =
  "rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white outline-none focus:border-violet-500";

function formatDt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MatchRow({ match }) {
  const [finishState, finishAction, finishPending] = useActionState(
    finishMatch,
    null
  );
  const [deadlineState, deadlineAction, deadlinePending] = useActionState(
    updateMatchDeadline,
    null
  );

  return (
    <tr className="border-b border-zinc-800/80 align-top">
      <td className="py-4 pr-4">
        <p className="font-medium text-white">
          {match.home_team}{" "}
          <span className="text-zinc-500">vs</span> {match.away_team}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Kickoff: {formatDt(match.match_time)}
        </p>
        <p className="text-xs text-violet-400/80">
          Predictions close: {formatDt(match.prediction_deadline ?? match.match_time)}
        </p>
        {match.is_finished && (
          <span className="mt-2 inline-block rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
            Completed · {match.home_score}–{match.away_score}
          </span>
        )}
      </td>

      <td className="py-4 pr-4">
        {!match.is_finished && (
          <form action={deadlineAction} className="space-y-2">
            <input type="hidden" name="matchId" value={match.id} />
            <p className="text-xs text-zinc-500">Close before kickoff</p>
            <select
              name="offsetMinutes"
              defaultValue="1"
              className={`${inputClass} w-full`}
              aria-label="Offset before kickoff"
            >
              {DEADLINE_OFFSET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={deadlinePending}
              className="w-full rounded-lg border border-violet-700/50 px-2 py-1 text-xs text-violet-300 hover:bg-violet-900/30 disabled:opacity-50"
            >
              {deadlinePending ? "Saving…" : "Update Deadline"}
            </button>
            {deadlineState?.error && (
              <p className="text-xs text-red-400">{deadlineState.error}</p>
            )}
            {deadlineState?.success && (
              <p className="text-xs text-emerald-400">{deadlineState.message}</p>
            )}
          </form>
        )}
      </td>

      <td className="py-4">
        <form action={finishAction} className="space-y-2">
          <input type="hidden" name="matchId" value={match.id} />
          <div className="flex items-center gap-2">
            <input
              name="homeScore"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={match.home_score ?? 0}
              className={`${inputClass} w-14 text-center`}
              aria-label={`${match.home_team} score`}
            />
            <span className="text-zinc-600">–</span>
            <input
              name="awayScore"
              type="number"
              min="0"
              step="1"
              required
              defaultValue={match.away_score ?? 0}
              className={`${inputClass} w-14 text-center`}
              aria-label={`${match.away_team} score`}
            />
          </div>
          <button
            type="submit"
            disabled={finishPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {finishPending && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {match.is_finished ? "Update Result" : "Finish Match"}
          </button>
          {finishState?.error && (
            <p className="text-xs text-red-400">{finishState.error}</p>
          )}
          {finishState?.success && (
            <p className="text-xs text-emerald-400">{finishState.message}</p>
          )}
        </form>
      </td>
    </tr>
  );
}

export default function ManageMatchesTable({ matches }) {
  if (!matches?.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h2 className="text-lg font-bold text-white">Manage Matches</h2>
        <p className="mt-2 text-sm text-zinc-500">No matches yet. Add one above.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="mb-1 text-lg font-bold text-white">Manage Matches</h2>
      <p className="mb-5 text-sm text-zinc-500">
        Update prediction deadlines and enter final scores. Finishing a match
        triggers automatic point calculation (+25 / +10 / 0).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="pb-3 pr-4 font-medium">Match</th>
              <th className="pb-3 pr-4 font-medium">Prediction Deadline</th>
              <th className="pb-3 font-medium">Final Score</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
