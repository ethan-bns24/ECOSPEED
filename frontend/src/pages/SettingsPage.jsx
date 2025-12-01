import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAppSettings, updateAppSettings, applyTheme } from '../lib/settingsStorage';

const SettingsPage = () => {
  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const { language, theme } = getAppSettings();
    setLanguage(language);
    setTheme(theme);
    applyTheme(theme);
  }, []);

  const handleLanguageChange = (e) => {
    const value = e.target.value;
    setLanguage(value);
    updateAppSettings({ language: value });
  };

  const handleThemeChange = (e) => {
    const value = e.target.value;
    setTheme(value);
    updateAppSettings({ theme: value });
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Paramètres</h1>
        <p className="text-sm text-slate-600">
          Personnalisez votre expérience ECOSPEED.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-100 text-sm text-slate-700 space-y-6">
        <div>
          <h2 className="text-base font-semibold mb-2">Langue</h2>
          <p className="text-xs text-slate-500 mb-2">
            Choisissez la langue principale de l&apos;interface.
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="language"
                value="fr"
                checked={language === 'fr'}
                onChange={handleLanguageChange}
              />
              Français
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="language"
                value="en"
                checked={language === 'en'}
                onChange={handleLanguageChange}
              />
              English
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h2 className="text-base font-semibold mb-2">Thème</h2>
          <p className="text-xs text-slate-500 mb-2">
            Basculez entre le mode clair et le mode sombre.
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={handleThemeChange}
              />
              Mode clair
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === 'dark'}
                onChange={handleThemeChange}
              />
              Mode sombre
            </label>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 text-xs text-slate-500">
          Les paramètres sont enregistrés dans ce navigateur uniquement.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

