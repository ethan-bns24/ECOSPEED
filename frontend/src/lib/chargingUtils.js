/**
 * Calcule la distance en kilomètres entre deux points GPS (formule de Haversine)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Trouve la meilleure borne de recharge en combinant distance et puissance
 * Privilégie les bornes avec une grande puissance pour charger plus vite
 */
export function findNearestStation(lat, lon, stations, maxDistanceKm = 80) {
  if (!stations || stations.length === 0) return null;
  
  let bestStation = null;
  let bestScore = -Infinity;
  
  stations.forEach(station => {
    if (!station.latitude || !station.longitude || 
        isNaN(station.latitude) || isNaN(station.longitude)) {
      return;
    }
    
    // Ne considérer que les stations disponibles
    if (station.status !== 'Dispo') return;
    
    const distance = calculateDistance(lat, lon, station.latitude, station.longitude);
    
    // Ignorer les stations trop éloignées
    if (distance > maxDistanceKm) return;
    
    // Puissance de la borne (défaut 50 kW si non spécifiée)
    const powerKw = station.powerKw || 50;
    
    // Score qui combine distance et puissance
    // Plus la puissance est élevée, meilleur est le score
    // Plus la distance est faible, meilleur est le score
    // On pondère la puissance plus fortement (x3) car elle impacte directement le temps de charge
    // Score = (puissance * 3) / (distance + 1) pour éviter division par zéro
    // On ajoute aussi un bonus pour les très fortes puissances (>150 kW)
    const powerBonus = powerKw > 150 ? 50 : powerKw > 100 ? 25 : 0;
    const score = (powerKw * 3 + powerBonus) / (distance + 1);
    
    if (score > bestScore) {
      bestScore = score;
      bestStation = { ...station, distanceKm: distance };
    }
  });
  
  return bestStation;
}

/**
 * Calcule où sur le trajet on a besoin de recharger et trouve les bornes les plus proches
 * @param {string} energyType - 'eco_energy' ou 'limit_energy' pour calculer les recharges selon le mode de conduite
 */
