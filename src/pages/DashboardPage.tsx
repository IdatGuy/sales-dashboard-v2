import React, { useEffect, useState } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import StoreSelector from "../components/common/StoreSelector";
import TimeFrameToggle from "../components/common/TimeFrameToggle";
import SalesChart from "../components/dashboard/SalesChart";
import GoalsProgress from "../components/dashboard/GoalsProgress";
import SalesProjection from "../components/dashboard/SalesProjection";
import CommissionWidget from "../components/dashboard/CommissionWidget";
import {
  getDailySalesData,
  getMonthlySalesData,
  getGoalProgress,
  getSalesProjection,
  getUserCommission,
} from "../data/mockData";
import { DailySales, MonthlySales } from "../types";

const DashboardPage: React.FC = () => {
  const { selectedStore, timeFrame } = useDashboard();
  const { currentUser } = useAuth();
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySales[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedStore) {
      setIsLoading(true);

      // Simulate API fetch delay
      const timer = setTimeout(() => {
        setDailySales(getDailySalesData(selectedStore.id));
        setMonthlySales(getMonthlySalesData(selectedStore.id));
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [selectedStore]);

  if (!selectedStore) {
    return <div>Loading...</div>;
  }

  const goalProgress = getGoalProgress(selectedStore.id);
  const projectedTotal = getSalesProjection(selectedStore.id);
  const currentTotal = goalProgress.sales.current;
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
              <TimeFrameToggle />
              <StoreSelector />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              <div className="md:col-span-2 bg-white rounded-lg shadow-md h-64"></div>
              <div className="bg-white rounded-lg shadow-md h-64"></div>
              <div className="bg-white rounded-lg shadow-md h-64"></div>
              <div className="bg-white rounded-lg shadow-md h-64"></div>
              <div className="bg-white rounded-lg shadow-md h-64"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales Chart - 2/3 width on larger screens */}
              <div className="md:col-span-2 animate-slide-up">
                <SalesChart
                  dailySales={dailySales}
                  monthlySales={monthlySales}
                />
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
                  salesProgress={goalProgress.sales}
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
