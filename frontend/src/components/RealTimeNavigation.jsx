import React, { useState, useEffect } from 'react';
import { Gauge, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import { getAppSettings } from '../lib/settingsStorage';
import { TRANSLATIONS } from '../lib/translations';

const RealTimeNavigation = ({ 
  currentSegment, 
  isNavigating,
  currentSpeed = 0,
}) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const { language: lang } = getAppSettings();
    setLanguage(lang);

    const handler = (event) => {
      const detail = event.detail || {};
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

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!currentSegment) {
    return null;
  }

  const speedLimit = currentSegment.speed_limit || 0;
  const ecoSpeed = currentSegment.eco_speed || 0;
  const speedDiff = currentSpeed - ecoSpeed;
  const speedDiffPercent = ecoSpeed > 0 ? (speedDiff / ecoSpeed) * 100 : 0;

  // Couleur principale de la vitesse en fonction de la vitesse éco
  const isBelowEco = currentSpeed < ecoSpeed - 1;
  const isAboveEco = currentSpeed > ecoSpeed + 1;
  const speedColorClass = isBelowEco
    ? 'text-blue-400'
    : isAboveEco
    ? 'text-red-400'
    : 'text-emerald-300';

  // Déterminer le statut de la vitesse
  const getSpeedStatus = () => {
    if (Math.abs(speedDiff) < 2) {
        return { 
          type: 'optimal', 
          color: 'text-emerald-400', 
          bgColor: 'bg-emerald-500/20',
          borderColor: 'border-emerald-400/50',
          icon: CheckCircle,
          message: language === 'fr' ? 'Vitesse optimale' : 'Optimal speed'
        };
    } else if (speedDiff > 0) {
        return { 
          type: 'above', 
          color: 'text-amber-400', 
          bgColor: 'bg-amber-500/20',
          borderColor: 'border-amber-400/50',
          icon: TrendingUp,
          message: language === 'fr' 
            ? `+${Math.round(speedDiff)} km/h au-dessus`
            : `+${Math.round(speedDiff)} km/h above`
        };
    } else {
        return { 
          type: 'below', 
          color: 'text-blue-400', 
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/50',
          icon: TrendingDown,
          message: language === 'fr'
            ? `${Math.round(Math.abs(speedDiff))} km/h en-dessous`
            : `${Math.round(Math.abs(speedDiff))} km/h below`
        };
    }
  };

  const speedStatus = getSpeedStatus();
  const StatusIcon = speedStatus.icon;
  const aboveLimit = currentSpeed > speedLimit + 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a2e1a] via-[#0a2e1a] to-transparent border-t border-emerald-800/30 z-50 px-3 py-2 md:p-6">
      <div className="max-w-7xl mx-auto space-y-2 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
        {/* Vitesse actuelle */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-3 py-2 md:p-4 border border-white/10">
          <div className="text-xs text-emerald-200/70 mb-2 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            <span>{language === 'fr' ? 'Vitesse actuelle' : 'Current speed'}</span>
          </div>
          <div className="flex items-baseline gap-3 mb-1">
            <div className={`text-4xl md:text-5xl font-bold ${speedColorClass}`}>
              {Math.round(currentSpeed)}
              <span className="text-xl md:text-2xl text-emerald-200/70 ml-1">km/h</span>
            </div>
            {/* Indicateur visuel simple (flèche) pour conduite */}
            <div
              className={`rounded-full px-2 py-1 flex items-center justify-center border ${speedStatus.bgColor} ${speedStatus.borderColor}`}
            >
              <StatusIcon className={`w-4 h-4 md:w-5 md:h-5 ${speedStatus.color}`} />
            </div>
          </div>
          {/* Message détaillé (caché sur très petit écran pour gagner de la place) */}
          <div className={`hidden sm:inline-flex text-xs md:text-sm items-center gap-1 ${speedStatus.color}`}>
            <span>{speedStatus.message}</span>
          </div>
        </div>

        {/* Limitation de vitesse */}
        <div className={`bg-white/5 backdrop-blur-sm rounded-2xl px-3 py-2 md:p-4 border ${aboveLimit ? 'border-red-500 animate-pulse' : 'border-white/10'}`}>
          <div className="text-xs text-emerald-200/70 mb-2">{language === 'fr' ? 'Limitation' : 'Speed limit'}</div>
            <div className="flex items-center gap-3">
            <div className={`text-4xl md:text-5xl font-bold ${aboveLimit ? 'text-red-500' : 'text-red-400'}`}>
              {speedLimit}
              <span className="text-xl md:text-2xl text-red-300/70 ml-1">km/h</span>
            </div>
            <div className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (speedLimit / 130) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vitesse éco conseillée */}
        <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl px-3 py-2 md:p-4 border border-emerald-400/30">
          <div className="text-xs text-emerald-200/70 mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{language === 'fr' ? 'Éco conseillée' : 'Eco recommended'}</span>
          </div>
          <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-1">
            {Math.round(ecoSpeed)}
            <span className="text-xl md:text-2xl text-emerald-300/70 ml-1">km/h</span>
          </div>
          <div className="text-xs text-emerald-200/70">
            {speedDiffPercent > 0 ? (
              <span className="text-amber-400">
                {language === 'fr' 
                  ? `Ralentissez de ${Math.round(speedDiff)} km/h pour économiser`
                  : `Slow down by ${Math.round(speedDiff)} km/h to save energy`}
              </span>
            ) : speedDiffPercent < 0 ? (
              <span className="text-blue-400">
                {language === 'fr'
                  ? `Accélérez de ${Math.round(Math.abs(speedDiff))} km/h pour optimiser`
                  : `Speed up by ${Math.round(Math.abs(speedDiff))} km/h to optimize`}
              </span>
            ) : (
              <span className="text-emerald-400">
                {language === 'fr' ? 'Vitesse optimale !' : 'Optimal speed!'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNavigation;
