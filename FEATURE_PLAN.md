# Depot Repair Feature Plan

## Overview

Add a depot repair workflow to the existing orders system. One store (the "depot") accepts mail-in devices from other stores, orders parts, performs repairs, and ships them back. Depot repairs are tracked in the same `order_list` table and `OrdersPage` as regular orders, with the following key differences:

- Created with status `'in transit'` instead of `'need to order'`
- `part_link` and `part_description` are optional at creation (required when advancing to `'need to order'`)
- All status transitions are gated on `has_depot_access` (a flag on the user), not store membership
- Depot-access users can see ALL depot orders across all stores
- When "All Stores" is toggled by a depot-access user, they see their own store orders + all depot orders from any store
- Depot orders are visually tagged with a "Depot" badge in the order list

**Status flow:**
`in transit → need to order → ordered → received → completed`
(plus the existing return/cancel branches from `need to order` onward)

---

## Clarifications

- **Status flow confirmed**: `in transit → need to order → ordered → received → completed`
- **Optional fields**: `part_link` and `part_description` optional ONLY in `in transit` (and `cancelled`); required once moved to `need to order`
- **UI integration**: Same orders list, visual "Depot" badge per row — no separate page/tab
- **All Stores behavior**: Depot-access users clicking "All Stores" see own store orders + all depot orders from every store

---

## Phase 1 — Database Migration

**File to create:** `supabase/migrations/20260307000000_depot_repairs.sql`

> Before writing: verify exact existing UPDATE policy names by querying `pg_policies` so DROP statements match exactly.

### Schema changes
- [ ] `ALTER TABLE profiles ADD COLUMN has_depot_access BOOLEAN NOT NULL DEFAULT FALSE`
- [ ] `ALTER TABLE order_list ADD COLUMN is_depot_repair BOOLEAN NOT NULL DEFAULT FALSE`
- [ ] `ALTER TABLE order_list ALTER COLUMN part_description DROP NOT NULL` (make nullable)
- [ ] `ALTER TABLE order_list ALTER COLUMN part_link DROP NOT NULL` (make nullable)
- [ ] Drop and recreate `order_list_status_check` to include `'in transit'`

### New RLS policies
- [ ] **SELECT** — `"Depot access users can view all depot orders"`: allows users with `has_depot_access = true` to SELECT any row where `is_depot_repair = true`
- [ ] **UPDATE** — `"Depot access users can update depot orders"`: allows users with `has_depot_access = true` to UPDATE any depot order in any direction (client-side `canTransition()` enforces valid transitions; admin policy already bypasses via `FOR ALL`)
- [ ] **SELECT** on `stores` — `"Depot access users can view all stores"`: allows depot-access users to SELECT all stores (needed for displaying store names on cross-store depot orders)

### Update existing UPDATE policies (add `AND is_depot_repair = false` to each USING clause)

This prevents regular role/store policies from matching depot orders. Drop and recreate each:

- [ ] `"All users can mark ordered as received"` — add `is_depot_repair = false` to USING
- [ ] `"All users can mark received as completed"` — add `is_depot_repair = false` to USING
- [ ] `"Employees can cancel need-to-order orders"` — add `is_depot_repair = false` to USING
- [ ] `"Managers can approve orders"` — add `is_depot_repair = false` to USING
- [ ] `"Managers can cancel need-to-order orders"` — add `is_depot_repair = false` to USING
- [ ] `"All users can flag received orders for return"` — add `is_depot_repair = false` to USING
- [ ] `"Managers can authorize returns"` — add `is_depot_repair = false` to USING
- [ ] `"All users can complete authorized returns"` — add `is_depot_repair = false` to USING
- [ ] Any `"Managers can mark orders as out of stock"` policy (if present) — add `is_depot_repair = false`

> Note: `"Admins may edit all"` (FOR ALL) and `"Users can insert orders for their stores"` (INSERT) do NOT need changes.

### Apply migration
- [ ] Run migration via `mcp__supabase__apply_migration` or confirm applied to production
- [ ] Verify new columns exist with `mcp__supabase__execute_sql`
- [ ] Verify all policies are correct with `SELECT * FROM pg_policies WHERE tablename = 'order_list'`

---

## Phase 2 — TypeScript Types

**Files:** `src/types/index.ts`, `src/services/api/orders.ts`

