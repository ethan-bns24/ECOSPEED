const SETTINGS_KEY = 'ecospeed_settings_v1';

function loadSettings() {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Failed to load settings', e);
    return {};
  }
}

function saveSettings(settings) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings || {}));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function getVehicleSettings() {
  const settings = loadSettings();
  return {
    enabledVehicles: settings.enabledVehicles || [],
    defaultVehicleName: settings.defaultVehicleName || null,
  };
}

export function updateVehicleSettings(partial) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  saveSettings(next);
  return next;
}


