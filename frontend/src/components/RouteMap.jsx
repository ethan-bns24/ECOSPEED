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

// Component to follow current position during navigation
function FollowPosition({ position, zoomLevel = 16 }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && Array.isArray(position) && position.length === 2) {
      const [lat, lon] = position;
      if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon)) {
        // Vue centrée sur la voiture avec un zoom élevé pour la conduite
        const targetZoom = Math.max(14, zoomLevel);
        map.setView([lat, lon], targetZoom, { animate: true, duration: 0.5 });
      }
    }
  }, [position, map]);
  
  return null;
}

const RouteMap = ({ segments, currentSegmentIndex, startLocation, endLocation, routeCoordinates, chargingStations = [], currentPosition = null, isNavigating = false }) => {
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
  
  // Current position marker - utiliser currentPosition si fourni (navigation temps réel), sinon utiliser le segment
  const currentMarker = currentPosition 
    ? currentPosition
    : segments.length > 0 && currentSegmentIndex >= 0 && currentSegmentIndex < segments.length
    ? [segments[currentSegmentIndex].lat_start, segments[currentSegmentIndex].lon_start]
    : null;

  // Default center (France)
  const defaultCenter = [46.6034, 1.8883];
  const center = currentPosition || startMarker || defaultCenter;

  // Custom icons - utiliser encodeURIComponent au lieu de btoa pour éviter les problèmes avec les caractères spéciaux
  const startIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#4ade80" stroke="#0a2e1a" stroke-width="2"/>
    <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="#0a2e1a">S</text>
  </svg>`;
  const startIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(startIconSvg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const endIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
    <text x="16" y="22" font-size="18" font-weight="bold" text-anchor="middle" fill="white">E</text>
  </svg>`;
  const endIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(endIconSvg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  const currentIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="white" stroke-width="2"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>`;
  const currentIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(currentIconSvg),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  const chargingIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#f59e0b" stroke="white" stroke-width="2"/>
    <text x="14" y="19" font-size="16" font-weight="bold" text-anchor="middle" fill="white">+</text>
  </svg>`;
  const chargingIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(chargingIconSvg),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <MapContainer
      center={center}
      zoom={isNavigating ? 15 : 9}
      style={{ height: '100%', width: '100%', borderRadius: '8px' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Auto-adjust map bounds à l'affichage carte standard uniquement */}
      {polylineCoords.length > 0 && !currentPosition && !isNavigating && <MapBounds coordinates={polylineCoords} />}
      
      {/* Suivre la position en temps réel pendant la navigation */}
      {currentPosition && <FollowPosition position={currentPosition} zoomLevel={isNavigating ? 16 : 12} />}
      
      {/* Route polyline */}
      {polylineCoords.length > 0 && (
        <Polyline
          positions={polylineCoords}
          color="#4ade80"
          weight={4}
          opacity={0.7}
        />
      )}
      
      {/* Start marker - on le masque pendant la navigation pour alléger la vue */}
      {startMarker && !isNavigating && (
        <Marker position={startMarker} icon={startIcon}>
          <Popup>
            <strong>Start:</strong> {startLocation || 'Start location'}
          </Popup>
        </Marker>
      )}
      
      {/* End marker - visible en navigation pour voir la destination */}
      {endMarker && (
        <Marker position={endMarker} icon={endIcon}>
          <Popup>
            <strong>End:</strong> {endLocation || 'End location'}
          </Popup>
        </Marker>
      )}
      
      {/* Current position marker - afficher si navigation active ou si on a dépassé le premier segment */}
      {currentMarker && (currentPosition || currentSegmentIndex > 0) && (
        <Marker position={currentMarker} icon={currentIcon}>
          <Popup>
            <strong>Current Position</strong><br />
            Segment {currentSegmentIndex + 1} of {segments.length}
          </Popup>
        </Marker>
      )}
      
      {/* Charging station markers */}
      {chargingStations && chargingStations.length > 0 && chargingStations.map((chargingPoint, index) => {
        if (!chargingPoint.station || !chargingPoint.station.latitude || !chargingPoint.station.longitude) {
          return null;
        }
        
        return (
          <Marker
            key={`charging-${index}`}
            position={[chargingPoint.station.latitude, chargingPoint.station.longitude]}
            icon={chargingIcon}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <strong>{chargingPoint.station.name || 'Borne de recharge'}</strong>
                <br />
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {chargingPoint.station.operator || 'Opérateur inconnu'}
                </span>
                <br />
                <span style={{ fontSize: '12px' }}>
                  {chargingPoint.station.powerKw || 0} kW
                </span>
                {chargingPoint.station.address && (
                  <>
                    <br />
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {chargingPoint.station.address}
                    </span>
                  </>
                )}
                {chargingPoint.station.price && (
                  <>
                    <br />
                    <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 'bold' }}>
                      {chargingPoint.station.price}
                    </span>
                  </>
                )}
                {chargingPoint.distanceKm && (
                  <>
                    <br />
                    <span style={{ fontSize: '11px', color: '#666' }}>
                      Distance: {chargingPoint.distanceKm.toFixed(1)} km
                    </span>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;