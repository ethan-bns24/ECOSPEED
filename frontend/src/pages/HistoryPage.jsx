import React, { useEffect, useState } from 'react';
import { Clock, MapPin, Zap, Star } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips } from '../lib/tripStorage';

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

  useEffect(() => {
    setTrips(getAllTrips());
  }, []);

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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Historique des trajets</h1>
        <p className="text-sm text-slate-600">
          Consultez et gérez tous vos trajets optimisés.
        </p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Total trajets</div>
          <div className="text-2xl font-semibold">{totalTrips}</div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Énergie économisée</div>
          <div className="text-2xl font-semibold">
            {totalEnergySavedKwh.toFixed(1)} kWh
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Distance totale</div>
          <div className="text-2xl font-semibold">
            {totalDistanceKm.toFixed(0)} km
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Score moyen</div>
          <div className="text-2xl font-semibold">{avgScore}</div>
        </div>
      </div>

      {/* Liste des trajets */}
      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold">
            Trajets récents
          </h2>
        </div>

        {trips.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aucun trajet enregistré pour le moment. Lancez une analyse pour
            enregistrer votre premier trajet.
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">
                      {trip.startLocation} → {trip.endLocation}
                    </div>
                    <div className="text-xs text-slate-500">
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
                    <div className="text-xs text-slate-500">Énergie économisée</div>
                    <div className="text-sm font-semibold text-emerald-700">
                      -{(trip.energySavedKwh || 0).toFixed(2)} kWh
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      Score
                    </div>
                    <div className="text-sm font-semibold text-amber-600">
                      {trip.ecoScore}/100
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    <Zap className="w-3 h-3" />
                    Optimisé
                  </span>
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


