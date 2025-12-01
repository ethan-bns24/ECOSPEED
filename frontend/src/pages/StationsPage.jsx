import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RouteMap from '../components/RouteMap';
import { getAppSettings } from '../lib/settingsStorage';
import axios from 'axios';

// Use environment variable or fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const StationsPage = () => {
  const [theme, setTheme] = useState('dark');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

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
    // Récupérer les bornes de recharge depuis l'API
    const fetchStations = async () => {
      setLoading(true);
      try {
        // Par défaut, on cherche autour de Paris
        const response = await axios.get(`${API}/charging-stations`, {
          params: {
            latitude: 48.8566,
            longitude: 2.3522,
            distance: 50, // 50 km autour de Paris
          },
          timeout: 10000,
        });
        setStations(response.data || []);
      } catch (error) {
        console.error('Error fetching charging stations:', error);
        // En cas d'erreur, on garde les bornes de démo
        setStations([
          {
            name: 'Supercharger Paris-La Défense',
            operator: 'Tesla',
            powerKw: 250,
            price: '0.40€/kWh',
            status: 'Dispo',
          },
          {
            name: 'Ionity Autoroute A6',
            operator: 'Ionity',
            powerKw: 350,
            price: '0.79€/kWh',
            status: 'Dispo',
          },
          {
            name: 'Total Energies Champs-Élysées',
            operator: 'Total',
            powerKw: 175,
            price: '0.45€/kWh',
            status: 'Dispo',
          },
          {
            name: 'Electra Parking Opéra',
            operator: 'Electra',
            powerKw: 150,
            price: '0.44€/kWh',
            status: 'Occupée',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);
  
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>Bornes de recharge</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          Trouvez des bornes de recharge à proximité ({stations.length} bornes trouvées).
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-6">
        <div className={`rounded-3xl p-4 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          {/* On réutilise RouteMap simplement comme fond cartographique centrée sur la France */}
          <div className="h-[320px] rounded-2xl overflow-hidden">
            <RouteMap
              segments={[]}
              currentSegmentIndex={0}
              startLocation="Paris"
              endLocation="Paris"
              routeCoordinates={[
                [48.8566, 2.3522],
                [48.8566, 2.3522],
              ]}
            />
          </div>
        </div>

        <div className={`rounded-3xl p-4 md:p-6 shadow-sm space-y-3 text-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          {loading ? (
            <div className={`text-center py-8 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
              Chargement des bornes de recharge...
            </div>
          ) : stations.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
              Aucune borne de recharge trouvée.
            </div>
          ) : (
            stations.map((s, index) => (
              <div
                key={s.name || index}
                className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold ${isDark ? 'text-white' : ''} truncate`}>{s.name}</div>
                  <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                    {s.operator} · {s.powerKw} kW
                  </div>
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
                  {s.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StationsPage;


