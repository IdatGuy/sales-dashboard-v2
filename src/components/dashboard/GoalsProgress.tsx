import React from "react";
import ProgressBar from "../common/ProgressBar";

interface GoalsProgressProps {
  salesProgress: {
    current: number;
    goal: number;
    percentage: number;
  };
  accessoryProgress: {
    current: number;
    goal: number;
    percentage: number;
  };
  homeConnectProgress: {
    current: number;
    goal: number;
    percentage: number;
  };
}

const GoalsProgress: React.FC<GoalsProgressProps> = React.memo(
  ({ salesProgress, accessoryProgress, homeConnectProgress }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Goals Progress
        </h3>

        <div className="mb-4">
          <ProgressBar
            percentage={salesProgress.percentage}
            label="Sales Goal"
            color="bg-primary-500 dark:bg-primary-400"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-1">
            <span>${salesProgress.current.toLocaleString()}</span>
            <span>${salesProgress.goal.toLocaleString()}</span>
          </div>
        </div>

        <div className="mb-4">
          <ProgressBar
            percentage={accessoryProgress.percentage}
            label="Accessory Goal"
            color="bg-secondary-500 dark:bg-secondary-400"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-1">
            <span>${accessoryProgress.current.toLocaleString()}</span>
            <span>${accessoryProgress.goal.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <ProgressBar
            percentage={homeConnectProgress.percentage}
            label="Home Connect Goal"
            color="bg-accent-500 dark:bg-accent-400"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-1">
            <span>{homeConnectProgress.current} units</span>
            <span>{homeConnectProgress.goal} units</span>
          </div>
        </div>
      </div>
    );
  }
);

export default GoalsProgress;
