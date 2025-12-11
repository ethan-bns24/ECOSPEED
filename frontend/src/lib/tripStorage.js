// Utilitaires pour stocker et relire les trajets calculés par /analysis

const STORAGE_KEY = 'ecospeed_trips_v1';

export function updateTripActualSoc(tripId, actualArrivalSoc) {
  const trips = loadTrips();
  const idx = trips.findIndex((t) => t.id === tripId);
  if (idx === -1) return null;
  trips[idx].actualArrivalSoc =
    actualArrivalSoc === null || actualArrivalSoc === undefined
      ? null
      : Math.max(0, Math.min(100, actualArrivalSoc));
  saveTrips(trips);
  return trips[idx];
}

function loadTrips() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error('Failed to load trips from localStorage', e);
    return [];
  }
}

function saveTrips(trips) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch (e) {
    console.error('Failed to save trips to localStorage', e);
  }
}

// Agrège les segments comme dans KPICards pour en déduire les KPI principaux
export function computeKpisFromSegments(segments) {
  if (!Array.isArray(segments) || segments.length === 0) {
    return {
      totalEcoEnergy: 0,
      totalRealEnergy: 0,
      totalLimitEnergy: 0,
      energySavedVsLimit: 0,
      energySavedVsLimitPercent: 0,
      totalEcoTimeMin: 0,
      totalLimitTimeMin: 0,
      co2AvoidedKg: 0,
      totalDistanceKm: 0,
    };
  }

  const totalEcoEnergy = segments.reduce((sum, s) => sum + (s.eco_energy || 0), 0);
  const totalRealEnergy = segments.reduce((sum, s) => sum + (s.real_energy || 0), 0);
  const totalLimitEnergy = segments.reduce((sum, s) => sum + (s.limit_energy || 0), 0);

  const totalEcoTimeMin = segments.reduce((sum, s) => sum + (s.eco_time || 0), 0) / 60;
  const totalLimitTimeMin = segments.reduce((sum, s) => sum + (s.limit_time || 0), 0) / 60;

  const energySavedVsLimit = totalLimitEnergy - totalEcoEnergy;
  const energySavedVsLimitPercent =
    totalLimitEnergy > 0 ? (energySavedVsLimit / totalLimitEnergy) * 100 : 0;

  // CO2 évité (approx) : 0.5 kg par kWh économisé
  const co2AvoidedKg = energySavedVsLimit * 0.5;

  const totalDistanceKm =
    segments.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

  return {
    totalEcoEnergy,
    totalRealEnergy,
    totalLimitEnergy,
    energySavedVsLimit,
    energySavedVsLimitPercent,
    totalEcoTimeMin,
    totalLimitTimeMin,
    co2AvoidedKg,
    totalDistanceKm,
  };
}

// Score d’éco‑conduite simple basé sur le pourcentage d’énergie économisée
export function computeEcoScore(energySavedPercent) {
  // 0% économie → score 50, 50%+ → score 100 (plafonné)
  const base = 50;
  const score = base + Math.max(0, Math.min(50, energySavedPercent / 1));
  return Math.round(Math.max(0, Math.min(100, score)));
}

// Calcule le nombre de recharges nécessaires pour un trajet
export function calculateChargingStops(energyKwh, batteryKwh, batteryStartPct, batteryEndPct) {
  if (!batteryKwh || batteryKwh <= 0) return 0;
  
  // Énergie disponible au départ (kWh)
  const energyAtStart = batteryKwh * (batteryStartPct / 100);
  
  // Énergie nécessaire à l'arrivée (kWh)
  const energyAtEnd = batteryKwh * (batteryEndPct / 100);
  
  // Énergie nette nécessaire (on doit avoir energyAtEnd à l'arrivée)
  const netEnergyNeeded = energyKwh - (energyAtStart - energyAtEnd);
  
  // Si on a assez d'énergie, pas besoin de recharger
  if (netEnergyNeeded <= 0) return 0;
  
  // Capacité utilisable de la batterie (on recharge typiquement de 20% à 80% = 60% utilisable)
  // Sur autoroute, on recharge jusqu'à 80% maximum pour optimiser le temps de charge
  const usableBatteryCapacity = batteryKwh * 0.6; // 60% de la capacité totale (de 20% à 80%)
  
  // Nombre de recharges nécessaires (arrondi vers le haut)
  const chargingStops = Math.ceil(netEnergyNeeded / usableBatteryCapacity);
  
  return Math.max(0, chargingStops);
}

