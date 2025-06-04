import React, { useEffect } from 'react';
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DailySales, MonthlySales } from '../../types';
import { useDashboard } from '../../context/DashboardContext';

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

const SalesChart: React.FC<SalesChartProps> = ({ dailySales = [], monthlySales = [] }) => {
  const { timeFrame } = useDashboard();
  const chartRef = React.useRef<ChartJS>(null);
  
  // Format data based on time frame
  const data = {
    labels: timeFrame.period === 'month' 
      ? dailySales.map(sale => sale.date)
      : monthlySales.map(sale => sale.month),
    datasets: [
      {
        label: 'Sales',
        data: timeFrame.period === 'month'
          ? dailySales.map(sale => sale.amount)
          : monthlySales.map(sale => sale.amount),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#334155',
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 14,
        },
        padding: 12,
        borderColor: 'rgba(203, 213, 225, 0.5)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(203, 213, 225, 0.5)',
        },
        ticks: {
          color: '#64748b',
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          }
        },
      },
    },
    interaction: {
      mode: 'index' as const,
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
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {timeFrame.period === 'month' ? 'Monthly' : 'Yearly'} Sales
        </h3>
        <span className="text-sm text-gray-500">
          {timeFrame.label}
        </span>
      </div>
      <div className="h-64">
        <Line
          ref={chartRef}
          data={data}
          options={options}
          className="animate-fade-in"
        />
      </div>
    </div>
  );
};

export default SalesChart;