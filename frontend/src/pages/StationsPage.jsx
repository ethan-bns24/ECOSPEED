import React from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import RouteMap from '../components/RouteMap';

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
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Bornes de recharge</h1>
        <p className="text-sm text-slate-600">
          Trouvez des bornes de recharge à proximité (liste de démo).
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] gap-6">
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100">
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

        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-3 text-sm">
          {mockStations.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between gap-3"
            >
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-slate-500">
                  {s.operator} · {s.powerKw} kW
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">
                  {s.price}
                </div>
              </div>
              <span
                className={`text-[11px] px-3 py-1 rounded-full border ${
                  s.status === 'Dispo'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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


