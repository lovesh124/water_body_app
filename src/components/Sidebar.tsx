import React, { useEffect, useState } from 'react';
import { Waterbody, SamplingStation, WaterQualityGauge } from '../types';
import { getSamplingLocations, getLatestSamplingData } from '../services/api';
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
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    if (waterbody) {
      console.log('Loading data for waterbody:', waterbody);
      loadWaterbodyData();
    } else {
      // Reset state when no waterbody is selected
      setStations([]);
      setGauges([]);
      setLoading(false);
    }
  }, [waterbody]);

  const loadWaterbodyData = async () => {
    if (!waterbody) return;

    setLoading(true);
    console.log('Fetching sampling stations for WBODYID:', waterbody.WBODYID);
    
    // Load sampling stations
    const samplingStations = await getSamplingLocations(waterbody.WBODYID);
    console.log('Sampling stations received:', samplingStations);
    setStations(samplingStations);

    if (samplingStations.length > 0) {
      // Load latest water quality data
      const stationIds = samplingStations.map(s => s.stationId);
      const parameters = [PARAMETERS.DO, PARAMETERS.CHLA, PARAMETERS.TN, PARAMETERS.TP];
      
      const latestData = await getLatestSamplingData(stationIds, parameters);
      
      const newGauges: WaterQualityGauge[] = parameters.map(param => {
        const data = latestData.get(param);
        
        if (data) {
          return {
            parameter: param,
            value: data.value,
            unit: PARAMETER_UNITS[param],
            status: evaluateWaterQuality(param, data.value),
            date: data.dateTime
          };
        }
        
        return {
          parameter: param,
          value: null,
          unit: PARAMETER_UNITS[param],
          status: 'unknown',
          date: null
        };
      });
      
      setGauges(newGauges);
    } else {
      setGauges([]);
    }

    setLoading(false);
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
      <div className="w-full h-full bg-white border-l border-gray-200">
        <div className="p-6 h-full overflow-y-auto">
          {/* No Waterbody Selected State */}
          {!waterbody && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="mb-4">
                <svg className="w-24 h-24 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Select a Waterbody
              </h3>
              <p className="text-gray-500 max-w-sm">
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
                  <h2 className="text-2xl font-bold text-gray-800">
                    {waterbody.WATERBODYNAME}
                  </h2>
                  <p className="text-sm text-gray-500">{waterbody.WBODYTYPE}</p>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-2xl ml-2 md:hidden"
                    title="Clear selection"
                  >
                    ×
                  </button>
                )}
              </div>

          {/* Waterbody Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Size</p>
                <p className="font-semibold">
                  {waterbody.SURFAREA_ACRES.toFixed(1)} acres
                </p>
              </div>
              <div>
                <p className="text-gray-500">Stations</p>
                <p className="font-semibold">{stations.length}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">ID</p>
                <p className="font-semibold text-xs">{waterbody.WBODYID}</p>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-gray-500 mt-2">Loading water quality data...</p>
            </div>
          )}

          {/* Water Quality Gauges */}
          {!loading && stations.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
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
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Good - Meets quality standards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Fair - Moderate concern</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Poor - Below standards</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* No Stations Message */}
          {!loading && stations.length === 0 && waterbody && (
            <div className="text-center py-8">
              <p className="text-gray-500">
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
