export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  isActive: boolean;
  hasDepotAccess: boolean;
  userStoreAccess: UserStoreAccess[]; // Updated to use UserStoreAccess
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  isActive: boolean;
  hasDepotAccess: boolean;
  storeIds: string[];
}

export interface Store {
  id: string;
  name: string;
  location: string;
}

export interface Sale {
  id: string;
  storeId: string;
  date: string;
  metrics: Record<string, number>;
}

export interface Commission {
  id: string;
  userId: string;
  month: string;
  total: number;
  breakdown: {
    accessorySales: number; // New property for accessory sales
    homeConnects: number; // New property for Home Connect sales
    residuals: number; // New property for residuals
  };
}


export interface GoalProgress {
  current: number;
  goal: number;
  percentage: number;
}

export interface GoalDefinition {
  id: string;
  name: string;
  metricKeys: string[];
  unitType: 'currency' | 'count' | 'percentage';
  sortOrder: number;
  isDeprecated: boolean;
}

export interface TimeFrame {
  period: 'day' | 'month' | 'year';
  label: string;
}

export interface CacheEntry {
  data: Sale[];
  timestamp: number;
}

export interface UserStoreAccess {
  userId: string;
  storeId: string;
}

export interface AllowedDomain {
  id: string;
  domain: string;
  label: string;
  createdAt: string;
}