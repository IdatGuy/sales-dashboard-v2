import React from 'react';
import { DollarSign } from 'lucide-react';

interface CommissionWidgetProps {
  commission: {
    total: number;
    breakdown: {
      base: number;
      bonus: number;
      incentives: number;
    };
  } | null;
}

const CommissionWidget: React.FC<CommissionWidgetProps> = ({ commission }) => {
  if (!commission) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Commission</h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No commission data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Commission</h3>
      
      <div className="flex items-center justify-center mb-4">
        <div className="bg-primary-50 p-3 rounded-full">
          <DollarSign size={24} className="text-primary-600" />
        </div>
        <div className="ml-4">
          <p className="text-3xl font-bold text-gray-800">
            ${commission.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">Current Month</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Base Commission</span>
          <span className="text-sm font-medium text-gray-800">
            ${commission.breakdown.base.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Performance Bonus</span>
          <span className="text-sm font-medium text-gray-800">
            ${commission.breakdown.bonus.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Special Incentives</span>
          <span className="text-sm font-medium text-gray-800">
            ${commission.breakdown.incentives.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommissionWidget;