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

// ================== Véhicules ==================

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

// ================== App (langue / thème) ==================

export function getAppSettings() {
  const settings = loadSettings();
  const language = settings.language || 'en'; // anglais par défaut
  const theme = settings.theme || 'light'; // thème clair par défaut
  
  // Appliquer le thème au chargement si pas encore appliqué
  if (typeof document !== 'undefined') {
    applyTheme(theme);
  }
  
  return {
    language,
    theme,
  };
}

export function updateAppSettings(partial) {
  const current = loadSettings();
  const next = { ...current, ...partial };
  saveSettings(next);
  applyTheme(next.theme);
  // Notifier le reste de l'app qu'un réglage a changé (langue / thème)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ecospeed-settings-updated', { detail: next })
    );
  }
  return next;
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const body = document.body;
  body.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') {
    body.classList.add('theme-light');
  } else {
    body.classList.add('theme-dark');
  }
}

