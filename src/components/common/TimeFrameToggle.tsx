import React from "react";
import { useDashboard } from "../../context/DashboardContext";

const TimeFrameToggle: React.FC = () => {
  const { timeFrame, setTimeFrame } = useDashboard();

  const today = new Date();

  const setDaily = () => {
    setTimeFrame({
      period: "day",
      label: "", // Label will be updated by the context based on the actual date
    });
  };

  const setMonthly = () =>
    setTimeFrame({
      period: "month",
      label: today.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });

  const setYearly = () =>
    setTimeFrame({
      period: "year",
      label: today.getFullYear().toString(),
    });

  return (
    <div className="inline-flex shadow-sm rounded-md">
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium transition-colors
          ${
            timeFrame.period === "day"
              ? "bg-primary-500 text-white border-primary-500 dark:bg-primary-400 dark:text-gray-900 dark:border-primary-400"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          }`}
        onClick={setDaily}
      >
        Daily
      </button>
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 border-t border-b border-r text-sm font-medium transition-colors
          ${
            timeFrame.period === "month"
              ? "bg-primary-500 text-white border-primary-500 dark:bg-primary-400 dark:text-gray-900 dark:border-primary-400"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          }`}
        onClick={setMonthly}
      >
        Monthly
      </button>
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium transition-colors
          ${
            timeFrame.period === "year"
              ? "bg-primary-500 text-white border-primary-500 dark:bg-primary-400 dark:text-gray-900 dark:border-primary-400"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          }`}
        onClick={setYearly}
      >
        Yearly
      </button>
    </div>
  );
};

export default TimeFrameToggle;
