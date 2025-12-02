import React, { useEffect, useState } from 'react';
import { Award, Lock } from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { getAllTrips } from '../lib/tripStorage';
import { getAppSettings } from '../lib/settingsStorage';
import { calculateBadges } from '../lib/badges';

const BadgesPage = () => {
  const [trips, setTrips] = useState([]);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    setTrips(getAllTrips());
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
  const badges = calculateBadges(trips);
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className={`text-2xl font-semibold mb-1 ${isDark ? 'text-emerald-100' : ''}`}>Badges</h1>
        <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-slate-600'}`}>
          Débloquez des récompenses en conduisant de manière écologique.
        </p>
      </div>

      <div className={`rounded-3xl p-5 md:p-6 shadow-sm ${isDark ? 'bg-emerald-500 text-white border border-emerald-400/30' : 'bg-white border border-slate-100'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-base md:text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Award className={`w-5 h-5 ${isDark ? 'text-amber-200' : 'text-amber-500'}`} />
            Progression des badges
          </h2>
          <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>
            {unlockedCount} / {badges.length} badges débloqués
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border px-4 py-3 flex flex-col gap-2 ${
                  badge.unlocked
                    ? isDark
                      ? 'border-emerald-300/50 bg-emerald-400/30'
                      : 'border-emerald-200 bg-emerald-50/80'
                    : isDark
                      ? 'border-emerald-300/30 bg-emerald-400/20 opacity-60'
                      : 'border-slate-100 bg-slate-50/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-0.5 ${badge.unlocked ? (isDark ? 'text-emerald-100' : 'text-emerald-600') : (isDark ? 'text-emerald-200/50' : 'text-slate-400')}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isDark ? 'text-white' : ''}`}>{badge.name}</div>
                      <div className={`text-xs mt-0.5 ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>{badge.description}</div>
                    </div>
                  </div>
                  {!badge.unlocked && (
                    <Lock className={`w-4 h-4 ${isDark ? 'text-emerald-200/50' : 'text-slate-400'}`} />
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${isDark ? 'text-emerald-50' : 'text-slate-500'}`}>Progression</span>
                    <span className={`text-xs font-medium ${isDark ? 'text-emerald-100' : 'text-slate-600'}`}>
                      {Math.round(badge.progress)}%
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? 'bg-emerald-300/30' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all ${
                        badge.unlocked
                          ? 'bg-emerald-500'
                          : isDark
                            ? 'bg-emerald-400/50'
                            : 'bg-emerald-300'
                      }`}
                      style={{ width: `${Math.min(100, badge.progress)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BadgesPage;


