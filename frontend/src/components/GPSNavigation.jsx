import React, { useState, useEffect } from 'react';
import { Navigation, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RotateCw } from 'lucide-react';
import { getAppSettings } from '../lib/settingsStorage';
import { TRANSLATIONS } from '../lib/translations';

// Fonction pour calculer l'angle entre deux points (en degrés)
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

// Fonction pour calculer l'angle de virage entre deux segments
function calculateTurnAngle(prevBearing, currentBearing) {
  let angle = currentBearing - prevBearing;
  if (angle > 180) angle -= 360;
  if (angle < -180) angle += 360;
  return angle;
}

// Fonction pour obtenir l'instruction de navigation
function getNavigationInstruction(angle, distance, language = 'fr') {
  const absAngle = Math.abs(angle);
  const t = TRANSLATIONS[language]?.navigation || TRANSLATIONS.en.navigation;
  
  if (absAngle < 15) {
    return { type: 'straight', icon: ArrowUp, text: t.continueStraight || 'Continue straight' };
  } else if (absAngle < 45) {
    if (angle > 0) {
      return { type: 'slight-right', icon: ArrowRight, text: t.slightRight || 'Slight right' };
    } else {
      return { type: 'slight-left', icon: ArrowLeft, text: t.slightLeft || 'Slight left' };
    }
  } else if (absAngle < 135) {
    if (angle > 0) {
      return { type: 'right', icon: ArrowRight, text: t.turnRight || 'Turn right' };
    } else {
      return { type: 'left', icon: ArrowLeft, text: t.turnLeft || 'Turn left' };
    }
  } else {
    if (angle > 0) {
      return { type: 'sharp-right', icon: RotateCw, text: t.sharpRight || 'Sharp right' };
    } else {
      return { type: 'sharp-left', icon: RotateCw, text: t.sharpLeft || 'Sharp left' };
    }
  }
}

const GPSNavigation = ({ 
  currentSegment, 
  nextSegment,
  segments,
  currentSegmentIndex,
  distanceToNextTurn,
  currentPosition
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

  // Calculer l'instruction de navigation
  let instruction = null;
  let distanceToTurn = distanceToNextTurn || 0;

  if (nextSegment && currentSegment) {
    // Calculer le bearing du segment actuel
    const currentBearing = calculateBearing(
      currentSegment.lat_start,
      currentSegment.lon_start,
      currentSegment.lat_end,
      currentSegment.lon_end
    );

    // Calculer le bearing du segment suivant
    const nextBearing = calculateBearing(
      nextSegment.lat_start,
      nextSegment.lon_start,
      nextSegment.lat_end,
      nextSegment.lon_end
    );

    // Calculer l'angle de virage
    const turnAngle = calculateTurnAngle(currentBearing, nextBearing);
    
    // Obtenir l'instruction avec la langue
    instruction = getNavigationInstruction(turnAngle, distanceToTurn, language);
  } else {
    // Pas de segment suivant, continuer tout droit
    const t = TRANSLATIONS[language]?.navigation || TRANSLATIONS.en.navigation;
    instruction = { type: 'straight', icon: ArrowUp, text: t.continueStraight || 'Continue straight' };
  }

  const InstructionIcon = instruction?.icon || ArrowUp;

  // Formater la distance
  const formatDistance = (km) => {
    if (km < 0.1) {
      return `${Math.round(km * 1000)} m`;
    } else if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    } else {
      return `${km.toFixed(1)} km`;
    }
  };

  // Formater le temps restant en heures + minutes
  const formatTime = (minutes, lang = 'fr') => {
    const totalMinutes = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours <= 0) {
      return lang === 'fr' ? `${mins} min` : `${mins} min`;
    }
    if (lang === 'fr') {
      return `${hours} h ${mins.toString().padStart(2, '0')} min`;
    }
    return `${hours} h ${mins.toString().padStart(2, '0')} min`;
  };

  // Infos globales restantes (distance + temps estimé)
  const remainingInfo = (() => {
    if (!segments || !Array.isArray(segments) || currentSegmentIndex >= segments.length) {
      return { distanceKm: 0, timeMin: 0 };
    }
    const remainingSegments = segments.slice(currentSegmentIndex);
    const totalRemainingDistanceM = remainingSegments.reduce(
      (sum, seg) => sum + (seg.distance || 0),
      0
    );
    const totalRemainingTimeSec = remainingSegments.reduce(
      (sum, seg) => sum + (seg.eco_time || seg.real_time || 0),
      0
    );
    return {
      distanceKm: totalRemainingDistanceM / 1000,
      timeMin: totalRemainingTimeSec / 60,
    };
  })();

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {/* Barre GPS principale, adaptée mobile + thème Ecospeed */}
      <div className="pointer-events-auto bg-[#0a2e1a]/95 backdrop-blur-md border-b border-emerald-900/60 px-3 py-2 md:px-6 md:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 md:gap-6">
          {/* Instruction de navigation */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center">
              <InstructionIcon className="w-6 h-6 md:w-7 md:h-7 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] md:text-xs text-emerald-200/80">
                {t.in || 'In'} {formatDistance(distanceToTurn)}
              </div>
              <div className="text-sm md:text-xl font-semibold text-emerald-50 truncate">
                {instruction?.text || t.continueStraight || 'Continue straight'}
              </div>
            </div>
          </div>

          {/* Distance et temps restants */}
          {segments && currentSegmentIndex < segments.length && (
            <div className="text-right shrink-0">
              <div className="text-[11px] md:text-xs text-emerald-200/80">
                {t.distanceRemaining || 'Distance remaining'}
              </div>
              <div className="text-lg md:text-2xl font-bold text-emerald-300">
                {formatDistance(remainingInfo.distanceKm)}
              </div>
              <div className="text-[10px] md:text-xs text-emerald-200/80">
                {language === 'fr'
                  ? `Temps restant ~ ${formatTime(remainingInfo.timeMin, 'fr')}`
                  : `Remaining time ~ ${formatTime(remainingInfo.timeMin, 'en')}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPSNavigation;

