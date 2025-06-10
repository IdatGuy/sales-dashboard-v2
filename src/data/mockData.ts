import { User, Store, StoreGoal, Sale, Commission, Document, UserStoreAccess } from '../types';

// Mock Users
export const mockUserStoreAccess: UserStoreAccess[] = [
  { userId: '1', storeId: '1', accessLevel: 'employee' },
  { userId: '2', storeId: '1', accessLevel: 'manager' },
  { userId: '2', storeId: '2', accessLevel: 'manager' },
  { userId: '2', storeId: '3', accessLevel: 'manager' },
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Employee',
    email: 'employee@example.com',
    role: 'employee',
    userStoreAccess: mockUserStoreAccess.filter(a => a.userId === '1'),
  },
  {
    id: '2',
    name: 'Mary Manager',
    email: 'manager@example.com',
    role: 'manager',
    userStoreAccess: mockUserStoreAccess.filter(a => a.userId === '2'),
  },
];

// Mock Stores
export const mockStores: Store[] = [
  {
    id: '1',
    name: 'Downtown Store',
    location: '123 Main St',
  },
  {
    id: '2',
    name: 'Westside Location',
    location: '456 West Ave',
  },
  {
    id: '3',
    name: 'Eastside Branch',
    location: '789 East Blvd',
  },
];

// Generate daily sales data for the current month
const generateDailySales = (storeId: string): Sale[] => {
  const sales: Sale[] = [];
  const today = new Date();
  for (let i = 44; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    // Random daily sales between $800 and $3000
    const salesAmount = Math.floor(Math.random() * (3000 - 800 + 1)) + 800;
    // Random accessory sales between $0 and $250
    const accessorySales = Math.floor(Math.random() * 251);
    // Random home connects between 1 and 8
    const homeConnects = Math.floor(Math.random() * 8) + 1;
    // Random cleanings between 0 and 6
    const cleanings = Math.floor(Math.random() * 7);
    // Random repairs between 10 and 25
    const repairs = Math.floor(Math.random() * (25 - 10 + 1)) + 10;

    sales.push({
      id: `${storeId}-${dateString}`,
      storeId,
      date: dateString,
      salesAmount,
      accessorySales,
      homeConnects,
      cleanings,
      repairs,
    });
  }
  return sales;
};

// Generate all sales data per store
const allDailySales: Sale[] = [
  ...generateDailySales('1'),
  ...generateDailySales('2'),
  ...generateDailySales('3'),
];

// Mock Sales (daily)
export const mockSales: Sale[] = [
  ...allDailySales,
];

// Mock Commissions
export const mockCommissions: Commission[] = [
  {
    id: '1',
    userId: '1',
    month: new Date().toISOString().split('T')[0].substring(0, 7),
    breakdown: {
      accessorySales: 60,
      homeConnects: 40,
      residuals: 20,
    },
    get total() {
      return this.breakdown.accessorySales + this.breakdown.homeConnects + this.breakdown.residuals;
    },
  },
];

// Mock Documents
export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Current Price Sheet - 2025',
    category: 'price',
    fileUrl: 'https://example.com/price-sheet-2025.pdf',
    uploadedBy: '2',
    uploadedAt: '2025-04-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'New Employee Training Guide',
    category: 'training',
    fileUrl: 'https://example.com/training-guide.pdf',
    uploadedBy: '2',
    uploadedAt: '2025-03-15T14:30:00Z',
  },
  {
    id: '3',
    name: 'Return Policy Update',
    category: 'policy',
    fileUrl: 'https://example.com/return-policy.pdf',
    uploadedBy: '2',
    uploadedAt: '2025-04-05T09:15:00Z',
  },
  {
    id: '5',
    name: 'Accessory Pricing Guide',
    category: 'price',
    fileUrl: 'https://example.com/accessory-pricing.pdf',
    uploadedBy: '2',
    uploadedAt: '2025-04-02T11:20:00Z',
  },
];

// Helper to accumulate daily sales
function accumulateDailySales(sales: Sale[]): Sale[] {
  let runningTotal = 0;
  return sales.map((sale) => {
    runningTotal += sale.salesAmount;
    return { ...sale, salesAmount: runningTotal };
  });
}

