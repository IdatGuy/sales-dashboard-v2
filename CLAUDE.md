# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Stack

Vite + React + TypeScript + Supabase (Auth + Postgres). Deployed on Vercel. No test suite. Uses npm.

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

## Environment

Copy `.env.example` to `.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

### Provider Stack (`App.tsx`)
`ErrorBoundary > Router > ThemeProvider > AuthProvider > AppContent`

`DashboardProvider` wraps each protected page individually so it re-initializes per route.

### Contexts
- **AuthContext** (`src/context/AuthContext.tsx`): Supabase Auth login, fetches `profiles` + `user_store_access`, assembles `User` object cached in `localStorage`. `isAuthenticated = !!currentUser`.
- **DashboardContext** (`src/context/DashboardContext.tsx`): Fetches sales data for `selectedStore + currentDate`. 5-minute in-memory cache keyed `storeId|YYYY-MM` (daily) and `storeId|YYYY` (monthly). Exposes `getSalesForPeriod()`, `refreshSalesData()`, metric definitions, goal definitions, and `showAccumulated` toggle.
- **ThemeContext**: Light/dark mode toggle.

### Routes
| Path | Access |
|------|--------|
| `/login` | Public |
| `/dashboard` | All authenticated |
| `/orders` | All authenticated |
| `/prices` | All authenticated |
| `/admin` | `admin` only |
| `/users` | `manager` + `admin` |
| `/invite` | `manager` + `admin` |
| `/set-password` | Invite flow only |

### Service Layer (`src/services/api/`)
All Supabase queries must go through services — never query from components directly.

- `sales.ts` — `salesService.upsertDailySales`, `getStoreDailySales(storeId, month)`, `getStoreMonthlySales(storeId, year)`, `bulkUpsertSalesFromCsv`
- `goals.ts` — `goalsService.getStoreGoals(storeId, month)`
- `goalDefinitions.ts` — `listGoalDefinitions`, `createGoalDefinition`, `updateGoalDefinition`
- `metricDefinitions.ts` — `getMetricDefinitions`, `createMetricDefinition`, `updateMetricDefinition`, `reorderMetricDefinitions`, `deleteMetricDefinition`
- `commission.ts` — `commissionService.getUserCommission(userId, month)`
- `stores.ts` — `getStoresByIds(ids[])`, `getAllStores()`
- `orders.ts` — `order_list` CRUD
- `priceSheet.ts` — price sheet data
- `users.ts` — `usersService.listUsers`, `updateUser`, `deactivateUser`, `reactivateUser`

### Edge Functions (`supabase/functions/`)
- `invite-user/` — validates JWT + role server-side; sends invite email
- `manage-users/` — GET/PATCH/DELETE/PUT for user management (requires manager+ role)

### Types
- UI types: `src/types/index.ts` (camelCase)
- DB schema types: `src/lib/database.types.ts` (snake_case)
- Service functions transform between them (e.g. `store_id` → `storeId`)

### Database Schema
Key tables: `profiles`, `stores`, `sales`, `store_goals`, `goal_definitions`, `sales_metric_definitions`, `commissions`, `user_store_access`, `order_list`.

**`sales`**: keyed `(store_id, date)` — one row per store per day. Metrics stored as JSONB `metrics` column (e.g. `{"accessory_sales": 100, "home_connects": 5}`).

**`sales_metric_definitions`**: admin-managed dynamic metrics. Fields: `key`, `label`, `unit_type` (`currency|count|percentage`), `is_visible`, `sort_order`, `is_builtin`, `is_deprecated`.

**`goal_definitions`**: admin-managed. Links a goal name to one or more metric keys and a `unit_type`. `store_goals` references `goal_definition_id` (PK: `store_id + month + goal_definition_id`).

**User roles** (`user_role` enum): `employee`, `manager`, `admin`. Store access via `user_store_access` junction table. `profiles.has_depot_access = true` grants access to all stores.

**Soft delete**: `profiles.is_active` + Supabase Auth ban (`ban_duration: '87600h'`).

### Role-Based UI
- Employees do not see `CommissionWidget` or `Leaderboard`.
- `/admin` — `admin` only; renders metric/goal definition panels and CSV import.
- `/users` — `manager` + `admin`; list, edit, deactivate/reactivate users.
- `StoreSelector` is hidden when the user has only one store.

### Date Handling
Dates stored as `YYYY-MM-DD`. Always parse as `new Date(year, month - 1, day)` — never pass ISO strings to `new Date()` to avoid timezone off-by-one errors. Utilities in `src/lib/dateUtils.ts`: `parseDateString`, `formatDateToYMD`, `countBusinessDays`.

### Projection Logic
`SalesProjection` calculates monthly/yearly pace using only completed business days (Sundays excluded). Incomplete current days are not counted.

---

## Security Rules

### RLS Policy Requirement
**Any time access control logic changes** — new roles, modified permissions, new tables with restricted access — you must:

1. Verify a matching RLS policy exists in Supabase for the affected table(s).
2. If no policy exists, create one alongside the code change. Do not rely on application-layer checks alone.
3. Prefer `(select auth.uid())` over `auth.uid()` in RLS conditions to avoid per-row function calls.

Example:
```sql
create policy "Users can view their store sales"
on sales for select
using (
  store_id in (
    select store_id from user_store_access
    where user_id = (select auth.uid())
  )
);
```

Full policy inventory: `supabase/migrations/20260225000000_rls_policies.sql`

---

## General Conventions

- Tailwind for all styling — no inline styles or CSS modules unless absolutely necessary.
- Keep Supabase queries in the service layer, not in components.
- Use `logger` (`src/lib/logger.ts`) instead of `console.log/error`.
- No test suite — verify changes manually via the dev server.
