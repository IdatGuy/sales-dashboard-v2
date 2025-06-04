import React from 'react';
import { useDashboard } from '../../context/DashboardContext';

const TimeFrameToggle: React.FC = () => {
  const { timeFrame, setTimeFrame } = useDashboard();
  
  const handleToggle = () => {
    const today = new Date();
    const isMonthly = timeFrame.period === 'month';
    
    // Toggle between month and year view
    if (isMonthly) {
      setTimeFrame({
        period: 'year',
        label: today.getFullYear().toString(),
      });
    } else {
      setTimeFrame({
        period: 'month',
        label: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      });
    }
  };

  return (
    <div className="inline-flex shadow-sm rounded-md">
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium transition-colors ${
          timeFrame.period === 'month'
            ? 'bg-primary-500 text-white border-primary-500'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => {
          if (timeFrame.period !== 'month') handleToggle();
        }}
      >
        Month
      </button>
      <button
        type="button"
        className={`relative inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium transition-colors ${
          timeFrame.period === 'year'
            ? 'bg-primary-500 text-white border-primary-500'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        }`}
        onClick={() => {
          if (timeFrame.period !== 'year') handleToggle();
        }}
      >
        Year
      </button>
    </div>
  );
};

export default TimeFrameToggle;