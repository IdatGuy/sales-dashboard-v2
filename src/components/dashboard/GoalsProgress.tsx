import React from "react";
import ProgressBar from "../common/ProgressBar";
import { GoalDefinition } from "../../services/api/goalDefinitions";

export interface GoalProgressItem {
  goalDefinition: GoalDefinition;
  current: number;
  target: number;
  percentage: number;
}

interface GoalsProgressProps {
  items: GoalProgressItem[];
}

const BAR_COLORS = [
  "bg-primary-500 dark:bg-primary-400",
  "bg-secondary-500 dark:bg-secondary-400",
  "bg-accent-500 dark:bg-accent-400",
  "bg-indigo-500 dark:bg-indigo-400",
  "bg-teal-500 dark:bg-teal-400",
];

function formatValue(value: number, unitType: string): string {
  if (unitType === "currency") return `$${value.toLocaleString()}`;
  if (unitType === "percentage") return `${value.toLocaleString()}%`;
  return value.toLocaleString();
}

const GoalsProgress: React.FC<GoalsProgressProps> = React.memo(({ items }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 h-64 flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Goals Progress
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No goal data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          Goals Progress
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Monthly Goals Progress
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.goalDefinition.id}>
            <ProgressBar
              percentage={item.percentage}
              label={item.goalDefinition.name}
              color={BAR_COLORS[i % BAR_COLORS.length]}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-1">
              <span>{formatValue(item.current, item.goalDefinition.unitType)}</span>
              <span>Goal: {formatValue(item.target, item.goalDefinition.unitType)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default GoalsProgress;
