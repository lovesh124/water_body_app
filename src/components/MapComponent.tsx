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
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<any>(null);

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
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [27.9, -82.5],
      zoom: 7,
      zoomControl: true
    });

    mapRef.current = map;

    // Add base layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap contributors'
    }).addTo(map);

    // Add ArcGIS waterbody layer with optional county filter
    // The service uses ATLAS_<COUNTY> fields with 'Y' values
    const waterbodyLayer = (esri as any).featureLayer({
      url: 'https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14',
      style: function () {
        return {
          fillColor: '#0ea5e9',
          fillOpacity: 0.3,
          color: '#0284c7',
          weight: 2
        };
      },
      ...(county ? { where: `ATLAS_${county.toUpperCase()} = 'Y'` } : {})
    });

    layerRef.current = waterbodyLayer;

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

      // Zoom to waterbody bounds
      if (e.layer.getBounds) {
        map.fitBounds(e.layer.getBounds());
      }

      onWaterbodySelect(waterbody);
    });

    // Handle hover effect
    waterbodyLayer.on('mouseover', function (e: any) {
      e.layer.setStyle({
        fillOpacity: 0.6
      });
    });

    waterbodyLayer.on('mouseout', function (e: any) {
      e.layer.setStyle({
        fillOpacity: 0.3
      });
    });

    waterbodyLayer.addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onWaterbodySelect, county]);

  return (
    <div className="relative w-full h-full">
      {/* County Dropdown Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <label htmlFor="county-select" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by County:
        </label>
        <select
          id="county-select"
          value={county || ''}
          onChange={(e) => onCountyChange?.(e.target.value)}
          className="block w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
