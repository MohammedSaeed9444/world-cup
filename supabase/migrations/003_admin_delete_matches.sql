-- Allow admin to delete matches (safe to run if 002 was already applied)
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

NOTIFY pgrst, 'reload schema';
