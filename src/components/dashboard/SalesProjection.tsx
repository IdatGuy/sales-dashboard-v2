import React, { useMemo } from "react";
import { TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { formatDateToYMD } from "../../lib/dateUtils";
import { GoalDefinition } from "../../services/api/goalDefinitions";

export interface GoalProgressItem {
  goalDefinition: GoalDefinition;
  current: number;
  target: number;
  percentage: number;
}

interface SalesProjectionProps {
  goalProgressItems?: GoalProgressItem[];
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

const SalesProjection: React.FC<SalesProjectionProps> = React.memo(
  ({ goalProgressItems = [] }) => {
    const { salesData, visibleMetrics } = useDashboard();

    const yesterday = useMemo(() => {
      const t = new Date();
      return new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
    }, []);

    const yesterdayStr = formatDateToYMD(yesterday);

    const yesterdayLabel = yesterday.toLocaleDateString("default", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    const yesterdaySale = salesData.daily.find((s) => s.date === yesterdayStr) ?? null;

    const sortedMetrics = useMemo(
      () => [...visibleMetrics].sort((a, b) => a.sortOrder - b.sortOrder),
      [visibleMetrics]
    );

    // Pace-based status: compare goal completion % against elapsed month %
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthElapsedPct = ((today.getDate() - 1) / daysInMonth) * 100;

    const [featuredMetric, ...restMetrics] = sortedMetrics;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Yesterday
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">{yesterdayLabel}</span>
        </div>

        {!yesterdaySale ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-2">
            No data entered for yesterday
          </p>
        ) : (
          <>
            {/* Featured metric */}
            {featuredMetric && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {featuredMetric.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatValue(
                    yesterdaySale.metrics[featuredMetric.key] ?? 0,
                    featuredMetric.unitType
                  )}
                </p>
              </div>
            )}

            {/* Remaining metrics grid */}
            {restMetrics.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-2">
                {restMetrics.map((metric) => (
                  <div key={metric.key}>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {metric.label}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {formatValue(
                        yesterdaySale.metrics[metric.key] ?? 0,
                        metric.unitType
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Goals section */}
        {goalProgressItems.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
            <p className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">
              Goals Progress
            </p>
            <div className="space-y-4">
              {goalProgressItems.map((item, i) => {
                let Icon = AlertTriangle;
                let iconClass = "text-orange-500";
                let valueClass = "text-orange-600 dark:text-orange-400";

                if (item.percentage >= 100) {
                  Icon = CheckCircle;
                  iconClass = "text-green-500";
                  valueClass = "text-green-600 dark:text-green-400";
                } else if (item.percentage >= monthElapsedPct) {
                  Icon = TrendingUp;
                  iconClass = "text-blue-500";
                  valueClass = "text-blue-600 dark:text-blue-400";
                }

                const clamped = Math.min(100, Math.max(0, item.percentage));
                return (
                  <div key={item.goalDefinition.id}>
                    {/* Label row with icon */}
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={16} className={`${iconClass} shrink-0`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {item.goalDefinition.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {clamped}%
                      </span>
                    </div>
                    {/* Bar row */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${BAR_COLORS[i % BAR_COLORS.length]} transition-all duration-1000 ease-out`}
                        style={{ width: `${clamped}%` }}
                      />
                    </div>
                    {/* Values row */}
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300 mt-1">
                      <span className={`font-semibold ${valueClass}`}>
                        {formatValue(item.current, item.goalDefinition.unitType)}
                      </span>
                      <span>Goal: {formatValue(item.target, item.goalDefinition.unitType)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default SalesProjection;
