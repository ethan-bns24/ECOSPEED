import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Leaf, Zap, ArrowLeft, Info, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import RouteMap from '../components/RouteMap';
import SpeedChart from '../components/SpeedChart';
import EnergyChart from '../components/EnergyChart';
import TimeChart from '../components/TimeChart';
import KPICards from '../components/KPICards';
import NavigationPanel from '../components/NavigationPanel';
import RealTimeNavigation from '../components/RealTimeNavigation';
import GPSNavigation from '../components/GPSNavigation';
import { toast } from 'sonner';
import { persistTripFromRoute, calculateChargingStops, getAllTrips, computeKpisFromSegments } from '../lib/tripStorage';
import { VEHICLE_PROFILES } from '../lib/vehicleProfiles';
import { calculateBadges } from '../lib/badges';
import { getVehicleSettings, updateVehicleSettings, getAppSettings, getCustomVehicles, getFavoriteLocations, updateFavoriteLocations } from '../lib/settingsStorage';
import { findChargingStationsOnRoute } from '../lib/chargingUtils';
import { TRANSLATIONS as APP_TRANSLATIONS } from '../lib/translations';

// Use environment variable or fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Log pour debug
console.log('Backend URL configured:', BACKEND_URL);
console.log('API endpoint:', API);

// Vehicle Profiles sont maintenant centralisés dans lib/vehicleProfiles

// Traductions locales pour cette page (fusionnées avec les traductions globales)
const PAGE_TRANSLATIONS = {
  fr: {
    back: 'Retour',
    routeConfig: 'Configuration de l\'itinéraire',
    routeConfigDesc: 'Entrez votre point de départ et d\'arrivée',
    startLocation: 'Adresse de départ',
    endLocation: 'Adresse d\'arrivée',
    startPlaceholder: 'Ex: Paris, France',
    endPlaceholder: 'Ex: Lyon, France',
    calculate: 'Calculer le profil éco-vitesse',
    calculating: 'Calcul en cours...',
    vehicleParams: 'Paramètres du véhicule électrique',
    vehicleParamsDesc: 'Ecospeed est conçu pour les véhicules électriques avec freinage régénératif',
    vehicleProfile: 'Profil véhicule',
    selectedAuto: 'sélectionné automatiquement',
    loadPassengers: 'Charge et passagers',
    numPassengers: 'Nombre de passagers',
    avgWeight: 'Poids moyen/personne (kg)',
    climate: 'Climatisation',
    climateIntensity: 'Intensité climatisation (%)',
    batteryStart: 'Batterie au départ (%)',
    batteryEnd: 'Batterie à l\'arrivée (%)',
    airDensity: 'Densité de l\'air (kg/m³)',
    routeMap: 'Carte de l\'itinéraire',
    emptyMass: 'Masse à vide (kg)',
    extraLoad: 'Charge supplémentaire (kg)',
    dragCoeff: 'Coefficient de traînée',
    frontalArea: 'Surface frontale (m²)',
    rollingResistance: 'Résistance au roulement',
    motorEfficiency: 'Efficacité moteur',
    regenEfficiency: 'Efficacité régénération',
    auxPower: 'Puissance auxiliaire (kW)',
    battery: 'Batterie (kWh)',
  },
  en: {
    back: 'Back',
    routeConfig: 'Route Configuration',
    routeConfigDesc: 'Enter your start and end locations',
    startLocation: 'Start Location',
    endLocation: 'End Location',
    startPlaceholder: 'e.g., Paris, France',
    endPlaceholder: 'e.g., Lyon, France',
    calculate: 'Calculate Eco-Speed Profile',
    calculating: 'Calculating...',
    vehicleParams: 'Electric Vehicle Parameters',
    vehicleParamsDesc: 'Ecospeed is designed for electric vehicles with regenerative braking',
    vehicleProfile: 'Vehicle Profile',
    selectedAuto: 'automatically selected',
    loadPassengers: 'Load and passengers',
    numPassengers: 'Number of passengers',
    avgWeight: 'Avg weight per person (kg)',
    climate: 'Climate control',
    climateIntensity: 'Climate intensity (%)',
    batteryStart: 'Battery at start (%)',
    batteryEnd: 'Battery at end (%)',
    airDensity: 'Air density (kg/m³)',
    routeMap: 'Route Map',
    emptyMass: 'Empty Mass (kg)',
    extraLoad: 'Extra Load (kg)',
    dragCoeff: 'Drag Coeff',
    frontalArea: 'Frontal Area (m²)',
    rollingResistance: 'Rolling Resistance',
    motorEfficiency: 'Motor Efficiency',
    regenEfficiency: 'Regen Efficiency',
    auxPower: 'Aux Power (kW)',
    battery: 'Battery (kWh)',
    usableBattery: 'Usable battery (kWh)',
    nominalVoltage: 'Nominal voltage (V)',
    batteryAge: 'Battery age (years)',
    maxChargePower: 'Max DC charge power (kW)',
  },
};

// Fusionner les traductions locales avec les traductions globales
const TRANSLATIONS = {
  fr: { ...APP_TRANSLATIONS.fr, ...PAGE_TRANSLATIONS.fr },
  en: { ...APP_TRANSLATIONS.en, ...PAGE_TRANSLATIONS.en },
};

// Helper function pour formater le temps en heures et minutes
const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

