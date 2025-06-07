import React, { useEffect, useState } from "react";
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
  getStoreDailySales,
  getStoreMonthlySales,
} from "../data/mockData";
import { Sale } from "../types";

const DashboardPage: React.FC = () => {
  const now = new Date();
  const { selectedStore, timeFrame } = useDashboard();
  const { currentUser } = useAuth();
  const [dailySales, setDailySales] = useState<Sale[]>([]);
  const [monthlySales, setMonthlySales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get the current month in "YYYY-MM" format
  const currentMonthStr = now.toISOString().slice(0, 7);
  const currentYearStr = now.getFullYear().toString();

  useEffect(() => {
    if (selectedStore) {
      setIsLoading(true);

      const timer = setTimeout(() => {
        setDailySales(getStoreDailySales(selectedStore.id, currentMonthStr));
        setMonthlySales(getStoreMonthlySales(selectedStore.id, currentYearStr));
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedStore, currentMonthStr, currentYearStr]);

  if (!selectedStore) {
    return <div>Loading...</div>;
  }

  // For daily/accumulated view, you can use the accumulateDailySales helper if needed
  // Example: const accumulatedSales = accumulateDailySales(dailySales);

  // Filter daily sales for the current month if needed (already done in getStoreDailySales)
  const filteredDailySales = dailySales;

  // For SalesChart, pass the correct data based on timeFrame
  let salesData: Sale[] = [];
  if (timeFrame.period === "day" || timeFrame.period === "month") {
    salesData = filteredDailySales;
  } else if (timeFrame.period === "year") {
    salesData = monthlySales;
  }

  const goalProgress = getGoalProgress(selectedStore.id, currentMonthStr);
  const projectedTotal = getSalesProjection(selectedStore.id);
  const currentTotal =
    salesData.length > 0 ? salesData[salesData.length - 1].salesAmount : 0;
  const userCommission = currentUser ? getUserCommission(currentUser.id) : null;

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
                label="June 2025"
                onPrev={() => {}}
                onNext={() => {}}
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
