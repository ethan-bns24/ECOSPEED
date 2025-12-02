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

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-b from-[#0a2e1a] via-[#0a2e1a]/95 to-transparent border-b border-emerald-800/30 z-40 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Instruction de navigation */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center ${
              instruction?.type === 'straight' ? 'bg-emerald-500/30' :
              instruction?.type === 'slight-right' || instruction?.type === 'slight-left' ? 'bg-blue-500/30' :
              instruction?.type === 'right' || instruction?.type === 'left' ? 'bg-amber-500/30' :
              'bg-red-500/30'
            } border-2 border-white/20`}>
              <InstructionIcon className={`w-8 h-8 md:w-10 md:h-10 ${
                instruction?.type === 'straight' ? 'text-emerald-400' :
                instruction?.type === 'slight-right' || instruction?.type === 'slight-left' ? 'text-blue-400' :
                instruction?.type === 'right' || instruction?.type === 'left' ? 'text-amber-400' :
                'text-red-400'
              }`} 
              style={{
                transform: instruction?.type === 'right' || instruction?.type === 'slight-right' 
                  ? 'rotate(0deg)' 
                  : instruction?.type === 'left' || instruction?.type === 'slight-left'
                  ? 'scaleX(-1)'
                  : 'none'
              }}
              />
            </div>
            <div>
              <div className="text-sm md:text-base text-emerald-200/70 mb-1">
                {t.in || 'In'} {formatDistance(distanceToTurn)}
              </div>
              <div className="text-lg md:text-2xl font-bold text-white">
                {instruction?.text || t.continueStraight || 'Continue straight'}
              </div>
            </div>
          </div>

          {/* Distance totale restante */}
          {segments && currentSegmentIndex < segments.length && (
            <div className="text-right">
              <div className="text-xs text-emerald-200/70 mb-1">
                {t.distanceRemaining || 'Distance remaining'}
              </div>
              <div className="text-xl md:text-2xl font-bold text-emerald-400">
                {(() => {
                  const remainingSegments = segments.slice(currentSegmentIndex);
                  const totalRemaining = remainingSegments.reduce((sum, seg) => sum + (seg.distance || 0), 0);
                  return formatDistance(totalRemaining / 1000);
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GPSNavigation;

