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
        <h1 className={`text-2xl font-semibold mb-1 ${theme === 'dark' ? 'text-emerald-100' : ''}`}>Paramètres</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-emerald-200' : 'text-slate-600'}`}>
          Personnalisez votre expérience ECOSPEED.
        </p>
      </div>

      <div className={`rounded-3xl p-5 md:p-6 shadow-sm text-sm space-y-6 ${theme === 'dark' ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100 text-slate-700'}`}>
        <div>
          <h2 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>Langue</h2>
          <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-emerald-50' : 'text-slate-500'}`}>
            Choisissez la langue principale de l&apos;interface.
          </p>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-white' : ''}`}>
              <input
                type="radio"
                name="language"
                value="fr"
                checked={language === 'fr'}
                onChange={handleLanguageChange}
              />
              Français
            </label>
            <label className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-white' : ''}`}>
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

        <div className={`border-t pt-4 ${theme === 'dark' ? 'border-emerald-300/30' : 'border-slate-100'}`}>
          <h2 className={`text-base font-semibold mb-2 ${theme === 'dark' ? 'text-white' : ''}`}>Thème</h2>
          <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-emerald-50' : 'text-slate-500'}`}>
            Basculez entre le mode clair et le mode sombre.
          </p>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-white' : ''}`}>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === 'light'}
                onChange={handleThemeChange}
              />
              Mode clair
            </label>
            <label className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-white' : ''}`}>
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

        <div className={`border-t pt-4 text-xs ${theme === 'dark' ? 'border-emerald-300/30 text-emerald-50' : 'border-slate-100 text-slate-500'}`}>
          Les paramètres sont enregistrés dans ce navigateur uniquement.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

