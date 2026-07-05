-- =============================================================================
-- FIX: Allow admin's scoring UPDATE to pass through the lockout trigger.
--
-- Root cause: when an admin finishes a match, the scoring trigger runs:
--   UPDATE predictions SET points = ... WHERE match_id = ...
-- This UPDATE was hitting the BEFORE UPDATE trigger which checked the deadline
-- and raised an exception even though the user isn't changing their prediction.
--
-- Fix: only enforce the deadline when pred_home or pred_away actually changes.
-- A points-only UPDATE (from the scoring function) is always allowed through.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_prediction_after_kickoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deadline TIMESTAMPTZ;
BEGIN
  -- For UPDATE: skip the deadline check when only the `points` / `updated_at`
  -- columns are changing (i.e. the scoring trigger, not a user edit).
  IF TG_OP = 'UPDATE'
     AND NEW.pred_home = OLD.pred_home
     AND NEW.pred_away = OLD.pred_away THEN
    RETURN NEW;
  END IF;

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

-- Re-create the trigger (CREATE OR REPLACE on the function is enough,
-- but dropping and re-creating makes the timing explicit).
DROP TRIGGER IF EXISTS trg_prevent_prediction_after_kickoff ON public.predictions;
CREATE TRIGGER trg_prevent_prediction_after_kickoff
  BEFORE INSERT OR UPDATE ON public.predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_prediction_after_kickoff();