### `src/types/index.ts`
- [ ] Add `hasDepotAccess: boolean` to `User` interface
- [ ] Add `hasDepotAccess: boolean` to `ManagedUser` interface

### `src/services/api/orders.ts`
- [ ] Add `'in transit'` to `Order['status']` union type
- [ ] Add `is_depot_repair: boolean` to `Order` interface
- [ ] Change `part_description: string` → `part_description: string | null`
- [ ] Change `part_link: string` → `part_link: string | null`

---

## Phase 3 — Status Config

**File:** `src/lib/orderStatusConfig.ts`

- [ ] Add `'in transit'` entry to `STATUS_CONFIG` array (insert before `'need to order'`):
  ```ts
  {
    name: 'in transit',
    isTerminal: false,
    colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    transitions: [
      { to: 'need to order', allowedRoles: ['employee', 'manager', 'admin'] },
      { to: 'cancelled',     allowedRoles: ['employee', 'manager', 'admin'] },
    ],
  }
  ```
- [ ] Add `hasDepotAccess: boolean = false` parameter to `canTransition()` signature
- [ ] Add depot gate logic at the top of `canTransition()` (after admin bypass):
  ```ts
  if (order.is_depot_repair && !hasDepotAccess) {
    return { allowed: false, reason: 'Only users with depot access can update depot repair orders.' };
  }
  ```
- [ ] Update `can_transition` re-export in `src/services/api/orders.ts` to forward the new parameter

---

## Phase 4 — Auth Context

**File:** `src/context/AuthContext.tsx`

- [ ] Update profiles select in `buildUserFromSupabase`:
  ```ts
  .select("id, username, role, is_active, has_depot_access")
  ```
- [ ] Include `hasDepotAccess: profile.has_depot_access ?? false` in returned `User` object

---

## Phase 5 — Orders Service

**File:** `src/services/api/orders.ts`

### `getOrders`
- [ ] Add `includeAllDepotOrders?: boolean` parameter (after `searchTerm`)
- [ ] When `includeAllDepotOrders = true` and `storeIds` provided:
  - Use PostgREST `.or()` to match `store_id IN storeIds` OR `is_depot_repair = true`
  - Example: `.or(\`store_id.in.(${storeIds.join(',')}),is_depot_repair.eq.true\`)`
  - RLS automatically restricts `is_depot_repair = true` rows to users with `has_depot_access`
- [ ] When `includeAllDepotOrders = true` and no `storeIds` (edge case): omit store filter entirely

### `getDistinctStatuses`
- [ ] Add `includeAllDepotOrders?: boolean` parameter
- [ ] Apply same OR logic when true

---

## Phase 6 — Stores Service

**File:** `src/services/api/stores.ts`

- [ ] Add `getAllStores(): Promise<Store[]>` function that fetches all stores (no ID filter)
  - Used when a depot-access user needs all stores for display in "All Stores" mode
  - RLS `"Depot access users can view all stores"` permits this server-side

---

## Phase 7 — Dashboard Context

**File:** `src/context/DashboardContext.tsx`

- [ ] When the current user has `hasDepotAccess = true`, also fetch all stores (via `getAllStores()`) and merge into `availableStores` (deduped by ID)
  - This ensures store names for cross-store depot orders can be resolved in the OrderList store name lookup
  - Only done once on user load, not on every store switch

---

## Phase 8 — Create Order Modal

**File:** `src/components/orders/CreateOrderModal.tsx`

- [ ] Add `isDepotRepair: boolean` to `formData` (default `false`)
- [ ] Add "Depot Repair" checkbox to the form (below "Home Connect" checkbox):
  ```tsx
  <label className="flex items-center">
    <input type="checkbox" name="isDepotRepair" checked={formData.isDepotRepair} onChange={handleInputChange} ... />
    <span className="ml-2 text-sm ...">Depot Repair</span>
  </label>
  ```
- [ ] When `isDepotRepair = true`:
  - Remove `*` required indicator from `part_description` and `part_link` labels
  - Remove `required` attribute from those inputs
  - Add helper text below each: `"Required before advancing from 'In Transit'"`
- [ ] Update form validation: skip `part_link` and `part_description` validation when `isDepotRepair = true`
- [ ] Update `orderData` on submit when depot:
  ```ts
  status: 'in transit',
  is_depot_repair: true,
  part_link: formData.part_link || null,
  part_description: formData.part_description || null,
  order_date: null,
  ```
