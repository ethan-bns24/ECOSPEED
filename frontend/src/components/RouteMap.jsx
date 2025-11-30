import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to adjust map view to fit route bounds
function MapBounds({ coordinates }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      // Create bounds from all coordinates
      const bounds = L.latLngBounds(coordinates);
      // Fit map to bounds with padding
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

const RouteMap = ({ segments, currentSegmentIndex, startLocation, endLocation, routeCoordinates }) => {
  const mapRef = useRef(null);

  // Use route_coordinates if available (full route path), otherwise fallback to segments
  const polylineCoords = routeCoordinates && routeCoordinates.length > 0
    ? routeCoordinates
    : segments.length > 0
    ? (() => {
        const coords = [];
        // Add the start point of the first segment
        coords.push([segments[0].lat_start, segments[0].lon_start]);
        // Add the end point of each segment (which connects to the next segment)
        segments.forEach(segment => {
          coords.push([segment.lat_end, segment.lon_end]);
        });
        return coords;
      })()
    : [];

  // Start and end markers - use route coordinates if available
  const startMarker = routeCoordinates && routeCoordinates.length > 0
    ? routeCoordinates[0]
    : segments.length > 0
    ? [segments[0].lat_start, segments[0].lon_start]
    : null;
    
  const endMarker = routeCoordinates && routeCoordinates.length > 0
    ? routeCoordinates[routeCoordinates.length - 1]
    : segments.length > 0
    ? [segments[segments.length - 1].lat_end, segments[segments.length - 1].lon_end]
    : null;
  
  // Current position marker
  const currentMarker = segments.length > 0 && currentSegmentIndex >= 0 && currentSegmentIndex < segments.length
    ? [segments[currentSegmentIndex].lat_start, segments[currentSegmentIndex].lon_start]
    : null;

  // Default center (France)
  const defaultCenter = [46.6034, 1.8883];
  const center = startMarker || defaultCenter;

  // Custom icons
  const startIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#4ade80" stroke="#0a2e1a" stroke-width="2"/>
        <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="#0a2e1a">S</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const endIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
        <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">E</text>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const currentIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <MapContainer
      center={center}
      zoom={9}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Auto-adjust map bounds to fit route */}
      {polylineCoords.length > 0 && <MapBounds coordinates={polylineCoords} />}
      
      {/* Route polyline */}
      {polylineCoords.length > 0 && (
        <Polyline
          positions={polylineCoords}
          color="#4ade80"
          weight={4}
          opacity={0.7}
        />
      )}
      
      {/* Start marker */}
      {startMarker && (
        <Marker position={startMarker} icon={startIcon}>
          <Popup>
            <strong>Start:</strong> {startLocation || 'Start location'}
          </Popup>
        </Marker>
      )}
      
      {/* End marker */}
      {endMarker && (
        <Marker position={endMarker} icon={endIcon}>
          <Popup>
            <strong>End:</strong> {endLocation || 'End location'}
          </Popup>
        </Marker>
      )}
      
      {/* Current position marker */}
      {currentMarker && currentSegmentIndex > 0 && (
        <Marker position={currentMarker} icon={currentIcon}>
          <Popup>
            <strong>Current Position</strong><br />
            Segment {currentSegmentIndex + 1} of {segments.length}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default RouteMap;