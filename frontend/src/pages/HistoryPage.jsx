import React, { useEffect, useState } from 'react';
import { Clock, MapPin, Zap, Star, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips, deleteTrip, deleteAllTrips } from '../lib/tripStorage';
import { getAppSettings } from '../lib/settingsStorage';
import { toast } from 'sonner';
import { TRANSLATIONS } from '../lib/translations';

const formatDateTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const HistoryPage = () => {
  const [trips, setTrips] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setTrips(getAllTrips());
    const { theme: thm, language: lang } = getAppSettings();
    setTheme(thm);
    setLanguage(lang);
    
    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.theme) setTheme(detail.theme);
      if (detail.language) setLanguage(detail.language);
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
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const totalTrips = trips.length;
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const totalEnergySavedKwh = trips.reduce(
    (sum, t) => sum + (t.energySavedKwh || 0),
    0
  );
  const avgScore =
    totalTrips > 0
      ? Math.round(
          trips.reduce((sum, t) => sum + (t.ecoScore || 0), 0) / totalTrips
        )
      : 0;

  const handleDeleteTrip = (tripId) => {
    if (window.confirm(t.history.confirmDelete)) {
      deleteTrip(tripId);
      setTrips(getAllTrips());
      toast.success(language === 'fr' ? 'Trajet supprimé avec succès' : 'Trip deleted successfully');
    }
  };

  const handleClearAll = () => {
    if (window.confirm(t.history.confirmClearAll)) {
      deleteAllTrips();
      setTrips([]);
      toast.success(language === 'fr' ? 'Historique effacé' : 'History cleared');
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>{t.history.title}</h1>
          <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
            {t.history.subtitle}
          </p>
        </div>
        {trips.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border ${
              isDark
                ? 'border-emerald-200/70 text-emerald-50 hover:bg-emerald-400/20'
                : 'border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            {t.history.clearAll}
          </button>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.stats.totalTrips}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : ''}`}>{totalTrips}</div>
        </div>
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.history.energySaved}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : ''}`}>
            {totalEnergySavedKwh.toFixed(1)} kWh
          </div>
        </div>
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.stats.totalDistance}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : ''}`}>
            {totalDistanceKm.toFixed(0)} km
          </div>
        </div>
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.stats.avgEcoScore}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : ''}`}>{avgScore}</div>
        </div>
      </div>

      {/* Liste des trajets */}
      <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : ''}`}>
            {t.dashboard.recentTrips}
          </h2>
        </div>

        {trips.length === 0 ? (
          <div className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
            {t.history.noTrips} {t.history.startTrip}
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className={`rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/70'}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-400/30' : 'bg-emerald-100'}`}>
                    <MapPin className={`w-5 h-5 ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-semibold ${isDark ? 'text-white' : ''}`}>
                      {trip.startLocation} → {trip.endLocation}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                      {formatDateTime(trip.createdAt)} ·{' '}
                      {trip.ecoTimeMin ? trip.ecoTimeMin.toFixed(0) : 0} min ·{' '}
                      {trip.distanceKm?.toFixed
                        ? trip.distanceKm.toFixed(1)
                        : trip.distanceKm}{' '}
                      km
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:text-right">
                  <div>
                    <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.history.energySaved}</div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      -{(trip.energySavedKwh || 0).toFixed(2)} kWh
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                      <Star className={`w-3 h-3 ${isDark ? 'text-amber-200' : 'text-amber-500'}`} />
                      {t.history.score}
                    </div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
                      {trip.ecoScore}/100
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.history.recharges}</div>
                    <div className={`text-sm font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                      {trip.chargingStops !== null && trip.chargingStops !== undefined ? trip.chargingStops : '-'}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-emerald-300/50 bg-emerald-400/30 text-emerald-50' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    <Zap className="w-3 h-3" />
                    {t.history.optimized}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTrip(trip.id)}
                    className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-emerald-400/20 text-emerald-200 hover:text-red-300' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                    title={t.history.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;


