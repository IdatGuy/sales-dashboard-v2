import React, { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import { STORAGE_KEYS } from "../lib/constants";
import Navbar from "../components/common/Navbar";
import StoreSelector from "../components/common/StoreSelector";
import PeriodNavigator from "../components/common/PeriodNavigator";
import TimeFrameToggle from "../components/common/TimeFrameToggle";
import MetricGroupChart from "../components/dashboard/MetricGroupChart";
import GoalsProgress from "../components/dashboard/GoalsProgress";
import SalesProjection from "../components/dashboard/SalesProjection";
import EnterSalesModal from "../components/dashboard/EnterSalesModal";
import GoalSettingsModal from "../components/dashboard/GoalSettingsModal";
import { goalsService } from "../services/api/goals";

const DashboardPage: React.FC = () => {
  const {
    selectedStore,
    timeFrame,
    currentDate,
    handlePrev,
    handleNext,
    getSalesForPeriod,
    salesData: contextSalesData,
    isLoading,
    updateStoreGoals,
    visibleMetrics,
    deprecatedMetrics,
  } = useDashboard();
  const { currentUser } = useAuth();

  const [storeGoals, setStoreGoals] = useState({
    salesGoal: 0,
    accessoryGoal: 0,
    homeConnectGoal: 0,
  });

  const [isEnterSalesOpen, setIsEnterSalesOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const [showAccumulated, setShowAccumulated] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_CHART_ACCUMULATED);
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [hideSundays, setHideSundays] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES_CHART_HIDE_SUNDAYS);
    return saved !== null ? JSON.parse(saved) : false;
  });

  const handleGoalSave = (goals: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  }) => {
    if (selectedStore) {
      updateStoreGoals(selectedStore.id, goals);
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_CHART_ACCUMULATED, JSON.stringify(showAccumulated));
  }, [showAccumulated]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES_CHART_HIDE_SUNDAYS, JSON.stringify(hideSundays));
  }, [hideSundays]);

  // Load store goals when store or date changes (skip for yearly view)
  useEffect(() => {
    if (selectedStore && timeFrame.period !== "year") {
      const currentMonth = `${currentDate.getFullYear()}-${(
        currentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;
      goalsService
        .getStoreGoals(selectedStore.id, currentMonth)
        .then((goals) => {
          if (goals) {
            setStoreGoals(goals);
          } else {
            // Reset to zeros when no goals found
            setStoreGoals({
              salesGoal: 0,
              accessoryGoal: 0,
              homeConnectGoal: 0,
            });
          }
        });
    } else if (timeFrame.period === "year") {
      // Reset goals when in yearly view
      setStoreGoals({
        salesGoal: 0,
        accessoryGoal: 0,
        homeConnectGoal: 0,
      });
    }
  }, [selectedStore, currentDate, timeFrame.period]);

  // Get filtered sales data for the current period
  const salesData = getSalesForPeriod();

  // Group metrics by unit type for separate charts
  const metricsByUnitType = useMemo(() => {
    const groups: Record<string, typeof visibleMetrics> = {};
    const allSalesData = timeFrame.period === "year"
      ? contextSalesData.monthly
      : contextSalesData.daily;

    for (const unitType of ["currency", "count", "percentage"] as const) {
      const visible = visibleMetrics.filter((m) => m.unitType === unitType);
      const deprecatedWithData = deprecatedMetrics.filter(
        (m) =>
          m.unitType === unitType &&
          allSalesData.some((sale) => {
            if (m.isBuiltin) {
              const prop = ({
                accessory_sales: "accessorySales",
                home_connects: "homeConnects",
                home_plus: "homePlus",
                cleanings: "cleanings",
                repairs: "repairs",
              } as Record<string, string>)[m.key];
              return prop ? ((sale as any)[prop] ?? 0) > 0 : false;
            }
            return (sale.customMetrics[m.key] ?? 0) > 0;
          })
      );
      const combined = [...visible, ...deprecatedWithData];
      if (combined.length > 0) {
        groups[unitType] = combined;
      }
    }
    return groups;
  }, [visibleMetrics, deprecatedMetrics, contextSalesData, timeFrame.period]);

  // Memoize expensive calculations
  const goalProgress = useMemo(() => {
    // Always use full month's sales data for goal calculations
    const monthlySales = contextSalesData.daily;
    const totalAccessory = monthlySales.reduce(
      (sum, sale) => sum + sale.accessorySales,
      0
    );
    const totalHomeConnect = monthlySales.reduce(
      (sum, sale) => sum + sale.homeConnects,
      0
    );
    const totalHomePlus = monthlySales.reduce(
      (sum, sale) => sum + (sale.homePlus || 0),
      0
    );
    const totalHomeConnectAndPlus = totalHomeConnect + totalHomePlus;

    return {
      accessory: {
        current: totalAccessory,
        goal: storeGoals.accessoryGoal,
        percentage:
          storeGoals.accessoryGoal > 0
            ? Math.round((totalAccessory / storeGoals.accessoryGoal) * 100)
            : 0,
      },
      homeConnect: {
        current: totalHomeConnectAndPlus,
        goal: storeGoals.homeConnectGoal,
        percentage:
          storeGoals.homeConnectGoal > 0
            ? Math.round(
                (totalHomeConnectAndPlus / storeGoals.homeConnectGoal) * 100
              )
            : 0,
      },
    };
  }, [contextSalesData.daily, storeGoals]);

  const currentTotal = useMemo(
    () =>
      contextSalesData.daily.reduce((sum, sale) => sum + sale.salesAmount, 0),
    [contextSalesData.daily]
  );


  // Calculate sales progress for goals - always use monthly total
  const salesProgress = useMemo(() => {
    const salesPercentage =
      storeGoals.salesGoal > 0
        ? Math.round((currentTotal / storeGoals.salesGoal) * 100)
        : 0;
    return {
      current: currentTotal,
      goal: storeGoals.salesGoal,
      percentage: salesPercentage,
    };
  }, [currentTotal, storeGoals.salesGoal]);

  const periodLabel = useMemo(() => {
    if (timeFrame.period === "day") {
      return currentDate.toLocaleString("default", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } else if (timeFrame.period === "month") {
      return currentDate.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    } else if (timeFrame.period === "year") {
      return currentDate.getFullYear().toString();
    }
    return "";
  }, [timeFrame.period, currentDate]);

  if (!selectedStore) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
              Sales Dashboard
            </h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <PeriodNavigator
                label={periodLabel}
                onPrev={handlePrev}
                onNext={handleNext}
              />
              <TimeFrameToggle />
              <StoreSelector />
              {(currentUser?.role === "manager" || currentUser?.role === "admin") && (
                <button
                  onClick={() => setIsGoalModalOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  title="Set Store Goals"
                >
                  <Plus size={16} className="mr-1" />
                  Enter Goal
                </button>
              )}
              {(currentUser?.role === "manager" || currentUser?.role === "admin") && (
                <button
                  onClick={() => setIsEnterSalesOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus size={16} className="mr-1" />
                  Enter Sales
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"></div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"></div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"></div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"></div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64"></div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column */}
              <div className="flex-1 flex flex-col">
                {/* Global chart controls */}
                {(timeFrame.period === "month" || timeFrame.period === "year") && (
                  <div className="flex items-center gap-4 mb-4">
                    {(timeFrame.period === "month" || timeFrame.period === "year") && (
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={showAccumulated}
                          onChange={() => setShowAccumulated((v) => !v)}
                          className="form-checkbox"
                        />
                        <span>Accumulated</span>
                      </label>
                    )}
                    {timeFrame.period === "month" && (
                      <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={hideSundays}
                          onChange={() => setHideSundays((v) => !v)}
                          className="form-checkbox"
                        />
                        <span>Hide Sundays</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Per-unit-type metric charts (currency chart always shown and includes salesAmount) */}
                {(["currency", "count", "percentage"] as const).map((unitType) => {
                  const metrics = metricsByUnitType[unitType] ?? [];
                  const isCurrency = unitType === "currency";
                  // Always render the currency chart (salesAmount lives there); skip others if empty
                  if (!isCurrency && metrics.length === 0) return null;
                  const titles = {
                    currency: `${timeFrame.label} Sales`,
                    count: "Count Metrics",
                    percentage: "Percentage Metrics",
                  };
                  return (
                    <div key={unitType} className="animate-slide-up mb-6">
                      <MetricGroupChart
                        sales={salesData}
                        metrics={metrics}
                        unitType={unitType}
                        title={titles[unitType]}
                        includeSalesAmount={isCurrency}
                        showAccumulated={showAccumulated}
                        hideSundays={hideSundays}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-80 flex flex-col gap-6">
                <div
                  className="animate-slide-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  <SalesProjection storeGoals={storeGoals} />
                </div>
                {/* Goals Progress - show for daily and monthly views */}
                {timeFrame.period !== "year" && (
                  <div
                    className="animate-slide-up"
                    style={{ animationDelay: "0.2s" }}
                  >
                    <GoalsProgress
                      salesProgress={salesProgress}
                      accessoryProgress={goalProgress.accessory}
                      homeConnectProgress={goalProgress.homeConnect}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <EnterSalesModal
        store={selectedStore}
        isOpen={isEnterSalesOpen}
        onClose={() => setIsEnterSalesOpen(false)}
      />
      <GoalSettingsModal
        store={selectedStore}
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleGoalSave}
        currentMonth={`${currentDate.getFullYear()}-${(
          currentDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}`}
      />
    </div>
  );
};

export default DashboardPage;
