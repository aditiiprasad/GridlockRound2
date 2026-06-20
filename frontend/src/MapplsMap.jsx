import React, { useEffect, useRef } from 'react';

const MapplsMap = ({ center, diversionRoute }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polylineInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    // Check if mappls is loaded
    if (!window.mappls) {
      console.error('Mappls script not loaded. Check index.html API key.');
      return;
    }

    if (!mapInstance.current) {
      // Initialize Map
      mapInstance.current = new window.mappls.Map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 15,
      });
    } else {
      // Update center smoothly
      mapInstance.current.setCenter([center.lat, center.lng]);
    }

    // Delay to ensure map is ready for drawing
    setTimeout(() => {
      // Add Marker for the incident
      if (markerInstance.current) {
        markerInstance.current.remove();
      }
      markerInstance.current = new window.mappls.Marker({
        map: mapInstance.current,
        position: { lat: center.lat, lng: center.lng },
        popupHtml: "<div style='padding:5px;font-weight:bold;'>Incident Location</div>",
        popupOptions: { openPopup: true }
      });

      // Add Polyline if diversion route exists
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
    }, 500);

    return () => {
      // We keep the map instance alive for React re-renders, 
      // but if unmounted entirely, we could clean it up.
    };
  }, [center, diversionRoute]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '300px', borderRadius: '12px' }}></div>;
};

export default MapplsMap;
