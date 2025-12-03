import { 
  Award, 
  Plane, 
  Zap, 
  Battery, 
  Trophy, 
  Crown, 
  Car, 
  Route,
  CheckCircle
} from 'lucide-react';
import { TRANSLATIONS } from './translations';

/**
 * Calcule tous les badges disponibles basés sur les données des trajets
 * @param {Array} trips - Liste des trajets
 * @param {string} language - Langue ('fr' ou 'en')
 */
export function calculateBadges(trips, language = 'en') {
  const totalTrips = trips.length;
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
  const totalEnergySavedKwh = trips.reduce(
    (sum, t) => sum + (t.energySavedKwh || 0),
    0
  );
  const maxScore = trips.reduce(
    (max, t) => (t.ecoScore && t.ecoScore > max ? t.ecoScore : max),
    0
  );

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const badges = [
    {
      id: 'first-trip',
      name: t.badgeNames['first-trip'],
      description: t.badgeDescriptions['first-trip'],
      icon: CheckCircle,
      progress: Math.min(100, (totalTrips > 0 ? 100 : 0)),
      unlocked: totalTrips > 0,
      threshold: 1,
      current: totalTrips,
    },
    {
      id: 'traveler',
      name: t.badgeNames['traveler'],
      description: t.badgeDescriptions['traveler'],
      icon: Plane,
      progress: Math.min(100, (totalDistanceKm / 500) * 100),
      unlocked: totalDistanceKm >= 500,
      threshold: 500,
      current: Math.round(totalDistanceKm),
    },
    {
      id: 'economical',
      name: t.badgeNames['economical'],
      description: t.badgeDescriptions['economical'],
      icon: Zap,
      progress: Math.min(100, (totalEnergySavedKwh / 10) * 100),
      unlocked: totalEnergySavedKwh >= 10,
      threshold: 10,
      current: Math.round(totalEnergySavedKwh * 10) / 10,
    },
    {
      id: 'eco-champion',
      name: t.badgeNames['eco-champion'],
      description: t.badgeDescriptions['eco-champion'],
      icon: Battery,
      progress: Math.min(100, (totalEnergySavedKwh / 50) * 100),
      unlocked: totalEnergySavedKwh >= 50,
      threshold: 50,
      current: Math.round(totalEnergySavedKwh * 10) / 10,
    },
    {
      id: 'model-driver',
      name: t.badgeNames['model-driver'],
      description: t.badgeDescriptions['model-driver'],
      icon: Trophy,
      progress: Math.min(100, (maxScore / 80) * 100),
      unlocked: maxScore >= 80,
      threshold: 80,
      current: maxScore,
    },
    {
      id: 'expert',
      name: t.badgeNames['expert'],
      description: t.badgeDescriptions['expert'],
      icon: Crown,
      progress: Math.min(100, (maxScore / 90) * 100),
      unlocked: maxScore >= 90,
      threshold: 90,
      current: maxScore,
    },
    {
      id: 'regular',
      name: t.badgeNames['regular'],
      description: t.badgeDescriptions['regular'],
      icon: Car,
      progress: Math.min(100, (totalTrips / 5) * 100),
      unlocked: totalTrips >= 5,
      threshold: 5,
      current: totalTrips,
    },
    {
      id: 'frequent',
      name: t.badgeNames['frequent'],
      description: t.badgeDescriptions['frequent'],
      icon: Route,
      progress: Math.min(100, (totalTrips / 20) * 100),
      unlocked: totalTrips >= 20,
      threshold: 20,
      current: totalTrips,
    },
    {
      id: 'dedicated',
      name: t.badgeNames['dedicated'],
      description: t.badgeDescriptions['dedicated'],
      icon: Award,
      progress: Math.min(100, (totalDistanceKm / 1000) * 100),
      unlocked: totalDistanceKm >= 1000,
      threshold: 1000,
      current: Math.round(totalDistanceKm),
    },
    {
      id: 'marathoner',
      name: t.badgeNames['marathoner'],
      description: t.badgeDescriptions['marathoner'],
      icon: Route,
      progress: Math.min(100, (totalDistanceKm / 5000) * 100),
      unlocked: totalDistanceKm >= 5000,
      threshold: 5000,
      current: Math.round(totalDistanceKm),
    },
    {
      id: 'energy-hero',
      name: t.badgeNames['energy-hero'],
      description: t.badgeDescriptions['energy-hero'],
      icon: Battery,
      progress: Math.min(100, (totalEnergySavedKwh / 200) * 100),
      unlocked: totalEnergySavedKwh >= 200,
      threshold: 200,
      current: Math.round(totalEnergySavedKwh * 10) / 10,
    },
    {
      id: 'legend',
      name: t.badgeNames['legend'],
      description: t.badgeDescriptions['legend'],
      icon: Crown,
      progress: Math.min(100, (totalTrips / 100) * 100),
      unlocked: totalTrips >= 100,
      threshold: 100,
      current: totalTrips,
    },
  ];

  return badges;
}

