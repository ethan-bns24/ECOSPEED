import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to adjust map view
function MapView({ center, zoom, stations }) {
  const map = useMap();
  
  useEffect(() => {
    try {
      if (center && Array.isArray(center) && center.length === 2 && 
          typeof center[0] === 'number' && typeof center[1] === 'number') {
        map.setView(center, zoom || 13);
      } else if (stations && Array.isArray(stations) && stations.length > 0) {
        // Fit bounds to show all stations
        const validCoords = stations
          .filter(s => 
            s && 
            typeof s.latitude === 'number' && 
            typeof s.longitude === 'number' &&
            !isNaN(s.latitude) && 
            !isNaN(s.longitude)
          )
          .map(s => [s.latitude, s.longitude]);
        
        if (validCoords.length > 0) {
          const bounds = L.latLngBounds(validCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
          }
        }
      }
    } catch (error) {
      console.error('Error adjusting map view:', error);
    }
  }, [center, zoom, stations, map]);
  
  return null;
}

// Custom icon for charging stations
const createStationIcon = (status) => {
  const color = status === 'Dispo' ? '#4ade80' : status === 'Occupée' ? '#f59e0b' : '#ef4444';
  return new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="12" y="17" font-size="12" font-weight="bold" text-anchor="middle" fill="white">⚡</text>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const StationsMap = ({ stations = [], selectedStation = null, onStationClick }) => {
  // Default center (France)
  const defaultCenter = [46.6034, 1.8883];
  const defaultZoom = 6;
  
  // Center on selected station or default
  const center = selectedStation && selectedStation.latitude && selectedStation.longitude
    ? [selectedStation.latitude, selectedStation.longitude]
    : defaultCenter;
  const zoom = selectedStation ? 13 : defaultZoom;

  // Filtrer les stations valides avec coordonnées
  const validStations = (stations || []).filter(s => 
    s && 
    typeof s.latitude === 'number' && 
    typeof s.longitude === 'number' &&
    !isNaN(s.latitude) && 
    !isNaN(s.longitude)
  );

  // Afficher toutes les bornes sur la carte, mais limiter à 500 pour éviter les problèmes de performance
  const stationsToDisplay = validStations.slice(0, 500);

  // Gestion d'erreur si la carte ne peut pas se charger
  try {
    return (
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 0 }}
        scrollWheelZoom={true}
        key="stations-map"
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapView center={center} zoom={zoom} stations={stationsToDisplay} />
      
      {/* Charging station markers */}
      {stationsToDisplay.length > 0 && stationsToDisplay
        .map((station, index) => {
          // Vérifier que les coordonnées sont valides
          if (!station.latitude || !station.longitude || 
              isNaN(station.latitude) || isNaN(station.longitude)) {
            return null;
          }
          
          const icon = createStationIcon(station.status || 'Dispo');
          
          // Nettoyer les chaînes pour éviter les caractères invalides
          const cleanName = String(station.name || 'Borne de recharge').replace(/[^\w\s\-.,()]/g, '');
          const cleanOperator = String(station.operator || 'Opérateur inconnu').replace(/[^\w\s\-.,()]/g, '');
          const cleanAddress = station.address ? String(station.address).replace(/[^\w\s\-.,()]/g, '') : '';
          
          return (
            <Marker
              key={`${station.latitude}-${station.longitude}-${index}`}
              position={[Number(station.latitude), Number(station.longitude)]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onStationClick) {
                    onStationClick(station);
                  }
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px' }}>
                  <strong>{cleanName}</strong>
                  <br />
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {cleanOperator}
                  </span>
                  <br />
                  <span style={{ fontSize: '12px' }}>
                    {station.powerKw || 0} kW
                  </span>
                  {cleanAddress && (
                    <>
                      <br />
                      <span style={{ fontSize: '11px', color: '#888' }}>
                        {cleanAddress}
                      </span>
                    </>
                  )}
                  {station.price && (
                    <>
                      <br />
                      <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 'bold' }}>
                        {String(station.price)}
                      </span>
                    </>
                  )}
                  <br />
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: station.status === 'Dispo' ? '#4ade80' : station.status === 'Occupée' ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    {station.status || 'Dispo'}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })
        .filter(Boolean) // Filtrer les null
      }
      </MapContainer>
    );
  } catch (error) {
    console.error('Error rendering StationsMap:', error);
    return (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Erreur lors du chargement de la carte</p>
          <p style={{ color: '#999', fontSize: '12px' }}>{error.message}</p>
        </div>
      </div>
    );
  }
};

export default StationsMap;

