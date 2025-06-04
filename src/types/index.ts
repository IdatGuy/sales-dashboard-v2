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
  salesGoal: number;
  accessoryGoal: number;
  homeConnectGoal: number;
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
  userId: string;
  storeId: string;
  date: string;
  salesAmount: number;
  accessorySales: number;
  homeConnects: number;
}

export interface Commission {
  id: string;
  userId: string;
  month: string;
  total: number;
  breakdown: {
    base: number;
    bonus: number;
    incentives: number;
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

export interface DailySales {
  date: string;
  amount: number;
}

export interface MonthlySales {
  month: string;
  amount: number;
}

export interface GoalProgress {
  current: number;
  goal: number;
  percentage: number;
}

export interface TimeFrame {
  period: 'month' | 'year';
  label: string;
}