import React from 'react';
import { WaterQualityGauge } from '../types';
import { PARAMETER_LABELS, getStatusColor } from '../utils/waterQuality';

interface GaugeProps {
  gauge: WaterQualityGauge;
}

const Gauge: React.FC<GaugeProps> = ({ gauge }) => {
  const color = getStatusColor(gauge.status);
  const percentage = gauge.value !== null ? Math.min((gauge.value / getMaxValue(gauge.parameter)) * 100, 100) : 0;
  const isLoading = gauge.value === null;

  return (
    <div className="bg-white dark:bg-black rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700 transition-colors">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
        {PARAMETER_LABELS[gauge.parameter] || gauge.parameter}
      </h3>
      
      <div className="relative w-32 h-32 mx-auto">
        <svg className="transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          
          {/* Progress circle or loading animation */}
          {isLoading ? (
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="10"
              strokeDasharray="20 10"
              strokeLinecap="round"
              className="animate-spin"
              style={{ transformOrigin: 'center' }}
            />
          ) : (
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isLoading ? (
            <>
              <div className="w-12 h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
              <div className="w-8 h-3 bg-gray-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </>
          ) : (
            <>
              <span className="text-2xl font-bold" style={{ color }}>
                {gauge.value !== null ? gauge.value.toFixed(2) : '--'}
              </span>
              <span className="text-xs text-gray-500 dark:text-slate-400">{gauge.unit}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-center">
        {isLoading ? (
          <div className="w-20 h-6 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mx-auto"></div>
        ) : (
          <>
            <span 
              className="inline-block px-2 py-1 rounded text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {gauge.status.toUpperCase()}
            </span>
            {gauge.date && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {new Date(gauge.date).toLocaleDateString()}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const getMaxValue = (parameter: string): number => {
  switch (parameter) {
    case 'DO_mgl': return 15;
    case 'Chla_ugl': return 50;
    case 'TN_mgl': return 2;
    case 'TP_mgl': return 0.2;
    case 'pH': return 14;
    case 'Secchi_ft': return 12;
    case 'TempW_C': return 40;
    case 'DO_percent': return 150;
    default: return 100;
  }
};

export default Gauge;
