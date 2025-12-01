import React, { useEffect, useState } from 'react';
import { Activity, BarChart2, Leaf, Zap } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips } from '../lib/tripStorage';

const StatsPage = () => {
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
  const totalCo2SavedKg = trips.reduce((sum, t) => sum + (t.co2SavedKg || 0), 0);
  const avgScore =
    totalTrips > 0
      ? Math.round(
          trips.reduce((sum, t) => sum + (t.ecoScore || 0), 0) / totalTrips
        )
      : 0;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Statistiques</h1>
        <p className="text-sm text-slate-600">
          Analysez vos performances d&apos;éco-conduite.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-emerald-600 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-emerald-100 mb-1">kWh économisés</div>
          <div className="text-2xl font-semibold">
            {totalEnergySavedKwh.toFixed(1)}
          </div>
        </div>
        <div className="bg-sky-600 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-sky-100 mb-1">km parcourus</div>
          <div className="text-2xl font-semibold">
            {totalDistanceKm.toFixed(0)}
          </div>
        </div>
        <div className="bg-emerald-700 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-emerald-100 mb-1">kg CO₂ évités</div>
          <div className="text-2xl font-semibold">
            {totalCo2SavedKg.toFixed(1)}
          </div>
        </div>
        <div className="bg-amber-500 text-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-xs text-amber-100 mb-1">Score moyen /100</div>
          <div className="text-2xl font-semibold">{avgScore}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            Énergie économisée par trajet
          </h2>
        </div>
        {trips.length === 0 ? (
          <div className="text-sm text-slate-500">
            Aucune donnée disponible pour l&apos;instant.
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {trips.map((trip) => (
              <li
                key={trip.id}
                className="flex items-center justify-between border-b last:border-0 border-slate-100 py-2"
              >
                <span className="text-slate-600">
                  {trip.startLocation} → {trip.endLocation}
                </span>
                <span className="font-semibold text-emerald-700">
                  -{(trip.energySavedKwh || 0).toFixed(2)} kWh
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
          <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-slate-600" />
            Comparaison avec la moyenne
          </h2>
          <p className="text-3xl font-bold text-emerald-600 mb-1">
            {totalEnergySavedKwh > 0 ? '+23%' : '0%'}
          </p>
          <p className="text-sm text-slate-600">
            Vous économisez plus d&apos;énergie que la moyenne des conducteurs
            (valeur indicative).
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
          <h2 className="text-base md:text-lg font-semibold mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            Impact environnemental
          </h2>
          <p className="text-sm text-slate-600">
            Grâce à vos économies d&apos;énergie, vous avez évité environ{' '}
            <span className="font-semibold">
              {totalCo2SavedKg.toFixed(1)} kg de CO₂
            </span>
            , soit l&apos;équivalent de plusieurs arbres plantés.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;


