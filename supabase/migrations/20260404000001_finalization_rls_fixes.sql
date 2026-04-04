-- =============================================================================
-- Pre-release finalization: RLS policy hardening
-- 2026-04-04
-- =============================================================================

-- =============================================================================
-- FIX 1: Tighten {public} policies to {authenticated}
--
-- Six policies were created without an explicit role, defaulting to {public}
-- (anon + authenticated). The USING clauses all filter on auth.uid(), so
-- anonymous users cannot access any rows in practice, but explicitly requiring
-- authentication is cleaner and more defense-in-depth.
-- =============================================================================

ALTER POLICY "Users can read their own profile"
  ON profiles TO authenticated;

ALTER POLICY "Users can read sales if they have store access"
  ON sales TO authenticated;

ALTER POLICY "Users can read their own store_access entries"
  ON user_store_access TO authenticated;

ALTER POLICY "Depot access users can view all stores"
  ON stores TO authenticated;

ALTER POLICY "Depot access users can view all depot orders"
  ON order_list TO authenticated;

ALTER POLICY "Depot access users can update depot orders"
  ON order_list TO authenticated;

-- =============================================================================
-- FIX 2: Drop dead 'out of stock' RLS policy
--
-- The 'out of stock' status was removed from the order_list CHECK constraint
-- and from orderStatusConfig.ts, but this UPDATE policy was never cleaned up.
-- Any attempt to invoke it would fail at the CHECK constraint level before
-- data could change. Dropping it removes misleading dead code.
-- =============================================================================

DROP POLICY IF EXISTS "Managers can mark orders as out of stock" ON order_list;
