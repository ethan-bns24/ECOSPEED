import React, { useEffect, useState } from 'react';
import { Car, Star, Plus } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { VEHICLE_PROFILES } from '../lib/vehicleProfiles';
import { getVehicleSettings, updateVehicleSettings, getAppSettings, getCustomVehicles, saveCustomVehicles } from '../lib/settingsStorage';
import { toast } from 'sonner';
import { TRANSLATIONS } from '../lib/translations';

const VehiclesPage = () => {
  const [enabledVehicles, setEnabledVehicles] = useState([]);
  const [defaultVehicleName, setDefaultVehicleName] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [customVehicles, setCustomVehicles] = useState([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

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
    
    // Charger les véhicules personnalisés
    const storedCustom = getCustomVehicles();
    if (Array.isArray(storedCustom)) {
      setCustomVehicles(storedCustom);
    }
    
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

  const isDefault = (name) => enabledVehicles.includes(name);

  const handleOpenCustomForm = (vehicle) => {
    setEditingVehicle(
      vehicle || {
        name: '',
        empty_mass: 1800,
        extra_load: 150,
        drag_coefficient: 0.62,
        frontal_area: 2.2,
        rolling_resistance: 0.010,
        motor_efficiency: 0.90,
        regen_efficiency: 0.60,
        aux_power_kw: 2.0,
        battery_kwh: 60,
      }
    );
    setShowCustomForm(true);
  };

  const handleCancelCustomForm = () => {
    setShowCustomForm(false);
    setEditingVehicle(null);
  };

  const handleSaveCustomForm = () => {
    if (!editingVehicle || !editingVehicle.name) {
      toast.error(language === 'fr' ? 'Veuillez saisir un nom de véhicule' : 'Please enter a vehicle name');
      return;
    }

    // Mettre à jour / ajouter le véhicule dans la liste locale
    const filtered = customVehicles.filter((v) => v.name !== editingVehicle.name);
    const updated = [...filtered, editingVehicle];
    setCustomVehicles(updated);
    saveCustomVehicles(updated);

    // L'ajouter automatiquement aux véhicules activés
    const nextEnabled = Array.from(new Set([...enabledVehicles, editingVehicle.name]));
    setEnabledVehicles(nextEnabled);
    const newDefault = defaultVehicleName || editingVehicle.name;
    setDefaultVehicleName(newDefault);
    updateVehicleSettings({
      enabledVehicles: nextEnabled,
      defaultVehicleName: newDefault,
    });

    setShowCustomForm(false);
    setEditingVehicle(null);
    toast.success(language === 'fr' ? 'Véhicule enregistré' : 'Vehicle saved');
  };

  const allVehicles = [
    // On n'affiche pas le profil "Custom" générique ici
    ...VEHICLE_PROFILES.filter((v) => v.name !== 'Custom'),
    ...customVehicles,
  ];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>{t.vehicles.title}</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          {t.vehicles.subtitle}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        <div className="space-y-4">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
                <Car className={`w-5 h-5 ${isDark ? 'text-emerald-100' : 'text-emerald-600'}`} />
                {t.vehicles.title}
              </h2>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-medium"
                onClick={() => handleOpenCustomForm(null)}
              >
                <Plus className="w-3 h-3" />
                {t.vehicles.addVehicle}
              </button>
            </div>

            <div className="space-y-3 text-sm">
              {allVehicles.map((vehicle) => (
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
                    {isDefault(vehicle.name) ? t.vehicles.setDefault : t.vehicles.removeDefault}
                  </span>
                </button>
              ))}
            </div>

            {showCustomForm && editingVehicle && (
              <div className={`mt-4 p-4 rounded-2xl border ${isDark ? 'border-emerald-300/40 bg-emerald-900/40' : 'border-emerald-200 bg-emerald-50/60'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Nom du véhicule' : 'Vehicle name'}
                    </label>
                    <input
                      type="text"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.name}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {t.vehicles.battery} (kWh)
                    </label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.battery_kwh}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, battery_kwh: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {t.vehicles.mass} (kg)
                    </label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.empty_mass}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, empty_mass: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Charge (passagers, bagages)' : 'Extra load (passengers, luggage)'}
                    </label>
                    <input
                      type="number"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.extra_load}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, extra_load: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Cx·A (aéro)' : 'CdA (aero)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.drag_coefficient}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, drag_coefficient: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Surface frontale (m²)' : 'Frontal area (m²)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.frontal_area}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, frontal_area: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Résistance au roulement' : 'Rolling resistance'}
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.rolling_resistance}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, rolling_resistance: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Rendement moteur' : 'Motor efficiency'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.motor_efficiency}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, motor_efficiency: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Rendement régénération' : 'Regen efficiency'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.regen_efficiency}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, regen_efficiency: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={isDark ? 'text-emerald-50' : 'text-slate-700'}>
                      {language === 'fr' ? 'Consommation auxiliaire (kW)' : 'Aux power (kW)'}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className={`mt-1 w-full rounded-lg px-2 py-1.5 text-xs border ${isDark ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50' : 'bg-white border-slate-300 text-slate-900'}`}
                      value={editingVehicle.aux_power_kw}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, aux_power_kw: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-full border ${isDark ? 'border-emerald-300/50 text-emerald-50' : 'border-slate-300 text-slate-700'}`}
                    onClick={handleCancelCustomForm}
                  >
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-emerald-500 text-white"
                    onClick={handleSaveCustomForm}
                  >
                    {language === 'fr' ? 'Enregistrer' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-3xl p-5 md:p-6 shadow-sm text-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
            <h2 className={`text-base md:text-lg font-semibold mb-2 ${isDark ? 'text-white' : ''}`}>
              {t.vehicles.tip}
            </h2>
            <p className={`text-sm ${isDark ? 'text-emerald-50' : 'text-slate-600'}`}>
              {t.vehicles.tipText}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VehiclesPage;


