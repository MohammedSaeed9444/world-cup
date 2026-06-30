"use client";

import { useActionState } from "react";
import { createMatch } from "@/app/actions/admin";
import { DEADLINE_OFFSET_OPTIONS, WORLD_CUP_TEAMS } from "@/lib/constants/admin";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500";

const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

/**
 * Admin form to insert a new match with kickoff and prediction deadline.
 */
export default function AddMatchForm() {
  const [state, formAction, isPending] = useActionState(createMatch, null);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
      <h2 className="mb-1 text-lg font-bold text-white">Add New Match</h2>
      <p className="mb-5 text-sm text-zinc-500">
        Schedule a fixture and set when predictions close.
      </p>

      <form action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="homeTeam" className={labelClass}>
              Home Team
            </label>
            <input
              id="homeTeam"
              name="homeTeam"
              list="wc-teams"
              required
              placeholder="e.g. Brazil"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="awayTeam" className={labelClass}>
              Away Team
            </label>
            <input
              id="awayTeam"
              name="awayTeam"
              list="wc-teams"
              required
              placeholder="e.g. Argentina"
              className={inputClass}
            />
          </div>
        </div>

        <datalist id="wc-teams">
          {WORLD_CUP_TEAMS.map((team) => (
            <option key={team} value={team} />
          ))}
        </datalist>

        <div>
          <label htmlFor="matchTime" className={labelClass}>
            Kickoff Date &amp; Time
          </label>
          <input
            id="matchTime"
            name="matchTime"
            type="datetime-local"
            required
            className={inputClass}
          />
        </div>

        <fieldset className="space-y-3 rounded-xl border border-zinc-800 p-4">
          <legend className="px-1 text-sm font-medium text-zinc-300">
            Prediction Deadline
          </legend>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="radio"
                name="deadlineMode"
                value="offset"
                defaultChecked
                className="accent-violet-500"
              />
              Close before kickoff
            </label>
            <label className="flex items-center gap-2 text-zinc-300">
              <input
                type="radio"
                name="deadlineMode"
                value="custom"
                className="accent-violet-500"
              />
              Custom date &amp; time
            </label>
          </div>

          <div>
            <label htmlFor="offsetMinutes" className={labelClass}>
              Offset before kickoff
            </label>
            <select
              id="offsetMinutes"
              name="offsetMinutes"
              defaultValue="1"
              className={inputClass}
            >
              {DEADLINE_OFFSET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="customDeadline" className={labelClass}>
              Custom deadline (when &quot;Custom&quot; mode selected)
            </label>
            <input
              id="customDeadline"
              name="customDeadline"
              type="datetime-local"
              className={inputClass}
            />
          </div>
        </fieldset>

        {state?.error && (
          <p className="rounded-lg bg-red-900/40 px-4 py-2 text-sm text-red-300">
            {state.error}
          </p>
        )}
        {state?.success && (
          <p className="rounded-lg bg-emerald-900/40 px-4 py-2 text-sm text-emerald-300">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          {isPending ? "Adding Match…" : "Add Match"}
        </button>
      </form>
    </div>
  );
}
