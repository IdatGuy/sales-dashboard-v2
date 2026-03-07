-- Remove 1-hour cancellation window for employees — allow cancel any time like managers

DROP POLICY IF EXISTS "Employees can cancel need-to-order orders within 1 hour" ON order_list;

CREATE POLICY "Employees can cancel need-to-order orders"
  ON order_list
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'employee'
    AND status = 'need to order'
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  )
  WITH CHECK (
    status = 'cancelled'
  );
