import React, { useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
  ScriptableContext,
  ScriptableLineSegmentContext,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Sale } from "../../types";
import { MetricDefinition } from "../../services/api/metricDefinitions";
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";
import { getSaleValueForMetric, aggregateDailySalesToMonthly, accumulateSales } from "../../lib/salesUtils";
import { countBusinessDays } from "../../lib/dateUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const METRIC_COLORS_DARK = ["#fbbf24", "#34d399", "#f472b6", "#f87171", "#a78bfa", "#fb923c", "#60a5fa"];
const METRIC_COLORS_LIGHT = ["#f59e42", "#059669", "#ec4899", "#ef4444", "#8b5cf6", "#f97316", "#3b82f6"];

interface MetricGroupChartProps {
  sales: Sale[];
  metrics: MetricDefinition[];
  unitType: "currency" | "count" | "percentage";
  title: string;
  showAccumulated: boolean;
}

const MetricGroupChart: React.FC<MetricGroupChartProps> = React.memo(
  ({ sales = [], metrics, unitType, title, showAccumulated }) => {
    const { timeFrame, currentDate } = useDashboard();
    const { isDarkMode } = useTheme();

    const chartRef = React.useRef<ChartJS<"line" | "bar", number[], string> | null>(null);

    // For yearly: aggregate daily sales into monthly totals
    let displaySales = sales;
    if (timeFrame.period === "year") {
      displaySales = aggregateDailySalesToMonthly(sales, metrics);
    }

    // Apply accumulated toggle to gross_revenue
    let accumulatedSales = displaySales;
    if (
      (timeFrame.period === "month" || timeFrame.period === "year") &&
      showAccumulated
    ) {
      accumulatedSales = accumulateSales(displaySales);
    }

    // Pre-compute accumulated values per metric key
    const accumulatedMetricData: Record<string, number[]> = {};
    if (showAccumulated && (timeFrame.period === "month" || timeFrame.period === "year")) {
      metrics.forEach((metric) => {
        if (metric.unitType === "percentage") return;
        accumulatedMetricData[metric.key] = accumulateSales(displaySales, metric.key)
          .map((sale) => sale.metrics[metric.key] ?? 0);
      });
    }

    // --- Projection for incomplete current period ---
    const today = new Date();
    let isIncomplete = false;
    let projectedSalesValue = 0;
    const projectedMetricValues: Record<string, number> = {};
    let projectedLabel = "";
    let projectedDateLabel = "";

    const selectedYear = currentDate.getFullYear();
    const selectedMonth = currentDate.getMonth();

    if (timeFrame.period === "month") {
      const isCurrentMonth =
        selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const currentDay = today.getDate();
      if (isCurrentMonth && currentDay < daysInMonth) {
        const completedDay = currentDay - 1;
        const completedBizDays = countBusinessDays(1, completedDay, selectedYear, selectedMonth);
        if (completedBizDays > 0) {
          isIncomplete = true;
          const currentTotal = displaySales.reduce((s, sale) => s + (sale.metrics['gross_revenue'] ?? 0), 0);
          const dailyAvg = currentTotal / completedBizDays;
          const remainingBizDays = countBusinessDays(currentDay, daysInMonth, selectedYear, selectedMonth);
          projectedSalesValue = showAccumulated
            ? currentTotal + dailyAvg * remainingBizDays
            : dailyAvg;
          metrics.forEach((metric) => {
            if (metric.unitType === "percentage") {
              const lastEntry = [...displaySales].reverse().find((s) => s.metrics[metric.key] !== undefined);
              projectedMetricValues[metric.key] = lastEntry ? (lastEntry.metrics[metric.key] ?? 0) : 0;
            } else {
              const mt = displaySales.reduce((s, sale) => s + getSaleValueForMetric(sale, metric), 0);
              const ma = mt / completedBizDays;
              projectedMetricValues[metric.key] = showAccumulated ? mt + ma * remainingBizDays : ma;
            }
          });
          const endDate = new Date(selectedYear, selectedMonth, daysInMonth);
          projectedLabel = endDate.toLocaleDateString(undefined, { weekday: "short" });
          projectedDateLabel = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
        }
      }
    } else if (timeFrame.period === "year") {
      const isCurrentYear = selectedYear === today.getFullYear();
      const currentMonth = today.getMonth();
      if (isCurrentYear && currentMonth < 11) {
        const completedMonths = currentMonth;
        if (completedMonths > 0) {
          isIncomplete = true;
          const currentTotal = displaySales.reduce((s, sale) => s + (sale.metrics['gross_revenue'] ?? 0), 0);
          const monthlyAvg = currentTotal / completedMonths;
          const remainingMonths = 12 - (currentMonth + 1);
          projectedSalesValue = showAccumulated
            ? currentTotal + monthlyAvg * remainingMonths
            : monthlyAvg;
          metrics.forEach((metric) => {
            if (metric.unitType === "percentage") {
              const lastEntry = [...displaySales].reverse().find((s) => s.metrics[metric.key] !== undefined);
              projectedMetricValues[metric.key] = lastEntry ? (lastEntry.metrics[metric.key] ?? 0) : 0;
            } else {
              const mt = displaySales.reduce((s, sale) => s + getSaleValueForMetric(sale, metric), 0);
              const ma = mt / completedMonths;
              projectedMetricValues[metric.key] = showAccumulated ? mt + ma * remainingMonths : ma;
            }
          });
          projectedLabel = new Date(selectedYear, 11, 1).toLocaleDateString(undefined, { month: "short" });
          projectedDateLabel = `${selectedYear}-12-01`;
        }
      }
    }
    // ------------------------------------------------

    const formatValue = (value: number) => {
      if (unitType === "currency") return `$${value.toLocaleString()}`;
      if (unitType === "percentage") return `${value}%`;
      return value.toLocaleString();
    };

    const formatTick = (value: number | string) => formatValue(Number(value));

    let data, ChartComponent, dateLabels: string[];

    if (timeFrame.period === "day") {
      ChartComponent = Bar;
      const mostRecent =
        accumulatedSales.length > 0
          ? [accumulatedSales[accumulatedSales.length - 1]]
          : [];
      dateLabels = mostRecent.map((sale) => sale.date);
      const labels = mostRecent.map((sale) => {
        const [year, month, day] = sale.date.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
          weekday: "short",
        });
      });

      data = {
        labels,
        datasets: [
          ...metrics.map((metric, i) => ({
            label: metric.isDeprecated ? `${metric.label} (historical)` : metric.label,
            data: mostRecent.map((sale) => getSaleValueForMetric(sale, metric)),
            backgroundColor:
              (isDarkMode
                ? METRIC_COLORS_DARK[i % METRIC_COLORS_DARK.length]
                : METRIC_COLORS_LIGHT[i % METRIC_COLORS_LIGHT.length]) +
              (metric.isDeprecated ? "99" : ""),
          })),
        ],
      };
    } else {
      ChartComponent = Line;
      dateLabels = accumulatedSales.map((sale) => sale.date);
      const labels = accumulatedSales.map((sale) => {
        if (timeFrame.period === "year") {
          const [year, month] = sale.date.split("-").map(Number);
          return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
            month: "short",
          });
        }
        const [year, month, day] = sale.date.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
          weekday: "short",
        });
      });

      if (isIncomplete) {
        labels.push(projectedLabel);
        dateLabels.push(projectedDateLabel);
      }

      const projectedIdx = labels.length - 1;

      data = {
        labels,
        datasets: [
          ...metrics.map((metric, i) => {
            const color = isDarkMode
              ? METRIC_COLORS_DARK[i % METRIC_COLORS_DARK.length]
              : METRIC_COLORS_LIGHT[i % METRIC_COLORS_LIGHT.length];
            const isPercentage = metric.unitType === "percentage";
            const baseData = (!isPercentage && showAccumulated && accumulatedMetricData[metric.key])
              ? accumulatedMetricData[metric.key]
              : displaySales.map((sale) => getSaleValueForMetric(sale, metric));
            return {
              label: metric.isDeprecated
                ? `${metric.label} (historical)`
                : (showAccumulated && !isPercentage) ? `Accumulated ${metric.label}` : metric.label,
              data: [
                ...baseData,
                ...(isIncomplete ? [Math.round(projectedMetricValues[metric.key] ?? 0)] : []),
              ],
              borderColor: color + (metric.isDeprecated ? "99" : ""),
              backgroundColor: color + (metric.isDeprecated ? "22" : "1a"),
              tension: 0.4,
              fill: false,
              pointRadius: isIncomplete
                ? (ctx: ScriptableContext<"line">) => ctx.dataIndex === projectedIdx ? 3 : 4
                : 4,
              pointBackgroundColor: isIncomplete
                ? (ctx: ScriptableContext<"line">) => ctx.dataIndex === projectedIdx ? color + "80" : color
                : color,
              pointBorderColor: "white",
              pointBorderWidth: 2,
              segment: isIncomplete ? {
                borderDash: (ctx: ScriptableLineSegmentContext) =>
                  ctx.p1DataIndex === projectedIdx ? [6, 4] : undefined,
                borderColor: (ctx: ScriptableLineSegmentContext) =>
                  ctx.p1DataIndex === projectedIdx ? color + "99" : undefined,
              } : undefined,
            };
          }),
        ],
      };
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: {
          backgroundColor: isDarkMode
            ? "rgba(30, 41, 59, 0.95)"
            : "rgba(255, 255, 255, 0.9)",
          titleColor: isDarkMode ? "#f1f5f9" : "#1e293b",
          bodyColor: isDarkMode ? "#cbd5e1" : "#334155",
          titleFont: { size: 14, weight: "bold" as const },
          bodyFont: { size: 14 },
          padding: 12,
          borderColor: isDarkMode
            ? "rgba(51, 65, 85, 0.7)"
            : "rgba(203, 213, 225, 0.5)",
          borderWidth: 1,
          displayColors: true,
          callbacks: {
            title: function (context: TooltipItem<"line" | "bar">[]) {
              const idx = context[0].dataIndex;
              const dateStr = dateLabels[idx];
              const [year, month, day] = dateStr.split("-").map(Number);
              const dateLabel = new Date(year, month - 1, day).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return isIncomplete && idx === dateLabels.length - 1
                ? `${dateLabel} (Projected)`
                : dateLabel;
            },
            label: function (context: TooltipItem<"line" | "bar">) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null) {
                label += formatValue(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: isDarkMode ? "#cbd5e1" : "#64748b" },
        },
        y: {
          type: "linear" as const,
          position: "left" as const,
          beginAtZero: true,
          grid: {
            color: isDarkMode
              ? "rgba(51, 65, 85, 0.5)"
              : "rgba(203, 213, 225, 0.5)",
          },
          ticks: {
            color: isDarkMode ? "#cbd5e1" : "#64748b",
            callback: formatTick,
          },
          title: {
            display: true,
            text:
              unitType === "currency"
                ? "Dollars"
                : unitType === "percentage"
                ? "Percent (%)"
                : "Count",
            color: isDarkMode ? "#cbd5e1" : "#64748b",
          },
        },
      },
      interaction: { mode: "index" as const, intersect: false },
      animation: { duration: 1000 },
    };

    useEffect(() => {
      if (chartRef.current) {
        chartRef.current.update();
      }
    }, [timeFrame, sales]);

    if (!sales || sales.length === 0) {
      return (
        <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800 h-64 flex flex-col items-center justify-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {title}
          </h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-gray-500">No data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {title}
          </h3>
        </div>
        <div className="h-64">
          <ChartComponent
            ref={chartRef as React.Ref<ChartJS<"line" | "bar", number[], string>>}
            data={data}
            options={options}
            className="animate-fade-in"
          />
        </div>
      </div>
    );
  }
);

export default MetricGroupChart;
