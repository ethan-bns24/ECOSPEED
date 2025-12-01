import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips } from '../lib/tripStorage';

const BadgesPage = () => {
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
  const maxScore = trips.reduce(
    (max, t) => (t.ecoScore && t.ecoScore > max ? t.ecoScore : max),
    0
  );

  const badges = [
    {
      name: 'Premier pas',
      description: 'Premier trajet optimisé',
      progress: Math.min(100, (totalTrips > 0 ? 100 : 0)),
      unlocked: totalTrips > 0,
    },
    {
      name: 'Voyageur',
      description: '500 km en mode ECO',
      progress: Math.min(100, (totalDistanceKm / 500) * 100),
      unlocked: totalDistanceKm >= 500,
    },
    {
      name: 'Économe',
      description: '10 kWh économisés',
      progress: Math.min(100, (totalEnergySavedKwh / 10) * 100),
      unlocked: totalEnergySavedKwh >= 10,
    },
    {
      name: 'Éco-champion',
      description: '50 kWh économisés',
      progress: Math.min(100, (totalEnergySavedKwh / 50) * 100),
      unlocked: totalEnergySavedKwh >= 50,
    },
    {
      name: 'Conducteur modèle',
      description: 'Score de 80+',
      progress: Math.min(100, (maxScore / 80) * 100),
      unlocked: maxScore >= 80,
    },
    {
      name: 'Expert',
      description: 'Score de 90+',
      progress: Math.min(100, (maxScore / 90) * 100),
      unlocked: maxScore >= 90,
    },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Badges</h1>
        <p className="text-sm text-slate-600">
          Débloquez des récompenses en conduisant de manière écologique.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Progression des badges
          </h2>
          <span className="text-xs text-slate-500">
            {badges.filter((b) => b.unlocked).length} / {badges.length} badges
            débloqués
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold">{badge.name}</div>
                  <div className="text-xs text-slate-500">{badge.description}</div>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border ${
                    badge.unlocked
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {badge.unlocked ? 'Débloqué' : 'Verrouillé'}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(100, badge.progress)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BadgesPage;


