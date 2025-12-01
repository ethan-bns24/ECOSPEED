import React, { useEffect, useState } from 'react';
import {
  Home,
  Map,
  Car,
  History,
  BarChart2,
  Award,
  Zap,
  Settings,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAppSettings } from '../lib/settingsStorage';

const LABELS = {
  fr: {
    menu: {
      home: 'Accueil',
      newTrip: 'Nouveau trajet',
      vehicles: 'Mes véhicules',
      history: 'Historique',
      stats: 'Statistiques',
      badges: 'Badges',
      stations: 'Bornes',
      settings: 'Paramètres',
    },
    greeting: 'Bonjour Ethan !',
    subtitle: 'Optimisez vos trajets 🚗⚡',
    footerTitle: 'Conduisez écolo',
    footerText: 'Optimisez votre consommation pour préserver la planète.',
    level: 'Niveau 1 · Éco-conducteur',
  },
  en: {
    menu: {
      home: 'Home',
      newTrip: 'New trip',
      vehicles: 'My vehicles',
      history: 'History',
      stats: 'Statistics',
      badges: 'Badges',
      stations: 'Charging',
      settings: 'Settings',
    },
    greeting: 'Hello Ethan! ',
    subtitle: 'Optimize your trips 🚗⚡',
    footerTitle: 'Drive green',
    footerText: 'Optimize your consumption to protect the planet.',
    level: 'Level 1 · Eco driver',
  },
};

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const { language, theme } = getAppSettings();
    setLanguage(language);
    setTheme(theme);

    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.language) setLanguage(detail.language);
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

  const t = LABELS[language] || LABELS.fr;

  const menuItems = [
    { label: t.menu.home, icon: Home, path: '/' },
    { label: t.menu.newTrip, icon: Map, path: '/analysis' },
    { label: t.menu.vehicles, icon: Car, path: '/vehicles' },
    { label: t.menu.history, icon: History, path: '/history' },
    { label: t.menu.stats, icon: BarChart2, path: '/stats' },
    { label: t.menu.badges, icon: Award, path: '/badges' },
    { label: t.menu.stations, icon: Zap, path: '/stations' },
    { label: t.menu.settings, icon: Settings, path: '/settings' },
  ];

  const isLight = theme === 'light';
  // Sidebar toujours verte, peu importe le thème
  const sidebarClass = 'hidden md:flex md:flex-col w-64 bg-[#0b3b27] text-white';
  const mainBgClass = isLight
    ? 'flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-white text-slate-900'
    : 'flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-gradient-to-b from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-emerald-100';

  const containerClass = isLight
    ? "min-h-screen bg-white flex text-slate-900"
    : "min-h-screen bg-[#0a2e1a] flex text-emerald-100";
  
  return (
    <div className={containerClass}>
      {/* Sidebar */}
      <aside className={sidebarClass}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#22c55e] flex items-center justify-center text-[#0b3b27] font-bold">
            E
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">Ecospeed</div>
            <div className="text-xs text-emerald-200/80">
              Green Driving Optimizer
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500 text-slate-900'
                    : 'text-emerald-100 hover:bg-emerald-500/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-emerald-100/70">
          <div className="font-semibold mb-1">{t.footerTitle}</div>
          <p>{t.footerText}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile + desktop header) */}
        <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b bg-white">
          <div className="flex items-center gap-3">
            {/* Mobile menu indicator (static for now) */}
            <div className="md:hidden h-9 w-9 rounded-full bg-[#0b3b27] text-white flex items-center justify-center font-semibold">
              E
            </div>
            <div>
              <div className="text-sm text-slate-500">{t.greeting}</div>
              <div className="text-lg font-semibold text-slate-900">
                {t.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100"
            >
              {t.level}
            </button>
            <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
              E
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={mainBgClass}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


