"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Secure server action: submit or update a match prediction.
 *
 * Security layers (defence in depth):
 *   1. Auth check — must be logged in
 *   2. Input validation — integers >= 0
 *   3. SERVER TIME CHECK — fetch match_time from DB, reject if NOW >= kickoff
 *   4. PostgreSQL trigger — final lockout even if this check is bypassed
 */
export async function submitPrediction(prevState, formData) {
  const supabase = await createClient();

  // --- Layer 1: Authentication ---
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "You must be logged in to submit a prediction." };
  }

  // --- Parse & validate input ---
  const matchId = formData.get("matchId");
  const predHomeRaw = formData.get("predHome");
  const predAwayRaw = formData.get("predAway");

  if (!matchId || predHomeRaw === null || predAwayRaw === null) {
    return { error: "Missing required fields." };
  }

  const predHome = parseInt(String(predHomeRaw), 10);
  const predAway = parseInt(String(predAwayRaw), 10);

  if (
    Number.isNaN(predHome) ||
    Number.isNaN(predAway) ||
    predHome < 0 ||
    predAway < 0
  ) {
    return { error: "Scores must be non-negative integers." };
  }

  // --- Layer 3: SERVER-SIDE KICKOFF LOCKOUT ---
  // Fetch the authoritative match_time from the database (never trust the client).
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("match_time, home_team, away_team")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    return { error: "Match not found." };
  }

  const kickoff = new Date(match.match_time);
  const now = new Date();

  if (now >= kickoff) {
    return {
      error: `Predictions are locked. ${match.home_team} vs ${match.away_team} kicked off at ${kickoff.toUTCString()}.`,
    };
  }

  // --- Upsert prediction (INSERT or UPDATE on conflict) ---
  const { error: upsertError } = await supabase.from("predictions").upsert(
    {
      user_id: user.id,
      match_id: matchId,
      pred_home: predHome,
      pred_away: predAway,
    },
    { onConflict: "user_id,match_id" }
  );

  if (upsertError) {
    // Surface DB trigger lockout message if someone bypassed the server check
    return { error: upsertError.message };
  }

  revalidatePath("/");
  return { success: true, message: "Prediction saved!" };
}

/**
 * Sign out the current user and redirect to login.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
