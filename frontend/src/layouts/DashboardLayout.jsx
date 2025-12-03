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
  Menu,
  X,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAppSettings } from '../lib/settingsStorage';
import { TRANSLATIONS } from '../lib/translations';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

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

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isLight = theme === 'light';
  // Sidebar toujours verte, peu importe le thème
  const sidebarClass = 'hidden md:flex md:flex-col w-64 bg-[#0b3b27] text-white';
  const mainBgClass = isLight
    ? 'flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-white text-slate-900'
    : 'flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-gradient-to-b from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-emerald-100';

  const containerClass = isLight
    ? "min-h-screen bg-white flex text-slate-900"
    : "min-h-screen bg-[#0a2e1a] flex text-emerald-100";
  
  const renderMenuItems = () => {
    return menuItems.map((item) => {
      const Icon = item.icon;
      const isActive =
        item.path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(item.path);

      return (
        <button
          key={item.path}
          type="button"
          onClick={() => handleMenuClick(item.path)}
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
    });
  };

  return (
    <div className={containerClass}>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Desktop */}
      <aside className={sidebarClass}>
        <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#022c22] flex items-center justify-center overflow-hidden">
            <img
              src="/logo-ecospeed.svg"
              alt="Ecospeed logo"
              className="h-8 w-8"
            />
          </div>
          <div>
            <div className="text-lg font-semibold leading-tight">Ecospeed</div>
            <div className="text-xs text-emerald-200/80">
              Green Driving Optimizer
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {renderMenuItems()}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-emerald-100/70">
          <div className="font-semibold mb-1">{t.sidebar.greenDrivingOptimizer}</div>
          <p>{t.footerText}</p>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0b3b27] text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#022c22] flex items-center justify-center overflow-hidden">
              <img
                src="/logo-ecospeed.svg"
                alt="Ecospeed logo"
                className="h-8 w-8"
              />
            </div>
            <div>
              <div className="text-lg font-semibold leading-tight">Ecospeed</div>
              <div className="text-xs text-emerald-200/80">
                {t.sidebar.greenDrivingOptimizer}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {renderMenuItems()}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 text-xs text-emerald-100/70">
          <div className="font-semibold mb-1">{t.footerTitle}</div>
          <p>{t.footerText}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile + desktop header) */}
        <header className={`h-16 px-4 md:px-8 flex items-center justify-between border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#0a2e1a] border-emerald-800/30'}`}>
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className={`text-sm ${isLight ? 'text-slate-500' : 'text-emerald-200'}`}>{t.greeting}</div>
              <div className={`text-lg font-semibold ${isLight ? 'text-slate-900' : 'text-emerald-100'}`}>
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


