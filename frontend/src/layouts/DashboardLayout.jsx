import React from 'react';
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

const MENU_ITEMS = [
  { label: 'Accueil', icon: Home, path: '/' },
  { label: 'Nouveau trajet', icon: Map, path: '/analysis' },
  { label: 'Mes véhicules', icon: Car, path: '/vehicles' },
  { label: 'Historique', icon: History, path: '/history' },
  { label: 'Statistiques', icon: BarChart2, path: '/stats' },
  { label: 'Badges', icon: Award, path: '/badges' },
  { label: 'Bornes', icon: Zap, path: '/stations' },
  { label: 'Paramètres', icon: Settings, path: '/settings' },
];

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-[#0b3b27] text-white">
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
          {MENU_ITEMS.map((item) => {
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
          <div className="font-semibold mb-1">Conduisez écolo</div>
          <p>Optimisez votre consommation pour préserver la planète.</p>
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
              <div className="text-sm text-slate-500">Bonjour Ethan !</div>
              <div className="text-lg font-semibold text-slate-900">
                Optimisez vos trajets 🚗⚡
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hidden md:inline-flex text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100"
            >
              Niveau 1 · Éco-conducteur
            </button>
            <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
              E
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-8 bg-gradient-to-b from-emerald-50 to-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;


