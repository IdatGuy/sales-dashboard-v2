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
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { Sale } from "../../types";
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";
import { aggregateDailySalesToMonthly, accumulateSales } from "../../lib/salesUtils";

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

interface SalesChartProps {
  sales: Sale[];
}

const SalesChart: React.FC<SalesChartProps> = React.memo(({ sales = [] }) => {
  const { timeFrame, showAccumulated, setShowAccumulated } = useDashboard();
  const { isDarkMode } = useTheme();

  const chartRef = React.useRef<ChartJS<"line" | "bar", number[], string> | null>(null);

  let displaySales = sales;

  // For yearly: aggregate daily sales into monthly totals
  if (timeFrame.period === "year") {
    displaySales = aggregateDailySalesToMonthly(sales);
  }

  // Accumulate sales if toggle is on and period is "month" or "year"
  if (
    (timeFrame.period === "month" || timeFrame.period === "year") &&
    showAccumulated
  ) {
    displaySales = accumulateSales(displaySales);
  }

  let data, ChartComponent, dateLabels: string[];

  if (timeFrame.period === "day") {
    ChartComponent = Bar;
    const mostRecent =
      displaySales.length > 0 ? [displaySales[displaySales.length - 1]] : [];
    dateLabels = mostRecent.map((sale) => sale.date);
    data = {
      labels: mostRecent.map((sale) => {
        const [year, month, day] = sale.date.split("-").map(Number);
        return new Date(year, month - 1, day).toLocaleDateString(undefined, {
          weekday: "short",
        });
      }),
      datasets: [
        {
          label: "Sales",
          data: mostRecent.map((sale) => sale.metrics['gross_revenue'] ?? 0),
          backgroundColor: isDarkMode ? "#38bdf8" : "#2563eb",
        },
      ],
    };
  } else {
    ChartComponent = Line;
    dateLabels = displaySales.map((sale) => sale.date);
    data = {
      labels: displaySales.map((sale) => {
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
      }),
      datasets: [
        {
          label: showAccumulated ? "Accumulated Sales" : "Sales",
          data: displaySales.map((sale) => sale.metrics['gross_revenue'] ?? 0),
          borderColor: isDarkMode ? "#38bdf8" : "#2563eb",
          backgroundColor: isDarkMode
            ? "rgba(56, 189, 248, 0.1)"
            : "rgba(37, 99, 235, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: isDarkMode ? "#38bdf8" : "#2563eb",
          pointBorderColor: "white",
          pointBorderWidth: 2,
        },
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
            return new Date(year, month - 1, day).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          },
          label: function (context: TooltipItem<"line" | "bar">) {
            let label = context.dataset.label || "";
            if (label) label += ": ";
            if (context.parsed.y !== null) {
              label += `$${context.parsed.y.toLocaleString()}`;
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
          callback: (value: number | string) => `$${Number(value).toLocaleString()}`,
        },
        title: {
          display: true,
          text: "Sales Amount",
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
          Sales
        </h3>
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500">No sales data available</p>
        </div>
      </div>
    );
  }

  function getChartTitle() {
    return `${timeFrame.label} Sales`;
  }

  return (
    <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {getChartTitle()}
        </h3>
        {(timeFrame.period === "month" || timeFrame.period === "year") && (
          <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showAccumulated}
              onChange={() => setShowAccumulated((v: boolean) => !v)}
              className="form-checkbox"
            />
            <span>Accumulated</span>
          </label>
        )}
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
});

export default SalesChart;