// Enregistre un trajet à partir de la réponse /route
export function persistTripFromRoute(routeData, meta = {}) {
  if (!routeData || !routeData.segments) return;

  const {
    totalEcoEnergy,
    energySavedVsLimit,
    energySavedVsLimitPercent,
    totalEcoTimeMin,
    totalLimitTimeMin,
    co2AvoidedKg,
    totalDistanceKm,
  } = computeKpisFromSegments(routeData.segments);

  const ecoScore = computeEcoScore(energySavedVsLimitPercent);
  
  // Calculer le nombre de recharges nécessaires
  const batteryKwh = meta.batteryKwh || null;
  const batteryStartPct = meta.batteryStartPct || 100;
  const batteryEndPct = meta.batteryEndPct || 20;
  const chargingStops = batteryKwh ? calculateChargingStops(totalEcoEnergy, batteryKwh, batteryStartPct, batteryEndPct) : null;

  // Vitesses moyennes pondérées par distance (km/h)
  const distanceKmFromRoute = routeData.total_distance
    ? routeData.total_distance / 1000
    : totalDistanceKm;
  const totalDistanceKmComputed = distanceKmFromRoute;
  let avgLimitSpeedKmh = null;
  let avgEcoSpeedKmh = null;
  if (Array.isArray(routeData.segments) && routeData.segments.length > 0) {
    const distKmSum = routeData.segments.reduce(
      (s, seg) => s + ((seg.distance || seg.distance_m || 0) / 1000),
      0
    );
    const denom = distKmSum > 0 ? distKmSum : totalDistanceKmComputed || 0;
    if (denom > 0) {
      const limitWeighted = routeData.segments.reduce(
        (s, seg) => s + ((seg.limit_speed || 0) * ((seg.distance || seg.distance_m || 0) / 1000)),
        0
      );
      const ecoWeighted = routeData.segments.reduce(
        (s, seg) => s + ((seg.eco_speed || 0) * ((seg.distance || seg.distance_m || 0) / 1000)),
        0
      );
      avgLimitSpeedKmh = limitWeighted / denom;
      avgEcoSpeedKmh = ecoWeighted / denom;
    }
  }

  const trip = {
    id: routeData.route_id || `${Date.now()}`,
    createdAt: Date.now(),
    startLocation: routeData.start_location,
    endLocation: routeData.end_location,
    distanceKm: distanceKmFromRoute,
    ecoEnergyKwh: totalEcoEnergy,
    energySavedKwh: energySavedVsLimit,
    energySavedPercent: energySavedVsLimitPercent,
    ecoTimeMin: totalEcoTimeMin,
    limitTimeMin: totalLimitTimeMin,
    co2SavedKg: co2AvoidedKg,
    ecoScore,
    vehicleName: meta.vehicleName || null,
    numPassengers: meta.numPassengers ?? null,
    chargingStops,
    avgLimitSpeedKmh,
    avgEcoSpeedKmh,
    batteryTargetPct: batteryEndPct,
    actualArrivalSoc: meta.actualArrivalSoc ?? null,
    batteryStartPct,
    batteryKwh,
  };

  const trips = loadTrips();
  // On remplace un trajet existant avec le même id s’il existe
  const existingIndex = trips.findIndex((t) => t.id === trip.id);
  if (existingIndex >= 0) {
    trips[existingIndex] = trip;
  } else {
    trips.unshift(trip);
  }

  saveTrips(trips);
  return trip;
}

export function getAllTrips() {
  return loadTrips().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// Supprime un trajet par son ID
export function deleteTrip(tripId) {
  const trips = loadTrips();
  const filtered = trips.filter(t => t.id !== tripId);
  saveTrips(filtered);
  return filtered;
}

// Supprime tous les trajets
export function deleteAllTrips() {
  saveTrips([]);
  return [];
}


