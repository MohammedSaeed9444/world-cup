-- =============================================================================
-- Admin features: prediction_deadline column + admin RLS + updated lockout trigger
-- Run in Supabase SQL Editor AFTER 001_initial_schema.sql
-- =============================================================================

-- Per-match prediction closing deadline (can be before kickoff)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS prediction_deadline TIMESTAMPTZ;

-- Backfill existing rows: default deadline = kickoff time
UPDATE public.matches
SET prediction_deadline = match_time
WHERE prediction_deadline IS NULL;

ALTER TABLE public.matches
  ALTER COLUMN prediction_deadline SET NOT NULL;

-- ---------------------------------------------------------------------------
-- Updated lockout trigger — uses prediction_deadline instead of match_time
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_prediction_after_kickoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deadline TIMESTAMPTZ;
BEGIN
  SELECT prediction_deadline INTO deadline
  FROM public.matches
  WHERE id = NEW.match_id;

  IF deadline IS NULL THEN
    RAISE EXCEPTION 'Match not found for prediction (match_id: %)', NEW.match_id;
  END IF;

  IF NOW() >= deadline THEN
    RAISE EXCEPTION
      'Predictions are locked. Deadline was % (UTC).',
      deadline;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Admin RLS — only mohammedsaeed9444@gmail.com may INSERT/UPDATE matches
-- ---------------------------------------------------------------------------
CREATE POLICY "admin_insert_matches"
  ON public.matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email = 'mohammedsaeed9444@gmail.com'
    )
  );

CREATE POLICY "admin_update_matches"
  ON public.matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email = 'mohammedsaeed9444@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email = 'mohammedsaeed9444@gmail.com'
    )
  );
