import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import * as esri from 'esri-leaflet';
import { Waterbody } from '../types';

interface MapComponentProps {
  onWaterbodySelect: (waterbody: Waterbody) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onWaterbodySelect }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<any>(null);

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
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add ArcGIS waterbody layer
    const waterbodyLayer = (esri as any).featureLayer({
      url: 'https://gis.waterinstitute.usf.edu/arcgis/rest/services/Maps/WaterAtlas_FrontPage/MapServer/14',
      style: function () {
        return {
          fillColor: '#0ea5e9',
          fillOpacity: 0.3,
          color: '#0284c7',
          weight: 2
        };
      }
    });

    layerRef.current = waterbodyLayer;

    // Handle waterbody click
    waterbodyLayer.on('click', function (e: any) {
      const props = e.layer.feature.properties;
      const waterbody: Waterbody = {
        WBODYID: props.WBODYID,
        WATERBODYNAME: props.WATERBODYNAME,
        WBODYTYPE: props.WBODYTYPE,
        SURFAREA_ACRES: props.SURFAREA_ACRES,
        geometry: e.layer.feature.geometry
      };

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
  }, [onWaterbodySelect]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

export default MapComponent;
