import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import MatchesBoard from "@/components/MatchesBoard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: true });

  let predictionsByMatchId = {};
  if (user) {
    const { data: predictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);

    if (predictions) {
      predictionsByMatchId = Object.fromEntries(
        predictions.map((p) => [p.match_id, p])
      );
    }
  }

  const { data: leaderboard } = await supabase
    .from("global_leaderboard")
    .select("*")
    .order("rank", { ascending: true });

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Matches board — 2/3 width on large screens */}
          <section className="lg:col-span-2">
            <h2 className="mb-5 text-xl font-bold text-white">⚽ Fixtures</h2>
            <MatchesBoard
              matches={matches ?? []}
              predictionsByMatchId={predictionsByMatchId}
            />
          </section>

          {/* Leaderboard sidebar */}
          <aside className="lg:col-span-1">
            <Leaderboard
              entries={leaderboard ?? []}
              currentUserId={user?.id}
            />
          </aside>
        </div>
      </main>
    </>
  );
}
