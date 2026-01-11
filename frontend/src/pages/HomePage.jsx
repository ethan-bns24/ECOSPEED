import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Leaf, Zap, Route, TrendingDown } from 'lucide-react';
import { getAllTrips } from '../lib/tripStorage';

const HomePage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    avgEnergySavedPct: 18,
    avgTimeExtraPct: 6,
    avgEcoScore: 72,
    totalDistanceKm: 0,
    trips: 0,
  });

  useEffect(() => {
    try {
      const trips = getAllTrips();
      if (!trips || trips.length === 0) return;

      const totalTrips = trips.length;
      const totalEnergySavedPct = trips.reduce((s, t) => s + (t.energySavedPercent || 0), 0);
      const totalEnergySavedKwh = trips.reduce((s, t) => s + (t.energySavedKwh || 0), 0);
      const totalEcoScore = trips.reduce((s, t) => s + (t.ecoScore || 0), 0);

      const timeExtrasPct = trips.map((t) => {
        const extraMin = (t.ecoTimeMin || 0) - (t.limitTimeMin || 0);
        const denom = t.limitTimeMin || 1;
        return (extraMin / denom) * 100;
      });
      const avgTimeExtraPct = timeExtrasPct.reduce((s, v) => s + v, 0) / totalTrips;

      const totalDistanceKm = trips.reduce((s, t) => s + (t.distanceKm || 0), 0);

      setStats({
        avgEnergySavedPct: Math.max(0, totalEnergySavedPct / totalTrips),
        avgTimeExtraPct: Math.max(0, avgTimeExtraPct),
        avgEcoScore: Math.max(0, totalEcoScore / totalTrips),
        totalDistanceKm,
        trips: totalTrips,
        energySavedKwh: totalEnergySavedKwh,
      });
    } catch (e) {
      console.error('Failed to compute home stats', e);
    }
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        title: 'Énergie économisée',
        value: `${stats.avgEnergySavedPct.toFixed(1)}%`,
        sub: stats.energySavedKwh !== undefined ? `${stats.energySavedKwh.toFixed(1)} kWh cumulés` : 'Estimé',
      },
      {
        title: 'Temps supplémentaire',
        value: `+${stats.avgTimeExtraPct.toFixed(1)}%`,
        sub: 'vs. trajet à la limite',
      },
      {
        title: 'Score éco moyen',
        value: `${stats.avgEcoScore.toFixed(0)}/100`,
        sub: `${stats.trips} trajets optimisés`,
      },
      {
        title: 'Distance optimisée',
        value: `${stats.totalDistanceKm.toFixed(1)} km`,
        sub: 'cumul des trajets',
      },
    ];
  }, [stats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a2e1a] via-[#1a4d2e] to-[#0f3d20] text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-10 h-10 text-[#4ade80]" fill="#4ade80" />
            <Leaf className="w-6 h-6 text-[#86efac] absolute -bottom-1 -right-1" />
          </div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ecospeed
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl lg:text-7xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Green Driving Optimizer
            </h2>
            <p className="text-xl lg:text-2xl text-[#86efac] font-medium">
              for Electric Vehicles
            </p>
          </div>

          <p className="text-lg lg:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Optimize your EV route to save battery energy while keeping travel time reasonable.
            Get segment-by-segment speed recommendations based on physics and terrain.
          </p>

          <div className="pt-8">
            <Button
              data-testid="start-analysis-btn"
              onClick={() => navigate('/analysis')}
              className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a2e1a] font-semibold px-10 py-6 text-lg rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#4ade80]/30"
            >
              Start Analysis
            </Button>
          </div>
        </div>

        {/* Snapshot KPIs */}
        <div className="grid md:grid-cols-4 gap-4 mt-12 max-w-5xl mx-auto">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-2"
            >
              <div className="text-sm text-emerald-100/90">{card.title}</div>
              <div className="text-3xl font-semibold">{card.value}</div>
              <div className="text-xs text-emerald-200/80">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-5xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300">
            <div className="bg-[#4ade80]/20 w-14 h-14 rounded-xl flex items-center justify-center">
              <Route className="w-7 h-7 text-[#4ade80]" />
            </div>
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Route Analysis
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Split your route into segments and analyze elevation, distance, and speed limits.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300">
            <div className="bg-[#4ade80]/20 w-14 h-14 rounded-xl flex items-center justify-center">
              <Zap className="w-7 h-7 text-[#4ade80]" />
            </div>
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Physics Model
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Calculate energy using gravity, drag, rolling resistance, and regenerative braking.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300">
            <div className="bg-[#4ade80]/20 w-14 h-14 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-[#4ade80]" />
            </div>
            <h3 className="text-xl font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Three Scenarios
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Compare LIMIT, REAL, and ECO driving styles to see energy savings and time impact.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 mt-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            How Ecospeed Works
          </h3>
          <div className="space-y-6 text-gray-300">
            <div>
              <h4 className="text-lg font-semibold text-[#86efac] mb-2">Route Analysis</h4>
              <p className="leading-relaxed">
                Ecospeed retrieves route and elevation data, splits it into segments, and prepares the data for physics-based analysis.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#86efac] mb-2">Physics Model</h4>
              <p className="leading-relaxed">
                We calculate forces (gravity, rolling resistance, aerodynamic drag, inertia) using your EV parameters (mass, drag coefficient, frontal area, regenerative braking efficiency) to estimate energy consumption.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#86efac] mb-2">Three Scenarios</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">LIMIT (red):</strong> Theoretical high-speed scenario at speed limits.</li>
                <li><strong className="text-white">REAL (blue):</strong> Simulated actual driver behavior with variations.</li>
                <li><strong className="text-white">ECO (green):</strong> Optimized speeds to minimize energy while limiting extra travel time.</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-[#86efac] mb-2">Optimization Logic</h4>
              <p className="leading-relaxed">
                ECO mode slows down especially on uphill segments where power demand is high, and maintains moderate speeds downhill to reduce total energy consumption while keeping extra travel time reasonable.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;