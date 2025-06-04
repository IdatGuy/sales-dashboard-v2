import React from 'react';

interface ProgressBarProps {
  percentage: number;
  label: string;
  color: string;
  animate?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  label, 
  color,
  animate = true 
}) => {
  // Make sure percentage is between 0 and 100
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-700">{clampedPercentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color} ${animate ? 'transition-all duration-1000 ease-out' : ''}`}
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;