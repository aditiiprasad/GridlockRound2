import React, { useEffect, useRef, useState } from 'react';

const MapplsMap = ({ center, diversionRoute }) => {
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  const markerInstance = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map once
  useEffect(() => {
    if (!window.mappls || mapInstance.current) {
      return;
    }

    try {
      mapInstance.current = new window.mappls.Map("mappls-map-container", {
        center: [center.lat, center.lng],
        zoom: 15,
      });

      mapInstance.current.addListener('load', () => {
        setMapLoaded(true);
      });
    } catch (e) {
      console.error("Map Init Error:", e);
    }
  }, []); // Run only once on mount

  // Update center and draw markers/polylines when props change or map loads
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;

    try {
      if (typeof mapInstance.current.setCenter === 'function') {
        mapInstance.current.setCenter([center.lat, center.lng]);
      }

      // Add Marker
      if (markerInstance.current) {
        markerInstance.current.remove();
      }
      markerInstance.current = new window.mappls.Marker({
        map: mapInstance.current,
        position: { lat: center.lat, lng: center.lng },
        popupHtml: "<div style='padding:5px;font-weight:bold;'>Incident Location</div>",
        popupOptions: { openPopup: true }
      });

      // Add Polyline
      if (polylineInstance.current) {
        polylineInstance.current.remove();
      }
      
      if (diversionRoute && diversionRoute.length > 0) {
        const path = diversionRoute.map(coord => ({ lat: coord.lat, lng: coord.lng }));
        
        polylineInstance.current = new window.mappls.Polyline({
          map: mapInstance.current,
          path: path,
          strokeColor: "#2563eb",
          strokeOpacity: 0.8,
          strokeWeight: 6,
          fitbounds: true
        });
      }
    } catch (e) {
      console.error("Map Update Error:", e);
    }
  }, [center, diversionRoute, mapLoaded]);

  return <div id="mappls-map-container" style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '12px' }}></div>;
};

export default MapplsMap;
