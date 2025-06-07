export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  storeIds: string[];
}

export interface Store {
  id: string;
  name: string;
  location: string;
}

export interface StoreGoal {
  id: string;
  storeId: string;
  month: string; // YYYY-MM format
  salesGoal: number;
  accessoryGoal: number;
  homeConnectGoal: number;
}

export interface Sale {
  id: string;
  storeId: string;
  date: string;
  salesAmount: number;
  accessorySales: number;
  homeConnects: number;
  cleanings: number; // New property for cleanings
  repairs: number; // New property for repairs
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

export interface Document {
  id: string;
  name: string;
  category: 'price' | 'training' | 'policy' | 'schedule';
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface GoalProgress {
  current: number;
  goal: number;
  percentage: number;
}

export interface TimeFrame {
  period: 'day' | 'month' | 'year';
  label: string;
}