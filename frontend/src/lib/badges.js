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

/**
 * Calcule tous les badges disponibles basés sur les données des trajets
 */
export function calculateBadges(trips) {
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

  const badges = [
    {
      id: 'first-trip',
      name: 'Premier trajet',
      description: 'Premier trajet optimisé',
      icon: CheckCircle,
      progress: Math.min(100, (totalTrips > 0 ? 100 : 0)),
      unlocked: totalTrips > 0,
      threshold: 1,
      current: totalTrips,
    },
    {
      id: 'traveler',
      name: 'Voyageur',
      description: '500 km en mode ECO',
      icon: Plane,
      progress: Math.min(100, (totalDistanceKm / 500) * 100),
      unlocked: totalDistanceKm >= 500,
      threshold: 500,
      current: Math.round(totalDistanceKm),
    },
    {
      id: 'economical',
      name: 'Économe',
      description: '10 kWh économisés',
      icon: Zap,
      progress: Math.min(100, (totalEnergySavedKwh / 10) * 100),
      unlocked: totalEnergySavedKwh >= 10,
      threshold: 10,
      current: Math.round(totalEnergySavedKwh * 10) / 10,
    },
    {
      id: 'eco-champion',
      name: 'Éco-champion',
      description: '50 kWh économisés',
      icon: Battery,
      progress: Math.min(100, (totalEnergySavedKwh / 50) * 100),
      unlocked: totalEnergySavedKwh >= 50,
      threshold: 50,
      current: Math.round(totalEnergySavedKwh * 10) / 10,
    },
    {
      id: 'model-driver',
      name: 'Conducteur modèle',
      description: 'Score de 80+',
      icon: Trophy,
      progress: Math.min(100, (maxScore / 80) * 100),
      unlocked: maxScore >= 80,
      threshold: 80,
      current: maxScore,
    },
    {
      id: 'expert',
      name: 'Expert',
      description: 'Score de 90+',
      icon: Crown,
      progress: Math.min(100, (maxScore / 90) * 100),
      unlocked: maxScore >= 90,
      threshold: 90,
      current: maxScore,
    },
    {
      id: 'regular',
      name: 'Habitué',
      description: '5 trajets',
      icon: Car,
      progress: Math.min(100, (totalTrips / 5) * 100),
      unlocked: totalTrips >= 5,
      threshold: 5,
      current: totalTrips,
    },
    {
      id: 'frequent',
      name: 'Régulier',
      description: '20 trajets',
      icon: Route,
      progress: Math.min(100, (totalTrips / 20) * 100),
      unlocked: totalTrips >= 20,
      threshold: 20,
      current: totalTrips,
    },
    {
      id: 'dedicated',
      name: 'Dévoué',
      description: '1000 km parcourus',
      icon: Award,
      progress: Math.min(100, (totalDistanceKm / 1000) * 100),
      unlocked: totalDistanceKm >= 1000,
      threshold: 1000,
      current: Math.round(totalDistanceKm),
    },
  ];

  return badges;
}

