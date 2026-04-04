-- Allow depot users to insert depot repair orders for any store.
-- Depot users need to create follow-up part orders for repairs belonging to
-- stores they are not directly assigned to.
CREATE POLICY "Depot users can insert depot repairs for any store"
ON order_list FOR INSERT TO authenticated
WITH CHECK (
  is_depot_repair = true
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
    AND has_depot_access = true
  )
);
