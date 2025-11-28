import React from 'react';
import { Battery, Clock, TrendingDown, Leaf } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const KPICards = ({ segments }) => {
  // Calculate totals
  const totalEcoEnergy = segments.reduce((sum, s) => sum + s.eco_energy, 0);
  const totalRealEnergy = segments.reduce((sum, s) => sum + s.real_energy, 0);
  const totalLimitEnergy = segments.reduce((sum, s) => sum + s.limit_energy, 0);
  
  const totalEcoTime = segments.reduce((sum, s) => sum + s.eco_time, 0) / 60; // minutes
  const totalRealTime = segments.reduce((sum, s) => sum + s.real_time, 0) / 60; // minutes
  const totalLimitTime = segments.reduce((sum, s) => sum + s.limit_time, 0) / 60; // minutes
  
  // Energy saved compared to speed limit (not real speed)
  const energySavedVsLimit = totalLimitEnergy - totalEcoEnergy;
  const energySavedVsLimitPercent = totalLimitEnergy > 0 ? (energySavedVsLimit / totalLimitEnergy) * 100 : 0;
  
  // Also calculate vs real speed for comparison
  const energySavedVsReal = totalRealEnergy - totalEcoEnergy;
  const energySavedVsRealPercent = totalRealEnergy > 0 ? (energySavedVsReal / totalRealEnergy) * 100 : 0;
  
  const extraTime = totalEcoTime - totalLimitTime; // Time difference vs speed limit
  const extraTimeVsReal = totalEcoTime - totalRealTime; // Time difference vs real speed
  
  // CO2 avoided calculation (rough estimate: 0.5 kg CO2 per kWh)
  const co2Avoided = energySavedVsLimit * 0.5;

  const kpis = [
    {
      icon: Battery,
      label: 'Eco Energy',
      value: totalEcoEnergy.toFixed(2),
      unit: 'kWh',
      color: 'text-[#4ade80]',
      bgColor: 'bg-[#4ade80]/10',
      testId: 'kpi-eco-energy'
    },
    {
      icon: TrendingDown,
      label: 'Energy Saved vs Speed Limit',
      value: energySavedVsLimit.toFixed(2),
      subValue: `${energySavedVsLimitPercent.toFixed(1)}%`,
      unit: 'kWh',
      color: 'text-[#4ade80]',
      bgColor: 'bg-[#4ade80]/10',
      testId: 'kpi-energy-saved',
      description: `Compared to driving at speed limit (${totalLimitEnergy.toFixed(2)} kWh)`
    },
    {
      icon: Clock,
      label: 'Extra Time vs Speed Limit',
      value: Math.abs(extraTime).toFixed(1),
      subValue: extraTime >= 0 ? '+' : '-',
      unit: 'min',
      color: extraTime > 0 ? 'text-yellow-400' : 'text-[#4ade80]',
      bgColor: extraTime > 0 ? 'bg-yellow-400/10' : 'bg-[#4ade80]/10',
      testId: 'kpi-extra-time',
      description: `Compared to driving at speed limit (${totalLimitTime.toFixed(1)} min)`
    },
    {
      icon: Leaf,
      label: 'CO₂ Avoided',
      value: co2Avoided.toFixed(2),
      unit: 'kg',
      color: 'text-[#4ade80]',
      bgColor: 'bg-[#4ade80]/10',
      testId: 'kpi-co2-avoided'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="kpi-cards">
      {kpis.map((kpi, index) => (
        <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10" data-testid={kpi.testId}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">{kpi.label}</div>
                <div className="flex flex-col gap-1">
                  {kpi.subValue && (
                    <div className="text-lg font-semibold text-gray-300 mb-1">
                      {kpi.subValue}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${kpi.color}`}>
                      {kpi.value}
                    </span>
                    <span className="text-sm text-gray-400">{kpi.unit}</span>
                  </div>
                </div>
                {kpi.description && (
                  <div className="text-xs text-gray-500 mt-1">{kpi.description}</div>
                )}
              </div>
              <div className={`${kpi.bgColor} p-3 rounded-lg`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KPICards;