import React from 'react';
import { Car, Plus } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';

const VehiclesPage = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Mes véhicules</h1>
        <p className="text-sm text-slate-600">
          Gérez vos véhicules électriques utilisés pour les simulations ECOSPEED.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-semibold flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-600" />
                Mes véhicules
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium"
              >
                <Plus className="w-3 h-3" />
                Ajouter un véhicule
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">Tesla Model 3</div>
                  <div className="text-xs text-slate-500">75 kWh · 1850 kg</div>
                </div>
                <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Prédéfini
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 text-sm">
            <h2 className="text-base md:text-lg font-semibold mb-2">
              Conseil
            </h2>
            <p className="text-slate-600">
              Pour de meilleurs résultats, créez un profil par véhicule que vous
              utilisez réellement (voiture principale, véhicule de société, etc.).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VehiclesPage;


