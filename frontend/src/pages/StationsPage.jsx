import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StationsMap from '../components/StationsMap';
import { getAppSettings } from '../lib/settingsStorage';
import axios from 'axios';

// Use environment variable or fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const StationsPage = () => {
  const [theme, setTheme] = useState('dark');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStation, setSelectedStation] = useState(null);
  const stationsPerPage = 20;

  useEffect(() => {
    const { theme: thm } = getAppSettings();
    setTheme(thm);
    
    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.theme) setTheme(detail.theme);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('ecospeed-settings-updated', handler);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ecospeed-settings-updated', handler);
      }
    };
  }, []);

  useEffect(() => {
    // Récupérer toutes les bornes de recharge de France depuis l'API
    const fetchStations = async () => {
      setLoading(true);
      try {
        // Ne pas passer de paramètres pour récupérer toutes les bornes de France
        const response = await axios.get(`${API}/charging-stations`, {
          timeout: 60000, // 60 secondes car le fichier peut être volumineux
        });
        setStations(response.data || []);
      } catch (error) {
        console.error('Error fetching charging stations:', error);
        // En cas d'erreur, on garde les bornes de démo avec coordonnées
        setStations([
          {
            name: 'Supercharger Paris-La Défense',
            operator: 'Tesla',
            powerKw: 250,
            price: '0.40€/kWh',
            status: 'Dispo',
            latitude: 48.8925,
            longitude: 2.2383,
            address: 'Paris-La Défense',
          },
          {
            name: 'Ionity Autoroute A6',
            operator: 'Ionity',
            powerKw: 350,
            price: '0.79€/kWh',
            status: 'Dispo',
            latitude: 48.8566,
            longitude: 2.3522,
            address: 'Autoroute A6',
          },
          {
            name: 'Total Energies Champs-Élysées',
            operator: 'Total',
            powerKw: 175,
            price: '0.45€/kWh',
            status: 'Dispo',
            latitude: 48.8698,
            longitude: 2.3081,
            address: 'Champs-Élysées, Paris',
          },
          {
            name: 'Electra Parking Opéra',
            operator: 'Electra',
            powerKw: 150,
            price: '0.44€/kWh',
            status: 'Occupée',
            latitude: 48.8706,
            longitude: 2.3317,
            address: 'Opéra, Paris',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);
  
  const isDark = theme === 'dark';

  // Filtrer les stations par terme de recherche
  const filteredStations = stations.filter(station => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      station.name?.toLowerCase().includes(search) ||
      station.operator?.toLowerCase().includes(search) ||
      station.address?.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredStations.length / stationsPerPage);
  const startIndex = (currentPage - 1) * stationsPerPage;
  const endIndex = startIndex + stationsPerPage;
  const paginatedStations = filteredStations.slice(startIndex, endIndex);

  // Réinitialiser la page quand le terme de recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>Bornes de recharge</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          Toutes les bornes de recharge publiques en France ({stations.length} bornes trouvées). Sélectionnez une borne dans le menu pour l'afficher sur la carte.
        </p>
      </div>

      {/* Barre de recherche et menu déroulant */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Rechercher une borne, un opérateur ou une adresse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-white/5 border-white/20 text-white placeholder-white/50'
              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        />
        
        {/* Menu déroulant pour sélectionner une borne */}
        <select
          value={selectedStation ? `${selectedStation.latitude}-${selectedStation.longitude}` : ''}
          onChange={(e) => {
            if (e.target.value) {
              const [lat, lon] = e.target.value.split('-').map(Number);
              const station = stations.find(s => s.latitude === lat && s.longitude === lon);
              if (station) {
                setSelectedStation(station);
              }
            } else {
              setSelectedStation(null);
            }
          }}
          className={`w-full px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-white/5 border-white/20 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
        >
          <option value="">-- Sélectionner une borne sur la carte --</option>
          {stations.map((station, index) => (
            <option
              key={`${station.latitude}-${station.longitude}-${index}`}
              value={`${station.latitude}-${station.longitude}`}
            >
              {station.name || 'Borne de recharge'} - {station.operator || 'Opérateur inconnu'} ({station.powerKw || 0} kW) - {station.address || 'Adresse inconnue'}
            </option>
          ))}
        </select>
        
        {searchTerm && (
          <p className={`text-xs ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
            {filteredStations.length} borne{filteredStations.length > 1 ? 's' : ''} trouvée{filteredStations.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-6">
        <div className={`rounded-3xl p-4 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          {/* Carte avec toutes les bornes */}
          <div className="h-[600px] rounded-2xl overflow-hidden relative bg-gray-100" style={{ minHeight: '600px' }}>
            {loading ? (
              <div className={`absolute inset-0 flex items-center justify-center z-10 ${isDark ? 'bg-emerald-500/90' : 'bg-white/90'}`}>
                <div className={`text-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                  <p>Chargement de la carte...</p>
                </div>
              </div>
            ) : (
              <div style={{ height: '100%', width: '100%' }}>
                <StationsMap
                  stations={filteredStations}
                  selectedStation={selectedStation}
                  onStationClick={(station) => {
                    setSelectedStation(station);
                    // Mettre à jour le select
                    const select = document.querySelector('select');
                    if (select) {
                      select.value = `${station.latitude}-${station.longitude}`;
                    }
                  }}
                />
              </div>
            )}
          </div>
          {selectedStation && (
            <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-white/10' : 'bg-slate-50'}`}>
              <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedStation.name || 'Borne de recharge'}
              </h3>
              <div className={`text-sm space-y-1 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
                <div><strong>Opérateur:</strong> {selectedStation.operator || 'Opérateur inconnu'}</div>
                <div><strong>Puissance:</strong> {selectedStation.powerKw || 0} kW</div>
                {selectedStation.address && (
                  <div><strong>Adresse:</strong> {selectedStation.address}</div>
                )}
                {selectedStation.price && (
                  <div><strong>Prix:</strong> {selectedStation.price}</div>
                )}
                <div>
                  <strong>Statut:</strong>{' '}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      selectedStation.status === 'Dispo'
                        ? isDark
                          ? 'bg-emerald-400/40 text-emerald-50'
                          : 'bg-emerald-50 text-emerald-700'
                        : selectedStation.status === 'Occupée'
                          ? isDark
                            ? 'bg-amber-400/40 text-amber-50'
                            : 'bg-amber-50 text-amber-700'
                          : isDark
                            ? 'bg-rose-400/40 text-rose-50'
                            : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {selectedStation.status || 'Dispo'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`rounded-3xl p-4 md:p-6 shadow-sm text-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          {loading ? (
            <div className={`text-center py-8 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
              Chargement des bornes de recharge... (cela peut prendre quelques secondes)
            </div>
          ) : filteredStations.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
              {searchTerm ? 'Aucune borne ne correspond à votre recherche.' : 'Aucune borne de recharge trouvée.'}
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {paginatedStations.map((s, index) => (
                  <div
                    key={`${s.name}-${s.latitude}-${s.longitude}-${index}`}
                    className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold ${isDark ? 'text-white' : ''} truncate`}>{s.name || 'Borne de recharge'}</div>
                      <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                        {s.operator || 'Opérateur inconnu'} · {s.powerKw || 0} kW
                      </div>
                      {s.address && (
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
                          {s.address}
                        </div>
                      )}
                      {s.price && (
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          {s.price}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-[11px] px-3 py-1 rounded-full border whitespace-nowrap ${
                        s.status === 'Dispo'
                          ? isDark
                            ? 'bg-emerald-400/40 text-emerald-50 border-emerald-300/50'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.status === 'Occupée'
                            ? isDark
                              ? 'bg-amber-400/40 text-amber-50 border-amber-300/50'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            : isDark
                              ? 'bg-rose-400/40 text-rose-50 border-rose-300/50'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {s.status || 'Dispo'}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`mt-4 flex items-center justify-between pt-4 border-t ${isDark ? 'border-emerald-300/30' : 'border-slate-200'}`}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === 1
                        ? isDark
                          ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isDark
                          ? 'bg-emerald-400/20 border-emerald-300/50 text-white hover:bg-emerald-400/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Précédent
                  </button>
                  <span className={`text-sm ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
                    Page {currentPage} sur {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg border ${
                      currentPage === totalPages
                        ? isDark
                          ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                          : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isDark
                          ? 'bg-emerald-400/20 border-emerald-300/50 text-white hover:bg-emerald-400/30'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StationsPage;


