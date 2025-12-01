import React, { useEffect, useState } from 'react';
import { Car, Star, Plus } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { VEHICLE_PROFILES } from '../lib/vehicleProfiles';
import { getVehicleSettings, updateVehicleSettings } from '../lib/settingsStorage';
import { getAppSettings } from '../lib/settingsStorage';
import { toast } from 'sonner';

const VehiclesPage = () => {
  const [enabledVehicles, setEnabledVehicles] = useState([]);
  const [defaultVehicleName, setDefaultVehicleName] = useState(null);
  const [theme, setTheme] = useState('dark');

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

  const handleSetDefault = (name) => {
    // Si le véhicule est déjà dans la liste, on le retire (toggle)
    if (enabledVehicles.includes(name)) {
      const nextEnabled = enabledVehicles.filter(v => v !== name);
      setEnabledVehicles(nextEnabled);
      // Si c'était le véhicule par défaut, on change pour le premier de la liste restante
      const newDefault = nextEnabled.length > 0 ? nextEnabled[0] : null;
      setDefaultVehicleName(newDefault);
      updateVehicleSettings({
        enabledVehicles: nextEnabled,
        defaultVehicleName: newDefault,
      });
      return;
    }

    // Sinon, on l'ajoute à la liste
    const nextEnabled = Array.from(new Set([...enabledVehicles, name]));
    setEnabledVehicles(nextEnabled);
    // Si c'est le premier véhicule ajouté, il devient le défaut
    if (nextEnabled.length === 1) {
      setDefaultVehicleName(name);
      updateVehicleSettings({
        enabledVehicles: nextEnabled,
        defaultVehicleName: name,
      });
    } else {
      // Sinon, on garde le défaut actuel
      updateVehicleSettings({
        enabledVehicles: nextEnabled,
        defaultVehicleName: defaultVehicleName || name,
      });
    }
  };

  const isDefault = (name) => name === defaultVehicleName;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>Mes véhicules</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          Gérez vos véhicules électriques utilisés pour les simulations ECOSPEED.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        <div className="space-y-4">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                <Car className={`w-5 h-5 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`} />
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
                  className={`w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 text-left transition ${isDark ? 'border-emerald-300/30 bg-emerald-400/20 hover:border-emerald-300/50 hover:bg-emerald-400/30' : 'border-slate-100 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50'}`}
                >
                  <div>
                    <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{vehicle.name}</div>
                    <div className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
                      {vehicle.battery_kwh} kWh · {vehicle.empty_mass} kg
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-3 py-1 rounded-full border ${
                      isDefault(vehicle.name)
                        ? isDark
                          ? 'bg-emerald-400/40 text-emerald-50 border-emerald-300/50'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isDark
                          ? 'bg-emerald-300/20 text-emerald-200 border-emerald-300/30'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${isDefault(vehicle.name) ? 'fill-current' : ''}`} />
                    {isDefault(vehicle.name) ? 'Par défaut' : 'Ajouter par défaut'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm text-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <h2 className={`text-base md:text-lg font-semibold mb-2 ${isDark ? 'text-white' : ''}`}>
              Conseil
            </h2>
            <p className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
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


