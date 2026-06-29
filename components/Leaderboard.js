/**
 * Global Leaderboard — ranked list of all players by total points.
 * Receives pre-fetched rows from the global_leaderboard SQL view.
 */
export default function Leaderboard({ entries, currentUserId }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-2 text-lg font-bold text-white">🏆 Leaderboard</h2>
        <p className="text-sm text-zinc-500">No players yet. Be the first!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h2 className="mb-4 text-lg font-bold text-white">🏆 Leaderboard</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Player</th>
              <th className="pb-2 pr-4 text-right font-medium">Predictions</th>
              <th className="pb-2 text-right font-medium">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isCurrentUser = entry.user_id === currentUserId;
              const medal =
                entry.rank === 1
                  ? "🥇"
                  : entry.rank === 2
                    ? "🥈"
                    : entry.rank === 3
                      ? "🥉"
                      : null;

              return (
                <tr
                  key={entry.user_id}
                  className={`border-b border-zinc-800/50 ${
                    isCurrentUser ? "bg-emerald-900/20" : ""
                  }`}
                >
                  <td className="py-3 pr-4 text-zinc-400">
                    {medal ?? entry.rank}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`font-medium ${
                        isCurrentUser ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {entry.display_name}
                      {isCurrentUser && (
                        <span className="ml-1 text-xs text-emerald-600">(you)</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right text-zinc-400">
                    {entry.predictions_made}
                  </td>
                  <td className="py-3 text-right font-bold text-amber-400">
                    {entry.total_points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
