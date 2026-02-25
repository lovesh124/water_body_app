import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { WaterQualityData, DateRange } from '../types';
import { getSamplingData } from '../services/api';
import { PARAMETER_LABELS, PARAMETER_UNITS, getStatusColor } from '../utils/waterQuality';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface HistoricalChartProps {
  stationIds: string[];
  onClose: () => void;
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ stationIds, onClose }) => {
  const [selectedParameter, setSelectedParameter] = useState('DO_mgl');
  const [dateRange, setDateRange] = useState<DateRange>('1yr');
  const [data, setData] = useState<WaterQualityData[]>([]);
  const [loading, setLoading] = useState(false);

  const parameters = ['DO_mgl', 'Chla_ugl', 'TN_mgl', 'TP_mgl'];

  useEffect(() => {
    loadData();
  }, [selectedParameter, dateRange, stationIds]);

  const loadData = async () => {
    if (stationIds.length === 0) return;
    
    setLoading(true);
    const endDate = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1yr':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '5yr':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case 'all':
        startDate.setFullYear(2000);
        break;
    }

    const samplingData = await getSamplingData(
      stationIds,
      selectedParameter,
      startDate.toISOString(),
      endDate.toISOString()
    );

    setData(samplingData);
    setLoading(false);
  };

  const chartData = {
    labels: data.map(d => new Date(d.dateTime).toLocaleDateString()),
    datasets: [
      {
        label: PARAMETER_LABELS[selectedParameter],
        data: data.map(d => d.value),
        borderColor: getStatusColor('good'),
        backgroundColor: getStatusColor('good') + '20',
        tension: 0.3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${PARAMETER_LABELS[selectedParameter]} Over Time`
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toFixed(2)} ${PARAMETER_UNITS[selectedParameter]}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: PARAMETER_UNITS[selectedParameter]
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-colors">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Historical Data</h2>
            <button
              onClick={onClose}
              className="text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-100 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Parameter Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Parameter
            </label>
            <div className="flex gap-2 flex-wrap">
              {parameters.map(param => (
                <button
                  key={param}
                  onClick={() => setSelectedParameter(param)}
                  className={`px-4 py-2 rounded ${
                    selectedParameter === param
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-zinc-900 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {PARAMETER_LABELS[param]}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              Date Range
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['30d', '90d', '1yr', '5yr', 'all'] as DateRange[]).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded ${
                    dateRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-zinc-900 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-zinc-800'
                  }`}
                >
                  {range === 'all' ? 'All' : range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="h-96 mb-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-slate-400">Loading data...</div>
              </div>
            ) : data.length > 0 ? (
              <Line data={chartData} options={options} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 dark:text-slate-400">No data available for this period</div>
              </div>
            )}
          </div>

          {/* Data Summary */}
          {data.length > 0 && (
            <div className="bg-gray-50 dark:bg-black border border-transparent dark:border-slate-800 p-4 rounded transition-colors">
              <p className="text-sm text-gray-600 dark:text-slate-300">
                <strong>Data Points:</strong> {data.length} |{' '}
                <strong>Average:</strong>{' '}
                {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(2)}{' '}
                {PARAMETER_UNITS[selectedParameter]}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart;
