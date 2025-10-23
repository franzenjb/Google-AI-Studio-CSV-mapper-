import React, { useEffect, useRef } from 'react';
import { MapMarker, Theme } from '../types';
import { getColorFromString } from '../utils/csvUtils';

declare var L: any;

interface MapDisplayProps {
  markers: MapMarker[];
  iconCategoryField: string;
  theme: Theme;
}

const createPopupContent = (data: { [key: string]: string }): string => {
  let content = '<div class="w-48 space-y-1">';
  for (const key in data) {
    content += `<div class="flex justify-between border-b border-gray-200 dark:border-gray-600 last:border-b-0 py-1">
                  <strong class="text-xs text-gray-600 dark:text-gray-300 font-semibold mr-2">${key}:</strong>
                  <span class="text-xs text-gray-800 dark:text-gray-100 truncate">${data[key]}</span>
                </div>`;
  }
  content += '</div>';
  return content;
};


const MapDisplay: React.FC<MapDisplayProps> = ({ markers, iconCategoryField, theme }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerLayerRef = useRef<any | null>(null);
  const tileLayerRef = useRef<any | null>(null);

  const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const lightAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const darkAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [20, 0], // Default center
        zoom: 2,
      });
      markerLayerRef.current = L.layerGroup().addTo(mapInstanceRef.current);
    }
  }, []);

  // Update tile layer based on theme
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const tileUrl = theme === 'dark' ? darkTileUrl : lightTileUrl;
    const attribution = theme === 'dark' ? darkAttribution : lightAttribution;

    if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
        // Leaflet doesn't have a setAttribution method, so we update it via options.
        if (mapInstanceRef.current.attributionControl) {
            mapInstanceRef.current.attributionControl.setPrefix(attribution);
        }
    } else {
        tileLayerRef.current = L.tileLayer(tileUrl, { attribution }).addTo(mapInstanceRef.current);
    }
  }, [theme]);


  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();

    markers.forEach((markerData) => {
      let icon;
      if (iconCategoryField && markerData.data[iconCategoryField]) {
          const categoryValue = markerData.data[iconCategoryField];
          const color = getColorFromString(categoryValue);
          icon = L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color:${color};" class="w-5 h-5 rounded-full border-2 border-white shadow-md"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
          });
      } else {
        // Default icon
        icon = new L.Icon.Default();
        icon.options.iconSize = [26, 44];
        icon.options.iconAnchor = [13, 44];
      }


      const marker = L.marker([markerData.lat, markerData.lng], { icon });
      marker.bindPopup(createPopupContent(markerData.data));
      markerLayerRef.current.addLayer(marker);
    });

    if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
        mapInstanceRef.current.setView([20,0], 2);
    }
  }, [markers, iconCategoryField]);

  return <div ref={mapRef} className="w-full h-full" />;
};

export default MapDisplay;