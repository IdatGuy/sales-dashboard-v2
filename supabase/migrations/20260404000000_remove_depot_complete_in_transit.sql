-- In transit orders must follow the full workflow (need to order → ordered → received → completed).
-- Direct in transit → completed is no longer permitted for depot users.
-- Admins retain full edit access via the existing "Admins may edit all" policy.
DROP POLICY IF EXISTS "Depot users can complete in transit orders" ON order_list;
