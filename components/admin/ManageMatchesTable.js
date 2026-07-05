"use client";

import { useActionState, useState } from "react";
import { deleteMatch, finishMatch, updateMatch, updateMatchDeadline } from "@/app/actions/admin";
import { DEADLINE_OFFSET_OPTIONS, WORLD_CUP_TEAMS } from "@/lib/constants/admin";
import { getFlag } from "@/utils/flags";

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

function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function MatchRow({ match }) {
  const [editing, setEditing] = useState(false);

  const [editState, editAction, editPending] = useActionState(updateMatch, null);
  const [finishState, finishAction, finishPending] = useActionState(finishMatch, null);
  const [deadlineState, deadlineAction, deadlinePending] = useActionState(updateMatchDeadline, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteMatch, null);

  const matchLabel = `${match.home_team} vs ${match.away_team}`;

  function handleDeleteSubmit(e) {
    if (!window.confirm(`Delete ${matchLabel}?\n\nThis permanently removes the match and all user predictions for it.`)) {
      e.preventDefault();
    }
  }

  return (
    <>
      <tr className="border-b border-zinc-800/80 align-top">
        {/* ── Match info + edit toggle ── */}
        <td className="py-4 pr-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-white">
                <span>{getFlag(match.home_team)}</span>{" "}
                {match.home_team}{" "}
                <span className="text-zinc-500">vs</span>{" "}
                <span>{getFlag(match.away_team)}</span>{" "}
                {match.away_team}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Kickoff: {formatDt(match.match_time)}
              </p>
              <p className="text-xs text-violet-400/80">
                Closes: {formatDt(match.prediction_deadline ?? match.match_time)}
              </p>
              {match.is_finished && (
                <span className="mt-1.5 inline-block rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
                  Completed · {match.home_score}–{match.away_score}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="shrink-0 rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:border-violet-600 hover:text-violet-300"
              title="Edit match details"
            >
              {editing ? "Cancel" : "✏️ Edit"}
            </button>
          </div>
        </td>

        {/* ── Prediction deadline ── */}
        <td className="py-4 pr-4">
          {!match.is_finished && (
            <form action={deadlineAction} className="space-y-2">
              <input type="hidden" name="matchId" value={match.id} />
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

        {/* ── Final score ── */}
        <td className="py-4 pr-4">
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

        {/* ── Delete ── */}
        <td className="py-4">
          <form action={deleteAction} onSubmit={handleDeleteSubmit}>
            <input type="hidden" name="matchId" value={match.id} />
            <button
              type="submit"
              disabled={deletePending}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/40 disabled:opacity-50"
            >
              {deletePending ? "…" : "🗑 Delete"}
            </button>
            {deleteState?.error && (
              <p className="mt-1 text-xs text-red-400">{deleteState.error}</p>
            )}
          </form>
        </td>
      </tr>

      {/* ── Inline edit row ── */}
      {editing && (
        <tr className="border-b border-violet-900/30 bg-violet-950/20">
          <td colSpan={4} className="px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-400">
              Edit Match Details
            </p>
            <form action={editAction} className="grid gap-3 sm:grid-cols-4">
              <input type="hidden" name="matchId" value={match.id} />
              <input type="hidden" name="tzOffsetMinutes" value={new Date().getTimezoneOffset()} />

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Home Team</label>
                <input
                  name="homeTeam"
                  list="wc-teams-edit"
                  required
                  defaultValue={match.home_team}
                  className={`${inputClass} w-full`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Away Team</label>
                <input
                  name="awayTeam"
                  list="wc-teams-edit"
                  required
                  defaultValue={match.away_team}
                  className={`${inputClass} w-full`}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-zinc-400">Kickoff Date &amp; Time</label>
                <input
                  name="matchTime"
                  type="datetime-local"
                  required
                  defaultValue={toLocalInputValue(match.match_time)}
                  className={`${inputClass} w-full`}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={editPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {editPending && (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  )}
                  {editPending ? "Saving…" : "Save Changes"}
                </button>
              </div>

              {editState?.error && (
                <p className="col-span-4 text-xs text-red-400">{editState.error}</p>
              )}
              {editState?.success && (
                <p className="col-span-4 text-xs text-emerald-400">{editState.message}</p>
              )}
            </form>

            <datalist id="wc-teams-edit">
              {WORLD_CUP_TEAMS.map((team) => (
                <option key={team} value={team} />
              ))}
            </datalist>
          </td>
        </tr>
      )}
    </>
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
        Click <span className="text-violet-400">✏️ Edit</span> to fix team names
        or the kickoff time. Enter final scores and hit{" "}
        <span className="text-emerald-400">Finish Match</span> to award points.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs text-zinc-500">
              <th className="pb-3 pr-4 font-medium">Match</th>
              <th className="pb-3 pr-4 font-medium">Prediction Deadline</th>
              <th className="pb-3 pr-4 font-medium">Final Score</th>
              <th className="pb-3 font-medium">Delete</th>
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
