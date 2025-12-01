import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RouteMap from '../components/RouteMap';
import { getAppSettings } from '../lib/settingsStorage';

// Cette page est surtout visuelle pour l'instant, les bornes sont statiques.

const mockStations = [
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
];

const StationsPage = () => {
  const [theme, setTheme] = useState('dark');

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
  
  const isDark = theme === 'dark';

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>Bornes de recharge</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          Trouvez des bornes de recharge à proximité (liste de démo).
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
          {mockStations.map((s) => (
            <div
              key={s.name}
              className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100'}`}
            >
              <div>
                <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{s.name}</div>
                <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                  {s.operator} · {s.powerKw} kW
                </div>
                <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                  {s.price}
                </div>
              </div>
              <span
                className={`text-[11px] px-3 py-1 rounded-full border ${
                  s.status === 'Dispo'
                    ? isDark
                      ? 'bg-emerald-400/40 text-emerald-50 border-emerald-300/50'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : isDark
                      ? 'bg-rose-400/40 text-rose-50 border-rose-300/50'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StationsPage;


