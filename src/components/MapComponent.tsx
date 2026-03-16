import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as esri from 'esri-leaflet';
import { Waterbody } from '../types';

interface MapComponentProps {
  onWaterbodySelect: (waterbody: Waterbody) => void;
  county?: string; // Optional county filter
  onCountyChange?: (county: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onWaterbodySelect, county, onCountyChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Counties available in the Water Atlas service
  // These are based on the ATLAS_<COUNTY> fields in the service
  const floridaCounties = [
    'Hillsborough',
    'Pinellas',
    'Manatee',
    'Sarasota',
    'Polk',
    'Seminole',
    'Lake',
    'Orange'
  ];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map with faster scroll wheel zooming
    const map = L.map(mapContainerRef.current, {
      wheelPxPerZoomLevel: 40, // Default is 60. Lower = faster scroll zooming
      zoomDelta: 1,
      zoomSnap: 1,
    }).setView([27.9, -82.5], 7);

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap contributors'
    }).addTo(map);

    // Add ArcGIS waterbody layer
    const whereClause = county ? `ATLAS_${county.toUpperCase()} = 'Y'` : "1=1";
    
    const waterbodyLayer = (esri as any).featureLayer({
      url: 'https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14',
      where: whereClause,
      style: function () {
        return {
          fillColor: '#0ea5e9',
          fillOpacity: 0.3,
          color: '#0284c7',
          weight: 2
        };
      }
    }).addTo(map);

    // Handle waterbody click
    waterbodyLayer.on('click', function (e: any) {
      console.log('Waterbody clicked:', e.layer.feature.properties);
      const props = e.layer.feature.properties;
      const waterbody: Waterbody = {
        WBODYID: props.WBODYID,
        WATERBODYNAME: props.WATERBODYNAME,
        WBODYTYPE: props.WBODYTYPE,
        SURFAREA_ACRES: props.SURFAREA_ACRES,
        geometry: e.layer.feature.geometry
      };

      console.log('Passing waterbody to sidebar:', waterbody);

      // Zoom to waterbody bounds with a faster animation
      if (e.layer.getBounds) {
        map.fitBounds(e.layer.getBounds(), {
          animate: true,
          duration: 0.35 // Default is 0.5 to 1.0s. Lower is faster.
        });
      }
      
      // Close tooltip so it doesn't get stuck after zoom
      if (e.layer.closeTooltip) {
        e.layer.closeTooltip();
      }

      onWaterbodySelect(waterbody);
    });

    // Handle hover effect
    waterbodyLayer.on('mouseover', function (e: any) {
      const props = e.layer.feature?.properties || {};
      const tooltipContent = [
        `<strong>${props.WATERBODYNAME || 'Unknown Waterbody'}</strong>`,
        props.WBODYTYPE ? `Type: ${props.WBODYTYPE}` : null,
        props.WBODYID ? `ID: ${props.WBODYID}` : null
      ].filter(Boolean).join('<br/>');

      e.layer.bindTooltip(tooltipContent, {
        direction: 'top',
        sticky: true,
        opacity: 0.95
      }).openTooltip();

      e.layer.setStyle({
        fillOpacity: 0.6
      });
    });

    waterbodyLayer.on('mouseout', function (e: any) {
      e.layer.setStyle({
        fillOpacity: 0.3
      });
      e.layer.closeTooltip();
    });

    return () => {
      map.remove();
    };
  }, [county, onWaterbodySelect]);

  return (
    <div className="relative w-full h-full">
      {/* County Dropdown Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white dark:bg-black border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 transition-colors">
        <label htmlFor="county-select" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
          Filter by County:
        </label>
        <select
          id="county-select"
          value={county || ''}
          onChange={(e) => onCountyChange?.(e.target.value)}
          className="block w-64 px-3 py-2 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900 dark:text-slate-100"
        >
          <option value="">All Counties</option>
          {floridaCounties.map((countyName) => (
            <option key={countyName} value={countyName}>
              {countyName} County
            </option>
          ))}
        </select>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default MapComponent;
// To filter by map extent instead, listen to map move events and call waterbodyLayer.setWhere with a spatial filter.
