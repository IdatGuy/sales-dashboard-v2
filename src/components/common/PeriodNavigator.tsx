import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  disabledPrev?: boolean;
  disabledNext?: boolean;
}

const PeriodNavigator: React.FC<PeriodNavigatorProps> = ({
  label,
  onPrev,
  onNext,
  disabledPrev = false,
  disabledNext = false,
}) => (
  <div className="inline-flex shadow-sm rounded-md">
    <button
      type="button"
      className={`inline-flex items-center px-3 py-2 rounded-l-md border text-sm font-medium transition-colors
        bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600
        ${disabledPrev ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={onPrev}
      disabled={disabledPrev}
      aria-label="Previous"
    >
      <ChevronLeft size={18} />
    </button>
    <span className="inline-flex items-center px-4 py-2 border-t border-b text-sm font-medium bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 select-none">
      {label}
    </span>
    <button
      type="button"
      className={`inline-flex items-center px-3 py-2 rounded-r-md border text-sm font-medium transition-colors
        bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600
        ${disabledNext ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={onNext}
      disabled={disabledNext}
      aria-label="Next"
    >
      <ChevronRight size={18} />
    </button>
  </div>
);

export default PeriodNavigator;
