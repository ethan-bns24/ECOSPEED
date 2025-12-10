import React, { useState, useEffect, useCallback } from 'react';
import { Gauge, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Bell, BellOff } from 'lucide-react';
import { getAppSettings } from '../lib/settingsStorage';
import { TRANSLATIONS } from '../lib/translations';

const RealTimeNavigation = ({ 
  currentSegment, 
  isNavigating,
  currentSpeed = 0,
  navigationMode = 'eco',
}) => {
  const [language, setLanguage] = useState('en');
  const [muteAlerts, setMuteAlerts] = useState(false);
  const [ecoWarned, setEcoWarned] = useState(false);
  const audioCtxRef = React.useRef(null);
  const limitIntervalRef = React.useRef(null);

  const ensureAudioCtx = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        audioCtxRef.current = new Ctx();
      }
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('Failed to resume audio context:', e);
      }
    }
    return ctx;
  }, []);

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
      if (limitIntervalRef.current) {
        clearInterval(limitIntervalRef.current);
      }
    };
  }, []);

  // Déverrouiller l'audio au démarrage de la navigation
  useEffect(() => {
    if (isNavigating) {
      ensureAudioCtx();
    }
  }, [isNavigating, ensureAudioCtx]);

  // Fonction Web Audio API
  const playBeepWebAudio = useCallback(async (frequency = 900, duration = 0.25, volume = 1.0) => {
    const ctx = await ensureAudioCtx();
    if (!ctx) {
      console.warn('Audio context not available');
      return false;
    }
    
    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Failed to resume audio context:', e);
        return false;
      }
    }
    
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, now);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
      
      console.log(`Playing beep (Web Audio): ${frequency}Hz, ${duration}s, volume ${volume}`);
      return true;
    } catch (e) {
      console.error('Failed to play beep:', e);
      return false;
    }
  }, [ensureAudioCtx]);

  // Fonction alternative avec SpeechSynthesis (fallback)
  const playBeepSpeech = useCallback((isLimit = false) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = isLimit ? 'Bip' : 'Beep';
      utterance.volume = 1.0;
      utterance.rate = 10; // Très rapide pour faire un bip
      utterance.pitch = isLimit ? 2 : 1.5;
      speechSynthesis.speak(utterance);
      console.log(`Playing beep (Speech): ${isLimit ? 'limit' : 'eco'}`);
      return true;
    }
    return false;
  }, []);

  const playBeep = useCallback(async (frequency = 900, duration = 0.25, volume = 1.0, force = false) => {
    if (!force && muteAlerts) return;
    
    // Essayer d'abord avec Web Audio API
    const success = await playBeepWebAudio(frequency, duration, volume);
    
    // Si ça échoue, essayer avec SpeechSynthesis comme fallback
    if (!success) {
      const isLimit = frequency >= 1000;
      playBeepSpeech(isLimit);
    }
  }, [muteAlerts, playBeepWebAudio, playBeepSpeech]);

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  if (!currentSegment) {
    return null;
  }

  const speedLimit = currentSegment.speed_limit || 0;
  const ecoSpeed = currentSegment.eco_speed || 0;
  const targetSpeed = navigationMode === 'limit' ? speedLimit : ecoSpeed;
  const speedDiff = currentSpeed - targetSpeed;
  const distanceM = currentSegment.distance || 0;
  const elevationStart = currentSegment.elevation_start ?? currentSegment.elevationStart ?? 0;
  const elevationEnd = currentSegment.elevation_end ?? currentSegment.elevationEnd ?? elevationStart;
  const elevationDelta = elevationEnd - elevationStart;
  const slopePercent = distanceM > 0 ? (elevationDelta / distanceM) * 100 : 0;
  const ecoEnergyKwh = currentSegment.eco_energy || 0;
  const limitEnergyKwh = currentSegment.limit_energy || 0;
  const ecoWhPerKm = distanceM > 0 ? (ecoEnergyKwh * 1_000_000) / distanceM : 0; // kWh -> Wh/km
  const limitWhPerKm = distanceM > 0 ? (limitEnergyKwh * 1_000_000) / distanceM : 0;

  // Alertes sonores sur dépassement
  useEffect(() => {
    if (!isNavigating || muteAlerts) {
      if (limitIntervalRef.current) {
        clearInterval(limitIntervalRef.current);
        limitIntervalRef.current = null;
      }
      return;
    }

    const overLimit = currentSpeed > speedLimit + 1;
    const overEco = !overLimit && currentSpeed > ecoSpeed + 1;

    // Avertissement ponctuel éco : une seule fois par dépassement, réarmé quand on repasse sous la cible
    if (overEco && !ecoWarned) {
      playBeep(800, 0.3, 1.0);
      setEcoWarned(true);
    } else if (!overEco) {
      setEcoWarned(false);
    }

    // Avertissement récurrent limite : bip périodique tant qu'on est au-dessus
    if (overLimit) {
      if (!limitIntervalRef.current) {
        playBeep(1100, 0.3, 1.0); // bip immédiat
        limitIntervalRef.current = setInterval(() => {
          playBeep(1100, 0.3, 1.0);
        }, 1200); // bip toutes les 1.2s tant que > limite
      }
    } else {
      if (limitIntervalRef.current) {
        clearInterval(limitIntervalRef.current);
        limitIntervalRef.current = null;
      }
    }

    return () => {
      if (limitIntervalRef.current) {
        clearInterval(limitIntervalRef.current);
        limitIntervalRef.current = null;
      }
    };
  }, [currentSpeed, speedLimit, ecoSpeed, isNavigating, muteAlerts, ecoWarned, playBeep]);

  // Couleur principale de la vitesse en fonction de la vitesse éco
  const isBelowTarget = currentSpeed < targetSpeed - 1;
  const isAboveTarget = currentSpeed > targetSpeed + 1;
  const aboveLimit = currentSpeed > speedLimit + 1;
  const speedColorClass = isBelowTarget
    ? 'text-blue-400'
    : isAboveTarget
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

  // Mode nuit / jour auto pour le bandeau bas
  const hour = new Date().getHours();
  const isNight = hour < 7 || hour >= 19;
  const bottomBgClass = isNight
    ? 'from-[#020617] via-[#020617] to-transparent'
    : 'from-[#0a2e1a] via-[#0a2e1a] to-transparent';

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t ${bottomBgClass} border-t border-emerald-800/30 z-50 px-3 py-2 md:p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Bulle Current speed uniquement */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl px-3 py-2 md:p-4 border border-white/10">
          <div className="text-xs text-emerald-200/70 mb-2 flex items-center gap-3">
            <Gauge className="w-4 h-4" />
            <span>{language === 'fr' ? 'Vitesse actuelle' : 'Current speed'}</span>
            <button
              type="button"
              onClick={async () => {
                const ctx = await ensureAudioCtx();
                console.log('Button clicked, audio context state:', ctx?.state);
                // Toujours jouer un son de test pour vérifier que l'audio fonctionne
                await playBeep(600, 0.4, 1.0, true);
                setMuteAlerts((v) => !v);
              }}
              className="ml-auto flex items-center gap-1 text-emerald-200/70 hover:text-emerald-100 transition"
              aria-label={muteAlerts ? 'Activer les alertes sonores' : 'Couper les alertes sonores'}
            >
              {muteAlerts ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {muteAlerts
                  ? language === 'fr' ? 'Alertes coupées' : 'Alerts off'
                  : language === 'fr' ? 'Alertes sonores' : 'Sound alerts'}
              </span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
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
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-1">
                <span className="text-[10px] md:text-xs text-emerald-200/90">
                  {language === 'fr' ? 'Conseillée' : 'Recommended'}
                </span>
                <span className="text-sm md:text-base font-semibold text-emerald-100">
                  {Math.round(targetSpeed)} km/h
                </span>
              </div>
              {aboveLimit && (
                <div className="flex items-center gap-1 animate-pulse">
                  <span className="text-[10px] md:text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold shadow-sm">
                    {speedLimit} km/h
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Message détaillé (caché sur très petit écran pour gagner de la place) */}
          <div className={`hidden sm:inline-flex text-xs md:text-sm items-center gap-1 ${speedStatus.color} mt-1`}>
            <span>{speedStatus.message}</span>
          </div>
          {/* Pente et conso segment */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-emerald-100/80">
            <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-2">
              <div className="text-[11px] text-emerald-100/70">Pente actuelle</div>
              <div className="text-sm font-semibold">
                {slopePercent > 0 ? '+' : ''}{slopePercent.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-2">
              <div className="text-[11px] text-emerald-100/70">Conso segment</div>
              <div className="text-[11px] leading-snug">
                <span className="font-semibold">Éco :</span> {Math.round(ecoWhPerKm)} Wh/km
              </div>
              <div className="text-[11px] leading-snug">
                <span className="font-semibold">Limite :</span> {Math.round(limitWhPerKm)} Wh/km
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNavigation;
