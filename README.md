# Sales Dashboard

A sales dashboard for multi-store retail teams. Built with React, TypeScript, Tailwind CSS, and Supabase.

**[Live App](https://sales-dashboard-v2.vercel.app)**

## Features

- **Sales Analytics** — Daily, monthly, and yearly charts with accumulated/daily toggle and pace projections
- **Dynamic Metrics** — Admin-configurable metric definitions (currency, count, percentage); stored as JSONB
- **Goal Tracking** — Admin-defined goals linked to metric keys; per-store monthly targets with progress bars
- **Commission Tracking** — Per-user commission breakdowns (accessory sales, home connects, residuals)
- **Order Management** — Full order lifecycle with status workflow (pending → complete, return flows, depot states)
- **Price Sheet** — Product pricing with built-in calculator
- **User Management** — Invite, edit, deactivate/reactivate users; soft delete via `is_active` + auth ban
- **Role-Based Access** — `employee`, `manager`, `admin` with RLS-enforced data isolation
- **Multi-Store** — Users scoped to assigned stores; `hasDepotAccess` flag grants access to all stores
- **Dark Mode** — Persistent light/dark theme toggle

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Chart.js, React Router
- **Backend**: Supabase (PostgreSQL 17, Auth, RLS, Edge Functions)
- **Deployment**: Vercel

## Getting Started

```bash
npm install
cp .env.example .env.local   # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

### Database Setup

```bash
npx supabase db push
```

This applies all migrations in `supabase/migrations/`, including schema, RLS policies, metric definitions, and goal system.

## Project Structure

```
src/
  components/
    admin/        # MetricDefinitionsPanel, GoalDefinitionsPanel, CsvImportPanel
    common/       # Navbar, StoreSelector, PeriodNavigator, TimeFrameToggle
    dashboard/    # SalesChart, GoalsProgress, CommissionWidget, Leaderboard, EnterSalesModal
    orders/       # OrderList, CreateOrderModal, CancelOrderModal
    priceSheet/   # PriceSheetGrid, PriceCalculatorModal, ManagePriceModal
    users/        # EditUserModal
  context/        # AuthContext, DashboardContext, ThemeContext
  pages/          # DashboardPage, OrdersPage, PriceSheetPage, AdminPage, UsersPage, InviteUserPage
  services/api/   # sales, goals, goalDefinitions, metricDefinitions, commission, stores, orders, priceSheet, users
  types/          # UI types (camelCase)
  lib/            # supabase client, database.types (snake_case), constants, dateUtils, logger
supabase/
  functions/      # invite-user, manage-users (Edge Functions)
  migrations/     # Full migration history
```

## Roles & Access

| Feature | Employee | Manager | Admin |
|---------|----------|---------|-------|
| View dashboard / orders / prices | ✓ | ✓ | ✓ |
| Commission widget & leaderboard | ✓ | — | ✓ |
| Enter / edit sales | ✓ | ✓ | ✓ |
| Set store goals | — | ✓ | ✓ |
| Manage users (`/users`, `/invite`) | — | ✓ | ✓ |
| Admin panel (metrics, goals, CSV import) | — | — | ✓ |

## Contact

isaiah.henline01@gmail.com
