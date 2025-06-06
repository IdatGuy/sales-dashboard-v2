import { User, Store, Sale, Commission, Document, DailySales, MonthlySales } from '../types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Employee',
    email: 'employee@example.com',
    role: 'employee',
    storeIds: ['1'],
  },
  {
    id: '2',
    name: 'Mary Manager',
    email: 'manager@example.com',
    role: 'manager',
    storeIds: ['1', '2', '3'],
  },
];

// Mock Stores
export const mockStores: Store[] = [
  {
    id: '1',
    name: 'Downtown Store',
    location: '123 Main St',
    salesGoal: 60000,
    accessoryGoal: 2500,
    homeConnectGoal: 30,
  },
  {
    id: '2',
    name: 'Westside Location',
    location: '456 West Ave',
    salesGoal: 38000,
    accessoryGoal: 1000,
    homeConnectGoal: 15,
  },
  {
    id: '3',
    name: 'Eastside Branch',
    location: '789 East Blvd',
    salesGoal: 53000,
    accessoryGoal: 2500,
    homeConnectGoal: 15,
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

    sales.push({
      id: `${storeId}-${dateString}`,
      userId: '', // Not used for store-level sales
      storeId,
      date: dateString,
      salesAmount,
      accessorySales,
      homeConnects,
    });
  }
  return sales;
};


// Helper to group daily sales into monthly totals
const groupMonthlySales = (dailySales: Sale[]): Sale[] => {
  const monthlyMap: { [key: string]: Sale } = {};
  dailySales.forEach((sale) => {
    const monthKey = sale.date.slice(0, 7); // YYYY-MM
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        id: `${sale.storeId}-${monthKey}`,
        userId: '',
        storeId: sale.storeId,
        date: `${monthKey}-15`, // Use 15th as a placeholder
        salesAmount: 0,
        accessorySales: 0,
        homeConnects: 0,
      };
    }
    monthlyMap[monthKey].salesAmount += sale.salesAmount;
    monthlyMap[monthKey].accessorySales += sale.accessorySales;
    monthlyMap[monthKey].homeConnects += sale.homeConnects;
  });
  return Object.values(monthlyMap);
};

// Generate all sales data per store
const allDailySales: Sale[] = [
  ...generateDailySales('1'),
  ...generateDailySales('2'),
  ...generateDailySales('3'),
];

const allMonthlySales: Sale[] = [
  ...groupMonthlySales(allDailySales.filter(s => s.storeId === '1')),
  ...groupMonthlySales(allDailySales.filter(s => s.storeId === '2')),
  ...groupMonthlySales(allDailySales.filter(s => s.storeId === '3')),
];

// Mock Sales (daily + monthly)
export const mockSales: Sale[] = [
  ...allDailySales,
  ...allMonthlySales,
];

// Mock Commissions
export const mockCommissions: Commission[] = [
  {
    id: '1',
    userId: '1',
    month: new Date().toISOString().split('T')[0].substring(0, 7), // Current month in YYYY-MM format
    total: 3500,
    breakdown: {
      base: 2000,
      bonus: 1000,
      incentives: 500,
    },
  },
  {
    id: '2',
    userId: '2',
    month: new Date().toISOString().split('T')[0].substring(0, 7),
    total: 5200,
    breakdown: {
      base: 3000,
      bonus: 1500,
      incentives: 700,
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

// Helper function to get daily sales data for a store
export const getDailySalesData = (storeId: string): DailySales[] => {
  // Only include daily sales (not monthly aggregates)
  const storeSales = mockSales.filter(
    sale => sale.storeId === storeId && !(sale.date.endsWith('-15') && sale.userId === '')
  );

  // Sort by date
  storeSales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Format for chart data (show month+day for clarity)
  return storeSales.map(sale => ({
    date: new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: sale.salesAmount,
  }));
};

// Helper function to get monthly sales data for a store
export const getMonthlySalesData = (storeId: string): MonthlySales[] => {
  const currentYear = new Date().getFullYear();
  const storeSales = mockSales.filter(sale => 
    sale.storeId === storeId && 
    sale.date.includes(currentYear.toString())
  );
  
  // Group by month
  const monthlyData: { [key: string]: number } = {};
  storeSales.forEach(sale => {
    const month = new Date(sale.date).getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = 0;
    }
    monthlyData[month] += sale.salesAmount;
  });
  
  // Format for chart data
  return Object.entries(monthlyData).map(([month, amount]) => ({
    month: new Date(currentYear, parseInt(month), 1).toLocaleDateString('en-US', { month: 'short' }),
    amount,
  }));
};

// Helper to get goal progress for a store
export const getGoalProgress = (storeId: string): { 
  sales: GoalProgress; 
  accessory: GoalProgress; 
  homeConnect: GoalProgress; 
} => {
  const store = mockStores.find(s => s.id === storeId);
  if (!store) {
    return {
      sales: { current: 0, goal: 0, percentage: 0 },
      accessory: { current: 0, goal: 0, percentage: 0 },
      homeConnect: { current: 0, goal: 0, percentage: 0 },
    };
  }
  
  const currentMonth = new Date().toISOString().split('T')[0].substring(0, 7);
  const storeSales = mockSales.filter(sale => 
    sale.storeId === storeId && 
    sale.date.includes(currentMonth)
  );
  
  const totalSales = storeSales.reduce((sum, sale) => sum + sale.salesAmount, 0);
  const totalAccessory = storeSales.reduce((sum, sale) => sum + sale.accessorySales, 0);
  const totalHomeConnect = storeSales.reduce((sum, sale) => sum + sale.homeConnects, 0);
  
  return {
    sales: {
      current: totalSales,
      goal: store.salesGoal,
      percentage: Math.min(100, Math.round((totalSales / store.salesGoal) * 100)),
    },
    accessory: {
      current: totalAccessory,
      goal: store.accessoryGoal,
      percentage: Math.min(100, Math.round((totalAccessory / store.accessoryGoal) * 100)),
    },
    homeConnect: {
      current: totalHomeConnect,
      goal: store.homeConnectGoal,
      percentage: Math.min(100, Math.round((totalHomeConnect / store.homeConnectGoal) * 100)),
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