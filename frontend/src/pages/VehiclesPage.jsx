import React, { useEffect, useState } from 'react';
import { Car, Star, Plus } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { VEHICLE_PROFILES } from '../lib/vehicleProfiles';
import { getVehicleSettings, updateVehicleSettings } from '../lib/settingsStorage';
import { toast } from 'sonner';

const VehiclesPage = () => {
  const [enabledVehicles, setEnabledVehicles] = useState([]);
  const [defaultVehicleName, setDefaultVehicleName] = useState(null);

  useEffect(() => {
    const { enabledVehicles, defaultVehicleName } = getVehicleSettings();
    if (enabledVehicles && enabledVehicles.length > 0) {
      setEnabledVehicles(enabledVehicles);
      setDefaultVehicleName(defaultVehicleName || enabledVehicles[0]);
    } else {
      // Par défaut, on active la première voiture
      const first = VEHICLE_PROFILES[0]?.name;
      if (first) {
        setEnabledVehicles([first]);
        setDefaultVehicleName(first);
        updateVehicleSettings({
          enabledVehicles: [first],
          defaultVehicleName: first,
        });
      }
    }
  }, []);

  const handleSetDefault = (name) => {
    // Si le véhicule est déjà dans la liste, on ne fait que changer le "par défaut"
    if (enabledVehicles.includes(name)) {
      setDefaultVehicleName(name);
      updateVehicleSettings({
        enabledVehicles,
        defaultVehicleName: name,
      });
      return;
    }

    if (enabledVehicles.length >= 3) {
      toast.error('Vous pouvez définir au maximum 3 véhicules par défaut.');
      return;
    }

    const nextEnabled = Array.from(new Set([...enabledVehicles, name]));
    setEnabledVehicles(nextEnabled);
    setDefaultVehicleName(name);
    updateVehicleSettings({
      enabledVehicles: nextEnabled,
      defaultVehicleName: name,
    });
  };

  const isDefault = (name) => name === defaultVehicleName;

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
              {VEHICLE_PROFILES.filter((v) => v.name !== 'Custom').map((vehicle) => (
                <button
                  key={vehicle.name}
                  type="button"
                  onClick={() => handleSetDefault(vehicle.name)}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-emerald-400 hover:bg-emerald-50 transition"
                >
                  <div>
                    <div className="font-semibold">{vehicle.name}</div>
                    <div className="text-xs text-slate-500">
                      {vehicle.battery_kwh} kWh · {vehicle.empty_mass} kg
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full border ${
                      isDefault(vehicle.name)
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Star className="w-3 h-3" />
                    {isDefault(vehicle.name) ? 'Par défaut' : 'Définir par défaut'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 text-sm">
            <h2 className="text-base md:text-lg font-semibold mb-2">
              Conseil
            </h2>
            <p className="text-slate-600 text-sm">
              Le véhicule marqué <strong>Par défaut</strong> sera utilisé
              automatiquement dans le calcul de trajet.  
              Si vous en marquez plusieurs au fil du temps, vous pourrez toujours
              les sélectionner dans l&apos;écran &laquo; Nouveau trajet &raquo;.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VehiclesPage;


