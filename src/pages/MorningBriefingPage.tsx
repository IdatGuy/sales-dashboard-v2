import React, { useMemo, useState, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import Navbar from "../components/common/Navbar";
import StoreSelector from "../components/common/StoreSelector";
import GoalsProgress, { GoalProgressItem } from "../components/dashboard/GoalsProgress";
import { goalsService, StoreGoalsMap } from "../services/api/goals";
import { getStoreDailySales } from "../services/api/sales";
import { getSaleValueForMetric } from "../lib/metricUtils";
import { formatDateToYMD } from "../lib/dateUtils";
import { Sale } from "../types";

function getYesterday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
}

function formatMetricValue(value: number, unitType: string): string {
  if (unitType === "currency") return `$${value.toLocaleString()}`;
  if (unitType === "percentage") return `${value.toLocaleString()}%`;
  return value.toLocaleString();
}

const MorningBriefingPage: React.FC = () => {
  const {
    selectedStore,
    salesData,
    isLoading,
    visibleMetrics,
    metricDefinitions,
    activeGoalDefinitions,
  } = useDashboard();

  const [storeGoalsMap, setStoreGoalsMap] = useState<StoreGoalsMap>({});
  const [extraSalesData, setExtraSalesData] = useState<Sale[] | null>(null);

  const yesterday = useMemo(() => getYesterday(), []);
  const yesterdayStr = useMemo(() => formatDateToYMD(yesterday), [yesterday]);

  const yesterdayMonthStr = useMemo(() => {
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, [yesterday]);

  const currentMonthStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }, []);

  // Edge case: today is the 1st of the month, so yesterday is in the previous month
  const isEdgeCase = yesterdayMonthStr !== currentMonthStr;

  useEffect(() => {
    if (!selectedStore || !isEdgeCase) return;
    getStoreDailySales(selectedStore.id, yesterdayMonthStr).then(setExtraSalesData);
  }, [selectedStore, yesterdayMonthStr, isEdgeCase]);

  useEffect(() => {
    if (!selectedStore) return;
    goalsService.getStoreGoals(selectedStore.id, yesterdayMonthStr).then(setStoreGoalsMap);
  }, [selectedStore, yesterdayMonthStr]);

  const dailySales = isEdgeCase ? (extraSalesData ?? []) : salesData.daily;
  const yesterdaySale = dailySales.find((s) => s.date === yesterdayStr);

  const mtdSales = useMemo(
    () => dailySales.filter((s) => s.date <= yesterdayStr),
    [dailySales, yesterdayStr]
  );

  const metricTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const sale of mtdSales) {
      for (const metric of metricDefinitions) {
        totals[metric.key] = (totals[metric.key] ?? 0) + getSaleValueForMetric(sale, metric);
      }
    }
    return totals;
  }, [mtdSales, metricDefinitions]);

  const goalProgressItems = useMemo((): GoalProgressItem[] => {
    return activeGoalDefinitions
      .filter((g) => (storeGoalsMap[g.id] ?? 0) > 0)
      .map((g) => {
        const target = storeGoalsMap[g.id];
        const current = g.metricKeys.reduce((sum, key) => sum + (metricTotals[key] ?? 0), 0);
        const percentage = target > 0 ? Math.round((current / target) * 100) : 0;
        return { goalDefinition: g, current, target, percentage };
      });
  }, [activeGoalDefinitions, storeGoalsMap, metricTotals]);

  const sortedMetrics = useMemo(
    () => [...visibleMetrics].sort((a, b) => a.sortOrder - b.sortOrder),
    [visibleMetrics]
  );

  const dateLabel = yesterday.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const loading = isLoading || (isEdgeCase && extraSalesData === null);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-2xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-5">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{dateLabel}</p>
          <div className="mt-2">
            <StoreSelector />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-28 bg-white dark:bg-gray-800 rounded-lg shadow-md"></div>
            <div className="h-44 bg-white dark:bg-gray-800 rounded-lg shadow-md"></div>
            <div className="h-44 bg-white dark:bg-gray-800 rounded-lg shadow-md"></div>
          </div>
        ) : !yesterdaySale ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No data entered for {dateLabel}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Featured metric — first by sortOrder */}
            {sortedMetrics.length > 0 && (() => {
              const featured = sortedMetrics[0];
              const value = getSaleValueForMetric(yesterdaySale, featured);
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {featured.label}
                  </p>
                  <p className="text-5xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">
                    {formatMetricValue(value, featured.unitType)}
                  </p>
                </div>
              );
            })()}

            {/* Secondary metrics — 2-column grid */}
            {sortedMetrics.length > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {sortedMetrics.slice(1).map((metric) => {
                    const value = getSaleValueForMetric(yesterdaySale, metric);
                    return (
                      <div key={metric.key}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-0.5">
                          {formatMetricValue(value, metric.unitType)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Monthly goal progress (MTD through yesterday) */}
            <GoalsProgress items={goalProgressItems} />
          </div>
        )}
      </main>
    </div>
  );
};

export default MorningBriefingPage;
