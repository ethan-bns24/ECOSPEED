import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisPage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [useDemo, setUseDemo] = useState(true);
  const [vehicleProfiles, setVehicleProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [customVehicle, setCustomVehicle] = useState({
    name: 'Custom',
    empty_mass: 1600,
    extra_load: 150,
    drag_coefficient: 0.28,
    frontal_area: 2.2,
    rolling_resistance: 0.008,
    motor_efficiency: 0.88,
    regen_efficiency: 0.68
  });
  
  // Route and analysis state
  const [loading, setLoading] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Load vehicle profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await axios.get(`${API}/vehicle-profiles`);
        setVehicleProfiles(response.data);
        if (response.data.length > 0) {
          setSelectedProfile(response.data[0].name);
        }
      } catch (error) {
        console.error('Error fetching vehicle profiles:', error);
        toast.error('Failed to load vehicle profiles');
      }
    };
    fetchProfiles();
  }, []);
  
  const getSelectedVehicleData = () => {
    if (selectedProfile === 'Custom') {
      return customVehicle;
    }
    return vehicleProfiles.find(p => p.name === selectedProfile) || vehicleProfiles[0];
  };
  
  const handleCalculateRoute = async () => {
    if (!useDemo && (!startLocation || !endLocation)) {
      toast.error('Please enter start and end locations or use demo mode');
      return;
    }
    
    setLoading(true);
    setShowResults(false);
    
    try {
      const vehicle = getSelectedVehicleData();
      const response = await axios.post(`${API}/route`, {
        start: startLocation || 'Le Havre, France',
        end: endLocation || 'Versailles, France',
        use_demo: useDemo,
        vehicle_profile: vehicle
      });
      
      setRouteData(response.data);
      setCurrentSegmentIndex(0);
      toast.success('Route calculated successfully!');
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route. Using demo mode.');
      // Fallback to demo
      setUseDemo(true);
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
        {/* Demo Mode Banner */}
        {useDemo && (
          <Alert className="mb-6 bg-[#4ade80]/10 border-[#4ade80]/30 text-white" data-testid="demo-banner">
            <Info className="w-5 h-5 text-[#4ade80]" />
            <AlertDescription className="ml-2">
              <strong>Demo mode:</strong> Using sample data for Le Havre → Versailles route. Configure API keys in environment to enable live routes.
            </AlertDescription>
          </Alert>
        )}

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
                    placeholder="e.g., Le Havre, France"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    disabled={useDemo}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-location">End Location</Label>
                  <Input
                    id="end-location"
                    data-testid="end-location-input"
                    placeholder="e.g., Versailles, France"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    disabled={useDemo}
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="use-demo"
                    data-testid="use-demo-checkbox"
                    checked={useDemo}
                    onCheckedChange={setUseDemo}
                    className="border-white/30"
                  />
                  <Label htmlFor="use-demo" className="cursor-pointer">
                    Use demo route (Le Havre → Versailles)
                  </Label>
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
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a4d2e] border-white/20 text-white">
                      {vehicleProfiles.map(profile => (
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
                    </div>
                  </div>
                )}
                
                {selectedProfile && selectedProfile !== 'Custom' && (
                  <div className="text-sm text-gray-300 space-y-1 pt-2">
                    {(() => {
                      const profile = vehicleProfiles.find(p => p.name === selectedProfile);
                      if (!profile) return null;
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div>Mass: {profile.empty_mass + profile.extra_load} kg</div>
                          <div>Cd: {profile.drag_coefficient}</div>
                          <div>Area: {profile.frontal_area} m²</div>
                          <div>Crr: {profile.rolling_resistance}</div>
                          <div>η motor: {(profile.motor_efficiency * 100).toFixed(0)}%</div>
                          <div>η regen: {(profile.regen_efficiency * 100).toFixed(0)}%</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
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