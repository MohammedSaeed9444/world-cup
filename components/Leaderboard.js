/**
 * Global Leaderboard with podium top-3 and ranked table below.
 */
export default function Leaderboard({ entries, currentUserId }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-2 text-lg font-bold text-white">🏆 Leaderboard</h2>
        <p className="text-sm text-zinc-500">
          No players yet. Be the first to submit a prediction!
        </p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Find current user's entry if they're outside the visible table
  const currentUserEntry = entries.find((e) => e.user_id === currentUserId);
  const currentUserInRest = rest.find((e) => e.user_id === currentUserId);
  const currentUserInTop3 = top3.find((e) => e.user_id === currentUserId);

  const podiumStyles = [
    // 1st
    {
      wrapper: "order-1 sm:order-2",
      card: "border-amber-500/50 bg-gradient-to-b from-amber-900/30 to-zinc-900/60 pt-6",
      medal: "🥇",
      points: "text-amber-300",
      name: "text-base",
      size: "scale-105",
    },
    // 2nd
    {
      wrapper: "order-2 sm:order-1",
      card: "border-zinc-600/60 bg-zinc-900/60 pt-4",
      medal: "🥈",
      points: "text-zinc-300",
      name: "text-sm",
      size: "",
    },
    // 3rd
    {
      wrapper: "order-3",
      card: "border-orange-800/40 bg-zinc-900/60 pt-4",
      medal: "🥉",
      points: "text-orange-300",
      name: "text-sm",
      size: "",
    },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="mb-5 text-lg font-bold text-white">🏆 Leaderboard</h2>

      {/* Podium — top 3 */}
      <div className="mb-5 grid grid-cols-3 items-end gap-2">
        {top3.map((entry, i) => {
          const s = podiumStyles[i];
          const isMe = entry.user_id === currentUserId;
          return (
            <div key={entry.user_id} className={`${s.wrapper} ${s.size}`}>
              <div
                className={`rounded-xl border px-2 py-3 text-center ${s.card} ${
                  isMe ? "ring-2 ring-emerald-500/50" : ""
                }`}
              >
                <p className="text-xl leading-none">{s.medal}</p>
                <p
                  className={`mt-1.5 font-semibold text-white ${s.name} break-words leading-tight`}
                >
                  {entry.display_name}
                  {isMe && (
                    <span className="block text-xs font-normal text-emerald-400">
                      you
                    </span>
                  )}
                </p>
                <p className={`mt-1 text-lg font-black tabular-nums ${s.points}`}>
                  {entry.total_points}
                  <span className="text-xs font-normal"> pts</span>
                </p>
                <p className="text-xs text-zinc-600">
                  {entry.predictions_made} picks
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining players */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((entry) => {
            const isMe = entry.user_id === currentUserId;
            return (
              <div
                key={entry.user_id}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                  isMe
                    ? "bg-emerald-900/20 ring-1 ring-emerald-700/40"
                    : "hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-500">
                    {entry.rank}
                  </span>
                  <span
                    className={`truncate font-medium ${
                      isMe ? "text-emerald-300" : "text-zinc-200"
                    }`}
                  >
                    {entry.display_name}
                    {isMe && (
                      <span className="ml-1 text-xs text-emerald-600">(you)</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="text-xs text-zinc-600">
                    {entry.predictions_made} picks
                  </span>
                  <span className="font-bold tabular-nums text-amber-400">
                    {entry.total_points}
                    <span className="text-xs font-normal text-zinc-500"> pts</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Your position callout — only shown if user is outside top 3 AND not in rest table */}
      {currentUserEntry &&
        !currentUserInTop3 &&
        !currentUserInRest &&
        rest.length === 0 && (
          <div className="mt-3 rounded-lg border border-emerald-800/40 bg-emerald-900/20 px-3 py-2 text-center text-sm">
            <span className="text-zinc-400">Your rank: </span>
            <span className="font-bold text-emerald-300">
              #{currentUserEntry.rank} · {currentUserEntry.total_points} pts
            </span>
          </div>
        )}

      {/* Total players count */}
      <p className="mt-4 text-center text-xs text-zinc-600">
        {entries.length} player{entries.length !== 1 ? "s" : ""} competing
      </p>
    </div>
  );
}
