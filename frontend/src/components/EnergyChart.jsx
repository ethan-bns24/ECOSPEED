import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const EnergyChart = ({ segments }) => {
  // Calculate totals
  const totalEcoEnergy = segments.reduce((sum, s) => sum + s.eco_energy, 0);
  const totalRealEnergy = segments.reduce((sum, s) => sum + s.real_energy, 0);
  const totalLimitEnergy = segments.reduce((sum, s) => sum + s.limit_energy, 0);

  const data = [
    {
      name: 'ECO',
      energy: parseFloat(totalEcoEnergy.toFixed(2)),
      color: '#4ade80'
    },
    {
      name: 'REAL',
      energy: parseFloat(totalRealEnergy.toFixed(2)),
      color: '#3b82f6'
    },
    {
      name: 'LIMIT',
      energy: parseFloat(totalLimitEnergy.toFixed(2)),
      color: '#ef4444'
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a4d2e] border border-white/20 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-white font-semibold mb-1">{payload[0].payload.name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            Energy: {payload[0].value} kWh
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: '400px' }} data-testid="energy-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
          />
          <YAxis 
            stroke="#9ca3af"
            label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="energy" name="Energy Consumption (kWh)" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;