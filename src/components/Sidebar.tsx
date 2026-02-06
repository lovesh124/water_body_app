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

  if (!waterbody) {
    return null;
  }

  return (
    <>
      <div className="absolute top-0 right-0 w-full md:w-96 h-full bg-white shadow-lg z-10 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {waterbody.WATERBODYNAME}
              </h2>
              <p className="text-sm text-gray-500">{waterbody.WBODYTYPE}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
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
          {!loading && stations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No sampling stations found for this waterbody.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Chart Modal */}
      {showChart && (
        <HistoricalChart
          stationIds={stations.map(s => s.stationId)}
          onClose={() => setShowChart(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
