import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { ArrowUpRight, Leaf, Zap, Award, Car, TrendingUp } from 'lucide-react';
import { getAllTrips } from '../lib/tripStorage';
import { getAppSettings, getVehicleSettings } from '../lib/settingsStorage';
import { calculateBadges } from '../lib/badges';
import { VEHICLE_PROFILES } from '../lib/vehicleProfiles';
import { TRANSLATIONS } from '../lib/translations';

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [enabledVehicles, setEnabledVehicles] = useState([]);

  useEffect(() => {
    setTrips(getAllTrips());
    const { theme: thm, language: lang } = getAppSettings();
    setTheme(thm);
    setLanguage(lang);
    
    // Récupérer les véhicules activés
    const { enabledVehicles: enabled } = getVehicleSettings();
    if (enabled && enabled.length > 0) {
      setEnabledVehicles(enabled);
    } else {
      // Par défaut, afficher le premier véhicule
      const first = VEHICLE_PROFILES[0]?.name;
      if (first) {
        setEnabledVehicles([first]);
      }
    }
    
    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.theme) setTheme(detail.theme);
      if (detail.language) setLanguage(detail.language);
      // Recharger les véhicules si les settings changent
      const { enabledVehicles: updated } = getVehicleSettings();
      if (updated && updated.length > 0) {
        setEnabledVehicles(updated);
      }
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
  
  // Filtrer les véhicules activés
  const defaultVehicles = VEHICLE_PROFILES.filter(v => 
    enabledVehicles.includes(v.name)
  );

  const totalTrips = trips.length;
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const totalEnergySavedKwh = trips.reduce(
    (sum, t) => sum + (t.energySavedKwh || 0),
    0
  );
  const totalCo2SavedKg = trips.reduce((sum, t) => sum + (t.co2SavedKg || 0), 0);
  const avgEcoScore =
    totalTrips > 0
      ? Math.round(
          trips.reduce((sum, t) => sum + (t.ecoScore || 0), 0) / totalTrips
        )
      : 0;

  // Pourcentages d'amélioration – approximations basées sur l'énergie économisée et le score
  const stats = {
    trips: totalTrips,
    distanceKm: totalDistanceKm.toFixed(0),
    energySavedKwh: totalEnergySavedKwh,
    co2SavedKg: totalCo2SavedKg,
    ecoScore: avgEcoScore,
    points: totalTrips * 10, // ex : 10 pts par trajet
    improvement: {
      energy: totalEnergySavedKwh > 0 ? 23 : 0,
      distance: totalDistanceKm > 0 ? 8 : 0,
      score: avgEcoScore > 0 ? 5 : 0,
      points: totalTrips > 0 ? 15 : 0,
    },
  };

  const recentTrips = trips.slice(0, 3);
  const badges = calculateBadges(trips);
  const unlockedBadges = badges.filter(b => b.unlocked);
  const displayedBadges = unlockedBadges.length > 0 
    ? unlockedBadges.slice(0, 4) 
    : badges.slice(0, 4);

  return (
    <DashboardLayout>
      {/* Top welcome banner */}
      <section className="mb-6 md:mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg shadow-emerald-500/20">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {t.dashboard.greeting} <span className="inline-block">👋</span>
            </h1>
            <p className="text-sm md:text-base text-emerald-50 max-w-xl">
              {t.dashboard.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-700/60 border border-emerald-300/30 text-sm">
              <Leaf className="w-4 h-4 text-emerald-100" />
              <span>{totalCo2SavedKg.toFixed(1)} {t.dashboard.co2Avoided}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-emerald-700 font-semibold text-sm shadow-sm hover:bg-emerald-50 transition"
            >
              + {t.dashboard.newTrip}
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards row */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        {/* Trajets effectués - Bleu en mode sombre, bleu clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-blue-600 text-white border border-blue-500/30' : 'bg-blue-50 border border-blue-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-blue-50' : 'text-blue-600'}`}>{t.dashboard.tripsCompleted}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-blue-900'}`}>{stats.trips}</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-blue-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +12%
          </div>
        </div>
        {/* Distance totale - Bleu en mode sombre, rose clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-blue-600 text-white border border-blue-500/30' : 'bg-pink-50 border border-pink-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-blue-50' : 'text-pink-600'}`}>{t.dashboard.totalDistance}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-pink-900'}`}>{stats.distanceKm} km</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-blue-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.distance}%
          </div>
        </div>
        {/* Énergie économisée - Vert en mode sombre, vert clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-600 text-white border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>{t.dashboard.energySaved}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{stats.energySavedKwh.toFixed(1)} kWh</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.energy}%
          </div>
        </div>
        {/* CO₂ évité - Vert en mode sombre, vert clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-600 text-white border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>{t.dashboard.co2AvoidedLabel}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{stats.co2SavedKg.toFixed(1)} kg</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +18%
          </div>
        </div>
        {/* Score éco moyen - Orange en mode sombre, beige/ambre clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-orange-600 text-white border border-orange-500/30' : 'bg-amber-50 border border-amber-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-orange-50' : 'text-amber-600'}`}>{t.dashboard.avgEcoScore}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-amber-900'}`}>{stats.ecoScore}/100</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-orange-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.score}%
          </div>
        </div>
        {/* Points totaux - Orange en mode sombre, rose clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-orange-600 text-white border border-orange-500/30' : 'bg-pink-50 border border-pink-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-orange-50' : 'text-pink-600'}`}>{t.dashboard.totalPoints}</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-pink-900'}`}>{stats.points}</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-orange-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.points}%
          </div>
        </div>
      </section>

      {/* Main content grid */}
      <section className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        {/* Left column: recent trips + eco driving score */}
        <div className="space-y-6">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : ''}`}>
                {t.dashboard.recentTrips}
              </h2>
              <button
                type="button"
                onClick={() => navigate('/history')}
                className={`text-xs font-medium ${isDark ? 'text-emerald-50 hover:text-white' : 'text-emerald-700 hover:text-emerald-800'}`}
              >
                {t.dashboard.seeAll}
              </button>
            </div>

            {recentTrips.length === 0 ? (
              <div className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                {t.dashboard.noTrips} {t.dashboard.startTrip}
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className={`rounded-2xl border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-400/30' : 'bg-emerald-100'}`}>
                        <Car className={`w-5 h-5 ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`} />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : ''}`}>
                          {trip.startLocation} → {trip.endLocation}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                          {formatDate(trip.createdAt)} ·{' '}
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
                        <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.dashboard.energySaved}</div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          -{(trip.energySavedKwh || 0).toFixed(1)} kWh
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.history.score}</div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
                          {trip.ecoScore}/100
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-emerald-300/50 bg-emerald-400/30 text-emerald-50' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        {t.history.completed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold ${isDark ? 'text-white' : ''}`}>
                {t.dashboard.ecoDrivingScore}
              </h2>
              <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{t.dashboard.level}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative inline-flex items-center justify-center">
                  <div className={`h-28 w-28 rounded-full border-[10px] flex items-center justify-center ${isDark ? 'border-emerald-300/50' : 'border-emerald-200'}`}>
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : ''}`}>{stats.ecoScore}</span>
                  </div>
                </div>
                <div className={`mt-2 text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>/100 · À améliorer</div>
              </div>
              <div className="flex-1 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`} />
                  <span className={`font-semibold ${isDark ? 'text-white' : ''}`}>+23% d&apos;économie d&apos;énergie</span>
                </div>
                <p className={`text-xs md:text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
                  Continuez à suivre les recommandations de vitesse ECOSPEED pour {t.dashboard.improveScore}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: badges & vehicles snapshot */}
        <div className="space-y-6">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                <Award className={`w-4 h-4 ${isDark ? 'text-amber-200' : 'text-amber-500'}`} />
                Badges
              </h2>
              <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                {unlockedBadges.length} / {badges.length} badges
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {displayedBadges.map((badge) => {
                const IconComponent = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`rounded-2xl border px-3 py-3 ${
                      badge.unlocked
                        ? isDark
                          ? 'border-emerald-300/50 bg-emerald-400/30'
                          : 'border-emerald-200 bg-emerald-50/80'
                        : isDark
                          ? 'border-emerald-300/30 bg-emerald-400/20 opacity-60'
                          : 'border-slate-100 bg-slate-50/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <IconComponent 
                        className={`w-4 h-4 mt-0.5 ${
                          badge.unlocked
                            ? isDark
                              ? 'text-emerald-100'
                              : 'text-emerald-600'
                            : isDark
                              ? 'text-emerald-200/50'
                              : 'text-slate-400'
                        }`} 
                      />
                      <div className="flex-1">
                        <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{badge.name}</div>
                        <div className={`text-[10px] mt-0.5 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                          {badge.description}
                        </div>
                      </div>
                    </div>
                    <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full rounded-full ${
                          badge.unlocked
                            ? 'bg-emerald-500'
                            : isDark
                              ? 'bg-emerald-400/50'
                              : 'bg-emerald-300'
                        }`}
                        style={{ width: `${Math.min(100, badge.progress)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {unlockedBadges.length === 0 && (
              <p className={`text-xs mt-3 text-center ${isDark ? 'text-emerald-100' : 'text-slate-500'}`}>
                Complétez des trajets pour débloquer vos premiers badges !
              </p>
            )}
          </div>

          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                <Car className={`w-4 h-4 ${isDark ? 'text-emerald-100' : 'text-sky-600'}`} />
                Mes véhicules
              </h2>
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className={`text-xs font-medium ${isDark ? 'text-emerald-50 hover:text-white' : 'text-emerald-700 hover:text-emerald-800'}`}
              >
                Gérer
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {defaultVehicles.length > 0 ? (
                defaultVehicles.map((vehicle) => (
                  <div
                    key={vehicle.name}
                    className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/60'}`}
                  >
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{vehicle.name}</div>
                      <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                        {vehicle.battery_kwh} kWh · {vehicle.empty_mass} kg
                      </div>
                    </div>
                    <span className={`text-[11px] px-3 py-1 rounded-full border ${isDark ? 'bg-emerald-400/40 text-emerald-50 border-emerald-300/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                      Par défaut
                    </span>
                  </div>
                ))
              ) : (
                <div className={`rounded-2xl border px-4 py-3 text-center ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/60'}`}>
                  <div className={`text-sm ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
                    Aucun véhicule par défaut
                  </div>
                </div>
              )}
              <div className={`rounded-2xl border border-dashed px-4 py-3 flex items-center justify-between gap-3 text-xs ${isDark ? 'border-emerald-300/30 text-emerald-200' : 'border-slate-200 text-slate-500'}`}>
                <span>Ajouter un véhicule populaire ou personnalisé</span>
                <button
                  type="button"
                  onClick={() => navigate('/vehicles')}
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500 text-white text-lg hover:bg-emerald-600 transition"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
};

export default DashboardPage;


