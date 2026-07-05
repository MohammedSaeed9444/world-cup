"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

const SCHEMA_HINT =
  "Database setup required: run supabase/migrations/002_admin_prediction_deadline.sql in the Supabase SQL Editor, then try again.";

/**
 * Parse a datetime-local string ("2026-07-15T20:00") into a UTC ISO timestamp.
 *
 * WHY: Vercel's server runs in UTC. new Date("2026-07-15T20:00") on a UTC server
 * treats the string as 20:00 UTC. But the admin entered 20:00 in their LOCAL
 * timezone (e.g. UTC+3 = 17:00 UTC). We correct using the browser's tzOffset
 * sent as a hidden form field (getTimezoneOffset() returns negative for east of UTC,
 * e.g. UTC+3 → -180).
 *
 * Correction: utcMs = serverParsedMs + tzOffsetMinutes * 60_000
 * Example: server parses 23:00 UTC, tzOffset = -180 → 23:00 - 3h = 20:00 UTC ✓
 */
function parseLocalDatetime(value, tzOffsetMinutes = 0) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const offset = Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0;
  return new Date(date.getTime() + offset * 60_000).toISOString();
}

/**
 * Compute prediction_deadline = kickoff minus offset minutes.
 */
function deadlineFromOffset(matchTimeIso, offsetMinutes) {
  const kickoff = new Date(matchTimeIso);
  const offset = parseInt(String(offsetMinutes), 10);

  if (Number.isNaN(offset) || offset < 0) {
    return { error: "Invalid deadline offset." };
  }

  const deadline = new Date(kickoff.getTime() - offset * 60 * 1000);
  return { deadline: deadline.toISOString() };
}

function formatDbError(message) {
  if (message?.includes("prediction_deadline")) {
    return SCHEMA_HINT;
  }
  return message;
}

/**
 * Insert a new match with kickoff time and prediction deadline.
 */
export async function createMatch(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const matchTimeLocal = String(formData.get("matchTime") ?? "").trim();
  const offsetMinutes = formData.get("offsetMinutes");
  const tzOffset = parseInt(String(formData.get("tzOffsetMinutes") ?? "0"), 10);

  if (!homeTeam || !awayTeam) {
    return { error: "Home and away team names are required." };
  }

  if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
    return { error: "Home and away teams must be different." };
  }

  const matchTime = parseLocalDatetime(matchTimeLocal, tzOffset);
  if (!matchTime) {
    return { error: "Invalid match date/time." };
  }

  const { deadline, error: deadlineError } = deadlineFromOffset(
    matchTime,
    offsetMinutes
  );
  if (deadlineError) return { error: deadlineError };

  const { error } = await supabase.from("matches").insert({
    home_team: homeTeam,
    away_team: awayTeam,
    match_time: matchTime,
    prediction_deadline: deadline,
    is_finished: false,
  });

  if (error) return { error: formatDbError(error.message) };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: `Match added: ${homeTeam} vs ${awayTeam}` };
}

/**
 * Update prediction deadline for an existing match (offset before kickoff).
 */
export async function updateMatchDeadline(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  const offsetMinutes = formData.get("offsetMinutes");

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("match_time")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) return { error: "Match not found." };

  const { deadline, error: deadlineError } = deadlineFromOffset(
    match.match_time,
    offsetMinutes
  );
  if (deadlineError) return { error: deadlineError };

  const { error } = await supabase
    .from("matches")
    .update({ prediction_deadline: deadline })
    .eq("id", matchId);

  if (error) return { error: formatDbError(error.message) };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: "Prediction deadline updated." };
}

/**
 * Edit a match's team names and/or kickoff time.
 * The prediction deadline offset is preserved automatically.
 */
export async function updateMatch(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  const homeTeam = String(formData.get("homeTeam") ?? "").trim();
  const awayTeam = String(formData.get("awayTeam") ?? "").trim();
  const matchTimeLocal = String(formData.get("matchTime") ?? "").trim();
  const tzOffset = parseInt(String(formData.get("tzOffsetMinutes") ?? "0"), 10);

  if (!homeTeam || !awayTeam) {
    return { error: "Both team names are required." };
  }
  if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
    return { error: "Home and away teams must be different." };
  }

  const matchTime = parseLocalDatetime(matchTimeLocal, tzOffset);
  if (!matchTime) {
    return { error: "Invalid match date/time." };
  }

  // Preserve the existing offset between kickoff and deadline
  const { data: existing, error: fetchError } = await supabase
    .from("matches")
    .select("match_time, prediction_deadline")
    .eq("id", matchId)
    .single();

  if (fetchError || !existing) return { error: "Match not found." };

  const offsetMs =
    new Date(existing.match_time).getTime() -
    new Date(existing.prediction_deadline).getTime();

  const newDeadline = new Date(
    new Date(matchTime).getTime() - offsetMs
  ).toISOString();

  const { error } = await supabase
    .from("matches")
    .update({
      home_team: homeTeam,
      away_team: awayTeam,
      match_time: matchTime,
      prediction_deadline: newDeadline,
    })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: "Match updated successfully." };
}

/**
 * Save final scores and mark a match as completed.
 */
export async function finishMatch(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  const homeScoreRaw = formData.get("homeScore");
  const awayScoreRaw = formData.get("awayScore");

  if (
    !matchId ||
    homeScoreRaw === null ||
    homeScoreRaw === "" ||
    awayScoreRaw === null ||
    awayScoreRaw === ""
  ) {
    return { error: "Match ID and both scores are required." };
  }

  const homeScore = parseInt(String(homeScoreRaw), 10);
  const awayScore = parseInt(String(awayScoreRaw), 10);

  if (
    Number.isNaN(homeScore) ||
    Number.isNaN(awayScore) ||
    homeScore < 0 ||
    awayScore < 0
  ) {
    return { error: "Scores must be non-negative integers (0, 1, 2, …)." };
  }

  const { error } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      is_finished: true,
    })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: "Match marked complete. Points recalculated." };
}

/**
 * Permanently delete a match and its predictions (CASCADE).
 */
export async function deleteMatch(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { error: "Match ID is required." };

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("home_team, away_team")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) return { error: "Match not found." };

  const { error } = await supabase.from("matches").delete().eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return {
    success: true,
    message: `Deleted ${match.home_team} vs ${match.away_team}.`,
  };
}
