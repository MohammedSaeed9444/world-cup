import MatchCard from "@/components/MatchCard";

/**
 * Renders a list of MatchCard components for all fixtures.
 */
export default function MatchList({ matches, predictionsByMatchId }) {
  if (!matches || matches.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-zinc-500">
        No matches scheduled yet. Add fixtures in the Supabase dashboard.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          prediction={predictionsByMatchId[match.id] ?? null}
        />
      ))}
    </div>
  );
}
