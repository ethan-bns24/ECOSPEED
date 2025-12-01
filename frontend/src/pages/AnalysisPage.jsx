import React, { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { persistTripFromRoute } from '../lib/tripStorage';

// Use environment variable or fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

// Log pour debug
console.log('Backend URL configured:', BACKEND_URL);
console.log('API endpoint:', API);

// Vehicle Profiles - defined directly in code (from Streamlit)
// Note: drag_coefficient is actually CdA (Cd × A), so frontal_area is for display only
const VEHICLE_PROFILES = [
  {
    name: "Tesla Model 3",
    empty_mass: 1850,
    extra_load: 150,
    drag_coefficient: 0.58, // CdA (Cd × A)
    frontal_area: 2.2, // Realistic frontal area in m²
    rolling_resistance: 0.008,
    motor_efficiency: 0.95,
    regen_efficiency: 0.85,
    aux_power_kw: 2.0,
    battery_kwh: 75
  },
  {
    name: "Tesla Model Y",
    empty_mass: 2000,
    extra_load: 150,
    drag_coefficient: 0.62, // CdA
    frontal_area: 2.4, // SUV - larger frontal area
    rolling_resistance: 0.008,
    motor_efficiency: 0.95,
    regen_efficiency: 0.85,
    aux_power_kw: 2.2,
    battery_kwh: 75
  },
  {
    name: "Audi Q4 e-tron",
    empty_mass: 2100,
    extra_load: 150,
    drag_coefficient: 0.70, // CdA
    frontal_area: 2.5, // SUV - larger frontal area
    rolling_resistance: 0.009,
    motor_efficiency: 0.92,
    regen_efficiency: 0.80,
    aux_power_kw: 2.5,
    battery_kwh: 82
  },
  {
    name: "BMW iX3",
    empty_mass: 2180,
    extra_load: 150,
    drag_coefficient: 0.68, // CdA
    frontal_area: 2.4, // SUV
    rolling_resistance: 0.009,
    motor_efficiency: 0.93,
    regen_efficiency: 0.82,
    aux_power_kw: 2.3,
    battery_kwh: 80
  },
  {
    name: "Mercedes EQC",
    empty_mass: 2425,
    extra_load: 150,
    drag_coefficient: 0.72, // CdA
    frontal_area: 2.5, // Large SUV
    rolling_resistance: 0.010,
    motor_efficiency: 0.91,
    regen_efficiency: 0.78,
    aux_power_kw: 2.8,
    battery_kwh: 80
  },
  {
    name: "Volkswagen ID.4",
    empty_mass: 2120,
    extra_load: 150,
    drag_coefficient: 0.66, // CdA
    frontal_area: 2.3, // SUV
    rolling_resistance: 0.009,
    motor_efficiency: 0.90,
    regen_efficiency: 0.75,
    aux_power_kw: 2.0,
    battery_kwh: 77
  },
  {
    name: "Renault Zoe",
    empty_mass: 1500,
    extra_load: 150,
    drag_coefficient: 0.65, // CdA
    frontal_area: 1.9, // Small car
    rolling_resistance: 0.010,
    motor_efficiency: 0.90,
    regen_efficiency: 0.70,
    aux_power_kw: 1.5,
    battery_kwh: 52
  },
  {
    name: "BMW i3",
    empty_mass: 1200,
    extra_load: 150,
    drag_coefficient: 0.50, // CdA
    frontal_area: 1.8, // Very small car
    rolling_resistance: 0.008,
    motor_efficiency: 0.92,
    regen_efficiency: 0.80,
    aux_power_kw: 1.8,
    battery_kwh: 42
  },
  {
    name: "Nissan Leaf",
    empty_mass: 1600,
    extra_load: 150,
    drag_coefficient: 0.68, // CdA
    frontal_area: 2.1, // Compact car
    rolling_resistance: 0.010,
    motor_efficiency: 0.88,
    regen_efficiency: 0.75,
    aux_power_kw: 1.7,
    battery_kwh: 40
  },
  {
    name: "Hyundai IONIQ 5",
    empty_mass: 1950,
    extra_load: 150,
    drag_coefficient: 0.64, // CdA
    frontal_area: 2.3, // SUV/Crossover
    rolling_resistance: 0.008,
    motor_efficiency: 0.94,
    regen_efficiency: 0.83,
    aux_power_kw: 2.1,
    battery_kwh: 73
  },
  {
    name: "Kia EV6",
    empty_mass: 1980,
    extra_load: 150,
    drag_coefficient: 0.63, // CdA
    frontal_area: 2.3, // SUV/Crossover
    rolling_resistance: 0.008,
    motor_efficiency: 0.94,
    regen_efficiency: 0.83,
    aux_power_kw: 2.1,
    battery_kwh: 77
  },
  {
    name: "Custom",
    empty_mass: 1900,
    extra_load: 150,
    drag_coefficient: 0.62, // CdA
    frontal_area: 2.2, // Default realistic value
    rolling_resistance: 0.010,
    motor_efficiency: 0.90,
    regen_efficiency: 0.60,
    aux_power_kw: 2.0,
    battery_kwh: 60
  }
];

const AnalysisPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(VEHICLE_PROFILES[0].name);
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
    battery_kwh: 60
  });
  
  // Additional parameters
  const [numPassengers, setNumPassengers] = useState(1);
  const [avgWeightKg, setAvgWeightKg] = useState(75);
  const [useClimate, setUseClimate] = useState(false);
  const [climateIntensity, setClimateIntensity] = useState(50);
  const [batteryStartPct, setBatteryStartPct] = useState(100);
  const [batteryEndPct, setBatteryEndPct] = useState(20);
  const [rhoAir, setRhoAir] = useState(1.225);
  
  // Route and analysis state
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Vehicle profiles are defined directly in code, no API call needed
  
  const getSelectedVehicleData = () => {
    if (selectedProfile === 'Custom') {
      return customVehicle;
    }
    return VEHICLE_PROFILES.find(p => p.name === selectedProfile) || VEHICLE_PROFILES[0];
  };
  
  const handleCalculateRoute = async () => {
    if (!startLocation || !endLocation) {
      toast.error('Please enter both start and end locations');
      return;
    }
    
    setLoading(true);
    setShowResults(false);
    
    try {
      const vehicle = getSelectedVehicleData();
      
      const requestData = {
        start: startLocation,
        end: endLocation,
        vehicle_profile: vehicle,
        user_max_speed: 130,
        num_passengers: numPassengers,
        avg_weight_kg: avgWeightKg,
        use_climate: useClimate,
        climate_intensity: climateIntensity,
        battery_start_pct: batteryStartPct,
        battery_end_pct: batteryEndPct,
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
      
      // Persister ce trajet pour le dashboard / historique / stats
      try {
        persistTripFromRoute(response.data, {
          vehicleName: vehicle.name,
          numPassengers: numPassengers,
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
  
  // Navigation simulation
  useEffect(() => {
    if (isNavigating && routeData && currentSegmentIndex < routeData.segments.length - 1) {
      const timer = setTimeout(() => {
        setCurrentSegmentIndex(prev => prev + 1);
      }, 1500); // Move to next segment every 1.5 seconds
      
      return () => clearTimeout(timer);
    } else if (isNavigating && currentSegmentIndex >= routeData?.segments.length - 1) {
      setIsNavigating(false);
      setShowResults(true);
      toast.success('Navigation complete! View results below.');
    }
  }, [isNavigating, currentSegmentIndex, routeData]);
  
  const handleStartNavigation = () => {
    if (routeData) {
      setCurrentSegmentIndex(0);
      setIsNavigating(true);
      setShowResults(false);
    }
  };
  
  const handlePauseNavigation = () => {
    setIsNavigating(false);
  };
  
  const handleResetNavigation = () => {
    setCurrentSegmentIndex(0);
    setIsNavigating(false);
    setShowResults(false);
  };
  
  const handleNextSegment = () => {
    if (routeData && currentSegmentIndex < routeData.segments.length - 1) {
      setCurrentSegmentIndex(prev => prev + 1);
    }
  };
  
  const progressPercent = routeData 
    ? ((currentSegmentIndex + 1) / routeData.segments.length) * 100 
    : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-white pb-12">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="hover:bg-white/10"
              data-testid="back-home-btn"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10" data-testid="route-config-card">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Route Configuration</CardTitle>
                <CardDescription className="text-gray-300">Enter your start and end locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-location">Start Location</Label>
                  <Input
                    id="start-location"
                    data-testid="start-location-input"
                    placeholder="e.g., Paris, France"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-location">End Location</Label>
                  <Input
                    id="end-location"
                    data-testid="end-location-input"
                    placeholder="e.g., Lyon, France"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <Button
                  data-testid="calculate-route-btn"
                  onClick={handleCalculateRoute}
                  disabled={loading}
                  className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0a2e1a] font-semibold"
                >
                  {loading ? 'Calculating...' : 'Calculate Eco-Speed Profile'}
                </Button>
              </CardContent>
            </Card>

            {/* Vehicle Configuration Card */}
            <Card className="bg-white/5 backdrop-blur-sm border-white/10" data-testid="vehicle-config-card">
              <CardHeader>
                <CardTitle className="text-xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Electric Vehicle Parameters</CardTitle>
                <CardDescription className="text-gray-300">
                  Ecospeed is designed for electric vehicles with regenerative braking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Vehicle Profile</Label>
                  <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                    <SelectTrigger data-testid="vehicle-profile-select" className="bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select a vehicle profile" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a4d2e] border-white/20 text-white">
                      {VEHICLE_PROFILES.map(profile => (
                        <SelectItem key={profile.name} value={profile.name}>
                          {profile.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProfile === 'Custom' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Empty Mass (kg)</Label>
                        <Input
                          type="number"
                          value={customVehicle.empty_mass}
                          onChange={(e) => setCustomVehicle({...customVehicle, empty_mass: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Extra Load (kg)</Label>
                        <Input
                          type="number"
                          value={customVehicle.extra_load}
                          onChange={(e) => setCustomVehicle({...customVehicle, extra_load: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Drag Coeff</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.drag_coefficient}
                          onChange={(e) => setCustomVehicle({...customVehicle, drag_coefficient: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Frontal Area (m²)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customVehicle.frontal_area}
                          onChange={(e) => setCustomVehicle({...customVehicle, frontal_area: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Rolling Resistance</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={customVehicle.rolling_resistance}
                          onChange={(e) => setCustomVehicle({...customVehicle, rolling_resistance: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Motor Efficiency</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.motor_efficiency}
                          onChange={(e) => setCustomVehicle({...customVehicle, motor_efficiency: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Regen Efficiency</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={customVehicle.regen_efficiency}
                          onChange={(e) => setCustomVehicle({...customVehicle, regen_efficiency: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Aux Power (kW)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={customVehicle.aux_power_kw || 2.0}
                          onChange={(e) => setCustomVehicle({...customVehicle, aux_power_kw: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Battery (kWh)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={customVehicle.battery_kwh || 60}
                          onChange={(e) => setCustomVehicle({...customVehicle, battery_kwh: parseFloat(e.target.value)})}
                          className="bg-white/5 border-white/20 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedProfile && selectedProfile !== 'Custom' && (
                  <div className="text-sm text-gray-300 space-y-1 pt-2">
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
                  <Label>👥 Load and passengers</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Number of passengers</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={numPassengers}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setNumPassengers(val >= 0 ? val : 0);
                        }}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Avg weight per person (kg)</Label>
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
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Driving conditions */}
                <div className="space-y-3">
                  <Label>🌡️ Driving conditions</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-climate"
                      checked={useClimate}
                      onChange={(e) => setUseClimate(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="use-climate" className="cursor-pointer">Use HVAC</Label>
                  </div>
                  {useClimate && (
                    <div>
                      <Label className="text-xs">HVAC intensity (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={climateIntensity}
                        onChange={(e) => setClimateIntensity(parseFloat(e.target.value) || 50)}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                {/* Battery state */}
                <div className="space-y-3">
                  <Label>🔋 Battery state</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Battery at departure (%)</Label>
                      <Input
                        type="number"
                        min="20"
                        max="100"
                        value={batteryStartPct}
                        onChange={(e) => setBatteryStartPct(parseFloat(e.target.value) || 100)}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Target battery on arrival (%)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="90"
                        value={batteryEndPct}
                        onChange={(e) => setBatteryEndPct(parseFloat(e.target.value) || 20)}
                        className="bg-white/5 border-white/20 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Advanced options */}
                <div className="space-y-3">
                  <Label>Advanced options</Label>
                  <div>
                    <Label className="text-xs">Air density (kg/m³)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.9"
                      max="1.5"
                      value={rhoAir}
                      onChange={(e) => setRhoAir(parseFloat(e.target.value) || 1.225)}
                      className="bg-white/5 border-white/20 text-white text-sm"
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
                  />
                </div>
              </CardContent>
            </Card>

            {/* Navigation Panel */}
            {routeData && (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10" data-testid="navigation-panel">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Navigation</CardTitle>
                    <div className="flex gap-2">
                      {!isNavigating && currentSegmentIndex === 0 && (
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
                      {isNavigating && (
                        <Button
                          data-testid="pause-navigation-btn"
                          onClick={handlePauseNavigation}
                          size="sm"
                          variant="outline"
                          className="border-white/20 hover:bg-white/10"
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      )}
                      {!isNavigating && currentSegmentIndex > 0 && (
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
                        className="border-white/20 hover:bg-white/10"
                        disabled={currentSegmentIndex >= routeData.segments.length - 1}
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      <Button
                        data-testid="reset-navigation-btn"
                        onClick={handleResetNavigation}
                        size="sm"
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
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
                    const totalEcoTime = routeData.segments.reduce((sum, s) => sum + s.eco_time, 0) / 60;
                    const totalLimitTime = routeData.segments.reduce((sum, s) => sum + s.limit_time, 0) / 60;
                    const extraTime = totalEcoTime - totalLimitTime;
                    
                    return (
                      <Card className="bg-[#4ade80]/10 border-[#4ade80]/30 mt-6" data-testid="final-summary">
                        <CardContent className="p-6">
                          <div className="text-center">
                            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              Trip Summary
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="bg-white/5 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-2">Energy at Speed Limit</div>
                                <div className="text-3xl font-bold text-white">
                                  {totalLimitEnergy.toFixed(2)} <span className="text-lg text-gray-400">kWh</span>
                                </div>
                              </div>
                              <div className="bg-[#4ade80]/20 rounded-lg p-4 border-2 border-[#4ade80]/50">
                                <div className="text-sm text-gray-300 mb-2">Energy Saved</div>
                                <div className="text-3xl font-bold text-[#4ade80]">
                                  {energySavedVsLimit.toFixed(2)} <span className="text-lg text-gray-300">kWh</span>
                                </div>
                                <div className="text-lg text-[#4ade80] mt-1 font-semibold">
                                  ({energySavedPercent.toFixed(1)}% savings)
                                </div>
                              </div>
                              <div className="bg-white/5 rounded-lg p-4">
                                <div className="text-sm text-gray-400 mb-2">Eco-Driving Energy</div>
                                <div className="text-3xl font-bold text-[#4ade80]">
                                  {totalEcoEnergy.toFixed(2)} <span className="text-lg text-gray-400">kWh</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-white/10">
                              <div className="flex items-center justify-center gap-8">
                                <div className="text-center">
                                  <div className="text-sm text-gray-400 mb-1">Time at Speed Limit</div>
                                  <div className="text-xl font-bold text-white">
                                    {totalLimitTime.toFixed(1)} <span className="text-sm text-gray-400">min</span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-400 mb-1">Eco-Driving Time</div>
                                  <div className="text-xl font-bold text-[#4ade80]">
                                    {totalEcoTime.toFixed(1)} <span className="text-sm text-gray-400">min</span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-400 mb-1">Extra Time</div>
                                  <div className={`text-xl font-bold ${extraTime > 0 ? 'text-yellow-400' : 'text-[#4ade80]'}`}>
                                    {extraTime >= 0 ? '+' : ''}{extraTime.toFixed(1)} <span className="text-sm text-gray-400">min</span>
                                  </div>
                                </div>
                              </div>
                            </div>
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
    </div>
  );
};

export default AnalysisPage;