- [ ] Update `getInitialFormData` to include `isDepotRepair: false`

---

## Phase 9 — Order List Component

**File:** `src/components/orders/OrderList.tsx`

- [ ] Add a "Depot" pill badge on rows where `order.is_depot_repair === true`:
  ```tsx
  {order.is_depot_repair && (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                     bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
      Depot
    </span>
  )}
  ```
  Place it alongside the status badge or in the status cell.

---

## Phase 10 — Orders Page

**File:** `src/pages/OrdersPage.tsx`

### Depot user — All Stores fetching
- [ ] Read `currentUser.hasDepotAccess` into a local `isDepotUser` const
- [ ] Pass `includeAllDepotOrders: isDepotUser` to `ordersService.getOrders()` when `viewAllStores = true`
- [ ] Pass same flag to `ordersService.getDistinctStatuses()` when `viewAllStores = true`

### `canTransition` / `can_transition` calls
- [ ] Pass `currentUser.hasDepotAccess` as the 4th argument to every `can_transition()` call in this file

### Status change modal — depot "in transit" → "need to order" transition
- [ ] Add local state for `depotPartLink` and `depotPartDescription` (used only when in this transition)
- [ ] When `newStatus === 'need to order'` and `activeOrder?.is_depot_repair`:
  - Check if `activeOrder.part_link` is missing → show a URL input field labeled "Part Link *"
  - Check if `activeOrder.part_description` is missing → show a textarea labeled "Part Description *"
- [ ] Validate these fields before calling `updateOrder`:
  ```ts
  const needsPartLink = !activeOrder.part_link && !depotPartLink.trim();
  const needsPartDesc = !activeOrder.part_description && !depotPartDescription.trim();
  if (needsPartLink || needsPartDesc) {
    setReasonError('Part link and description are required before advancing to Need to Order.');
    return;
  }
  ```
- [ ] Include them in the update payload:
  ```ts
  await ordersService.updateOrder(activeOrder.id, {
    status: 'need to order',
    part_link: depotPartLink || activeOrder.part_link,
    part_description: depotPartDescription || activeOrder.part_description,
  });
  ```
- [ ] Clear `depotPartLink` and `depotPartDescription` in `closeStatusModal()`

### Status change modal — block non-depot users from seeing transitions on depot orders
- [ ] The `activeOrderValidStatuses` filter already uses `can_transition()`, which now returns `allowed: false` for non-depot users on depot orders — no extra code needed here as long as `can_transition` is called correctly

---

## Phase 11 — Invite User Page

**File:** `src/pages/InviteUserPage.tsx`

- [ ] Add `hasDepotAccess` state: `const [hasDepotAccess, setHasDepotAccess] = useState(false)`
- [ ] Add "Depot Access" checkbox in the form (below the Role field):
  ```tsx
  <div className="flex items-center gap-3">
    <input type="checkbox" checked={hasDepotAccess} onChange={e => setHasDepotAccess(e.target.checked)} ... />
    <label className="text-sm">Depot Access — can view and manage all depot repairs across all stores</label>
  </div>
  ```
- [ ] Include `hasDepotAccess` in the Edge Function payload:
  ```ts
  body: { email, name, role, storeIds, hasDepotAccess }
  ```
- [ ] Reset `hasDepotAccess` to `false` on form reset after success

---

## Phase 12 — Invite User Edge Function

**File:** `supabase/functions/invite-user/index.ts`

