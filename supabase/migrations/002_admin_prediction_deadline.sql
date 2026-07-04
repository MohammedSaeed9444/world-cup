-- =============================================================================
-- FIX: Add prediction_deadline column (run this in Supabase SQL Editor)
-- Safe to run multiple times.
-- =============================================================================

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS prediction_deadline TIMESTAMPTZ;

UPDATE public.matches
SET prediction_deadline = match_time
WHERE prediction_deadline IS NULL;

ALTER TABLE public.matches
  ALTER COLUMN prediction_deadline SET NOT NULL;

-- Lockout trigger uses prediction_deadline
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

DROP TRIGGER IF EXISTS trg_prevent_prediction_after_kickoff ON public.predictions;
CREATE TRIGGER trg_prevent_prediction_after_kickoff
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_prediction_after_kickoff();

-- Admin RLS (idempotent)
DROP POLICY IF EXISTS "admin_insert_matches" ON public.matches;
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

DROP POLICY IF EXISTS "admin_update_matches" ON public.matches;
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

DROP POLICY IF EXISTS "admin_delete_matches" ON public.matches;
CREATE POLICY "admin_delete_matches"
  ON public.matches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND email = 'mohammedsaeed9444@gmail.com'
    )
  );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
