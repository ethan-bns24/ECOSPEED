import React, { useState, useEffect } from 'react';
import { Gauge, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';

const RealTimeNavigation = ({ 
  currentSegment, 
  isNavigating,
  onSpeedChange 
}) => {
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState([]);
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

  useEffect(() => {
    if (!isNavigating || !currentSegment) {
      setCurrentSpeed(0);
      return;
    }

    // Simuler la vitesse actuelle basée sur la vitesse éco recommandée
    // Ajouter une variation aléatoire pour simuler la conduite réelle
    const targetSpeed = currentSegment.eco_speed || 0;
    const speedVariation = (Math.random() - 0.5) * 10; // Variation de ±5 km/h
    const simulatedSpeed = Math.max(0, Math.min(
      currentSegment.speed_limit || 130,
      targetSpeed + speedVariation
    ));

    // Animation progressive vers la vitesse cible
    const interval = setInterval(() => {
      setCurrentSpeed(prev => {
        const diff = simulatedSpeed - prev;
        const step = diff * 0.1; // Animation fluide
        const newSpeed = prev + step;
        return Math.round(newSpeed * 10) / 10;
      });
    }, 100);

    // Mettre à jour la vitesse cible périodiquement
    const updateInterval = setInterval(() => {
      const newVariation = (Math.random() - 0.5) * 10;
      const newTargetSpeed = Math.max(0, Math.min(
        currentSegment.speed_limit || 130,
        targetSpeed + newVariation
      ));
      setSpeedHistory(prev => [...prev.slice(-10), newTargetSpeed]);
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(updateInterval);
    };
  }, [isNavigating, currentSegment]);

  useEffect(() => {
    if (onSpeedChange) {
      onSpeedChange(currentSpeed);
    }
  }, [currentSpeed, onSpeedChange]);

  if (!currentSegment) {
    return null;
  }

  const speedLimit = currentSegment.speed_limit || 0;
  const ecoSpeed = currentSegment.eco_speed || 0;
  const speedDiff = currentSpeed - ecoSpeed;
  const speedDiffPercent = ecoSpeed > 0 ? (speedDiff / ecoSpeed) * 100 : 0;

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
            ? `+${speedDiff.toFixed(1)} km/h au-dessus`
            : `+${speedDiff.toFixed(1)} km/h above`
        };
    } else {
        return { 
          type: 'below', 
          color: 'text-blue-400', 
          bgColor: 'bg-blue-500/20',
          borderColor: 'border-blue-400/50',
          icon: TrendingDown,
          message: language === 'fr'
            ? `${Math.abs(speedDiff).toFixed(1)} km/h en-dessous`
            : `${Math.abs(speedDiff).toFixed(1)} km/h below`
        };
    }
  };

  const speedStatus = getSpeedStatus();
  const StatusIcon = speedStatus.icon;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0a2e1a] via-[#0a2e1a] to-transparent border-t border-emerald-800/30 z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Vitesse actuelle */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-emerald-200/70 mb-2 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              <span>{language === 'fr' ? 'Vitesse actuelle' : 'Current speed'}</span>
            </div>
            <div className="text-4xl md:text-5xl font-bold text-white mb-1">
              {Math.round(currentSpeed)}
              <span className="text-xl md:text-2xl text-emerald-200/70 ml-1">km/h</span>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${speedStatus.bgColor} ${speedStatus.borderColor} border`}>
              <StatusIcon className={`w-3 h-3 ${speedStatus.color}`} />
              <span className={speedStatus.color}>{speedStatus.message}</span>
            </div>
          </div>

          {/* Limitation de vitesse */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-emerald-200/70 mb-2">{language === 'fr' ? 'Limitation' : 'Speed limit'}</div>
            <div className="flex items-center gap-3">
              <div className="text-4xl md:text-5xl font-bold text-red-400">
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
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/30">
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
                    ? `Ralentissez de ${speedDiff.toFixed(1)} km/h pour économiser`
                    : `Slow down by ${speedDiff.toFixed(1)} km/h to save energy`}
                </span>
              ) : speedDiffPercent < 0 ? (
                <span className="text-blue-400">
                  {language === 'fr'
                    ? `Accélérez de ${Math.abs(speedDiff).toFixed(1)} km/h pour optimiser`
                    : `Speed up by ${Math.abs(speedDiff).toFixed(1)} km/h to optimize`}
                </span>
              ) : (
                <span className="text-emerald-400">
                  {language === 'fr' ? 'Vitesse optimale !' : 'Optimal speed!'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Indicateur de progression du segment */}
        {currentSegment && (
          <div className="mt-4 text-center">
            <div className="text-xs text-emerald-200/70">
              {language === 'fr' ? 'Segment' : 'Segment'} {currentSegment.index + 1} • {currentSegment.distance ? (currentSegment.distance / 1000).toFixed(2) : '0.00'} km
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeNavigation;