const AnalysisPage = () => {
  const navigate = useNavigate();
  
  // Language and theme state - initialiser avec des valeurs par défaut
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    const { language: lang, theme: thm } = getAppSettings();
    setLanguage(lang);
    setTheme(thm);
    
    const handler = (event) => {
      const detail = event.detail || {};
      if (detail.language) setLanguage(detail.language);
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
  
  const t = TRANSLATIONS[language] || TRANSLATIONS.en || TRANSLATIONS.fr;
  const isDark = theme === 'dark';
  
  // Form state
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(
    VEHICLE_PROFILES && VEHICLE_PROFILES.length > 0 ? VEHICLE_PROFILES[0].name : ''
  );
  const [customVehicle, setCustomVehicle] = useState({
    name: 'Custom',
    empty_mass: 1900,
    extra_load: 150,
    drag_coefficient: 0.62, // CdA
    frontal_area: 2.2,
    rolling_resistance: 0.010,
    motor_efficiency: 0.90,
    regen_efficiency: 0.60,
    aux_power_kw: 2.0,
    battery_kwh: 60,
    usable_battery_kwh: 55,
    nominal_voltage: 400,
    battery_age_years: 0,
    max_charge_kw: 150,
  });
  
  // Additional parameters
  const [numPassengers, setNumPassengers] = useState(1);
  const [avgWeightKg, setAvgWeightKg] = useState(75);
  const [useClimate, setUseClimate] = useState(false);
  const [climateIntensity, setClimateIntensity] = useState(50);
  const [batteryStartPct, setBatteryStartPct] = useState(100);
  const [batteryEndPct, setBatteryEndPct] = useState(20); // clampé 0-100
  const [rhoAir, setRhoAir] = useState(1.225);
  
  // Route and analysis state
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [routeChargingStations, setRouteChargingStations] = useState([]);
  const [limitChargingStations, setLimitChargingStations] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [distanceToNextTurn, setDistanceToNextTurn] = useState(0);
  const [userLocation, setUserLocation] = useState(null); // Position GPS réelle si disponible
  const [useRealGps, setUseRealGps] = useState(false); // Navigation basée sur GPS réel
  const gpsWatchIdRef = useRef(null);
  const [demoMode, setDemoMode] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [favoriteLocations, setFavoriteLocations] = useState({ home: '', work: '' });
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [endSummary, setEndSummary] = useState(null);
  const [endBadges, setEndBadges] = useState([]);
  const [endActualSoc, setEndActualSoc] = useState('');
  const [isRecalculatingRoute, setIsRecalculatingRoute] = useState(false);
  const [searchChargingStations, setSearchChargingStations] = useState(true);
  const [navigationMode, setNavigationMode] = useState('eco'); // 'eco' ou 'limit'
  
  // Vehicle profiles: filtrées par les préférences (véhicules actifs)
  const [availableProfiles, setAvailableProfiles] = useState(
    VEHICLE_PROFILES && VEHICLE_PROFILES.length > 0 ? VEHICLE_PROFILES : []
  );

  useEffect(() => {
    // Charger les préférences véhicules
    try {
      const { enabledVehicles, defaultVehicleName } = getVehicleSettings() || {};
      const storedCustom = getCustomVehicles() || [];
      const allProfiles = [
        ...VEHICLE_PROFILES,
        ...storedCustom,
      ];
      let profiles = [];

      // Seuls les véhicules marqués comme "par défaut" (dans enabledVehicles) apparaissent
      if (enabledVehicles && enabledVehicles.length > 0) {
        profiles = allProfiles.filter((p) => enabledVehicles.includes(p.name));
      } else {
        // Si aucune préférence encore enregistrée, on choisit la première voiture
        const first = allProfiles[0]?.name;
        if (first) {
          profiles = allProfiles.filter((p) => p.name === first);
          updateVehicleSettings({
            enabledVehicles: [first],
            defaultVehicleName: first,
          });
        } else {
          // Fallback : tous les véhicules si aucune préférence
          profiles = allProfiles;
        }
      }

      setAvailableProfiles(profiles);

      // Sélectionner le véhicule par défaut, ou le premier de la liste filtrée
      const preferredName =
        (defaultVehicleName &&
          profiles.find((p) => p.name === defaultVehicleName)?.name) ||
        profiles[0]?.name ||
        VEHICLE_PROFILES[0]?.name;

      setSelectedProfile(preferredName);
    } catch (e) {
      console.error('Failed to load vehicle settings', e);
    }
  }, []);

  // Charger les raccourcis domicile / travail
  useEffect(() => {
    try {
      const fav = getFavoriteLocations();
      setFavoriteLocations(fav);
    } catch (e) {
      console.error('Failed to load favorite locations', e);
    }
  }, []);

  // Détecter si on est sur mobile (pour quelques réglages d'UI)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth < 768;
    setIsMobileDevice(mobile);
  }, []);

  // Pendant la navigation, suivre en continu la position GPS réelle de l'utilisateur
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator) || demoMode) {
      return;
    }

    if (!isNavigating) {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
      setUseRealGps(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        setCurrentPosition([latitude, longitude]);
        setUseRealGps(true);

        if (typeof speed === 'number' && !Number.isNaN(speed) && speed >= 0) {
          const kmh = speed * 3.6;
          setCurrentSpeed(kmh);
        }
      },
      (err) => {
        console.warn('Geolocation watch error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );

    gpsWatchIdRef.current = watchId;

    return () => {
      if (gpsWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(gpsWatchIdRef.current);
        gpsWatchIdRef.current = null;
      }
    };
  }, [isNavigating, demoMode]);

  // Mode démo clavier (Z / S) pour ajuster la vitesse manuellement (uniquement si mode démo activé)
  useEffect(() => {
    if (typeof window === 'undefined' || isMobileDevice === true || !demoMode) return;

    const handleKeyDown = (event) => {
      if (!isNavigating || useRealGps || !routeData || !routeData.segments) return;
      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 's') return;

      const currentSegment = routeData.segments[currentSegmentIndex];
      if (!currentSegment) return;

      setDemoMode(true);

      setCurrentSpeed((prev) => {
        let base = prev;
        if (!base || base <= 0) {
          base = Math.max(0, (currentSegment.eco_speed || 0) - 2);
        }
        if (key === 'z') {
          return base + 1;
        } else {
          return Math.max(0, base - 1);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavigating, useRealGps, routeData, currentSegmentIndex, demoMode, isMobileDevice]);

  // Tenter de récupérer la localisation de l'utilisateur une fois au chargement
  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lon: longitude });
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  // Détection de sortie de trajet en mode GPS réel : si on est trop loin de la trace, on recalcule un itinéraire
  useEffect(() => {
    if (
      !isNavigating ||
      !useRealGps ||
      !routeData ||
      !Array.isArray(routeData.route_coordinates) ||
      routeData.route_coordinates.length === 0 ||
      !currentPosition ||
      !endLocation
    ) {
      return;
    }

    const [lat, lon] = currentPosition;

    let minDistKm = Infinity;
    for (const coord of routeData.route_coordinates) {
      if (!Array.isArray(coord) || coord.length < 2) continue;
      const d = haversineDistanceKm(lat, lon, coord[0], coord[1]);
      if (d < minDistKm) {
        minDistKm = d;
      }
    }

    // Seuil : si on est à plus de 150 m de la trace, on considère qu'on a quitté l'itinéraire.
    // On évite les recalculs en boucle en vérifiant si un calcul est déjà en cours.
    if (minDistKm > 0.15 && Number.isFinite(minDistKm)) {
      if (loading || isRecalculatingRoute) return;
      const newStart = `${lat},${lon}`;
      setStartLocation(newStart);
      setIsRecalculatingRoute(true);
      toast.info(
        language === 'fr'
          ? 'Vous avez quitté le trajet, recalcul de l’itinéraire...'
          : 'You left the route, recalculating...'
      );
      (async () => {
        try {
          await performRouteCalculation(newStart);
        } finally {
          setIsRecalculatingRoute(false);
        }
      })();
    }
  }, [currentPosition, isNavigating, useRealGps, routeData, endLocation, language, loading, isRecalculatingRoute]);

  const getSelectedVehicleData = () => {
    if (selectedProfile === 'Custom') {
      return customVehicle;
    }
    // D'abord, essayer dans la liste de profils disponibles (inclut les véhicules personnalisés)
    if (availableProfiles && availableProfiles.length > 0) {
      const found = availableProfiles.find((p) => p.name === selectedProfile);
      if (found) return found;
    }
    // Fallback sur les profils statiques
    if (!VEHICLE_PROFILES || VEHICLE_PROFILES.length === 0) {
      return customVehicle;
    }
    return VEHICLE_PROFILES.find(p => p.name === selectedProfile) || (VEHICLE_PROFILES[0] || customVehicle);
  };

  // Petite fonction utilitaire pour calculer une distance approximative (Haversine) en kilomètres
  const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (
      typeof lat1 !== 'number' ||
      typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' ||
      typeof lon2 !== 'number'
    ) {
      return Infinity;
    }
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // Rayon moyen de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fonction interne qui effectue réellement l'appel au backend avec un point de départ résolu
  const performRouteCalculation = async (startValue) => {
    const resolvedStart = startValue;

    setLoading(true);
    setShowResults(false);
    setRouteChargingStations([]); // Réinitialiser les bornes de recharge au début du calcul
    setLimitChargingStations([]); // Réinitialiser aussi les bornes pour le mode limite
    
    try {
      const vehicle = getSelectedVehicleData();
      // Objectif d'arrivée clampé entre 20% et 80% pour rester réaliste
      const targetArrivalPct = Math.max(20, Math.min(80, batteryEndPct ?? 20));
      
      const requestData = {
        start: resolvedStart,
        end: endLocation,
        vehicle_profile: vehicle,
        user_max_speed: 130,
        num_passengers: numPassengers,
        avg_weight_kg: avgWeightKg,
        use_climate: useClimate,
        climate_intensity: climateIntensity,
        battery_start_pct: batteryStartPct,
        battery_end_pct: targetArrivalPct,
        rho_air: rhoAir
      };
      
      console.log('Sending request to:', `${API}/route`);
      console.log('Backend URL:', BACKEND_URL);
      console.log('Request data:', requestData);
      console.log('Passengers:', numPassengers, 'Avg weight:', avgWeightKg);
      
      const response = await axios.post(`${API}/route`, requestData, {
        timeout: 60000, // 60 secondes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setRouteData(response.data);
      setCurrentSegmentIndex(0);
      setShowResults(true);
      
      // Récupérer les bornes de recharge si l'option est activée
      // On calcule les bornes pour les deux modes (éco-conduite et limite de vitesse)
      if (searchChargingStations) {
        try {
          const stationsResponse = await axios.get(`${API}/charging-stations`, {
            timeout: 60000,
          });
          const allStations = stationsResponse.data || [];

          const batteryKwh = vehicle?.battery_kwh || null;
          if (batteryKwh && response.data.segments && response.data.route_coordinates) {
            // Bornes pour le mode éco-conduite
            const ecoStationsOnRoute = findChargingStationsOnRoute(
              response.data.segments,
              response.data.route_coordinates,
              batteryKwh,
              batteryStartPct,
              allStations,
              'eco_energy', // Mode éco-conduite
              targetArrivalPct,
              80,
              vehicle?.max_charge_kw
            );
            setRouteChargingStations(ecoStationsOnRoute);
            
            // Bornes pour le mode limite de vitesse
            const limitStationsOnRoute = findChargingStationsOnRoute(
              response.data.segments,
              response.data.route_coordinates,
              batteryKwh,
              batteryStartPct,
              allStations,
              'limit_energy', // Mode limite de vitesse
              targetArrivalPct,
              80,
              vehicle?.max_charge_kw
            );
            setLimitChargingStations(limitStationsOnRoute);
          } else {
            setRouteChargingStations([]);
            setLimitChargingStations([]);
          }
        } catch (error) {
          console.error('Error fetching charging stations:', error);
          setRouteChargingStations([]);
          setLimitChargingStations([]);
        }
      } else {
        setRouteChargingStations([]);
        setLimitChargingStations([]);
      }
      
      // Persister ce trajet pour le dashboard / historique / stats
      try {
        // Calculer la batterie à l'arrivée pour la persistance
        const batteryKwh = vehicle.battery_kwh || null;
        let calculatedBatteryEndPct = null;
        if (batteryKwh && batteryStartPct) {
          const totalEcoEnergy = response.data.segments.reduce((sum, s) => sum + s.eco_energy, 0);
          const energyAtStart = batteryKwh * (batteryStartPct / 100);
          const energyRemaining = energyAtStart - totalEcoEnergy;
          calculatedBatteryEndPct = Math.max(0, Math.min(100, (energyRemaining / batteryKwh) * 100));
        }
        
        persistTripFromRoute(response.data, {
          vehicleName: vehicle.name,
          numPassengers: numPassengers,
          batteryKwh: batteryKwh,
          batteryStartPct: batteryStartPct,
          batteryEndPct: calculatedBatteryEndPct,
        });
      } catch (e) {
        console.error('Failed to persist trip summary', e);
      }
      
      toast.success(`Route calculated: ${response.data.start_location} → ${response.data.end_location}`);
    } catch (error) {
      console.error('Error calculating route:', error);
      console.error('Error response:', error.response);
      console.error('Error request URL:', error.config?.url);
      
      let errorMessage = 'Failed to calculate route';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = `Cannot connect to backend at ${API}. Please make sure the backend server is running on port 8001.`;
      } else if (error.response) {
        // Server responded with an error code
        errorMessage = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response was received
        errorMessage = `No response from server at ${API}. Please check if the backend is running.`;
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRoute = async () => {
    // Si on a la localisation GPS et que le champ départ est vide,
    // on utilise la position actuelle comme point de départ (lat,lon)
    let resolvedStart = startLocation;
    if ((!resolvedStart || resolvedStart.trim() === '') && userLocation) {
      resolvedStart = `${userLocation.lat},${userLocation.lon}`;
    }

    // Si on n'a toujours pas de départ mais que la géolocalisation est dispo,
    // on tente une requête immédiate au GPS, puis on relance le calcul.
    if ((!resolvedStart || resolvedStart.trim() === '') && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const autoStart = `${latitude},${longitude}`;
          setUserLocation({ lat: latitude, lon: longitude });
          if (!endLocation) {
            toast.error('Please enter an end location');
            return;
          }
          await performRouteCalculation(autoStart);
        },
        (err) => {
          console.warn('Geolocation error (on calculate):', err);
          toast.error('Unable to detect your location. Please enter a start location.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
      return;
    }

    if (!resolvedStart || !endLocation) {
      toast.error('Please enter both start and end locations');
      return;
    }

    await performRouteCalculation(resolvedStart);
  };
  
  // Plus de simulation automatique : la carte reste sur la position GPS (ou initiale) ou en mode démo.
  
  const handleStartNavigation = () => {
    if (routeData) {
      setCurrentSegmentIndex(0);
      setIsNavigating(true);
      setShowResults(false);
      setCurrentSpeed(0);
      // Initialiser la position à partir de la localisation réelle si disponible
      if (userLocation) {
        setCurrentPosition([userLocation.lat, userLocation.lon]);
      } else if (routeData.route_coordinates && routeData.route_coordinates.length > 0) {
        setCurrentPosition(routeData.route_coordinates[0]);
      }
    }
  };
  
  const handlePauseNavigation = () => {
    // On quitte le mode plein écran GPS mais on ré-affiche le dashboard de résultats
    setIsNavigating(false);
    setShowResults(true);
  };
  
  const handleResetNavigation = () => {
    // Construire un récap de fin de trajet (surtout utile sur mobile)
    if (routeData && routeData.segments && routeData.segments.length > 0) {
      try {
        const kpis = computeKpisFromSegments(routeData.segments);
        const selectedVehicle = getSelectedVehicleData();
        const vehicleFromRoute = routeData?.vehicle_profile || {};
        const batteryKwh =
          selectedVehicle?.battery_kwh ??
          vehicleFromRoute?.battery_kwh ??
          null;
        const startPct = Number.isFinite(parseFloat(batteryStartPct))
          ? parseFloat(batteryStartPct)
          : Number.isFinite(parseFloat(routeData?.battery_start_pct))
            ? parseFloat(routeData?.battery_start_pct)
            : null;
        const totalDistanceKm = routeData.total_distance
          ? routeData.total_distance / 1000
          : kpis.totalDistanceKm;

        const trips = getAllTrips();
        const badges = calculateBadges(trips, language).filter((b) => b.unlocked);

        // Estimation SOC prévu par l'appli (mode éco) à l'arrivée
        let predictedArrivalPct = null;
        if (batteryKwh && startPct !== null) {
          const energyAtStart = batteryKwh * (startPct / 100);
          const energyConsumed = Number.isFinite(kpis.totalEcoEnergy) ? kpis.totalEcoEnergy : 0;
          const energyRemaining = energyAtStart - energyConsumed;
          predictedArrivalPct = Math.max(0, Math.min(100, (energyRemaining / batteryKwh) * 100));
        }

        setEndSummary({
          distanceKm: totalDistanceKm,
          ecoEnergyKwh: kpis.totalEcoEnergy,
          limitEnergyKwh: kpis.totalLimitEnergy,
          energySavedKwh: kpis.energySavedVsLimit,
          ecoTimeMin: kpis.totalEcoTimeMin,
          limitTimeMin: kpis.totalLimitTimeMin,
          batteryKwh,
          predictedArrivalPct,
        });
        setEndBadges(badges);
        setEndActualSoc('');
        setShowEndScreen(true);
      } catch (e) {
        console.error('Failed to build end-of-trip summary', e);
      }
    }

    setCurrentSegmentIndex(0);
    setIsNavigating(false);
    setShowResults(false);
    setCurrentSpeed(0);
    setCurrentPosition(null);
    setDistanceToNextTurn(0);
  };
  
  const handleNextSegment = () => {
    if (routeData && currentSegmentIndex < routeData.segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
    }
  };
  
  const progressPercent = routeData 
    ? ((currentSegmentIndex + 1) / routeData.segments.length) * 100 
    : 0;
  
  const bgClass = isDark 
    ? `min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-emerald-100 ${isNavigating ? 'pb-48' : 'pb-12'}`
    : `min-h-screen bg-white text-slate-900 ${isNavigating ? 'pb-48' : 'pb-12'}`;
  
  const headerClass = isDark
    ? "bg-[#0a2e1a]/80 backdrop-blur-md border-b border-emerald-800/30 sticky top-0 z-50"
    : "bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50";

  // Gestion des bulles "Domicile" / "Travail" pour remplir rapidement les champs
  const handleFavoriteClick = (target, kind) => {
    const currentValue = favoriteLocations[kind] || '';
    let valueToUse = currentValue;

    // Si aucun lieu encore enregistré, on demande à l'utilisateur de le configurer
    if (!valueToUse && typeof window !== 'undefined') {
      const promptText =
        language === 'fr'
          ? kind === 'home'
            ? 'Entrez l\'adresse de votre domicile'
            : 'Entrez l\'adresse de votre lieu de travail'
          : kind === 'home'
          ? 'Enter your home address'
          : 'Enter your work address';
      const entered = window.prompt(promptText, '');
      if (!entered || !entered.trim()) {
        return;
      }
      valueToUse = entered.trim();
      const next = {
        ...favoriteLocations,
        [kind]: valueToUse,
      };
      setFavoriteLocations(next);
      updateFavoriteLocations(next);
    }

    if (!valueToUse) return;

    if (target === 'start') {
      setStartLocation(valueToUse);
    } else if (target === 'end') {
      setEndLocation(valueToUse);
    }
  };

  // Permet de reconfigurer les adresses domicile / travail
  const handleEditFavorites = () => {
    if (typeof window === 'undefined') return;

    const homeLabel =
      language === 'fr' ? 'Adresse de votre domicile' : 'Your home address';
    const workLabel =
      language === 'fr'
        ? 'Adresse de votre lieu de travail'
        : 'Your work address';

    const newHome = window.prompt(homeLabel, favoriteLocations.home || '');
    const newWork = window.prompt(workLabel, favoriteLocations.work || '');

    const next = {
      home: newHome && newHome.trim() ? newHome.trim() : '',
      work: newWork && newWork.trim() ? newWork.trim() : '',
    };

    setFavoriteLocations(next);
    updateFavoriteLocations(next);
  };
  
  // Si on est en navigation, afficher la carte en plein écran style Waze
  if (isNavigating && routeData && routeData.segments[currentSegmentIndex]) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Interface GPS en haut */}
        <GPSNavigation
          currentSegment={routeData.segments[currentSegmentIndex]}
          nextSegment={currentSegmentIndex < routeData.segments.length - 1 ? routeData.segments[currentSegmentIndex + 1] : null}
          segments={routeData.segments}
          currentSegmentIndex={currentSegmentIndex}
          distanceToNextTurn={distanceToNextTurn}
          currentPosition={currentPosition}
          navigationMode={navigationMode}
        />
        
        {/* Carte en plein écran */}
        <div className="absolute inset-0 pt-20 pb-48">
          <RouteMap
            segments={routeData.segments || []} 
            currentSegmentIndex={currentSegmentIndex}
            startLocation={routeData.start_location}
            endLocation={routeData.end_location}
            routeCoordinates={routeData.route_coordinates || []}
            chargingStations={routeChargingStations}
            currentPosition={currentPosition}
            isNavigating={true}
          />
        </div>
        
        {/* Vitesses en bas */}
        <RealTimeNavigation
          currentSegment={routeData.segments[currentSegmentIndex]}
          isNavigating={isNavigating}
          currentSpeed={currentSpeed}
          navigationMode={navigationMode}
        />
        
        {/* Boutons de contrôle en overlay */}
        <div className="fixed top-3 right-3 md:top-4 md:right-6 z-[200] pointer-events-auto flex flex-col gap-2 items-end">
          <Button
            onClick={handlePauseNavigation}
            size="sm"
            className="bg-red-500/90 hover:bg-red-600 text-white backdrop-blur-sm shadow-lg"
          >
            <Pause className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t.navigation.pause}</span>
          </Button>
          <Button
            onClick={handleResetNavigation}
            size="sm"
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border-white/20 shadow-lg"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{t.navigation.reset}</span>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={bgClass}>
      {/* Header */}
      <header className={headerClass}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-white/10"
              data-testid="back-home-btn"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              {t.back}
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Zap className="w-8 h-8 text-[#4ade80]" fill="#4ade80" />
                <Leaf className="w-5 h-5 text-[#86efac] absolute -bottom-1 -right-1" />
              </div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Ecospeed
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Route Configuration Card */}
            <Card className={isDark ? "bg-white/5 backdrop-blur-sm border-emerald-700/30" : "bg-white border-slate-200 shadow-sm"} data-testid="route-config-card">
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-emerald-100' : 'text-black'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t.routeConfig}</CardTitle>
                <CardDescription className={isDark ? "text-emerald-200/80" : "text-black"}>{t.routeConfigDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-location" className={isDark ? "text-emerald-100" : "text-black"}>{t.startLocation}</Label>
                  <Input
                    id="start-location"
                    data-testid="start-location-input"
                    placeholder={t.startPlaceholder}
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 placeholder:text-emerald-300/60" : "bg-white border-slate-300 text-black placeholder:text-slate-600"}
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className={isDark ? 'text-emerald-200/80' : 'text-black'}>
                      {language === 'fr' ? 'Raccourcis :' : 'Shortcuts:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFavoriteClick('start', 'home')}
                      className={`px-2 py-1 rounded-full border text-xs ${
                        isDark
                          ? 'border-emerald-500/60 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {language === 'fr' ? 'Domicile' : 'Home'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFavoriteClick('start', 'work')}
                      className={`px-2 py-1 rounded-full border text-xs ${
                        isDark
                          ? 'border-emerald-500/60 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {language === 'fr' ? 'Travail' : 'Work'}
                    </button>
                    <button
                      type="button"
                      onClick={handleEditFavorites}
                      className={`ml-auto underline-offset-2 ${
                        isDark
                          ? 'text-emerald-200/80 hover:text-emerald-100'
                          : 'text-black hover:text-slate-800'
                      }`}
                    >
                      {language === 'fr'
                        ? 'Modifier domicile / travail'
                        : 'Edit home / work'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-location" className={isDark ? "text-emerald-100" : "text-black"}>{t.endLocation}</Label>
                  <Input
                    id="end-location"
                    data-testid="end-location-input"
                    placeholder={t.endPlaceholder}
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 placeholder:text-emerald-300/60" : "bg-white border-slate-300 text-black placeholder:text-slate-600"}
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                    <span className={isDark ? 'text-emerald-200/80' : 'text-black'}>
                      {language === 'fr' ? 'Raccourcis :' : 'Shortcuts:'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFavoriteClick('end', 'home')}
                      className={`px-2 py-1 rounded-full border text-xs ${
                        isDark
                          ? 'border-emerald-500/60 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {language === 'fr' ? 'Domicile' : 'Home'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFavoriteClick('end', 'work')}
                      className={`px-2 py-1 rounded-full border text-xs ${
                        isDark
                          ? 'border-emerald-500/60 text-emerald-100 bg-emerald-500/10 hover:bg-emerald-500/20'
                          : 'border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {language === 'fr' ? 'Travail' : 'Work'}
                    </button>
                  </div>
                </div>
                
                <Button
                  data-testid="calculate-route-btn"
                  onClick={handleCalculateRoute}
                  disabled={loading}
                  className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0a2e1a] font-semibold"
                >
                  {loading ? t.calculating : t.calculate}
                </Button>
                <div className="flex items-center gap-2 text-xs mt-2">
                  <input
                    id="search-charging-stations"
                    type="checkbox"
                    checked={searchChargingStations}
                    onChange={(e) => setSearchChargingStations(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor="search-charging-stations"
                    className={isDark ? 'text-emerald-100' : 'text-black'}
                  >
                    {language === 'fr'
                      ? 'Chercher des bornes de recharge'
                      : 'Find charging stations'}
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Configuration Card */}
            <Card className={isDark ? "bg-white/5 backdrop-blur-sm border-emerald-700/30" : "bg-white border-slate-200 shadow-sm"} data-testid="vehicle-config-card">
              <CardHeader>
                <CardTitle className={`text-xl ${isDark ? 'text-emerald-100' : 'text-black'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{t.vehicleParams}</CardTitle>
                <CardDescription className={isDark ? "text-emerald-200/80" : "text-black"}>
                  {t.vehicleParamsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className={isDark ? "text-emerald-100" : "text-black"}>{t.vehicleProfile}</Label>
                  {availableProfiles && availableProfiles.length === 1 ? (
                    <div className={`text-sm ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                      <span className="font-semibold">{availableProfiles[0]?.name || 'N/A'}</span>{' '}
                      ({t.selectedAuto})
                    </div>
                  ) : availableProfiles && availableProfiles.length > 1 ? (
                    <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                      <SelectTrigger
                        data-testid="vehicle-profile-select"
                        className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100" : "bg-white border-slate-300 text-slate-900"}
                      >
                        <SelectValue placeholder={t.vehicleProfile} />
                      </SelectTrigger>
                      <SelectContent className={isDark ? "bg-[#1a4d2e] border-emerald-700/30 text-emerald-100" : "bg-white border-slate-200 text-black"}>
                        {availableProfiles && availableProfiles.length > 0 ? (
                          availableProfiles.map((profile) => (
                            <SelectItem key={profile.name} value={profile.name}>
                              {profile.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="Custom">Custom</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className={`text-sm ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                      {t.vehicleProfile}: Custom
                    </div>
                  )}
                </div>
                
                {selectedProfile === 'Custom' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.emptyMass}</Label>
                        <Input
                          type="number"
                          value={customVehicle.empty_mass}
                          onChange={(e) => setCustomVehicle({...customVehicle, empty_mass: parseFloat(e.target.value)})}
                    className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-black text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.extraLoad}</Label>
                        <Input
                          type="number"
                          value={customVehicle.extra_load}
                          onChange={(e) => setCustomVehicle({...customVehicle, extra_load: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.dragCoeff}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.drag_coefficient}
                          onChange={(e) => setCustomVehicle({...customVehicle, drag_coefficient: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.frontalArea}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customVehicle.frontal_area}
                          onChange={(e) => setCustomVehicle({...customVehicle, frontal_area: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.rollingResistance}</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={customVehicle.rolling_resistance}
                          onChange={(e) => setCustomVehicle({...customVehicle, rolling_resistance: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.motorEfficiency}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.motor_efficiency}
                          onChange={(e) => setCustomVehicle({...customVehicle, motor_efficiency: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.regenEfficiency}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.regen_efficiency}
                          onChange={(e) => setCustomVehicle({...customVehicle, regen_efficiency: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.auxPower}</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customVehicle.aux_power_kw || 2.0}
                          onChange={(e) => setCustomVehicle({...customVehicle, aux_power_kw: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.battery}</Label>
                        <Input
                          type="number"
                          step="1"
                          value={customVehicle.battery_kwh || 60}
                          onChange={(e) => setCustomVehicle({...customVehicle, battery_kwh: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.batteryAge}</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={customVehicle.battery_age_years || 0}
                          onChange={(e) => setCustomVehicle({...customVehicle, battery_age_years: parseFloat(e.target.value) || 0})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.maxChargePower}</Label>
                        <Input
                          type="number"
                          step="10"
                          min="20"
                          value={customVehicle.max_charge_kw || 150}
                          onChange={(e) => setCustomVehicle({...customVehicle, max_charge_kw: parseFloat(e.target.value) || 0})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.usableBattery}</Label>
                        <Input
                          type="number"
                          step="1"
                          value={customVehicle.usable_battery_kwh || 55}
                          onChange={(e) => setCustomVehicle({...customVehicle, usable_battery_kwh: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                      <div>
                        <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.nominalVoltage}</Label>
                        <Input
                          type="number"
                          step="10"
                          value={customVehicle.nominal_voltage || 400}
                          onChange={(e) => setCustomVehicle({...customVehicle, nominal_voltage: parseFloat(e.target.value)})}
                          className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedProfile && selectedProfile !== 'Custom' && (
                  <div className={`text-sm space-y-1 pt-2 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                    {(() => {
                      const profile = VEHICLE_PROFILES.find(p => p.name === selectedProfile);
                      if (!profile) return null;
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div>Mass: {profile.empty_mass + profile.extra_load} kg</div>
                          <div>CdA: {profile.drag_coefficient}</div>
                          <div>Area: {profile.frontal_area} m²</div>
                          <div>Crr: {profile.rolling_resistance}</div>
                          <div>η motor: {(profile.motor_efficiency * 100).toFixed(0)}%</div>
                          <div>η regen: {(profile.regen_efficiency * 100).toFixed(0)}%</div>
                          {profile.battery_kwh && <div>Battery: {profile.battery_kwh} kWh</div>}
                          {profile.aux_power_kw && <div>Aux: {profile.aux_power_kw} kW</div>}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                <Separator className="my-4" />
                
                {/* Load and passengers */}
                <div className="space-y-3">
                  <Label className={isDark ? "text-white" : "text-black"}>👥 {t.loadPassengers}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.numPassengers}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={numPassengers}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value || '0', 10);
                          if (Number.isNaN(raw)) {
                            setNumPassengers(1);
                            return;
                          }
                          const clamped = Math.max(1, Math.min(5, raw));
                          setNumPassengers(clamped);
                        }}
                        className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-black text-sm"}
                      />
                    </div>
                    <div>
                      <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.avgWeight}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="200"
                        step="0.1"
                        value={avgWeightKg}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0 && val <= 200) {
                            setAvgWeightKg(val);
                          } else if (e.target.value === '' || e.target.value === '0') {
                            setAvgWeightKg(0);
                          }
                        }}
                        className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Driving conditions */}
                <div className="space-y-3">
                  <Label className={isDark ? "text-emerald-100" : "text-black"}>🌡️ {language === 'fr' ? 'Conditions de conduite' : 'Driving conditions'}</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-climate"
                      checked={useClimate}
                      onChange={(e) => setUseClimate(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="use-climate" className={`cursor-pointer ${isDark ? 'text-emerald-100' : 'text-black'}`}>{t.climate}</Label>
                  </div>
                  {useClimate && (
                    <div>
                    <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.climateIntensity}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={climateIntensity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            // Limiter entre 0 et 100
                            const clamped = Math.max(0, Math.min(100, val));
                            setClimateIntensity(clamped);
                          } else if (e.target.value === '' || e.target.value === '0') {
                            setClimateIntensity(0);
                          }
                        }}
                        className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-black text-sm"}
                      />
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                {/* Battery state */}
                <div className="space-y-3">
                  <Label className={isDark ? "text-emerald-100" : "text-black"}>🔋 {language === 'fr' ? 'État de la batterie' : 'Battery state'}</Label>
                  <div>
                    <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.batteryStart}</Label>
                    <Input
                      type="number"
                      min="20"
                      max="100"
                      value={batteryStartPct}
                      onChange={(e) => setBatteryStartPct(parseFloat(e.target.value) || 100)}
                    className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-black text-sm"}
                    />
                  </div>
                  <div>
                    <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.batteryEnd}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={batteryEndPct}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const clamped = Math.max(0, Math.min(100, val || 0));
                        setBatteryEndPct(clamped);
                      }}
                      className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-black text-sm"}
                    />
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Advanced options */}
                <div className="space-y-3">
                  <Label className={isDark ? "text-emerald-100" : "text-black"}>{language === 'fr' ? 'Options avancées' : 'Advanced options'}</Label>
                  <div>
                    <Label className={`text-xs ${isDark ? 'text-emerald-200' : 'text-black'}`}>{t.airDensity}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.9"
                      max="1.5"
                      value={rhoAir}
                      onChange={(e) => setRhoAir(parseFloat(e.target.value) || 1.225)}
                      className={isDark ? "bg-white/5 border-emerald-700/30 text-emerald-100 text-sm" : "bg-white border-slate-300 text-slate-900 text-sm"}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Map and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10" data-testid="map-card">
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Route Map</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden" style={{ height: '400px' }}>
                  <RouteMap
                    segments={routeData?.segments || []} 
                    currentSegmentIndex={currentSegmentIndex}
                    startLocation={routeData?.start_location}
                    endLocation={routeData?.end_location}
                    routeCoordinates={routeData?.route_coordinates || []}
                    chargingStations={routeChargingStations}
                    currentPosition={currentPosition}
                    isNavigating={false}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation Panel - Afficher seulement si pas en navigation temps réel */}
            {routeData && !isNavigating && (
              <Card
                className={isDark ? "bg-white/5 backdrop-blur-sm border-white/10 text-emerald-50" : "bg-white border-slate-200 text-black shadow-sm"}
                data-testid="navigation-panel"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <CardTitle
                        className={isDark ? "text-emerald-100" : "text-black"}
                        style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                      >
                        Navigation
                      </CardTitle>
                      <div className="flex items-center flex-wrap gap-3 text-xs">
                        <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-200/80' : 'text-black'}`}>
                          <input
                            id="demo-mode-toggle"
                            type="checkbox"
                            checked={demoMode}
                            onChange={(e) => {
                              setDemoMode(e.target.checked);
                              if (e.target.checked) {
                                setUseRealGps(false);
                              }
                            }}
                            className="h-3 w-3 rounded border-emerald-400 bg-transparent"
                          />
                          <label htmlFor="demo-mode-toggle" className={isDark ? "" : "text-black"}>
                            {language === 'fr' ? 'Mode démo (Z/S)' : 'Demo mode (Z/S)'}
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className={`text-xs ${isDark ? 'text-emerald-100' : 'text-black'}`}>
                            {language === 'fr' ? 'Vitesse cible' : 'Target speed'}
                          </label>
                          <select
                            value={navigationMode}
                            onChange={(e) => setNavigationMode(e.target.value)}
                            className={`text-xs rounded-full px-3 py-1 border ${
                              isDark
                                ? 'bg-white/5 border-emerald-300/40 text-emerald-50'
                                : 'bg-white border-slate-200 text-slate-900'
                            }`}
                          >
                            <option value="eco">{language === 'fr' ? 'Éco (économies)' : 'Eco (savings)'}</option>
                            <option value="limit">{language === 'fr' ? 'Limite (plus rapide)' : 'Limit (faster)'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {currentSegmentIndex === 0 && (
                        <Button
                          data-testid="start-navigation-btn"
                          onClick={handleStartNavigation}
                          size="sm"
                          className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a2e1a]"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {currentSegmentIndex > 0 && (
                        <Button
                          data-testid="continue-navigation-btn"
                          onClick={() => setIsNavigating(true)}
                          size="sm"
                          className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a2e1a]"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      <Button
                        data-testid="next-segment-btn"
                        onClick={handleNextSegment}
                        size="sm"
                        variant="outline"
                        className={isDark ? "border-white/20 hover:bg-white/10 text-white" : "border-slate-300 text-black hover:bg-slate-100"}
                        disabled={currentSegmentIndex >= routeData.segments.length - 1}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid="reset-navigation-btn"
                        onClick={handleResetNavigation}
                        size="sm"
                        variant="outline"
                        className={isDark ? "border-white/20 hover:bg-white/10 text-white" : "border-slate-300 text-black hover:bg-slate-100"}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={progressPercent} className="h-2" />
                    <NavigationPanel
                      currentSegment={routeData.segments[currentSegmentIndex]}
                      totalSegments={routeData.segments.length}
                      totalDistance={routeData.total_distance}
                      allSegments={routeData.segments}
                    />
                  </div>
                </CardContent>
              </Card>
            )}


            {/* Results Dashboard */}
            {showResults && routeData && (
              <div className="space-y-6" data-testid="results-dashboard">
                <Separator className="bg-white/20" />
                
                <div>
                  <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    Results Dashboard
                  </h2>
                  
                  {/* KPI Cards */}
                  <KPICards segments={routeData.segments} />
                  
                  {/* Final Summary - Energy Saved vs Speed Limit */}
                  {(() => {
                    const totalEcoEnergy = routeData.segments.reduce((sum, s) => sum + s.eco_energy, 0);
                    const totalLimitEnergy = routeData.segments.reduce((sum, s) => sum + s.limit_energy, 0);
                    const energySavedVsLimit = totalLimitEnergy - totalEcoEnergy;
                    const energySavedPercent = totalLimitEnergy > 0 ? (energySavedVsLimit / totalLimitEnergy) * 100 : 0;
                    const baseEcoTime = routeData.segments.reduce((sum, s) => sum + s.eco_time, 0) / 60;
                    const baseLimitTime = routeData.segments.reduce((sum, s) => sum + s.limit_time, 0) / 60;
                    
                    // Calculer les temps de charge séparément pour chaque mode de conduite
                    // Car le nombre de recharges peut être différent selon la consommation
                    const ecoChargingStationsList = routeChargingStations && Array.isArray(routeChargingStations)
                      ? routeChargingStations
                      : [];
                    const limitChargingStationsList = limitChargingStations && Array.isArray(limitChargingStations)
                      ? limitChargingStations
                      : [];
                    
                    const totalEcoChargingTime = ecoChargingStationsList.reduce((sum, cp) => 
                      sum + (cp?.chargingTimeMinutes || 0), 0
                    );
                    const totalLimitChargingTime = limitChargingStationsList.reduce((sum, cp) => 
                      sum + (cp?.chargingTimeMinutes || 0), 0
                    );
                    
                    // Ajouter les temps de charge aux temps de trajet
                    const totalEcoTime = baseEcoTime + (totalEcoChargingTime / 60);
                    const totalLimitTime = baseLimitTime + (totalLimitChargingTime / 60);
                    const extraTime = totalEcoTime - totalLimitTime;
                    
                    // Calculer la batterie à l'arrivée en tenant compte des recharges
                    const vehicle = getSelectedVehicleData();
                    const batteryKwh = vehicle?.battery_kwh || null;
                    const desiredArrivalPct = Math.max(20, Math.min(80, batteryEndPct || 20));
                    let batteryEndPctCalc = null;
                    let chargingStops = null;
                    
                    if (batteryKwh && batteryStartPct) {
                      const energyAtStart = batteryKwh * (batteryStartPct / 100);
                      
                      // Calculer d'abord la batterie sans recharges
                      const energyRemainingWithoutCharges = energyAtStart - totalEcoEnergy;
                      const batteryEndPctWithoutCharges = Math.max(20, Math.min(80, (energyRemainingWithoutCharges / batteryKwh) * 100));
                      
                      // Calculer le nombre de recharges nécessaires (objectif d'arrivée saisi par l'utilisateur)
                      chargingStops = calculateChargingStops(totalEcoEnergy, batteryKwh, batteryStartPct, desiredArrivalPct);
                      
                      // Si on a besoin de recharges, recalculer la batterie finale
                      if (chargingStops > 0) {
                        // Chaque recharge sur autoroute se fait de 20% à 80% (60% de capacité ajoutée)
                        const energyPerCharge = batteryKwh * 0.6; // 60% (de 20% à 80%)
                        const totalEnergyAdded = chargingStops * energyPerCharge;
                        
                        // Énergie finale = énergie au départ - énergie consommée + énergie rechargée
                        const finalEnergy = energyAtStart - totalEcoEnergy + totalEnergyAdded;
                        batteryEndPctCalc = Math.max(20, Math.min(80, (finalEnergy / batteryKwh) * 100));
                      } else {
                        // Pas de recharges nécessaires, utiliser le calcul direct
                        batteryEndPctCalc = batteryEndPctWithoutCharges;
                      }
                    }

                    // Si on a déjà calculé des bornes sur le trajet, utiliser ce nombre pour l'affichage
                    if (routeChargingStations && routeChargingStations.length > 0) {
                      chargingStops = routeChargingStations.length;
                      // Si des recharges sont planifiées, on considère l'objectif d'arrivée comme atteint
                      batteryEndPctCalc = desiredArrivalPct;
                    }
                    
                    return (
                      <Card className={`${isDark ? 'bg-white/5 backdrop-blur-sm border-emerald-700/30' : 'bg-white border-slate-200'} mt-6`} data-testid="final-summary">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-emerald-100' : 'text-black'}`} style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {language === 'fr' ? 'Résumé du trajet' : 'Trip Summary'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-4`}>
                                <div className={`text-sm mb-2 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                  {language === 'fr' ? 'Énergie à la limite' : 'Energy at Speed Limit'}
                                </div>
                                <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                  {totalLimitEnergy.toFixed(2)} <span className={`text-lg ${isDark ? 'text-emerald-200' : 'text-black'}`}>kWh</span>
                                </div>
                              </div>
                              <div className={`${isDark ? 'bg-emerald-500/20 border-2 border-emerald-500/50' : 'bg-emerald-50 border-2 border-emerald-200'} rounded-lg p-4`}>
                                <div className={`text-sm mb-2 ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                  {language === 'fr' ? 'Énergie économisée' : 'Energy Saved'}
                                </div>
                                <div className={`text-3xl font-bold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                  {energySavedVsLimit.toFixed(2)} <span className={`text-lg ${isDark ? 'text-emerald-200' : 'text-emerald-600'}`}>kWh</span>
                                </div>
                                <div className={`text-lg mt-1 font-semibold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                  ({energySavedPercent.toFixed(1)}% {language === 'fr' ? 'd\'économie' : 'savings'})
                                </div>
                              </div>
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-4`}>
                                <div className={`text-sm mb-2 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                  {language === 'fr' ? 'Énergie éco-conduite' : 'Eco-Driving Energy'}
                                </div>
                                <div className={`text-3xl font-bold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                  {totalEcoEnergy.toFixed(2)} <span className={`text-lg ${isDark ? 'text-emerald-200' : 'text-black'}`}>kWh</span>
                                </div>
                              </div>
                            </div>
                            <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                              <div className="flex items-center justify-center gap-8 flex-wrap">
                                <div className="text-center">
                                  <div className={`text-sm mb-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                    {language === 'fr' ? 'Temps à la limite' : 'Time at Speed Limit'}
                                  </div>
                                  <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    {formatTime(totalLimitTime)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-sm mb-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                    {language === 'fr' ? 'Temps éco-conduite' : 'Eco-Driving Time'}
                                  </div>
                                  <div className={`text-xl font-bold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                    {formatTime(totalEcoTime)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-sm mb-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                    {language === 'fr' ? 'Temps supplémentaire' : 'Extra Time'}
                                  </div>
                                  <div className={`text-xl font-bold ${extraTime > 0 ? (isDark ? 'text-yellow-300' : 'text-yellow-600') : (isDark ? 'text-emerald-100' : 'text-emerald-700')}`}>
                                    {extraTime >= 0 ? '+' : ''}{formatTime(Math.abs(extraTime))}
                                  </div>
                                </div>
                                {batteryEndPct !== null && batteryKwh && (
                                  <div className="text-center">
                                    <div className={`text-sm mb-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                      {language === 'fr' ? 'Batterie à l\'arrivée' : 'Battery at Arrival'}
                                    </div>
                                    <div className={`text-xl font-bold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                      {batteryEndPct.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                                {chargingStops !== null && (
                                  <div className="text-center">
                                    <div className={`text-sm mb-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                      {language === 'fr' ? 'Recharges nécessaires' : 'Charging Stops'}
                                    </div>
                                    <div className={`text-xl font-bold ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                      {chargingStops} <span className={`text-sm ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                        {language === 'fr' ? (chargingStops > 1 ? 'recharges' : 'recharge') : (chargingStops > 1 ? 'stops' : 'stop')}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Charging stations info */}
                            {routeChargingStations && routeChargingStations.length > 0 && (
                              <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-emerald-100' : 'text-black'}`}>
                                  {language === 'fr' ? 'Bornes de recharge sur le trajet' : 'Charging Stations on Route'}
                                </h4>
                                <div className="space-y-3">
                                  {routeChargingStations.map((chargingPoint, index) => (
                                    <div
                                      key={index}
                                      className={`rounded-lg p-4 ${isDark ? 'bg-white/5 border border-emerald-400/30' : 'bg-slate-50 border border-slate-200'}`}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                            {chargingPoint.station?.name || 'Borne de recharge'}
                                          </div>
                                          <div className={`text-sm mt-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                            {chargingPoint.station?.operator || 'Opérateur inconnu'} · {chargingPoint.station?.powerKw || 0} kW
                                          </div>
                                          {chargingPoint.station?.address && (
                                            <div className={`text-xs mt-1 ${isDark ? 'text-emerald-300/80' : 'text-black'}`}>
                                              {chargingPoint.station.address}
                                            </div>
                                          )}
                                          {chargingPoint.distanceKm && (
                                            <div className={`text-xs mt-1 ${isDark ? 'text-emerald-200' : 'text-black'}`}>
                                              {language === 'fr' ? 'Distance du trajet' : 'Distance from route'}: {chargingPoint.distanceKm.toFixed(1)} km
                                            </div>
                                          )}
                                          {chargingPoint.chargingTimeMinutes && (
                                            <div className={`text-xs mt-1 font-medium ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                              {language === 'fr' ? 'Temps de charge' : 'Charging time'}: {formatTime(chargingPoint.chargingTimeMinutes)}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          {chargingPoint.station?.price && (
                                            <div className={`text-sm font-medium ${isDark ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                              {chargingPoint.station.price}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                  
                  {/* Charts */}
                  <Tabs defaultValue="speed" className="mt-8">
                    <TabsList className="bg-white/10 border-white/20">
                      <TabsTrigger value="speed" data-testid="speed-tab">Speed Profile</TabsTrigger>
                      <TabsTrigger value="energy" data-testid="energy-tab">Energy</TabsTrigger>
                      <TabsTrigger value="time" data-testid="time-tab">Travel Time</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="speed" className="mt-6">
                      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardHeader>
                          <CardTitle>Speed vs Distance Profile</CardTitle>
                          <CardDescription className="text-gray-300">
                            Compare LIMIT, REAL, and ECO speeds across the route
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SpeedChart segments={routeData.segments} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="energy" className="mt-6">
                      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardHeader>
                          <CardTitle>Energy Consumption by Scenario</CardTitle>
                          <CardDescription className="text-gray-300">
                            Total energy consumption (kWh) for each driving style
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <EnergyChart segments={routeData.segments} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="time" className="mt-6">
                      <Card className="bg-white/5 backdrop-blur-sm border-white/10">
                        <CardHeader>
                          <CardTitle>Travel Time by Scenario</CardTitle>
                          <CardDescription className="text-gray-300">
                            Total travel time (minutes) for each driving style
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <TimeChart segments={routeData.segments} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Écran de fin de trajet plein écran (surtout pensé pour mobile) */}
      {showEndScreen && endSummary && (
        <div className="fixed inset-0 z-[120] bg-[#020617]/95 text-emerald-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-[#022c22] to-[#020617] shadow-2xl p-5 space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {language === 'fr' ? 'Trajet terminé 🎉' : 'Trip finished 🎉'}
              </h2>
              <p className="text-xs text-emerald-200/80">
                {language === 'fr'
                  ? 'Voici le récapitulatif rapide de vos gains.'
                  : 'Here is a quick recap of your savings.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-black/40 border border-emerald-400/40 p-3">
                <div className="text-[11px] text-emerald-200/80">
                  {language === 'fr' ? 'Distance' : 'Distance'}
                </div>
                <div className="text-xl font-semibold">
                  {endSummary.distanceKm.toFixed(1)} km
                </div>
              </div>
              <div className="rounded-2xl bg-black/40 border border-emerald-400/40 p-3">
                <div className="text-[11px] text-emerald-200/80">
                  {language === 'fr' ? 'Énergie économisée' : 'Energy saved'}
                </div>
                  <div className="text-xl font-semibold text-emerald-300">
                    {endSummary.energySavedKwh >= 0 ? '+' : '−'}
                    {Math.abs(endSummary.energySavedKwh).toFixed(1)} kWh
                  </div>
              </div>
              <div className="rounded-2xl bg-black/40 border border-emerald-400/40 p-3 col-span-2">
                <div className="flex items-center justify-between text-[11px] text-emerald-200/80 mb-1">
                  <span>{language === 'fr' ? 'Temps limite' : 'Time at limit'}</span>
                  <span>{language === 'fr' ? 'Temps éco' : 'Eco time'}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>{formatTime(endSummary.limitTimeMin)}</span>
                  <span className="text-emerald-300">{formatTime(endSummary.ecoTimeMin)}</span>
                </div>
              </div>
            </div>

            {/* Bloc comparaison SOC prévu vs réel */}
            {(endSummary?.predictedArrivalPct !== null && endSummary?.predictedArrivalPct !== undefined) && (
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-2xl bg-black/40 border border-emerald-400/40 p-3 space-y-3">
                  <div className="text-[11px] text-emerald-200/80">
                    {language === 'fr' ? 'Comparaison batterie arrivée' : 'Arrival battery comparison'}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="rounded-xl bg-white/5 border border-emerald-400/20 p-2">
                      <div className="text-emerald-200/80 mb-1">
                        {language === 'fr' ? 'Prévu (appli)' : 'Predicted'}
                      </div>
                      <div className="text-lg font-semibold">
                        {endSummary.predictedArrivalPct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-emerald-400/20 p-2">
                      <div className="text-emerald-200/80 mb-1">
                        {language === 'fr' ? 'Rentré (réel)' : 'Actual (entered)'}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={endActualSoc}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (Number.isNaN(val)) {
                            setEndActualSoc('');
                          } else {
                            setEndActualSoc(Math.max(0, Math.min(100, val)));
                          }
                        }}
                        className="w-full rounded-lg bg-[#0b1726] border border-emerald-400/40 text-emerald-50 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 text-center"
                        placeholder="--"
                      />
                    </div>
                    <div className="rounded-xl bg-white/5 border border-emerald-400/20 p-2">
                      <div className="text-emerald-200/80 mb-1">
                        {language === 'fr' ? 'Écart (pts)' : 'Delta (pts)'}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          endActualSoc !== '' && (endActualSoc - endSummary.predictedArrivalPct) >= 0
                            ? 'text-emerald-300'
                            : 'text-red-300'
                        }`}
                      >
                        {endActualSoc === ''
                          ? '--'
                          : `${endActualSoc - endSummary.predictedArrivalPct >= 0 ? '+' : ''}${(endActualSoc - endSummary.predictedArrivalPct).toFixed(1)}`}
                      </div>
                    </div>
                  </div>
                  {endActualSoc !== '' && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-xs flex items-center justify-between">
                      <span className="text-emerald-200/90">
                        {language === 'fr'
                          ? 'Erreur absolue (points de SOC)'
                          : 'Absolute error (SOC pts)'}
                      </span>
                      <span className="text-sm font-semibold text-emerald-100">
                        {Math.abs(endActualSoc - endSummary.predictedArrivalPct).toFixed(1)} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {endBadges && endBadges.length > 0 && (
              <div className="rounded-2xl bg-black/40 border border-emerald-400/30 p-3 max-h-40 overflow-y-auto">
                <div className="text-[11px] text-emerald-200/80 mb-1">
                  {language === 'fr'
                    ? 'Badges actuellement débloqués'
                    : 'Badges currently unlocked'}
                </div>
                <div className="flex flex-wrap gap-1">
                  {endBadges.map((badge) => (
                    <span
                      key={badge.id}
                      className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/40 text-[11px]"
                    >
                      {badge.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowEndScreen(false);
                setShowResults(true);
              }}
              className="w-full rounded-full bg-emerald-500 text-[#022c22] font-semibold text-sm py-2.5 shadow-lg hover:bg-emerald-400 transition"
            >
              {language === 'fr' ? 'Fermer le récap' : 'Close summary'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;