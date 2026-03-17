import React, { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import StoreSelector from "../components/common/StoreSelector";
import PeriodNavigator from "../components/common/PeriodNavigator";
import TimeFrameToggle from "../components/common/TimeFrameToggle";
import MetricGroupChart from "../components/dashboard/MetricGroupChart";
import SalesProjection, { GoalProgressItem } from "../components/dashboard/SalesProjection";
import EnterSalesModal from "../components/dashboard/EnterSalesModal";
import GoalSettingsModal from "../components/dashboard/GoalSettingsModal";
import { goalsService, StoreGoalsMap } from "../services/api/goals";
import { getSaleValueForMetric } from "../lib/salesUtils";

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
    visibleMetrics,
    deprecatedMetrics,
    metricDefinitions,
    activeGoalDefinitions,
    showAccumulated,
    setShowAccumulated,
  } = useDashboard();
  const { currentUser } = useAuth();

  const [storeGoalsMap, setStoreGoalsMap] = useState<StoreGoalsMap>({});
  const [isEnterSalesOpen, setIsEnterSalesOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const currentMonthStr = useMemo(
    () =>
      `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`,
    [currentDate]
  );

  // Load store goals when store or date changes (skip for yearly view)
  useEffect(() => {
    if (selectedStore && timeFrame.period !== "year") {
      goalsService.getStoreGoals(selectedStore.id, currentMonthStr).then((map) => {
        setStoreGoalsMap(map);
      });
    } else if (timeFrame.period === "year") {
      setStoreGoalsMap({});
    }
  }, [selectedStore, currentMonthStr, timeFrame.period]);

  // Get filtered sales data for the current period
  const salesData = getSalesForPeriod();

  // Group metrics by unit type for separate charts
  const metricsByUnitType = useMemo(() => {
    const groups: Record<string, typeof visibleMetrics> = {};
    const allSalesData =
      timeFrame.period === "year"
        ? contextSalesData.monthly
        : contextSalesData.daily;

    for (const unitType of ["currency", "count", "percentage"] as const) {
      const visible = visibleMetrics.filter((m) => m.unitType === unitType);
      const deprecatedWithData = deprecatedMetrics.filter(
        (m) =>
          m.unitType === unitType &&
          allSalesData.some((sale) => (sale.metrics[m.key] ?? 0) > 0)
      );
      const combined = [...visible, ...deprecatedWithData];
      if (combined.length > 0) {
        groups[unitType] = combined;
      }
    }
    return groups;
  }, [visibleMetrics, deprecatedMetrics, contextSalesData, timeFrame.period]);

  // Build metric totals for goal progress calculation.
  // Percentage metrics use the most recently entered value (running rate);
  // all other metrics are summed across the month.
  const metricTotals = useMemo(() => {
    const monthlySales = [...contextSalesData.daily].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const totals: Record<string, number> = {};
    for (const metric of metricDefinitions) {
      if (metric.unitType === "percentage") {
        for (const sale of monthlySales) {
          const val = sale.metrics[metric.key];
          if (val !== undefined) totals[metric.key] = val;
        }
      } else {
        for (const sale of monthlySales) {
          totals[metric.key] = (totals[metric.key] ?? 0) + getSaleValueForMetric(sale, metric);
        }
      }
    }
    return totals;
  }, [contextSalesData.daily, metricDefinitions]);

  // Compute goal progress items (only goals with a non-zero target)
  const goalProgressItems = useMemo((): GoalProgressItem[] => {
    if (timeFrame.period === "year") return [];
    return activeGoalDefinitions
      .filter((g) => (storeGoalsMap[g.id] ?? 0) > 0)
      .map((g) => {
        const target = storeGoalsMap[g.id];
        const current = g.metricKeys.reduce(
          (sum, key) => sum + (metricTotals[key] ?? 0),
          0
        );
        const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
        return { goalDefinition: g, current, target, percentage };
      });
  }, [activeGoalDefinitions, storeGoalsMap, metricTotals, timeFrame.period]);

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
              <div className="flex-1 flex flex-col order-2 lg:order-1">
                {/* Global chart controls */}
                {(timeFrame.period === "month" || timeFrame.period === "year") && (
                  <div className="flex items-center gap-4 mb-4">
                    <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={showAccumulated}
                        onChange={() => setShowAccumulated((v) => !v)}
                        className="form-checkbox"
                      />
                      <span>Accumulated</span>
                    </label>
                  </div>
                )}

                {/* Per-unit-type metric charts */}
                {(["currency", "count", "percentage"] as const).map((unitType) => {
                  const metrics = metricsByUnitType[unitType] ?? [];
                  const isCurrency = unitType === "currency";
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
                        showAccumulated={showAccumulated}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Right Column */}
              <div className="w-full lg:w-80 flex flex-col gap-6 order-1 lg:order-2">
                <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <SalesProjection
                    goalProgressItems={timeFrame.period !== "year" ? goalProgressItems : []}
                  />
                </div>
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
        onSave={() => {
          // Reload goals after save
          goalsService.getStoreGoals(selectedStore.id, currentMonthStr).then((map) => {
            setStoreGoalsMap(map);
          });
        }}
        currentMonth={currentMonthStr}
      />
    </div>
  );
};

export default DashboardPage;
