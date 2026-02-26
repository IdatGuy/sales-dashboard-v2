-- =============================================================================
-- Security Audit: RLS Policy Documentation & Fixes
-- Audited: 2026-02-25
--
-- All 11 public tables have RLS enabled.
-- This migration documents verified-correct policies and applies 4 security fixes.
-- =============================================================================

-- =============================================================================
-- VERIFIED CORRECT POLICIES (already in production, no changes)
-- =============================================================================

-- sales:
--   SELECT "Users can read sales if they have store access"
--     USING: EXISTS (SELECT 1 FROM user_store_access WHERE user_id = auth.uid() AND store_id = sales.store_id)
--   INSERT "Managers and admins can insert sales"
--     WITH CHECK: role IN (manager, admin) AND store access
--   UPDATE "Managers and admins can update sales"
--     USING/WITH CHECK: role IN (manager, admin) AND store access

-- commissions:
--   SELECT "Users can view their own commissions"
--     USING: auth.uid() = user_id

-- order_list:
--   SELECT "Users can only see orders for their assigned stores"   ✅
--   UPDATE "All users can mark ordered as received"               ✅ (store access check)
--   UPDATE "All users can mark received as completed"             ✅ (store access check)
--   UPDATE "Employees can cancel need-to-order orders within 1 hour" ✅ (role + time + store)
--   UPDATE "Managers can approve orders"                          ✅ (role + store)
--   UPDATE "Managers can cancel need-to-order orders"             ✅ (role + store)
--   UPDATE "Managers can mark orders as out of stock"             ✅ (role + store)
--   ALL    "Admins may edit all"                                  ✅

-- profiles:
--   SELECT "Users can read their own profile"
--     USING: id = auth.uid()

-- stores:
--   SELECT "Manager sees all, others see assigned"
--     USING: role = manager OR id IN user_store_access for auth.uid()

-- user_store_access:
--   SELECT "Users can read their own store_access entries"
--     USING: user_id = auth.uid()

-- price_sheet:
--   SELECT "Anyone can view prices"   ✅
--   ALL    "Managers and admins can edit prices" ✅

-- devices / services:
--   SELECT: authenticated users  ✅
--   ALL:    managers and admins  ✅

-- =============================================================================
-- FIX 1: commissions — Add admin-only write protection
--
-- VULNERABILITY: No INSERT/UPDATE/DELETE policies exist on the commissions table.
-- Any authenticated user can create or modify commission records for any user_id.
-- The SELECT policy correctly uses auth.uid() = user_id, but writes are unprotected.
--
-- FIX: Restrict all writes to admins only.
-- =============================================================================

CREATE POLICY "Admins can manage commissions"
  ON commissions
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- =============================================================================
-- FIX 2: order_list — Restrict INSERT to authorized stores
--
-- VULNERABILITY: The existing "allow_authenticated_insert" policy uses
-- WITH CHECK = true, allowing any authenticated user to create orders for
-- any store_id, regardless of their user_store_access assignments.
--
-- FIX: Drop the permissive policy and replace with a store-access-checked one.
-- =============================================================================

DROP POLICY IF EXISTS "allow_authenticated_insert" ON order_list;

CREATE POLICY "Users can insert orders for their stores"
  ON order_list
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = order_list.store_id
    )
  );

-- =============================================================================
-- FIX 3: store_goals — Tighten SELECT to authorized stores only
--
-- VULNERABILITY: The "Enable read access for all users" policy uses qual = true,
-- meaning unauthenticated (anon) users can read goals for all stores via the
-- REST API with just the public anon key.
--
-- FIX: Restrict reads to authenticated users with store access (admins see all).
-- =============================================================================

DROP POLICY IF EXISTS "Enable read access for all users" ON store_goals;

CREATE POLICY "Users can view goals for their stores"
  ON store_goals
  FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    OR EXISTS (
      SELECT 1 FROM user_store_access
      WHERE user_id = auth.uid()
        AND store_id = store_goals.store_id
    )
  );

-- =============================================================================
-- FIX 4: store_goals — Fix write scope (add INSERT, add store access check,
--         include admins)
--
-- VULNERABILITIES:
--   a) No INSERT policy → managers cannot create goals for a store that has
--      never had goals set (app feature is broken on first use per store).
--   b) UPDATE/DELETE policies check role but NOT store access → a manager can
--      modify goals for any store, not just stores they are assigned to.
--   c) UPDATE/DELETE policies exclude 'admin' role entirely.
--
-- FIX: Drop the scoped UPDATE/DELETE policies and replace with a single FOR ALL
--      policy that enforces role AND store access (admins bypass store check).
-- =============================================================================

DROP POLICY IF EXISTS "Managers can update store goals" ON store_goals;
DROP POLICY IF EXISTS "Managers can delete store goals" ON store_goals;

CREATE POLICY "Managers and admins can manage store goals"
  ON store_goals
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR EXISTS (
        SELECT 1 FROM user_store_access
        WHERE user_id = auth.uid()
          AND store_id = store_goals.store_id
      )
    )
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('manager', 'admin')
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
      OR EXISTS (
        SELECT 1 FROM user_store_access
        WHERE user_id = auth.uid()
          AND store_id = store_goals.store_id
      )
    )
  );
