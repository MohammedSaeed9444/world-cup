"use client";

import MatchCard from "@/components/MatchCard";

function SectionHeader({ icon, title, count, color }) {
  const colors = {
    emerald: "text-emerald-400 border-emerald-800/60",
    red: "text-red-400 border-red-800/60",
    amber: "text-amber-400 border-amber-800/60",
  };

  return (
    <div className={`mb-3 flex items-center gap-2 border-b pb-2 ${colors[color]}`}>
      <span>{icon}</span>
      <h3 className="font-semibold">{title}</h3>
      <span className="ml-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-bold text-zinc-400">
        {count}
      </span>
    </div>
  );
}

/**
 * Match board — three always-visible sections:
 *   1. Open for Predictions — sorted soonest first
 *   2. Locked / In Progress — sorted soonest first
 *   3. Finished              — sorted most recent first
 */
export default function MatchesBoard({ matches, predictionsByMatchId }) {
  const now = new Date();

  const upcoming = matches
    .filter(
      (m) =>
        !m.is_finished &&
        new Date(m.prediction_deadline ?? m.match_time) > now
    )
    .sort((a, b) => new Date(a.match_time) - new Date(b.match_time));

  const locked = matches
    .filter(
      (m) =>
        !m.is_finished &&
        new Date(m.prediction_deadline ?? m.match_time) <= now
    )
    .sort((a, b) => new Date(a.match_time) - new Date(b.match_time));

  // Newest first so latest results appear at the top
  const finished = matches
    .filter((m) => m.is_finished)
    .sort((a, b) => new Date(b.match_time) - new Date(a.match_time));

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
        <p className="text-4xl">⚽</p>
        <p className="mt-3 text-zinc-500">No matches scheduled yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {upcoming.length > 0 && (
        <section>
          <SectionHeader
            icon="📅"
            title="Open for Predictions"
            count={upcoming.length}
            color="emerald"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {upcoming.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId[match.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <SectionHeader
            icon="🔒"
            title="In Progress"
            count={locked.length}
            color="red"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {locked.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId[match.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <SectionHeader
            icon="✅"
            title="Completed"
            count={finished.length}
            color="amber"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {finished.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictionsByMatchId[match.id] ?? null}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
