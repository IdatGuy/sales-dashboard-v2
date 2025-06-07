import React from "react";
import { DollarSign } from "lucide-react";

interface CommissionWidgetProps {
  commission: {
    total: number;
    breakdown: {
      accessorySales: number;
      homeConnects: number;
      residuals: number;
    };
  } | null;
}

const CommissionWidget: React.FC<CommissionWidgetProps> = ({ commission }) => {
  if (!commission) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Your Commission
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No commission data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        Your Commission all data aproximate
      </h3>

      <div className="flex items-center justify-center mb-4">
        <div className="bg-primary-50 dark:bg-primary-900 p-3 rounded-full">
          <DollarSign
            size={24}
            className="text-primary-600 dark:text-primary-400"
          />
        </div>
        <div className="ml-4">
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            ${commission.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Current Month
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Accessory Sales
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            ${commission.breakdown.accessorySales.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Home Connects
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            ${commission.breakdown.homeConnects.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Residuals
          </span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
            ${commission.breakdown.residuals.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommissionWidget;
