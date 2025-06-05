import React, { useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { DailySales, MonthlySales } from "../../types";
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  dailySales?: DailySales[];
  monthlySales?: MonthlySales[];
}

const SalesChart: React.FC<SalesChartProps> = ({
  dailySales = [],
  monthlySales = [],
}) => {
  const { timeFrame } = useDashboard();
  const { isDarkMode } = useTheme();
  const chartRef = React.useRef<ChartJS<"line", number[], string> | null>(null);

  // Format data based on time frame
  const data = {
    labels:
      timeFrame.period === "month"
        ? dailySales.map((sale) => sale.date)
        : monthlySales.map((sale) => sale.month),
    datasets: [
      {
        label: "Sales",
        data:
          timeFrame.period === "month"
            ? dailySales.map((sale) => sale.amount)
            : monthlySales.map((sale) => sale.amount),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "white",
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1e293b",
        bodyColor: "#334155",
        titleFont: {
          size: 14,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 14,
        },
        padding: 12,
        borderColor: "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function (context: any) {
            return `$${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: "#64748b",
          callback: function (value: any) {
            return "$" + value.toLocaleString();
          },
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    animation: {
      duration: 1000,
    },
  };

  useEffect(() => {
    // Animation when switching between month and year views
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [timeFrame, dailySales, monthlySales]);

  return (
    <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {timeFrame.period === "month" ? "Monthly" : "Yearly"} Sales
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {timeFrame.label}
        </span>
      </div>
      <div className="h-64">
        <Line
          ref={chartRef}
          data={{
            ...data,
            datasets: data.datasets.map((ds) => ({
              ...ds,
              borderColor: isDarkMode
                ? "#38bdf8" // Tailwind 'sky-400' or similar
                : "#2563eb", // Tailwind 'blue-600'
              backgroundColor: isDarkMode
                ? "rgba(56, 189, 248, 0.1)"
                : "rgba(37, 99, 235, 0.1)",
              pointBackgroundColor: isDarkMode ? "#38bdf8" : "#2563eb",
            })),
          }}
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              tooltip: {
                ...options.plugins.tooltip,
                backgroundColor: isDarkMode
                  ? "rgba(30, 41, 59, 0.95)"
                  : "rgba(255, 255, 255, 0.9)",
                titleColor: isDarkMode ? "#f1f5f9" : "#1e293b",
                bodyColor: isDarkMode ? "#cbd5e1" : "#334155",
                borderColor: isDarkMode
                  ? "rgba(51, 65, 85, 0.7)"
                  : "rgba(203, 213, 225, 0.5)",
              },
            },
            scales: {
              x: {
                ...options.scales.x,
                ticks: {
                  ...options.scales.x.ticks,
                  color: isDarkMode ? "#cbd5e1" : "#64748b",
                },
              },
              y: {
                ...options.scales.y,
                grid: {
                  ...options.scales.y.grid,
                  color: isDarkMode
                    ? "rgba(51, 65, 85, 0.5)"
                    : "rgba(203, 213, 225, 0.5)",
                },
                ticks: {
                  ...options.scales.y.ticks,
                  color: isDarkMode ? "#cbd5e1" : "#64748b",
                },
              },
            },
          }}
          className="animate-fade-in"
        />
      </div>
    </div>
  );
};

export default SalesChart;
