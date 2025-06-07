import React, { useMemo } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import StoreSelector from "../components/common/StoreSelector";
import PeriodNavigator from "../components/common/PeriodNavigator";
import TimeFrameToggle from "../components/common/TimeFrameToggle";
import SalesChart from "../components/dashboard/SalesChart";
import GoalsProgress from "../components/dashboard/GoalsProgress";
import SalesProjection from "../components/dashboard/SalesProjection";
import CommissionWidget from "../components/dashboard/CommissionWidget";
import {
  getGoalProgress,
  getSalesProjection,
  getUserCommission,
} from "../data/mockData";

const DashboardPage: React.FC = () => {
  const {
    selectedStore,
    timeFrame,
    currentDate,
    handlePrev,
    handleNext,
    getSalesForPeriod,
    isLoading,
  } = useDashboard();
  const { currentUser } = useAuth();

  if (!selectedStore) {
    return <div>Loading...</div>;
  }

  // Get filtered sales data for the current period
  const salesData = getSalesForPeriod();

  // Memoize expensive calculations
  const goalProgress = useMemo(() => {
    const goalYear = currentDate.getFullYear();
    const goalMonth = currentDate.getMonth() + 1;
    const currentMonthStrForGoals = `${goalYear}-${goalMonth
      .toString()
      .padStart(2, "0")}`;
    return getGoalProgress(selectedStore.id, currentMonthStrForGoals);
  }, [selectedStore, currentDate]);

  const projectedTotal = useMemo(
    () => getSalesProjection(selectedStore.id),
    [selectedStore]
  );

  const currentTotal = useMemo(
    () => salesData.reduce((sum, sale) => sum + sale.salesAmount, 0),
    [salesData]
  );

  const userCommission = useMemo(
    () => (currentUser ? getUserCommission(currentUser.id) : null),
    [currentUser]
  );

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Chart - 2/3 width on larger screens */}
              <div className="md:col-span-2 animate-slide-up">
                <SalesChart sales={salesData} />
              </div>

              {/* Sales Projection - 1/3 width */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <SalesProjection
                  currentTotal={currentTotal}
                  projectedTotal={projectedTotal}
                />
              </div>

              {/* Goals Progress - 1/3 width */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <GoalsProgress
                  accessoryProgress={goalProgress.accessory}
                  homeConnectProgress={goalProgress.homeConnect}
                />
              </div>

              {/* Commission Widget - 1/3 width */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                <CommissionWidget commission={userCommission} />
              </div>

              {/* Placeholder for additional content */}
              <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64 animate-slide-up"
                style={{ animationDelay: "0.4s" }}
              >
                <h5 className="p-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Either leaderboard or daily sales excel like chart
                </h5>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
