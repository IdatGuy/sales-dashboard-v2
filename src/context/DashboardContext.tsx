import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Store, TimeFrame, Sale, CacheEntry } from "../types";
import {
  getStoreDailySales,
  getStoreMonthlySales,
} from "../services/api/sales";
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
  getMostRecentSalesDate: () => Date | null;
  refreshSalesData: () => void;
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
      try {
        // Fetch data from API (await the async calls)
        const daily = cachedDaily || (await getStoreDailySales(storeId, month));
        const monthly =
          cachedMonthly || (await getStoreMonthlySales(storeId, year));

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
      } catch (error) {
        console.error("Error fetching sales data:", error);
        setSalesData({ daily: [], monthly: [] });
      } finally {
        setIsLoading(false);
      }
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
      const y = currentDate.getFullYear();
      const m = String(currentDate.getMonth() + 1).padStart(2, "0");
      const d = String(currentDate.getDate()).padStart(2, "0");
      const currentDayStr = `${y}-${m}-${d}`;
      return salesData.daily.filter((sale) => sale.date === currentDayStr);
    } else if (timeFrame.period === "month") {
      return salesData.daily;
    } else if (timeFrame.period === "year") {
      return salesData.monthly;
    }
    return [];
  }, [salesData, timeFrame.period, currentDate]);

  const getMostRecentSalesDate = React.useCallback((): Date | null => {
    if (salesData.daily.length === 0) {
      return null;
    }

    // Find the most recent date with sales data
    const sortedDates = salesData.daily
      .map((sale) => sale.date)
      .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)

    if (sortedDates.length === 0) {
      return null;
    }

    // Parse the most recent date safely
    const [year, month, day] = sortedDates[0].split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [salesData.daily]);

  const refreshSalesData = React.useCallback(() => {
    if (!selectedStore) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const dailyKey = `${selectedStore.id}-${year}-${month.toString().padStart(2, '0')}`;
    const monthlyKey = `${selectedStore.id}-${year}`;

    setDailySalesCache(prev => { const n = new Map(prev); n.delete(dailyKey); return n; });
    setMonthlySalesCache(prev => { const n = new Map(prev); n.delete(monthlyKey); return n; });
  }, [selectedStore, currentDate]);

  const setTimeFrameWithDate = React.useCallback(
    (newTimeFrame: TimeFrame) => {
      setTimeFrame(newTimeFrame);

      // If switching to daily view, also update currentDate to most recent sales date
      if (newTimeFrame.period === "day") {
        const mostRecentDate = getMostRecentSalesDate();
        if (mostRecentDate) {
          setCurrentDate(mostRecentDate);
        }
      }
    },
    [getMostRecentSalesDate]
  );

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

  const selectStore = (store: Store) => {
    if (stores.some((s) => s.id === store.id)) {
      setSelectedStore(store);
    }
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
        try {
          const stores = await getStoresByIds(storeIds);
          setStores(stores);
        } catch (error) {
          console.error("Error fetching stores:", error);
          setStores([]);
        }
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

  // Update timeFrame.label whenever currentDate or timeFrame.period changes
  useEffect(() => {
    let label = "";
    if (timeFrame.period === "day") {
      label = currentDate.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } else if (timeFrame.period === "month") {
      label = currentDate.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    } else if (timeFrame.period === "year") {
      label = currentDate.getFullYear().toString();
    }
    if (label !== timeFrame.label) {
      setTimeFrame({ ...timeFrame, label });
    }
  }, [currentDate, timeFrame.period]);

  const value = {
    selectedStore,
    timeFrame,
    setSelectedStore: selectStore,
    setTimeFrame: setTimeFrameWithDate,
    availableStores: stores,
    updateStoreGoals,
    currentDate,
    handlePrev,
    handleNext,
    salesData,
    isLoading,
    getSalesForPeriod,
    getMostRecentSalesDate,
    refreshSalesData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
