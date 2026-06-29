-- =============================================================================
-- World Cup Predictions — Supabase PostgreSQL Schema
-- Run this entire script in the Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. PROFILES — linked 1:1 to Supabase Auth users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create a profile row whenever a new user registers via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      split_part(COALESCE(NEW.email, 'player'), '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. MATCHES — World Cup fixtures with official kickoff times
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team   TEXT NOT NULL,
  away_team   TEXT NOT NULL,
  match_time  TIMESTAMPTZ NOT NULL,
  home_score  INTEGER,
  away_score  INTEGER,
  is_finished BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 3. PREDICTIONS — one prediction per user per match (enforced by UNIQUE)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.predictions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  match_id   UUID NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  pred_home  INTEGER NOT NULL CHECK (pred_home >= 0),
  pred_away  INTEGER NOT NULL CHECK (pred_away >= 0),
  points     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

-- ---------------------------------------------------------------------------
-- 4. CRITICAL LOCKOUT — reject INSERT/UPDATE after kickoff (DB-level force)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_prediction_after_kickoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  kickoff TIMESTAMPTZ;
BEGIN
  SELECT match_time INTO kickoff
  FROM public.matches
  WHERE id = NEW.match_id;

  IF kickoff IS NULL THEN
    RAISE EXCEPTION 'Match not found for prediction (match_id: %)', NEW.match_id;
  END IF;

  -- NOW() is evaluated server-side in UTC — same source of truth as match_time
  IF NOW() >= kickoff THEN
    RAISE EXCEPTION
      'Predictions are locked after kickoff. Match started at % (UTC).',
      kickoff;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_prediction_after_kickoff ON public.predictions;
CREATE TRIGGER trg_prevent_prediction_after_kickoff
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_prediction_after_kickoff();

-- ---------------------------------------------------------------------------
-- 5. SCORING — mirrors utils/scoring.js logic inside PostgreSQL
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_prediction_points(
  pred_home  INTEGER,
  pred_away  INTEGER,
  final_home INTEGER,
  final_away INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Exact score match → 25 points
  IF pred_home = final_home AND pred_away = final_away THEN
    RETURN 25;
  END IF;

  -- Correct outcome only (win/loss/draw direction) → 10 points
  IF (pred_home > pred_away AND final_home > final_away)
     OR (pred_home < pred_away AND final_home < final_away)
     OR (pred_home = pred_away AND final_home = final_away) THEN
    RETURN 10;
  END IF;

  -- Wrong outcome → 0 points
  RETURN 0;
END;
$$;

-- Recalculate all prediction points when a match is marked finished
CREATE OR REPLACE FUNCTION public.update_prediction_points_on_match_finish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_finished = TRUE
     AND NEW.home_score IS NOT NULL
     AND NEW.away_score IS NOT NULL THEN
    UPDATE public.predictions
    SET
      points     = public.calculate_prediction_points(
                     pred_home, pred_away, NEW.home_score, NEW.away_score
                   ),
      updated_at = NOW()
    WHERE match_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_prediction_points ON public.matches;
CREATE TRIGGER trg_update_prediction_points
  AFTER UPDATE ON public.matches
  FOR EACH ROW
  WHEN (
    NEW.is_finished = TRUE
    AND (
      OLD.is_finished IS DISTINCT FROM TRUE
      OR OLD.home_score IS DISTINCT FROM NEW.home_score
      OR OLD.away_score IS DISTINCT FROM NEW.away_score
    )
  )
  EXECUTE FUNCTION public.update_prediction_points_on_match_finish();

-- ---------------------------------------------------------------------------
-- 6. GLOBAL LEADERBOARD VIEW — ranked by total points
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.global_leaderboard AS
SELECT
  p.id                                              AS user_id,
  p.display_name,
  p.email,
  COALESCE(SUM(pr.points), 0)::INTEGER              AS total_points,
  COUNT(pr.id)::INTEGER                             AS predictions_made,
  RANK() OVER (
    ORDER BY COALESCE(SUM(pr.points), 0) DESC, p.display_name ASC
  )                                                 AS rank
FROM public.profiles p
LEFT JOIN public.predictions pr ON pr.user_id = p.id
GROUP BY p.id, p.display_name, p.email
ORDER BY total_points DESC, p.display_name ASC;

-- ---------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY — defence-in-depth on top of triggers
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Profiles: everyone authenticated can read; users edit only themselves
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Matches: read-only for players (insert/update via Supabase dashboard or service role)
CREATE POLICY "matches_select_authenticated"
  ON public.matches FOR SELECT
  TO authenticated
  USING (true);

-- Predictions: read all; write only own rows (kickoff lock enforced by trigger)
CREATE POLICY "predictions_select_authenticated"
  ON public.predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "predictions_insert_own"
  ON public.predictions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "predictions_update_own"
  ON public.predictions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard view inherits RLS from underlying tables; grant SELECT explicitly
GRANT SELECT ON public.global_leaderboard TO authenticated;

-- ---------------------------------------------------------------------------
-- 8. SAMPLE DATA — optional demo fixtures (delete or replace for real WC data)
-- ---------------------------------------------------------------------------
-- Only insert sample rows if the table is empty (safe to re-run script)
INSERT INTO public.matches (home_team, away_team, match_time, is_finished)
SELECT * FROM (VALUES
  ('Brazil',    'Argentina',  NOW() + INTERVAL '7 days',  FALSE),
  ('France',    'Germany',   NOW() + INTERVAL '8 days',  FALSE),
  ('Spain',     'Italy',     NOW() - INTERVAL '2 hours', TRUE),
  ('England',   'Portugal',  NOW() - INTERVAL '1 day',   TRUE)
) AS v(home_team, away_team, match_time, is_finished)
WHERE NOT EXISTS (SELECT 1 FROM public.matches LIMIT 1);

-- Set final scores on the two "finished" sample matches so scoring demo works
UPDATE public.matches
SET home_score = 2, away_score = 1, is_finished = TRUE
WHERE home_team = 'Spain' AND away_team = 'Italy';

UPDATE public.matches
SET home_score = 1, away_score = 1, is_finished = TRUE
WHERE home_team = 'England' AND away_team = 'Portugal';
