-- Allow depot users to mark in-transit depot orders as completed directly,
-- skipping the standard need-to-order → ordered → received workflow.
CREATE POLICY "Depot users can complete in transit orders"
  ON order_list FOR UPDATE TO authenticated
  USING (
    status = 'in transit'
    AND is_depot_repair = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid())
        AND has_depot_access = true
    )
  )
  WITH CHECK (
    status = 'completed'
    AND is_depot_repair = true
  );
