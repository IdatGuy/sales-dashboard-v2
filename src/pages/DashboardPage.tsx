import React, { useMemo, useState, useEffect } from "react";
import { Plus } from "lucide-react";
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
import Leaderboard from "../components/dashboard/Leaderboard";
import EnterSalesModal from "../components/dashboard/EnterSalesModal";
import GoalSettingsModal from "../components/dashboard/GoalSettingsModal";
import { goalsService } from "../services/api/goals";
import { commissionService } from "../services/api/commission";
import { Commission } from "../types";

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
  } = useDashboard();
  const { currentUser } = useAuth();

  const [storeGoals, setStoreGoals] = useState({
    salesGoal: 0,
    accessoryGoal: 0,
    homeConnectGoal: 0,
  });

  const [userCommission, setUserCommission] = useState<Commission | null>(null);
  const [isEnterSalesOpen, setIsEnterSalesOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);

  const handleGoalSave = (goals: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  }) => {
    if (selectedStore) {
      updateStoreGoals(selectedStore.id, goals);
    }
  };

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

  // Load user commission data
  useEffect(() => {
    if (currentUser && timeFrame.period !== "year") {
      const currentMonth = `${currentDate.getFullYear()}-${(
        currentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}`;

      commissionService
        .getUserCommission(currentUser.id, currentMonth)
        .then((commission) => {
          setUserCommission(commission);
        });
    } else {
      setUserCommission(null);
    }
  }, [currentUser, currentDate, timeFrame.period]);

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
                  className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  title="Set Store Goals"
                >
                  <Plus size={16} className="mr-1" />
                  Enter Goal
                </button>
              )}
              {(currentUser?.role === "manager" || currentUser?.role === "admin") && (
                <button
                  onClick={() => setIsEnterSalesOpen(true)}
                  className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                {/* Sales Chart */}
                <div className="animate-slide-up mb-6">
                  <SalesChart sales={salesData} />
                </div>

                {/* Commission & Leaderboard row (only for non-managers) */}
                {currentUser && currentUser.role !== "manager" && (
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div
                      className="flex-1 animate-slide-up"
                      style={{ animationDelay: "0.3s" }}
                    >
                      <CommissionWidget commission={userCommission} />
                    </div>
                    <div
                      className="flex-1 animate-slide-up"
                      style={{ animationDelay: "0.4s" }}
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-64">
                        <Leaderboard
                          month={currentDate.toISOString().slice(0, 7)}
                        />
                      </div>
                    </div>
                  </div>
                )}
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
