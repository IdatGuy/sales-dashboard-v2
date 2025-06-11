import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Store, TimeFrame, Sale, CacheEntry } from "../types";
import { getStoreDailySales, getStoreMonthlySales } from "../data/mockData";
import { getStoresByIds } from "../services/api/stores";
import { useAuth } from "../context/AuthContext";

interface SalesData {
  daily: Sale[];
  monthly: Sale[];
}

interface DashboardContextType {
  selectedStore: Store | null;
  timeFrame: TimeFrame;
  setSelectedStore: (store: Store) => void;
  setTimeFrame: (timeFrame: TimeFrame) => void;
  availableStores: Store[];
  updateStoreGoals: (
    storeId: string,
    goals: {
      salesGoal: number;
      accessoryGoal: number;
      homeConnectGoal: number;
    }
  ) => void;
  currentDate: Date;
  handlePrev: () => void;
  handleNext: () => void;
  salesData: SalesData;
  isLoading: boolean;
  getSalesForPeriod: () => Sale[];
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
}) => {
  const { currentUser } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(
    stores[0] || null
  );
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    period: "month",
    label: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
  });
  const [currentDate, setCurrentDate] = useState(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    )
  );

  // Cache state
  const [dailySalesCache, setDailySalesCache] = useState<
    Map<string, CacheEntry>
  >(new Map());
  const [monthlySalesCache, setMonthlySalesCache] = useState<
    Map<string, CacheEntry>
  >(new Map());
  const [salesData, setSalesData] = useState<SalesData>({
    daily: [],
    monthly: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getCachedData = (
    cache: Map<string, CacheEntry>,
    key: string
  ): Sale[] | null => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  };

  const setCachedData = (
    cache: Map<string, CacheEntry>,
    setCache: React.Dispatch<React.SetStateAction<Map<string, CacheEntry>>>,
    key: string,
    data: Sale[]
  ) => {
    setCache(new Map(cache.set(key, { data, timestamp: Date.now() })));
  };

  const fetchSalesData = React.useCallback(
    async (storeId: string, month: string, year: string) => {
      const dailyKey = `${storeId}-${month}`;
      const monthlyKey = `${storeId}-${year}`;

      // Check cache first
      const cachedDaily = getCachedData(dailySalesCache, dailyKey);
      const cachedMonthly = getCachedData(monthlySalesCache, monthlyKey);

      if (cachedDaily && cachedMonthly) {
        setSalesData({ daily: cachedDaily, monthly: cachedMonthly });
        return;
      }

      setIsLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      const daily = cachedDaily || getStoreDailySales(storeId, month);
      const monthly = cachedMonthly || getStoreMonthlySales(storeId, year);

      // Update cache
      if (!cachedDaily) {
        setCachedData(dailySalesCache, setDailySalesCache, dailyKey, daily);
      }
      if (!cachedMonthly) {
        setCachedData(
          monthlySalesCache,
          setMonthlySalesCache,
          monthlyKey,
          monthly
        );
      }

      setSalesData({ daily, monthly });
      setIsLoading(false);
    },
    [dailySalesCache, monthlySalesCache]
  );

  // Effect to fetch data when dependencies change
  React.useEffect(() => {
    if (selectedStore) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const currentMonthStr = `${year}-${month.toString().padStart(2, "0")}`;
      const currentYearStr = year.toString();

      fetchSalesData(selectedStore.id, currentMonthStr, currentYearStr);
    }
  }, [selectedStore, currentDate, fetchSalesData]);

  const getSalesForPeriod = React.useCallback((): Sale[] => {
    if (timeFrame.period === "day") {
      const currentDayISO = currentDate.toISOString().split("T")[0];
      return salesData.daily.filter((sale) => sale.date === currentDayISO);
    } else if (timeFrame.period === "month") {
      return salesData.daily;
    } else if (timeFrame.period === "year") {
      return salesData.monthly;
    }
    return [];
  }, [salesData, timeFrame.period, currentDate]);

  const handlePrev = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (timeFrame.period === "day") {
        newDate.setDate(prevDate.getDate() - 1);
      } else if (timeFrame.period === "month") {
        newDate.setMonth(prevDate.getMonth() - 1, 1);
      } else if (timeFrame.period === "year") {
        newDate.setFullYear(prevDate.getFullYear() - 1, 0, 1);
      }
      return newDate;
    });
  };

  const handleNext = () => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      if (timeFrame.period === "day") {
        newDate.setDate(prevDate.getDate() + 1);
      } else if (timeFrame.period === "month") {
        newDate.setMonth(prevDate.getMonth() + 1, 1);
      } else if (timeFrame.period === "year") {
        newDate.setFullYear(prevDate.getFullYear() + 1, 0, 1);
      }
      return newDate;
    });
  };

  const updateStoreGoals = (
    storeId: string,
    goals: {
      salesGoal: number;
      accessoryGoal: number;
      homeConnectGoal: number;
    }
  ) => {
    const updatedStores = stores.map((store) =>
      store.id === storeId ? { ...store, ...goals } : store
    );
    setStores(updatedStores);

    // Update selected store if it's the one being modified
    if (selectedStore?.id === storeId) {
      setSelectedStore({ ...selectedStore, ...goals });
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      if (currentUser && currentUser.userStoreAccess) {
        const storeIds = currentUser.userStoreAccess.map(
          (a: { storeId: string }) => a.storeId
        );
        const stores = await getStoresByIds(storeIds);
        setStores(stores);
      } else {
        setStores([]);
      }
    };
    fetchStores();
  }, [currentUser]);

  // Ensure selectedStore is set when stores are loaded
  useEffect(() => {
    if (stores.length > 0 && !selectedStore) {
      setSelectedStore(stores[0]);
    }
    // If stores is empty, also clear selectedStore
    if (stores.length === 0 && selectedStore) {
      setSelectedStore(null);
    }
  }, [stores, selectedStore]);

  const value = {
    selectedStore,
    timeFrame,
    setSelectedStore,
    setTimeFrame,
    availableStores: stores,
    updateStoreGoals,
    currentDate,
    handlePrev,
    handleNext,
    salesData,
    isLoading,
    getSalesForPeriod,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
