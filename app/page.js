import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";
import MatchList from "@/components/MatchList";
import { createClient } from "@/lib/supabase/server";

/** Always render fresh — data depends on auth session and live DB state */
export const dynamic = "force-dynamic";

/**
 * Dashboard — main page showing matches, predictions, and leaderboard.
 * Server Component: fetches all data, passes to client MatchCards.
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all matches ordered by kickoff time
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: true });

  if (matchesError) {
    console.error("Failed to load matches:", matchesError.message);
  }

  // Fetch current user's predictions for all matches
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

  // Fetch global leaderboard from the SQL view
  const { data: leaderboard, error: lbError } = await supabase
    .from("global_leaderboard")
    .select("*")
    .order("rank", { ascending: true });

  if (lbError) {
    console.error("Failed to load leaderboard:", lbError.message);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Matches column (2/3 width on large screens) */}
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-xl font-bold text-white">📅 Fixtures</h2>
            <MatchList
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
