import React, { useMemo } from "react";
import { TrendingUp, CheckCircle } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";

interface SalesProjectionProps {
  // Remove the props since we'll calculate internally
  storeGoals?: {
    salesGoal: number;
    accessoryGoal: number;
    homeConnectGoal: number;
  };
}

const SalesProjection: React.FC<SalesProjectionProps> = React.memo(
  ({ storeGoals }) => {
    const { timeFrame, currentDate, salesData } = useDashboard();

    // Calculate projections based on timeframe and selected date
    const projectionData = useMemo(() => {
      const today = new Date();
      const selectedYear = currentDate.getFullYear();
      const selectedMonth = currentDate.getMonth();

      if (timeFrame.period === "day" || timeFrame.period === "month") {
        // Both daily and monthly views show the same monthly projection
        const daysInMonth = new Date(
          selectedYear,
          selectedMonth + 1,
          0
        ).getDate();
        const isCurrentMonth =
          selectedYear === today.getFullYear() &&
          selectedMonth === today.getMonth();
        const currentDay = isCurrentMonth ? today.getDate() : daysInMonth;

        // Calculate month's total from daily sales data
        const monthSales = salesData.daily.filter((sale) => {
          const saleDate = new Date(sale.date);
          return (
            saleDate.getFullYear() === selectedYear &&
            saleDate.getMonth() === selectedMonth
          );
        });

        const currentTotal = monthSales.reduce(
          (sum, sale) => sum + sale.salesAmount,
          0
        );

        // If month is complete or we're viewing a past/future month
        if (!isCurrentMonth || currentDay >= daysInMonth) {
          return {
            currentTotal,
            projectedTotal: currentTotal,
            isComplete: true,
            period: "month",
          };
        }

        // Calculate projection for incomplete current month
        if (currentDay === 0) {
          return {
            currentTotal: 0,
            projectedTotal: 0,
            isComplete: false,
            period: "month",
          };
        }

        // Helper function to check if a date is Sunday
        const isSunday = (date: Date) => date.getDay() === 0;

        // Helper function to count business days (excluding Sundays) in a range
        const countBusinessDays = (
          startDay: number,
          endDay: number,
          year: number,
          month: number
        ) => {
          let businessDays = 0;
          for (let day = startDay; day <= endDay; day++) {
            const date = new Date(year, month, day);
            if (!isSunday(date)) {
              businessDays++;
            }
          }
          return businessDays;
        };

        // Only count completed days (exclude today since it might not be complete)
        const completedDay = currentDay - 1;

        if (completedDay <= 0) {
          // If no completed days yet, use current total as projection
          return {
            currentTotal,
            projectedTotal: currentTotal,
            isComplete: false,
            period: "month",
          };
        }

        // Count business days in completed period (excluding Sundays)
        const completedBusinessDays = countBusinessDays(
          1,
          completedDay,
          selectedYear,
          selectedMonth
        );

        if (completedBusinessDays === 0) {
          // If no completed business days, use current total as projection
          return {
            currentTotal,
            projectedTotal: currentTotal,
            isComplete: false,
            period: "month",
          };
        }

        // Calculate business day average (excluding Sundays from sales data)
        // Formula: Total Sales ÷ Completed Business Days = Daily Average
        // Then: Daily Average × Remaining Business Days = Additional Projected Sales
        const businessDayAverage = currentTotal / completedBusinessDays;

        // Count remaining business days in the month (excluding Sundays)
        const remainingBusinessDays = countBusinessDays(
          currentDay,
          daysInMonth,
          selectedYear,
          selectedMonth
        );

        const projectedTotal =
          currentTotal + businessDayAverage * remainingBusinessDays;

        return {
          currentTotal,
          projectedTotal: Math.round(projectedTotal),
          isComplete: false,
          period: "month",
        };
      } else if (timeFrame.period === "year") {
        // Yearly projection logic
        const isCurrentYear = selectedYear === today.getFullYear();
        const currentMonth = isCurrentYear ? today.getMonth() : 11; // 0-indexed, so 11 = December

        // Calculate year's total from monthly sales data
        const yearSales = salesData.monthly.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate.getFullYear() === selectedYear;
        });

        const currentTotal = yearSales.reduce(
          (sum, sale) => sum + sale.salesAmount,
          0
        );

        // If year is complete or we're viewing a past/future year
        if (!isCurrentYear || currentMonth >= 11) {
          return {
            currentTotal,
            projectedTotal: currentTotal,
            isComplete: true,
            period: "year",
          };
        }

        // Calculate projection for incomplete current year
        // Only count completed months (exclude current month if it's not complete)
        const isCurrentMonthComplete =
          isCurrentYear &&
          selectedYear === today.getFullYear() &&
          currentMonth === today.getMonth();
        const completedMonths = isCurrentMonthComplete
          ? currentMonth
          : currentMonth + 1; // Don't count incomplete current month

        if (completedMonths === 0) {
          return {
            currentTotal: 0,
            projectedTotal: 0,
            isComplete: false,
            period: "year",
          };
        }

        const monthlyAverage = currentTotal / completedMonths;
        const remainingMonths = 12 - (currentMonth + 1); // Remaining months after current month
        const projectedTotal = currentTotal + monthlyAverage * remainingMonths;

        return {
          currentTotal,
          projectedTotal: Math.round(projectedTotal),
          isComplete: false,
          period: "year",
        };
      }

      // Default fallback
      return {
        currentTotal: 0,
        projectedTotal: 0,
        isComplete: true,
        period: timeFrame.period,
      };
    }, [timeFrame, currentDate, salesData]);

    const { currentTotal, projectedTotal, isComplete, period } = projectionData;

    // Handle no data
    if (!currentTotal && !projectedTotal) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-64 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {timeFrame.period === "year" ? "Yearly" : "Monthly"} Projection
          </h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">No sales data available</p>
          </div>
        </div>
      );
    }

    // Determine status for incomplete periods
    let statusColor = "text-gray-500";
    let statusText = "Complete";
    let StatusIcon = CheckCircle;

    if (!isComplete) {
      // For incomplete periods, compare projected total against store goals
      let targetGoal = 50000; // Default fallback

      if (storeGoals?.salesGoal && storeGoals.salesGoal > 0) {
        if (period === "month") {
          targetGoal = storeGoals.salesGoal;
        } else {
          // For yearly, multiply monthly goal by 12
          targetGoal = storeGoals.salesGoal * 12;
        }
      }

      const projectedPercentage =
        targetGoal > 0 ? (projectedTotal / targetGoal) * 100 : 0;

      if (projectedPercentage >= 110) {
        statusColor = "text-green-500";
        statusText = "Ahead of Goal";
      } else if (projectedPercentage >= 90) {
        statusColor = "text-blue-500";
        statusText = "On Track";
      } else {
        statusColor = "text-red-500";
        statusText = "Behind Goal";
      }
      StatusIcon = TrendingUp;
    }

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {timeFrame.period === "year" ? "Yearly" : "Monthly"} Projection
          </h3>
          <div
            className={`flex items-center ${statusColor} dark:text-inherit text-sm font-medium`}
          >
            <StatusIcon size={16} className="mr-1" />
            {statusText}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
              {period === "month" ? "Month to Date" : "Year to Date"}
            </p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              ${currentTotal.toLocaleString()}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
              {isComplete
                ? period === "month"
                  ? "Month Total"
                  : "Year Total"
                : "Projected Total"}
            </p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ${projectedTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {isComplete && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {period === "month" ? "Month" : "Year"} completed - showing final
              totals
            </p>
          </div>
        )}
      </div>
    );
  }
);

export default SalesProjection;
