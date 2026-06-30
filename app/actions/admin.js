"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

/**
 * Parse a datetime-local string ("2026-07-15T20:00") into an ISO timestamp.
 * @param {string} value
 */
function parseLocalDatetime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/**
 * Compute prediction_deadline from kickoff and either a custom datetime or offset.
 */
function resolvePredictionDeadline(matchTimeIso, deadlineMode, offsetMinutes, customDeadline) {
  const kickoff = new Date(matchTimeIso);

  if (deadlineMode === "custom") {
    const custom = parseLocalDatetime(customDeadline);
    if (!custom) return { error: "Invalid custom prediction deadline." };
    if (new Date(custom) > kickoff) {
      return { error: "Prediction deadline cannot be after kickoff." };
    }
    return { deadline: custom };
  }

  const offset = parseInt(String(offsetMinutes), 10);
  if (Number.isNaN(offset) || offset < 0) {
    return { error: "Invalid deadline offset." };
  }

  const deadline = new Date(kickoff.getTime() - offset * 60 * 1000);
  return { deadline: deadline.toISOString() };
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
  const deadlineMode = String(formData.get("deadlineMode") ?? "offset");
  const offsetMinutes = formData.get("offsetMinutes");
  const customDeadline = String(formData.get("customDeadline") ?? "").trim();

  if (!homeTeam || !awayTeam) {
    return { error: "Home and away team names are required." };
  }

  if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) {
    return { error: "Home and away teams must be different." };
  }

  const matchTime = parseLocalDatetime(matchTimeLocal);
  if (!matchTime) {
    return { error: "Invalid match date/time." };
  }

  const { deadline, error: deadlineError } = resolvePredictionDeadline(
    matchTime,
    deadlineMode,
    offsetMinutes,
    customDeadline
  );
  if (deadlineError) return { error: deadlineError };

  const { error } = await supabase.from("matches").insert({
    home_team: homeTeam,
    away_team: awayTeam,
    match_time: matchTime,
    prediction_deadline: deadline,
    is_finished: false,
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: `Match added: ${homeTeam} vs ${awayTeam}` };
}

/**
 * Update prediction deadline for an existing match.
 */
export async function updateMatchDeadline(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  const deadlineMode = String(formData.get("deadlineMode") ?? "offset");
  const offsetMinutes = formData.get("offsetMinutes");
  const customDeadline = String(formData.get("customDeadline") ?? "").trim();

  const { data: match, error: fetchError } = await supabase
    .from("matches")
    .select("match_time")
    .eq("id", matchId)
    .single();

  if (fetchError || !match) return { error: "Match not found." };

  const { deadline, error: deadlineError } = resolvePredictionDeadline(
    match.match_time,
    deadlineMode,
    offsetMinutes,
    customDeadline
  );
  if (deadlineError) return { error: deadlineError };

  const { error } = await supabase
    .from("matches")
    .update({ prediction_deadline: deadline })
    .eq("id", matchId);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true, message: "Prediction deadline updated." };
}

/**
 * Save final scores and mark a match as completed.
 * DB trigger recalculates all user prediction points automatically.
 */
export async function finishMatch(prevState, formData) {
  const { denied, supabase } = await requireAdmin();
  if (denied) return { error: "Access denied." };

  const matchId = String(formData.get("matchId") ?? "");
  const homeScoreRaw = formData.get("homeScore");
  const awayScoreRaw = formData.get("awayScore");

  if (!matchId || homeScoreRaw === null || homeScoreRaw === "" || awayScoreRaw === null || awayScoreRaw === "") {
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
