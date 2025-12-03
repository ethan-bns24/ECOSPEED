import React from 'react';
import { Gauge, Navigation, Clock, Battery } from 'lucide-react';

const NavigationPanel = ({ currentSegment, totalSegments, totalDistance, allSegments }) => {
  if (!currentSegment) {
    return (
      <div className="text-center text-gray-400 py-8">
        No navigation data available
      </div>
    );
  }

  // Calculer la distance réelle couverte en additionnant les distances des segments précédents
  let distanceCovered = 0;
  if (allSegments && Array.isArray(allSegments)) {
    for (let i = 0; i < currentSegment.index; i++) {
      if (allSegments[i] && allSegments[i].distance != null) {
        distanceCovered += allSegments[i].distance / 1000; // Convertir mètres en km
      }
    }
  } else {
    // Fallback si allSegments n'est pas fourni
    distanceCovered = currentSegment.index * (totalDistance / totalSegments);
  }
  
  // Calculer la distance restante
  const distanceRemaining = totalDistance - distanceCovered;
  
  const getEcoMessage = () => {
    const speedDiff = currentSegment.speed_limit - currentSegment.eco_speed;
    if (speedDiff > 20) {
      return "Significantly reduced speed for maximum energy savings";
    } else if (speedDiff > 10) {
      return "Reduced energy usage with limited extra time";
    } else {
      return "Optimal balance between energy and time";
    }
  };

  return (
    <div className="space-y-6" data-testid="navigation-info">
      {/* Progress Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-[#4ade80]" />
            <span className="text-sm text-gray-400">Progress</span>
          </div>
          <div className="text-2xl font-bold">
            {currentSegment.index + 1} / {totalSegments}
          </div>
          <div className="text-xs text-gray-400 mt-1">segments</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-[#4ade80]" />
            <span className="text-sm text-gray-400">Distance</span>
          </div>
          <div className="text-2xl font-bold">
            {distanceRemaining.toFixed(1)} km
          </div>
          <div className="text-xs text-gray-400 mt-1">remaining</div>
        </div>
      </div>

      {/* Eco Speed Recommendation */}
      <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-lg p-6" data-testid="eco-recommendation">
        <div className="flex items-start gap-4">
          <div className="bg-[#4ade80] rounded-full p-3">
            <Gauge className="w-6 h-6 text-[#0a2e1a]" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-300 mb-1">Recommended Eco-Speed</div>
            <div className="text-4xl font-bold text-[#4ade80] mb-2">
              {currentSegment.eco_speed} <span className="text-2xl">km/h</span>
            </div>
            <p className="text-sm text-gray-300">
              {getEcoMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Speed Comparison */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-2">Speed Limit</div>
          <div className="text-xl font-bold text-red-400">
            {currentSegment.speed_limit}
          </div>
          <div className="text-xs text-gray-500">km/h</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-2">Real (Simulated)</div>
          <div className="text-xl font-bold text-blue-400">
            {currentSegment.real_speed}
          </div>
          <div className="text-xs text-gray-500">km/h</div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-2">Eco-Speed</div>
          <div className="text-xl font-bold text-[#4ade80]">
            {currentSegment.eco_speed}
          </div>
          <div className="text-xs text-gray-500">km/h</div>
        </div>
      </div>

    </div>
  );
};

export default NavigationPanel;