export const CACHE_TTL_MS = 5 * 60 * 1000;
export const DEFAULT_SHOW_ACCUMULATED = true;
export const LOCALE = "en-US";

export const ROLES = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const STORAGE_KEYS = {
  CURRENT_USER: 'currentUser',
  THEME: 'theme',
  SALES_CHART_ACCUMULATED: 'salesChart-showAccumulated',
} as const;
