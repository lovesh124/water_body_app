import React, { useEffect, useRef, useState } from 'react';
import { Waterbody, SamplingStation, WaterQualityData, WaterQualityGauge } from '../types';
import { getSamplingLocations, getSamplingData } from '../services/api';
import { PARAMETERS, PARAMETER_LABELS, PARAMETER_UNITS, evaluateWaterQuality } from '../utils/waterQuality';
import { exportToCSV } from '../utils/waterQuality';
import Gauge from './Gauge';
import HistoricalChart from './HistoricalChart';

interface SidebarProps {
  waterbody: Waterbody | null;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ waterbody, onClose }) => {
  const [stations, setStations] = useState<SamplingStation[]>([]);
  const [gauges, setGauges] = useState<WaterQualityGauge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChart, setShowChart] = useState(false);
  const activeRequestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any previous in-flight request chain before starting a new one.
    activeRequestControllerRef.current?.abort();

    if (waterbody) {
      console.log('Loading data for waterbody:', waterbody);
      setError(null); // Clear any previous errors
      const controller = new AbortController();
      activeRequestControllerRef.current = controller;
      loadWaterbodyData(controller.signal);
    } else {
      activeRequestControllerRef.current = null;
      // Reset state when no waterbody is selected
      setStations([]);
      setGauges([]);
      setLoading(false);
      setError(null);
    }

    return () => {
      activeRequestControllerRef.current?.abort();
    };
  }, [waterbody]);

  const getLatestGaugeFromData = (
    parameter: string,
    data: WaterQualityData[],
    fallback: WaterQualityGauge
  ): WaterQualityGauge => {
    if (data.length > 0) {
      console.log(`Processing ${parameter}: ${data.length} points, first item:`, data[0]);

      const latest = data
        .filter((d: any) => d.dateTime && d.value !== null && d.value !== undefined)
        .sort((a: any, b: any) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
        )[0];

      if (latest) {
        console.log(`Latest for ${parameter}: value=${latest.value}, date=${latest.dateTime}`);
        return {
          parameter,
          value: latest.value,
          unit: PARAMETER_UNITS[parameter],
          status: evaluateWaterQuality(parameter, latest.value),
          date: latest.dateTime
        } as WaterQualityGauge;
      }
    }

    console.log(`No data for ${parameter}`);
    return fallback;
  };

  const retryLoadWaterbodyData = () => {
    if (!waterbody) return;

    activeRequestControllerRef.current?.abort();
    const controller = new AbortController();
    activeRequestControllerRef.current = controller;
    setError(null);
    loadWaterbodyData(controller.signal);
  };

  const loadWaterbodyData = async (signal: AbortSignal) => {
    if (!waterbody || signal.aborted) return;

    setLoading(true);
    console.log('Fetching sampling stations for WBODYID:', waterbody.WBODYID);
    
    try {
      // Load sampling stations
      const samplingStations = await getSamplingLocations(waterbody.WBODYID, signal);
      if (signal.aborted) return;

      console.log('Sampling stations received:', samplingStations);
      console.log('Number of stations:', samplingStations.length);
      setStations(samplingStations);

      if (samplingStations.length > 0) {
        const stationIds = samplingStations.map(s => s.stationId);
        const parameters = [PARAMETERS.DO, PARAMETERS.CHLA, PARAMETERS.TN, PARAMETERS.TP];
        
        // Initialize gauges with loading state
        const initialGauges: WaterQualityGauge[] = parameters.map(param => ({
          parameter: param,
          value: null,
          unit: PARAMETER_UNITS[param],
          status: 'unknown' as const,
          date: null
        }));
        setGauges(initialGauges);
        setLoading(false); // Show the skeleton gauges
        
        // Fetch parameters sequentially and update each gauge as soon as data arrives.
        for (const [index, param] of parameters.entries()) {
          const data = await getSamplingData(stationIds, param, undefined, undefined, signal);
          if (signal.aborted) return;

          setGauges(prevGauges => {
            const nextGauges = [...prevGauges];
            nextGauges[index] = getLatestGaugeFromData(param, data, initialGauges[index]);
            return nextGauges;
          });
        }
      } else {
        console.log('No sampling stations found');
        setGauges([]);
        setLoading(false);
      }
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      console.error('Error loading waterbody data:', error);
      setError('Failed to load water quality data. The API may be unavailable or the request timed out.');
      setStations([]);
      setGauges([]);
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (gauges.length === 0) return;

    const exportData = gauges.map(g => ({
      Parameter: PARAMETER_LABELS[g.parameter],
      Value: g.value !== null ? g.value : 'N/A',
      Unit: g.unit,
      Status: g.status,
      Date: g.date ? new Date(g.date).toLocaleDateString() : 'N/A'
    }));

    exportToCSV(exportData, `${waterbody?.WATERBODYNAME}_water_quality.csv`);
  };

  return (
    <>
      <div className="w-full h-full bg-white dark:bg-black border-l border-gray-200 dark:border-slate-700 transition-colors">
        <div className="p-6 h-full overflow-y-auto">
          {/* No Waterbody Selected State */}
          {!waterbody && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4">
                <svg className="w-24 h-24 text-gray-300 dark:text-slate-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-2">
                Select a Waterbody
              </h3>
              <p className="text-gray-500 dark:text-slate-400 max-w-sm">
                Click on any waterbody on the map to view its water quality data and historical trends.
              </p>
            </div>
          )}

          {/* Waterbody Selected State */}
          {waterbody && (
            <>
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
                    {waterbody.WATERBODYNAME}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{waterbody.WBODYTYPE || 'Waterbody'}</p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-100 text-2xl ml-2 md:hidden"
                    title="Clear selection"
                  >
                    ×
                  </button>
                )}
              </div>

          {/* Waterbody Info */}
          <div className="bg-gray-50 dark:bg-black rounded-lg p-4 mb-6 border border-transparent dark:border-slate-800 transition-colors">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-slate-400">Size</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {waterbody.SURFAREA_ACRES != null ? `${waterbody.SURFAREA_ACRES.toFixed(1)} acres` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400">Stations</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{stations.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-slate-400">ID</p>
                <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{waterbody.WBODYID}</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 dark:text-slate-400 mt-2">Loading water quality data...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">Error Loading Data</h4>
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={retryLoadWaterbodyData}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Water Quality Gauges */}
          {!loading && stations.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-100 mb-4">
                Water Quality Status
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {gauges.map((gauge, index) => (
                  <Gauge key={index} gauge={gauge} />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => setShowChart(true)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  View Historical Data
                </button>
                
                <button
                  onClick={handleExport}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Export Data (CSV)
                </button>
              </div>

              {/* Legend */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-black rounded-lg border border-transparent dark:border-slate-800 transition-colors">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">Status Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-slate-700 dark:text-slate-300">Good - Meets quality standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-slate-700 dark:text-slate-300">Fair - Moderate concern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-slate-700 dark:text-slate-300">Poor - Below standards</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No Stations Message */}
          {!loading && stations.length === 0 && waterbody && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-slate-400">
                No sampling stations found for this waterbody.
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {/* Historical Chart Modal */}
      {showChart && waterbody && (
        <HistoricalChart
          stationIds={stations.map(s => s.stationId)}
          onClose={() => setShowChart(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
