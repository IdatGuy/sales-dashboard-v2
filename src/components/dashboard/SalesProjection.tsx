import React from "react";
import { TrendingUp } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";

interface SalesProjectionProps {
  currentTotal: number;
  projectedTotal: number;
}

const SalesProjection: React.FC<SalesProjectionProps> = ({
  currentTotal,
  projectedTotal,
}) => {
  const { timeFrame } = useDashboard();

  // Calculate percentage of goal (this would come from your data)
  const targetGoal = 100000; // Example goal
  const percentageOfGoal = Math.round((projectedTotal / targetGoal) * 100);

  // Determine if we're on track, behind, or ahead
  let statusColor = "text-warning-500";
  let statusText = "On Track";

  if (percentageOfGoal >= 110) {
    statusColor = "text-success-500";
    statusText = "Ahead of Goal";
  } else if (percentageOfGoal < 90) {
    statusColor = "text-error-500";
    statusText = "Behind Goal";
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {timeFrame.period === "month" ? "Monthly" : "Yearly"} Projection
        </h3>
        <div
          className={`flex items-center ${statusColor} dark:text-inherit text-sm font-medium`}
        >
          <TrendingUp size={16} className="mr-1" />
          {statusText}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
            Current Total
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            ${currentTotal.toLocaleString()}
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-1">
            Projected
          </p>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            ${projectedTotal.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-300">
            Goal Progress
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {percentageOfGoal}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mt-1">
          <div
            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${
              percentageOfGoal >= 100
                ? "bg-success-500 dark:bg-success-400"
                : percentageOfGoal >= 90
                ? "bg-warning-500 dark:bg-warning-400"
                : "bg-error-500 dark:bg-error-400"
            }`}
            style={{ width: `${Math.min(100, percentageOfGoal)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SalesProjection;