- [ ] Add `hasDepotAccess?: boolean` to `InvitePayload` interface
- [ ] After `inviteUserByEmail` creates the profile (via trigger), update `has_depot_access` if true:
  ```ts
  if (hasDepotAccess) {
    await adminClient
      .from('profiles')
      .update({ has_depot_access: true })
      .eq('id', newUserId);
  }
  ```
  (place this before the `user_store_access` insert, or after — doesn't matter; rollback handles both)

---

## Phase 13 — Users Page

**File:** `src/pages/UsersPage.tsx`

- [ ] Add `hasDepotAccess: boolean` to the `EditUserModal` form state (initialized from `user.hasDepotAccess`)
- [ ] Add "Depot Access" checkbox inside `EditUserModal` (visible to both manager and admin callers):
  ```tsx
  <div className="flex items-center gap-3">
    <input type="checkbox" checked={hasDepotAccess} onChange={e => setHasDepotAccess(e.target.checked)} ... />
    <label className="text-sm">Depot Access</label>
  </div>
  ```
- [ ] Include `hasDepotAccess` in the `onSave` call payload
- [ ] Update `onSave` prop signature to include `hasDepotAccess: boolean`
- [ ] Pass `hasDepotAccess` in the `usersService.updateUser()` call

---

## Phase 14 — Users Service

**File:** `src/services/api/users.ts`

- [ ] Add `hasDepotAccess?: boolean` to the `updateUser` updates parameter type
- [ ] Pass `hasDepotAccess` to the Edge Function body when provided

---

## Phase 15 — Manage Users Edge Function

**File:** `supabase/functions/manage-users/index.ts`

### `list` action
- [ ] Update profiles select to include `has_depot_access`:
  ```ts
  .select("id, username, role, is_active, has_depot_access")
  ```
- [ ] Include `hasDepotAccess: p.has_depot_access` in the returned user objects

### `update` action
- [ ] Accept `hasDepotAccess?: boolean` from request body
- [ ] If provided, update `profiles.has_depot_access`:
  ```ts
  if (hasDepotAccess !== undefined) {
    profileUpdate.has_depot_access = hasDepotAccess;
  }
  ```

---

## Phase 16 — Regenerate TypeScript DB Types (optional but recommended)

- [ ] Run `mcp__supabase__generate_typescript_types` to update `src/lib/database.types.ts` with new columns (`has_depot_access`, `is_depot_repair`, updated `status` enum)

---

## Verification Checklist

- [ ] `npm run dev` — dev server starts without TypeScript errors
- [ ] `npm run lint` — no lint errors
- [ ] **Create depot order**: Login as any user → Orders → Create Order → check "Depot Repair" → submit without part_link/part_description → order appears in list with `in transit` status and purple "Depot" badge
- [ ] **Non-depot user blocked**: As employee without depot access, click status badge on a depot order → no valid transitions shown (or transitions blocked with depot-access message)
- [ ] **Depot user advances status**: As depot-access user, advance depot order from `in transit` → `need to order` → missing `part_link`/`part_description` fields appear inline → fill in → order moves to `need to order` with those fields saved
- [ ] **Full lifecycle**: Advance depot order through `need to order → ordered → received → completed` as depot-access user
- [ ] **Cancel from in transit**: Depot-access user cancels an `in transit` depot order (requires cancellation reason)
- [ ] **Non-depot All Stores**: Regular employee clicks "All Stores" → sees only their assigned store orders (no cross-store depot orders)
- [ ] **Depot All Stores**: Depot-access user clicks "All Stores" → sees their own store's regular + depot orders AND depot orders from all other stores
- [ ] **Invite with depot access**: Admin invites new user with "Depot Access" checked → profile has `has_depot_access = true` in Supabase
- [ ] **Edit depot access in Users page**: Admin opens edit modal for existing user → toggles "Depot Access" → saves → reflected in DB
- [ ] **RLS isolation** (via `mcp__supabase__execute_sql`): A user without `has_depot_access` cannot SELECT depot orders from stores they're not assigned to
- [ ] **INSERT isolation**: Any authenticated user with store access can INSERT a depot order for their store; INSERT for a store they don't have access to is rejected

---

## Files Changed Summary

| File | Type | Phase |
|------|------|-------|
| `supabase/migrations/20260307000000_depot_repairs.sql` | New | 1 |
| `src/types/index.ts` | Modified | 2 |
| `src/services/api/orders.ts` | Modified | 2, 3, 5 |
| `src/lib/orderStatusConfig.ts` | Modified | 3 |
| `src/context/AuthContext.tsx` | Modified | 4 |
| `src/services/api/stores.ts` | Modified | 6 |
| `src/context/DashboardContext.tsx` | Modified | 7 |
| `src/components/orders/CreateOrderModal.tsx` | Modified | 8 |
| `src/components/orders/OrderList.tsx` | Modified | 9 |
| `src/pages/OrdersPage.tsx` | Modified | 10 |
| `src/pages/InviteUserPage.tsx` | Modified | 11 |
| `supabase/functions/invite-user/index.ts` | Modified | 12 |
| `src/pages/UsersPage.tsx` | Modified | 13 |
| `src/services/api/users.ts` | Modified | 14 |
| `supabase/functions/manage-users/index.ts` | Modified | 15 |
| `src/lib/database.types.ts` | Regenerated | 16 |
