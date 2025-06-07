import React, { useEffect, useState } from "react";
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
import { useDashboard } from "../../context/DashboardContext";
import { useTheme } from "../../context/ThemeContext";

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

const SalesChart: React.FC<SalesChartProps> = ({ sales = [] }) => {
  const { timeFrame } = useDashboard();
  const { isDarkMode } = useTheme();
  const [showAccumulated, setShowAccumulated] = useState(true);
  const chartRef = React.useRef<ChartJS<
    "line" | "bar",
    number[],
    string
  > | null>(null);

  // Accumulate sales if toggle is on and period is "month" or "year"
  let displaySales = sales;
  if (
    (timeFrame.period === "month" || timeFrame.period === "year") &&
    showAccumulated
  ) {
    let runningTotal = 0;
    displaySales = sales.map((sale) => {
      runningTotal += sale.salesAmount;
      return { ...sale, salesAmount: runningTotal };
    });
  }

  // Prepare data based on time frame
  let data, ChartComponent;
  if (timeFrame.period === "day") {
    ChartComponent = Bar;
    data = {
      labels: displaySales.map((sale) => sale.date),
      datasets: [
        {
          label: "Sales",
          data: displaySales.map((sale) => sale.salesAmount),
          backgroundColor: isDarkMode ? "#38bdf8" : "#2563eb",
        },
        {
          label: "Accessory Sales",
          data: displaySales.map((sale) => sale.accessorySales ?? 0),
          backgroundColor: isDarkMode ? "#fbbf24" : "#f59e42",
        },
        {
          label: "Home Connects",
          data: displaySales.map((sale) => sale.homeConnects ?? 0),
          backgroundColor: isDarkMode ? "#34d399" : "#059669",
        },
      ],
    };
  } else {
    ChartComponent = Line;
    data = {
      labels: displaySales.map((sale) => sale.date),
      datasets: [
        {
          label: showAccumulated ? "Accumulated Sales" : "Sales",
          data: displaySales.map((sale) => sale.salesAmount),
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
      legend: {
        display: true,
      },
      tooltip: {
        backgroundColor: isDarkMode
          ? "rgba(30, 41, 59, 0.95)"
          : "rgba(255, 255, 255, 0.9)",
        titleColor: isDarkMode ? "#f1f5f9" : "#1e293b",
        bodyColor: isDarkMode ? "#cbd5e1" : "#334155",
        titleFont: {
          size: 14,
          weight: "bold" as const,
        },
        bodyFont: {
          size: 14,
        },
        padding: 12,
        borderColor: isDarkMode
          ? "rgba(51, 65, 85, 0.7)"
          : "rgba(203, 213, 225, 0.5)",
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            return `${
              context.dataset.label
            }: ${context.parsed.y.toLocaleString()}`;
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
          color: isDarkMode ? "#cbd5e1" : "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDarkMode
            ? "rgba(51, 65, 85, 0.5)"
            : "rgba(203, 213, 225, 0.5)",
        },
        ticks: {
          color: isDarkMode ? "#cbd5e1" : "#64748b",
          callback: function (value: any) {
            return value.toLocaleString();
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
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [timeFrame, sales]);

  return (
    <div className="rounded-lg shadow-md p-4 bg-white dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {timeFrame.label} Sales
        </h3>
        {(timeFrame.period === "month" || timeFrame.period === "year") && (
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showAccumulated}
              onChange={() => setShowAccumulated((v) => !v)}
              className="form-checkbox"
            />
            <span>Accumulated</span>
          </label>
        )}
      </div>
      <div className="h-64">
        <ChartComponent
          ref={chartRef as any}
          data={data}
          options={options}
          className="animate-fade-in"
        />
      </div>
    </div>
  );
};

export default SalesChart;
