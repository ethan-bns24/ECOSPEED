import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { ArrowUpRight, Leaf, Zap, Award, Car, TrendingUp } from 'lucide-react';
import { getAllTrips } from '../lib/tripStorage';
import { getAppSettings } from '../lib/settingsStorage';

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

  useEffect(() => {
    setTrips(getAllTrips());
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

  return (
    <DashboardLayout>
      {/* Top welcome banner */}
      <section className="mb-6 md:mb-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-6 md:px-8 md:py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-lg shadow-emerald-500/20">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              Bonjour Ethan ! <span className="inline-block">👋</span>
            </h1>
            <p className="text-sm md:text-base text-emerald-50 max-w-xl">
              Optimisez vos trajets et économisez de l&apos;énergie avec notre optimiseur
              de conduite écologique.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-700/60 border border-emerald-300/30 text-sm">
              <Leaf className="w-4 h-4 text-emerald-100" />
              <span>{totalCo2SavedKg.toFixed(1)} kg CO₂ évités</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-emerald-700 font-semibold text-sm shadow-sm hover:bg-emerald-50 transition"
            >
              + Nouveau trajet
            </button>
          </div>
        </div>
      </section>

      {/* KPI cards row */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        {/* Trajets effectués - Bleu clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-blue-50 border border-blue-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-blue-600'}`}>Trajets effectués</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-blue-900'}`}>{stats.trips}</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +12%
          </div>
        </div>
        {/* Distance totale - Rose clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-pink-50 border border-pink-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-pink-600'}`}>Distance totale</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-pink-900'}`}>{stats.distanceKm} km</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.distance}%
          </div>
        </div>
        {/* Énergie économisée - Vert clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>Énergie économisée</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{stats.energySavedKwh.toFixed(1)} kWh</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.energy}%
          </div>
        </div>
        {/* CO₂ évité - Vert clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-emerald-50 border border-emerald-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>CO₂ évité</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-emerald-900'}`}>{stats.co2SavedKg.toFixed(1)} kg</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +18%
          </div>
        </div>
        {/* Score éco moyen - Beige/Ambre clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-amber-50 border border-amber-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-amber-600'}`}>Score éco moyen</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-amber-900'}`}>{stats.ecoScore}/100</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
            <ArrowUpRight className="w-3 h-3" /> +{stats.improvement.score}%
          </div>
        </div>
        {/* Points totaux - Rose clair en mode clair */}
        <div className={`rounded-2xl px-4 py-4 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-pink-50 border border-pink-100'}`}>
          <div className={`text-xs mb-1 ${isDark ? 'text-emerald-50' : 'text-pink-600'}`}>Points totaux</div>
          <div className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-pink-900'}`}>{stats.points}</div>
          <div className={`text-[11px] mt-1 flex items-center gap-1 ${isDark ? 'text-emerald-50' : 'text-emerald-600'}`}>
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
                Trajets récents
              </h2>
              <button
                type="button"
                className={`text-xs font-medium ${isDark ? 'text-emerald-50 hover:text-white' : 'text-emerald-700 hover:text-emerald-800'}`}
              >
                Voir tout
              </button>
            </div>

            {recentTrips.length === 0 ? (
              <div className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                Aucun trajet pour le moment. Planifiez votre premier trajet pour
                commencer.
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
                        <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>Énergie économisée</div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                          -{(trip.energySavedKwh || 0).toFixed(1)} kWh
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>Score</div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-amber-200' : 'text-amber-600'}`}>
                          {trip.ecoScore}/100
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${isDark ? 'border-emerald-300/50 bg-emerald-400/30 text-emerald-50' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                        Terminé
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
                Score Éco-conduite
              </h2>
              <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>Niveau 1</span>
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
                  Continuez à suivre les recommandations de vitesse ECOSPEED pour
                  améliorer votre score et débloquer de nouveaux badges.
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
              <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>0 / 9 badges</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`rounded-2xl border px-3 py-3 opacity-60 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/40'}`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-white' : ''}`}>Premier trajet</div>
                <div className={isDark ? 'text-emerald-50' : 'text-slate-500'}>Premier trajet optimisé</div>
                <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                  <div className="h-full w-0 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className={`rounded-2xl border px-3 py-3 opacity-60 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/40'}`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-white' : ''}`}>Économe</div>
                <div className={isDark ? 'text-emerald-50' : 'text-slate-500'}>10 kWh économisés</div>
                <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                  <div className="h-full w-0 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className={`rounded-2xl border px-3 py-3 opacity-60 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/40'}`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-white' : ''}`}>Voyageur</div>
                <div className={isDark ? 'text-emerald-50' : 'text-slate-500'}>500 km en mode ECO</div>
                <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                  <div className="h-full w-0 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className={`rounded-2xl border px-3 py-3 opacity-60 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/40'}`}>
                <div className={`font-semibold mb-1 ${isDark ? 'text-white' : ''}`}>Éco-champion</div>
                <div className={isDark ? 'text-emerald-50' : 'text-slate-500'}>50 kWh économisés</div>
                <div className={`mt-2 h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                  <div className="h-full w-0 rounded-full bg-emerald-500" />
                </div>
              </div>
            </div>
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
              <div className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${isDark ? 'border-emerald-300/30 bg-emerald-400/20' : 'border-slate-100 bg-slate-50/60'}`}>
                <div>
                  <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>Tesla Model 3</div>
                  <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>75 kWh · 1850 kg</div>
                </div>
                <span className={`text-[11px] px-3 py-1 rounded-full border ${isDark ? 'bg-emerald-400/40 text-emerald-50 border-emerald-300/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  Prédéfini
                </span>
              </div>
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


