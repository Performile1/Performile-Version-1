import React, { useEffect, useRef } from 'react';
import { Box, Typography, Alert } from '@mui/material';

interface ProximityMapProps {
  latitude?: number;
  longitude?: number;
  radius?: number; // in kilometers
  markers?: Array<{
    lat: number;
    lng: number;
    label: string;
    color?: string;
  }>;
  height?: number | string;
  zoom?: number;
}

export const ProximityMap: React.FC<ProximityMapProps> = ({
  latitude,
  longitude,
  radius = 50,
  markers = [],
  height = 400,
  zoom = 10,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Check if Leaflet is available
    if (typeof window === 'undefined' || !(window as any).L) {
      return;
    }

    const L = (window as any).L;

    // Initialize map only once
    if (!mapInstanceRef.current && mapRef.current && latitude && longitude) {
      // Create map
      const map = L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    // Update map view if coordinates change
    if (mapInstanceRef.current && latitude && longitude) {
      mapInstanceRef.current.setView([latitude, longitude], zoom);

      // Clear existing layers (except tile layer)
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      // Add center marker
      const centerMarker = L.marker([latitude, longitude], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: '<div style="background-color: #1976d2; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(mapInstanceRef.current);

      centerMarker.bindPopup('Your Location');

      // Add radius circle
      if (radius > 0) {
        L.circle([latitude, longitude], {
          radius: radius * 1000, // Convert km to meters
          color: '#1976d2',
          fillColor: '#1976d2',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(mapInstanceRef.current);
      }

      // Add additional markers
      markers.forEach((marker) => {
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="background-color: ${marker.color || '#f44336'}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const markerInstance = L.marker([marker.lat, marker.lng], {
          icon: markerIcon,
        }).addTo(mapInstanceRef.current);

        markerInstance.bindPopup(marker.label);
      });
    }

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, radius, markers, zoom]);

  // If no coordinates provided
  if (!latitude || !longitude) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 1,
        }}
      >
        <Box sx={{ textAlign: 'center', p: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            📍 No location set
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter an address and click "Get Coordinates" to see the map
          </Typography>
        </Box>
      </Box>
    );
  }

  // Check if Leaflet is loaded
  if (typeof window !== 'undefined' && !(window as any).L) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Map library not loaded. Please refresh the page.
      </Alert>
    );
  }

  return (
    <Box
      ref={mapRef}
      sx={{
        height,
        width: '100%',
        borderRadius: 1,
        overflow: 'hidden',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
        },
      }}
    />
  );
};

export default ProximityMap;
