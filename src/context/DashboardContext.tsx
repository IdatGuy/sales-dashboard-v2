import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from "react";
import { Store, TimeFrame, Sale, CacheEntry } from "../types";
import { CACHE_TTL_MS, LOCALE, STORAGE_KEYS, DEFAULT_SHOW_ACCUMULATED } from "../lib/constants";
import { logger } from "../lib/logger";
import {
  getStoreDailySales,
  getStoreMonthlySales,
} from "../services/api/sales";
import { getStoresByIds, getAllStores } from "../services/api/stores";
import { useAuth } from "../context/AuthContext";
import {
  getMetricDefinitions,
  MetricDefinition,
} from "../services/api/metricDefinitions";
import {
  listGoalDefinitions,
  GoalDefinition,
} from "../services/api/goalDefinitions";

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
  currentDate: Date;
  handlePrev: () => void;
  handleNext: () => void;
  salesData: SalesData;
  isLoading: boolean;
  getSalesForPeriod: () => Sale[];
  refreshSalesData: () => void;
  metricDefinitions: MetricDefinition[];
  visibleMetrics: MetricDefinition[];
  deprecatedMetrics: MetricDefinition[];
  isMetricsLoading: boolean;
  refreshMetricDefinitions: () => void;
  goalDefinitions: GoalDefinition[];
  activeGoalDefinitions: GoalDefinition[];
  refreshGoalDefinitions: () => void;
  showAccumulated: boolean;
  setShowAccumulated: React.Dispatch<React.SetStateAction<boolean>>;
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
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showAccumulated, setShowAccumulated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_CHART_ACCUMULATED);
    return saved !== null ? JSON.parse(saved) : DEFAULT_SHOW_ACCUMULATED;
  });
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    period: "month",
    label: new Date().toLocaleDateString(LOCALE, {
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

  // Metric definitions state
  const [metricDefinitions, setMetricDefinitions] = useState<MetricDefinition[]>([]);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  const visibleMetrics = useMemo(
    () => metricDefinitions.filter((d) => !d.isDeprecated),
    [metricDefinitions]
  );

  const deprecatedMetrics = useMemo(
    () => metricDefinitions.filter((d) => d.isDeprecated),
    [metricDefinitions]
  );

  const refreshMetricDefinitions = React.useCallback(() => {
    getMetricDefinitions().then((defs) => {
      setMetricDefinitions(defs);
    }).catch((err) => logger.error('Failed to refresh metric definitions:', err));
  }, []);

  useEffect(() => {
    getMetricDefinitions().then((defs) => {
      setMetricDefinitions(defs);
      setIsMetricsLoading(false);
    });
  }, []);

  // Goal definitions state
  const [goalDefinitions, setGoalDefinitions] = useState<GoalDefinition[]>([]);

  const activeGoalDefinitions = useMemo(
    () => goalDefinitions.filter((d) => !d.isDeprecated),
    [goalDefinitions]
  );

  const refreshGoalDefinitions = React.useCallback(() => {
    listGoalDefinitions().then((defs) => {
      setGoalDefinitions(defs);
    }).catch((err) => logger.error('Failed to refresh goal definitions:', err));
  }, []);

  useEffect(() => {
    listGoalDefinitions().then((defs) => {
      setGoalDefinitions(defs);
    });
  }, []);

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


  const getCachedData = (
    cache: Map<string, CacheEntry>,
    key: string
  ): Sale[] | null => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
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
      const dailyKey = `${storeId}|${month}`;
      const monthlyKey = `${storeId}|${year}`;

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
      } catch (error: unknown) {
        logger.error("Error fetching sales data:", error instanceof Error ? error.message : String(error));
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
    const dailyKey = `${selectedStore.id}|${year}-${month.toString().padStart(2, '0')}`;
    const monthlyKey = `${selectedStore.id}|${year}`;

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_CHART_ACCUMULATED, JSON.stringify(showAccumulated));
  }, [showAccumulated]);

  useEffect(() => {
    const fetchStores = async () => {
      if (currentUser && currentUser.userStoreAccess) {
        const storeIds = currentUser.userStoreAccess.map(
          (a: { storeId: string }) => a.storeId
        );
        try {
          let fetched: Store[];
          const assignedStores = await getStoresByIds(storeIds);
          if (currentUser.hasDepotAccess) {
            const allStores = await getAllStores();
            const mergedMap = new Map(assignedStores.map((s) => [s.id, s]));
            for (const s of allStores) {
              if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
            }
            fetched = Array.from(mergedMap.values());
          } else {
            fetched = assignedStores;
          }
          setStores(fetched);
          setSelectedStore((prev) => prev ?? fetched[0] ?? null);
        } catch (error: unknown) {
          logger.error("Error fetching stores:", error);
          setStores([]);
          setSelectedStore(null);
        }
      } else {
        setStores([]);
        setSelectedStore(null);
      }
    };
    fetchStores();
  }, [currentUser]);

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
    currentDate,
    handlePrev,
    handleNext,
    salesData,
    isLoading,
    getSalesForPeriod,
    refreshSalesData,
    metricDefinitions,
    visibleMetrics,
    deprecatedMetrics,
    isMetricsLoading,
    refreshMetricDefinitions,
    goalDefinitions,
    activeGoalDefinitions,
    refreshGoalDefinitions,
    showAccumulated,
    setShowAccumulated,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
