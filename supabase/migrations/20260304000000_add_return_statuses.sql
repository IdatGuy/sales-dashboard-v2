-- =============================================================================
-- Add Return Authorized & Return Complete Statuses
-- 2026-03-04
--
-- Extends the order_list status CHECK constraint and adds RLS UPDATE policies
-- for the return flow: received → return required → return authorized → return complete
-- Per: src/Parts Ordering Access Control.csv rows 9-12
-- =============================================================================

-- =============================================================================
-- 1. Update CHECK constraint to allow new status values
-- =============================================================================

ALTER TABLE order_list
  DROP CONSTRAINT IF EXISTS order_list_status_check;

ALTER TABLE order_list
  ADD CONSTRAINT order_list_status_check CHECK (
    status IN (
      'need to order',
      'ordered',
      'received',
      'distro',
      'return required',
      'return authorized',
      'return complete',
      'completed',
      'cancelled'
    )
  );

-- =============================================================================
-- 2. RLS UPDATE policies for new transitions
--
-- Pattern: USING = current row must be in source status (+ role/store checks)
--          WITH CHECK = updated row must be in target status (+ role/store checks)
--
-- The existing "Admins may edit all" FOR ALL policy already covers admin bypass.
-- =============================================================================

-- received → return required (all roles, CSV row 9: "Anyone can request a return")
CREATE POLICY "All users can flag received orders for return"
  ON order_list FOR UPDATE TO authenticated
  USING (
    status = 'received'
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  )
  WITH CHECK (
    status = 'return required'
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  );

-- return required → return authorized (manager/admin only, CSV row 10)
CREATE POLICY "Managers can authorize returns"
  ON order_list FOR UPDATE TO authenticated
  USING (
    status = 'return required'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  )
  WITH CHECK (
    status = 'return authorized'
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  );

-- return authorized → return complete (all roles, CSV rows 11-12)
CREATE POLICY "All users can complete authorized returns"
  ON order_list FOR UPDATE TO authenticated
  USING (
    status = 'return authorized'
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  )
  WITH CHECK (
    status = 'return complete'
    AND EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  );