export function findChargingStationsOnRoute(
  segments,
  routeCoordinates,
  batteryKwh,
  batteryStartPct,
  stations,
  energyType = 'eco_energy',
  targetArrivalPct = 20,
  maxDistanceKm = 80
) {
  if (!segments || segments.length === 0 || !batteryKwh || !stations || stations.length === 0) {
    return [];
  }
  
  const chargingPoints = [];
  const energyAtStart = batteryKwh * (batteryStartPct / 100);
  const usableCapacity = batteryKwh * 0.6; // 60% utilisable (de 20% à 80%)
  const targetPct = Math.max(20, Math.min(80, targetArrivalPct || 20)); // objectif borne 20-80
  const targetEnergy = batteryKwh * (targetPct / 100);
  const minAllowedEnergy = targetEnergy; // seuil déclencheur (objectif d'arrivée)
  
  let cumulativeEnergy = 0;
  let currentBatteryLevel = energyAtStart;
  let lastChargeEnergy = 0;
  
  // Parcourir les segments pour trouver où on a besoin de recharger
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    // Utiliser le type d'énergie spécifié (eco_energy ou limit_energy)
    const segmentEnergy = segment[energyType] || 0;
    cumulativeEnergy += segmentEnergy;
    currentBatteryLevel = energyAtStart - cumulativeEnergy + lastChargeEnergy;
    
    // Si la batterie descend en dessous du seuil cible (au moins 20%), on doit recharger
    if (currentBatteryLevel < minAllowedEnergy) {
      // Trouver la position sur le trajet où on passe sous le seuil
      const thresholdEnergy = minAllowedEnergy;
      const segmentStartEnergy = energyAtStart - (cumulativeEnergy - segmentEnergy) + lastChargeEnergy;
      const segmentEndEnergy = currentBatteryLevel;
      
      // Interpoler la position dans le segment
      let chargeLat, chargeLon;
      
      if (routeCoordinates && routeCoordinates.length > 0) {
        // Utiliser les coordonnées de la route pour une meilleure précision
        // Estimer la position basée sur la proportion d'énergie consommée
        const energyRatio = segmentEnergy > 0 
          ? (thresholdEnergy - segmentStartEnergy) / (segmentEndEnergy - segmentStartEnergy)
          : 0.5;
        
        // Trouver l'index approximatif dans routeCoordinates
        const segmentIndex = Math.floor((i / segments.length) * routeCoordinates.length);
        const nextIndex = Math.min(segmentIndex + 1, routeCoordinates.length - 1);
        
        if (routeCoordinates[segmentIndex] && routeCoordinates[nextIndex]) {
          chargeLat = routeCoordinates[segmentIndex][0] + 
            (routeCoordinates[nextIndex][0] - routeCoordinates[segmentIndex][0]) * energyRatio;
          chargeLon = routeCoordinates[segmentIndex][1] + 
            (routeCoordinates[nextIndex][1] - routeCoordinates[segmentIndex][1]) * energyRatio;
        } else {
          chargeLat = segment.lat_end;
          chargeLon = segment.lon_end;
        }
      } else {
        // Fallback sur les coordonnées du segment
        chargeLat = segment.lat_end;
        chargeLon = segment.lon_end;
      }
      
      // Trouver la borne la plus proche
      const nearestStation = findNearestStation(chargeLat, chargeLon, stations, maxDistanceKm);
      
      // Eviter de dupliquer la même station
      const isDuplicate = nearestStation && chargingPoints.some((cp) => {
        const sameName = cp.station?.name === nearestStation.name;
        const samePos = Math.abs((cp.lat || 0) - chargeLat) < 0.01 && Math.abs((cp.lon || 0) - chargeLon) < 0.01;
        return sameName && samePos;
      });
      
      if (nearestStation && !isDuplicate) {
        const batteryLevelPctAtCharge = Math.max(0, Math.min(100, (currentBatteryLevel / batteryKwh) * 100));
        // Énergie à ajouter pour revenir à l'objectif (max 60% de la capacité)
        const neededEnergy = Math.max(0, targetEnergy - currentBatteryLevel);
        const energyToCharge = Math.min(usableCapacity, neededEnergy > 0 ? neededEnergy : usableCapacity);
        const chargingPowerKw = nearestStation.powerKw || 50; // Puissance de la borne en kW (défaut 50 kW)
        const chargingTimeHours = energyToCharge / chargingPowerKw; // Temps en heures
        const chargingTimeMinutes = chargingTimeHours * 60; // Temps en minutes
        
        chargingPoints.push({
          segmentIndex: i,
          lat: chargeLat,
          lon: chargeLon,
          station: nearestStation,
          batteryLevelAtCharge: batteryLevelPctAtCharge,
          chargingTimeMinutes: chargingTimeMinutes,
          energyToCharge: energyToCharge,
        });
        
        // Après recharge, on ajoute l'énergie chargée
        lastChargeEnergy += energyToCharge;
        currentBatteryLevel = Math.min(batteryKwh, currentBatteryLevel + energyToCharge);
      }
    }
  }

  // Vérifier SOC à l'arrivée et ajouter une recharge finale si besoin
  const totalEnergyConsumed = segments.reduce((sum, s) => sum + (s[energyType] || 0), 0);
  const finalEnergy = energyAtStart - totalEnergyConsumed + lastChargeEnergy;
  if (finalEnergy < targetEnergy && routeCoordinates && routeCoordinates.length > 0) {
    const endLat = routeCoordinates[routeCoordinates.length - 1][0];
    const endLon = routeCoordinates[routeCoordinates.length - 1][1];
    const nearestStation = findNearestStation(endLat, endLon, stations, maxDistanceKm);
    if (nearestStation && !chargingPoints.some((cp) => cp.station?.name === nearestStation.name)) {
      const neededEnergy = Math.max(0, targetEnergy - finalEnergy);
      const energyToCharge = Math.min(usableCapacity, neededEnergy);
      const chargingPowerKw = nearestStation.powerKw || 50;
      const chargingTimeHours = energyToCharge / chargingPowerKw;
      const chargingTimeMinutes = chargingTimeHours * 60;
      chargingPoints.push({
        segmentIndex: segments.length - 1,
        lat: endLat,
        lon: endLon,
        station: nearestStation,
        batteryLevelAtCharge: Math.max(0, Math.min(100, (finalEnergy / batteryKwh) * 100)),
        chargingTimeMinutes,
        energyToCharge,
      });
    }
  }
  
  return chargingPoints;
}

