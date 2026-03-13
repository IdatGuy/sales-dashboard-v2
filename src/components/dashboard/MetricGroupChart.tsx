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
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Sale } from "../../types";
import { MetricDefinition } from "../../services/api/metricDefinitions";
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";
import { getSaleValueForMetric } from "../../lib/metricUtils";

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
  /** When true, prepends salesAmount as the first dataset (used for the currency chart) */
  includeSalesAmount?: boolean;
  showAccumulated: boolean;
  hideSundays: boolean;
}

const MetricGroupChart: React.FC<MetricGroupChartProps> = React.memo(
  ({ sales = [], metrics, unitType, title, includeSalesAmount = false, showAccumulated, hideSundays }) => {
    const { timeFrame } = useDashboard();
    const { isDarkMode } = useTheme();

    const chartRef = React.useRef<ChartJS<"line" | "bar", number[], string> | null>(null);

    // For yearly: aggregate daily sales into monthly totals
    let displaySales = sales;
    if (timeFrame.period === "year") {
      const monthlyMap: { [key: string]: Sale } = {};
      sales.forEach((sale) => {
        const monthKey = sale.date.substring(0, 7);
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            id: `${sale.storeId}-${monthKey}`,
            storeId: sale.storeId,
            date: `${monthKey}-01`,
            salesAmount: 0,
            accessorySales: 0,
            homeConnects: 0,
            homePlus: 0,
            cleanings: 0,
            repairs: 0,
            customMetrics: {},
          };
        }
        monthlyMap[monthKey].salesAmount += sale.salesAmount;
        metrics.forEach((metric) => {
          const val = getSaleValueForMetric(sale, metric);
          monthlyMap[monthKey].customMetrics[metric.key] =
            (monthlyMap[monthKey].customMetrics[metric.key] ?? 0) + val;
        });
      });
      displaySales = Object.values(monthlyMap).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    }

    // Filter out Sundays in month view (locations are always closed on Sundays)
    if (timeFrame.period === "month" && hideSundays) {
      displaySales = displaySales.filter((sale) => {
        const [year, month, day] = sale.date.split("-").map(Number);
        return new Date(year, month - 1, day).getDay() !== 0;
      });
    }

    // For year-aggregated sales, builtin metric values were stored in customMetrics
    function getDisplayValue(sale: Sale, metric: MetricDefinition): number {
      if (timeFrame.period === "year") {
        return sale.customMetrics[metric.key] ?? 0;
      }
      return getSaleValueForMetric(sale, metric);
    }

    // Apply accumulated toggle to salesAmount
    let accumulatedSales = displaySales;
    if (
      (timeFrame.period === "month" || timeFrame.period === "year") &&
      showAccumulated
    ) {
      let runningTotal = 0;
      accumulatedSales = displaySales.map((sale) => {
        runningTotal += sale.salesAmount;
        return { ...sale, salesAmount: runningTotal };
      });
    }

    // Pre-compute accumulated values per metric key
    const accumulatedMetricData: Record<string, number[]> = {};
    if (showAccumulated && (timeFrame.period === "month" || timeFrame.period === "year")) {
      metrics.forEach((metric) => {
        let runningTotal = 0;
        accumulatedMetricData[metric.key] = displaySales.map((sale) => {
          runningTotal += getDisplayValue(sale, metric);
          return runningTotal;
        });
      });
    }

    const formatValue = (value: number) => {
      if (unitType === "currency") return `$${value.toLocaleString()}`;
      if (unitType === "percentage") return `${value}%`;
      return value.toLocaleString();
    };

    const formatTick = (value: any) => formatValue(Number(value));

    const salesColor = { dark: "#38bdf8", light: "#2563eb" };
    const primaryColor = isDarkMode ? salesColor.dark : salesColor.light;

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

      const salesDataset = includeSalesAmount
        ? [
            {
              label: "Sales",
              data: mostRecent.map((sale) => sale.salesAmount),
              backgroundColor: primaryColor,
            },
          ]
        : [];

      data = {
        labels,
        datasets: [
          ...salesDataset,
          ...metrics.map((metric, i) => ({
            label: metric.isDeprecated ? `${metric.label} (historical)` : metric.label,
            data: mostRecent.map((sale) => getDisplayValue(sale, metric)),
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

      const salesDataset = includeSalesAmount
        ? [
            {
              label: showAccumulated ? "Accumulated Sales" : "Sales",
              data: accumulatedSales.map((sale) => sale.salesAmount),
              borderColor: primaryColor,
              backgroundColor: isDarkMode
                ? "rgba(56, 189, 248, 0.1)"
                : "rgba(37, 99, 235, 0.1)",
              tension: 0.4,
              fill: true,
              pointRadius: 4,
              pointBackgroundColor: primaryColor,
              pointBorderColor: "white",
              pointBorderWidth: 2,
            },
          ]
        : [];

      data = {
        labels,
        datasets: [
          ...salesDataset,
          ...metrics.map((metric, i) => {
            const color = isDarkMode
              ? METRIC_COLORS_DARK[i % METRIC_COLORS_DARK.length]
              : METRIC_COLORS_LIGHT[i % METRIC_COLORS_LIGHT.length];
            return {
              label: metric.isDeprecated
                ? `${metric.label} (historical)`
                : showAccumulated ? `Accumulated ${metric.label}` : metric.label,
              data: showAccumulated && accumulatedMetricData[metric.key]
                ? accumulatedMetricData[metric.key]
                : displaySales.map((sale) => getDisplayValue(sale, metric)),
              borderColor: color + (metric.isDeprecated ? "99" : ""),
              backgroundColor: color + (metric.isDeprecated ? "22" : "1a"),
              tension: 0.4,
              fill: false,
              pointRadius: 4,
              pointBackgroundColor: color,
              pointBorderColor: "white",
              pointBorderWidth: 2,
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
            title: function (context: any) {
              const idx = context[0].dataIndex;
              const dateStr = dateLabels[idx];
              const [year, month, day] = dateStr.split("-").map(Number);
              return new Date(year, month - 1, day).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
            },
            label: function (context: any) {
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
            ref={chartRef as any}
            data={data}
            options={options as any}
            className="animate-fade-in"
          />
        </div>
      </div>
    );
  }
);

export default MetricGroupChart;
