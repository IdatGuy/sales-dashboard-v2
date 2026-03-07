# CLAUDE.md

This file provides guidance to Claude Code when working with this repository (Next.js + Tailwind + Supabase).

## Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

### Provider Stack (`App.tsx`)
`Router > ThemeProvider > AuthProvider`. `DashboardProvider` wraps each protected page individually so it re-initializes per route.

### Context / State
- **AuthContext**: Supabase Auth login, fetches `profiles` + `user_store_access`, assembles `User` object in `localStorage`. `isAuthenticated = !!currentUser`.
- **DashboardContext**: Fetches sales data based on `selectedStore` + `currentDate`. 5-minute in-memory cache keyed by `storeId-YYYY-MM` (daily) and `storeId-YYYY` (monthly). Exposes `getSalesForPeriod()`.
- **ThemeContext**: Light/dark mode toggle.

### Service Layer (`src/services/api/`)
- `sales.ts` — `getStoreDailySales(storeId, month)`, `getStoreMonthlySales(storeId, year)`
- `goals.ts` — `goalsService.getStoreGoals(storeId, month)`
- `commission.ts` — `commissionService.getUserCommission(userId, month)`
- `stores.ts` — `getStoresByIds(ids[])`
- `orders.ts` — order_list CRUD
- `priceSheet.ts` — price sheet data

### Types
UI types are in `src/types/index.ts` (camelCase). DB schema types are in `src/lib/database.types.ts` (snake_case). Service functions transform between them (e.g. `sales_amount` → `salesAmount`).

### Database Schema
Key tables: `profiles`, `stores`, `sales`, `store_goals`, `commissions`, `user_store_access`, `order_list`, `documents`.

User roles (`user_role` enum): `employee`, `manager`, `admin`. Store access via `user_store_access` junction table.

The `sales` table is keyed by `(store_id, date)` — one row per store per day.

### Role-Based UI
- Managers do not see `CommissionWidget` or `Leaderboard`.
- `/admin` renders `AdminPage` only for `role === 'admin'`, otherwise redirects to `/dashboard`.

### Date Handling
Dates are stored as `YYYY-MM-DD`. Always parse as `new Date(year, month - 1, day)` — never pass ISO strings directly to `new Date()` — to avoid timezone off-by-one errors.

### Projection Logic
`SalesProjection` calculates monthly/yearly pace using only completed business days (Sundays excluded). Incomplete current days are not counted.

---

## Security Rules

### RLS Policy Requirement
**Any time access control logic changes** — new roles, modified permissions, new tables with restricted access, or changes to `user_store_access` — you must:

1. Verify that a matching RLS policy exists in Supabase for the affected table(s).
2. If no policy exists, create one before or alongside the code change. Do not rely solely on application-layer checks.
3. Prefer `(select auth.uid())` over `auth.uid()` in RLS conditions to avoid per-row function calls.

Example pattern:
```sql
-- Allow users to read only their own store's data
create policy "Users can view their store sales"
on sales for select
using (
  store_id in (
    select store_id from user_store_access
    where user_id = (select auth.uid())
  )
);
```

---

## General Conventions

- Use **Server Components** by default in Next.js; opt into `"use client"` only when necessary (interactivity, hooks, browser APIs).
- Route all **write/mutation** operations through server actions or API routes — do not mutate data from the client directly via Supabase.
- Use **Zod** to validate data shapes before DB inserts.
- Tailwind for all styling — no inline styles or CSS modules unless absolutely necessary.
- Keep Supabase queries in the service layer (`src/services/api/`), not in components.
