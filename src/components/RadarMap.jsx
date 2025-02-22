import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const RadarMap = ({ coordinates }) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    // Determine the center of the map: use provided coordinates if available, otherwise default to Boston
    const center = (coordinates && coordinates.lat && coordinates.lng)
      ? [coordinates.lng, coordinates.lat]
      : [-71.0589, 42.3601];

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 12,
    });

    // Optionally, set maximum bounds for the map
    const bounds = [
      [-123.069003, 45.395273],
      [-122.303707, 45.612333]
    ];
    map.setMaxBounds(bounds);

    return () => map.remove();
  }, [coordinates]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
};

export default RadarMap;
