import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, Leaf, Zap, Trash2 } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips, deleteTrip, deleteAllTrips } from '../lib/tripStorage';
import { getAppSettings } from '../lib/settingsStorage';
import { TRANSLATIONS } from '../lib/translations';
import { toast } from 'sonner';

const StatsPage = () => {
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
  const totalCo2SavedKg = trips.reduce((sum, t) => sum + (t.co2SavedKg || 0), 0);
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
          <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>{t.stats.title}</h1>
          <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
            {t.stats.subtitle}
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

      <div className={`rounded-3xl p-5 md:p-6 shadow-sm mb-6 ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            {language === 'fr' ? 'Détails trajets (vitesses & batterie)' : 'Trip details (speeds & battery)'}
          </h2>
        </div>
        {trips.length === 0 ? (
          <div className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
            {language === 'fr' ? 'Aucune donnée.' : 'No data.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={`${isDark ? 'text-emerald-50' : 'text-slate-700'}`}>
                  <th className="text-left pb-2 pr-4 whitespace-nowrap">{language === 'fr' ? 'Trajet' : 'Trip'}</th>
                  <th className="text-right pb-2 pr-4 whitespace-nowrap">{language === 'fr' ? 'Vit. éco moy. (km/h)' : 'Avg eco speed (km/h)'}</th>
                  <th className="text-right pb-2 pr-4 whitespace-nowrap">{language === 'fr' ? 'Batterie cible (%)' : 'Battery target (%)'}</th>
                  <th className="text-right pb-2 pr-4 whitespace-nowrap">{language === 'fr' ? 'Batterie réelle (%)' : 'Battery actual (%)'}</th>
                  <th className="text-right pb-2 pr-4 whitespace-nowrap">{language === 'fr' ? 'Erreur (%)' : 'Error (%)'}</th>
                  <th className="text-right pb-2 whitespace-nowrap">{language === 'fr' ? 'Conso éco (kWh)' : 'Eco energy (kWh)'}</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const errorPct =
                    trip.actualArrivalSoc !== null &&
                    trip.actualArrivalSoc !== undefined &&
                    trip.batteryTargetPct !== null &&
                    trip.batteryTargetPct !== undefined &&
                    trip.batteryTargetPct > 0
                      ? ((trip.actualArrivalSoc - trip.batteryTargetPct) / trip.batteryTargetPct) * 100
                      : null;
                  return (
                    <tr key={trip.id} className={`${isDark ? 'border-emerald-300/30' : 'border-slate-100'} border-b last:border-0`}>
                      <td className="py-2 pr-4 whitespace-nowrap">{trip.startLocation} → {trip.endLocation}</td>
                      <td className="py-2 pr-4 text-right">{trip.avgEcoSpeedKmh ? trip.avgEcoSpeedKmh.toFixed(1) : '--'}</td>
                      <td className="py-2 pr-4 text-right">{trip.batteryTargetPct !== null && trip.batteryTargetPct !== undefined ? trip.batteryTargetPct.toFixed(1) : '--'}</td>
                      <td className="py-2 pr-4 text-right">{trip.actualArrivalSoc !== null && trip.actualArrivalSoc !== undefined ? trip.actualArrivalSoc.toFixed(1) : '--'}</td>
                      <td className={`py-2 pr-4 text-right ${errorPct !== null ? (errorPct >= 0 ? (isDark ? 'text-emerald-100' : 'text-emerald-700') : 'text-red-500') : ''}`}>
                        {errorPct === null ? '--' : `${errorPct >= 0 ? '+' : ''}${errorPct.toFixed(1)}%`}
                      </td>
                      <td className="py-2 text-right">{trip.ecoEnergyKwh !== undefined ? trip.ecoEnergyKwh.toFixed(2) : '--'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
        <div className="bg-emerald-600 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-emerald-100 mb-1">{t.stats.energySavedLabel}</div>
          <div className="text-2xl font-semibold">
            {totalEnergySavedKwh.toFixed(1)}
          </div>
        </div>
        <div className="bg-sky-600 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-sky-100 mb-1">{t.stats.distanceLabel}</div>
          <div className="text-2xl font-semibold">
            {totalDistanceKm.toFixed(0)}
          </div>
        </div>
        <div className="bg-emerald-700 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-emerald-100 mb-1">{t.stats.co2AvoidedLabel}</div>
          <div className="text-2xl font-semibold">
            {totalCo2SavedKg.toFixed(1)}
          </div>
        </div>
        <div className="bg-amber-500 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-amber-100 mb-1">{t.stats.avgScoreLabel}</div>
          <div className="text-2xl font-semibold">{avgScore}</div>
        </div>
      </div>

      <div className={`rounded-3xl p-5 md:p-6 shadow-sm mb-6 ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Zap className={`w-4 h-4 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`} />
            {t.stats.energySavedPerTrip}
          </h2>
        </div>
        {trips.length === 0 ? (
          <div className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
            {t.stats.noData}
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className={`flex items-center justify-between gap-3 border-b last:border-0 py-2 ${isDark ? 'border-emerald-300/30' : 'border-slate-100'}`}
              >
                <div className="flex-1 flex items-center justify-between gap-3">
                  <span className={isDark ? 'text-emerald-50' : 'text-slate-600'}>
                    {trip.startLocation} → {trip.endLocation}
                  </span>
                  <span className={`font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                    -{(trip.energySavedKwh || 0).toFixed(2)} kWh
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteTrip(trip.id)}
                  className={`p-1.5 rounded-lg transition ${isDark ? 'hover:bg-emerald-400/20 text-emerald-100 hover:text-red-200' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'}`}
                  title={t.history.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <h2 className={`text-base md:text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <BarChart2 className={`w-4 h-4 ${isDark ? 'text-emerald-100' : 'text-slate-600'}`} />
            {t.stats.comparison}
          </h2>
          <p className={`text-3xl font-bold mb-1 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`}>
            {totalEnergySavedKwh > 0 ? '+23%' : '0%'}
          </p>
          <p className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
            {t.stats.comparisonText}
          </p>
        </div>

        <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
          <h2 className={`text-base md:text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Leaf className={`w-4 h-4 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`} />
            {t.stats.environmentalImpact}
          </h2>
          <p className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
            {t.stats.environmentalImpactText}{' '}
            <span className="font-semibold">
              {totalCo2SavedKg.toFixed(1)} {t.stats.co2Equivalent}
            </span>
            {t.stats.treesEquivalent}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;