// Get daily sales for a store and month, optionally accumulated
export const getStoreDailySales = (
  storeId: string,
  month: string, // "YYYY-MM"
  accumulated: boolean = false
): Sale[] => {
  const dailySales = mockSales
    .filter(
      sale =>
        sale.storeId === storeId &&
        sale.date.startsWith(month) &&
        sale.date.length === 10 // ensure it's a daily sale, not monthly aggregate
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return accumulated ? accumulateDailySales(dailySales) : dailySales;
};

// Get monthly sales for a store and year
export const getStoreMonthlySales = (
  storeId: string,
  year?: string // "YYYY"
): Sale[] => {
  const yearStr = year || new Date().getFullYear().toString();
  const sales = mockSales.filter(
    sale =>
      sale.storeId === storeId &&
      sale.date.startsWith(yearStr) &&
      sale.date.length === 10 // only daily sales
  );

  const monthlyMap: { [key: string]: Sale } = {};

  sales.forEach(sale => {
    const monthKey = sale.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        id: `${storeId}-${monthKey}`,
        storeId,
        date: `${monthKey}-01`,
        salesAmount: 0,
        accessorySales: 0,
        homeConnects: 0,
        cleanings: 0,
        repairs: 0,
      };
    }
    monthlyMap[monthKey].salesAmount += sale.salesAmount;
    monthlyMap[monthKey].accessorySales += sale.accessorySales;
    monthlyMap[monthKey].homeConnects += sale.homeConnects;
    monthlyMap[monthKey].cleanings += sale.cleanings;
    monthlyMap[monthKey].repairs += sale.repairs;
  });

  return Object.values(monthlyMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Example mock goals (add this near your other mock data)
export const mockStoreGoals: StoreGoal[] = [
  {
    id: 'goal-1-2025-06',
    storeId: '1',
    month: '2025-06',
    salesGoal: 100000,
    accessoryGoal: 15000,
    homeConnectGoal: 80,
  },
  {
    id: 'goal-2-2025-06',
    storeId: '2',
    month: '2025-06',
    salesGoal: 90000,
    accessoryGoal: 12000,
    homeConnectGoal: 60,
  },
];

// Helper to get goal progress for a store
export const getGoalProgress = (storeId: string, month?: string): {
  sales: GoalProgress;
  accessory: GoalProgress;
  homeConnect: GoalProgress;
} => {
  // Default to current month if not provided
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  // Find the goal for this store and month
  const goal = mockStoreGoals.find(
    (g) => g.storeId === storeId && g.month === targetMonth
  );

  // Get sales for this store and month
  const storeSales = mockSales.filter(
    (sale) => sale.storeId === storeId && sale.date.startsWith(targetMonth)
  );

  const totalSales = storeSales.reduce((sum, sale) => sum + sale.salesAmount, 0);
  const totalAccessory = storeSales.reduce((sum, sale) => sum + sale.accessorySales, 0);
  const totalHomeConnect = storeSales.reduce((sum, sale) => sum + sale.homeConnects, 0);

  return {
    sales: {
      current: totalSales,
      goal: goal?.salesGoal ?? 0,
      percentage: goal ? Math.min(100, Math.round((totalSales / goal.salesGoal) * 100)) : 0,
    },
    accessory: {
      current: totalAccessory,
      goal: goal?.accessoryGoal ?? 0,
      percentage: goal ? Math.min(100, Math.round((totalAccessory / goal.accessoryGoal) * 100)) : 0,
    },
    homeConnect: {
      current: totalHomeConnect,
      goal: goal?.homeConnectGoal ?? 0,
      percentage: goal ? Math.min(100, Math.round((totalHomeConnect / goal.homeConnectGoal) * 100)) : 0,
    },
  };
};

// Helper function to get documents by category
export const getDocumentsByCategory = (category: string): Document[] => {
  return mockDocuments.filter(doc => doc.category === category);
};

// Helper to calculate sales projection
export const getSalesProjection = (storeId: string): number => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = today.getDate();

  // Only include sales up to today in the current month
  const storeSales = mockSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return (
      sale.storeId === storeId &&
      saleDate.getFullYear() === currentYear &&
      saleDate.getMonth() === currentMonth &&
      saleDate.getDate() <= currentDay
    );
  });

  const totalSales = storeSales.reduce((sum, sale) => sum + sale.salesAmount, 0);

  // Avoid division by zero
  if (currentDay === 0) return 0;

  // Project based on average daily sales so far, for the rest of the month
  const dailyAverage = totalSales / currentDay;
  const remainingDays = daysInMonth - currentDay;
  const projection = totalSales + dailyAverage * remainingDays;

  return Math.round(projection);
};

// Helper to get commission for a user
export const getUserCommission = (userId: string): Commission | null => {
  const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
  return mockCommissions.find(comm => comm.userId === userId && comm.month === currentMonth) || null;
};

// Type for the goal progress that wasn't defined earlier
interface GoalProgress {
  current: number;
  goal: number;
  percentage: number;
}