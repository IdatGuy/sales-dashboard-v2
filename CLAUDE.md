# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript compile + Vite production build
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

No test suite is configured.

## Environment Setup

Copy `.env.example` to `.env.local` and populate:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture

### Provider Stack (App.tsx)

Providers wrap the app in this order: `Router > ThemeProvider > AuthProvider`. `DashboardProvider` wraps each protected page individually (not at the app root) so it re-initializes per route.

### State Management via Context

- **AuthContext** (`src/context/AuthContext.tsx`): Handles Supabase Auth login, fetches the user's `profiles` row and `user_store_access` rows, then stores the assembled `User` object in `localStorage`. `isAuthenticated` is simply `!!currentUser`.
- **DashboardContext** (`src/context/DashboardContext.tsx`): Central hub for the dashboard. Fetches sales data from Supabase based on `selectedStore` + `currentDate`, maintains a 5-minute in-memory cache keyed by `storeId-YYYY-MM` (daily) and `storeId-YYYY` (monthly). Exposes `getSalesForPeriod()` which filters cached data for the active timeframe (day/month/year).
- **ThemeContext** (`src/context/ThemeContext.tsx`): Light/dark mode toggle.

### Service Layer

All Supabase queries are in `src/services/api/`:
- `sales.ts` — `getStoreDailySales(storeId, month)` and `getStoreMonthlySales(storeId, year)`
- `goals.ts` — `goalsService.getStoreGoals(storeId, month)`
- `commission.ts` — `commissionService.getUserCommission(userId, month)`
- `stores.ts` — `getStoresByIds(ids[])`
- `orders.ts` — order_list CRUD
- `priceSheet.ts` — price sheet data

### Type System

`src/types/index.ts` contains UI-facing TypeScript interfaces (camelCase). `src/lib/database.types.ts` contains the generated Supabase schema types (snake_case). Service functions transform between them — e.g., `sales_amount` → `salesAmount`.

### Database Schema

Key tables: `profiles`, `stores`, `sales`, `store_goals`, `commissions`, `user_store_access`, `order_list`, `documents`.

User roles (enum `user_role`): `employee`, `manager`, `admin`. Store access is managed through the `user_store_access` junction table — each user can access one or more stores.

The `sales` table is keyed by `(store_id, date)` — one row per store per day. Fields: `sales_amount`, `accessory_sales`, `home_connects`, `home_plus`, `cleanings`, `repairs`.

### Role-Based UI

- Managers do not see the CommissionWidget or Leaderboard on DashboardPage.
- The `/admin` route renders `AdminPage` only for `role === 'admin'`, otherwise redirects to `/dashboard`.

### Date Handling

Dates in the DB are stored as `YYYY-MM-DD` strings. Always parse them explicitly as `new Date(year, month - 1, day)` — never pass ISO strings directly to `new Date()` — to avoid timezone off-by-one errors. This pattern is used throughout the codebase.

### Projection Logic

`SalesProjection` calculates monthly/yearly pace using only **completed business days** (Sundays excluded). Incomplete current days are not counted.
