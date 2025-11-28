import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SpeedChart = ({ segments }) => {
  // Transform segments data for chart
  const data = segments.map((segment, index) => {
    const distanceKm = segments.slice(0, index + 1).reduce((sum, s) => sum + s.distance, 0) / 1000;
    return {
      distance: distanceKm.toFixed(1),
      limit: segment.speed_limit,
      real: segment.real_speed,
      eco: segment.eco_speed,
      segment: index + 1
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a4d2e] border border-white/20 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-gray-300 mb-2">Distance: {payload[0].payload.distance} km</p>
          <p className="text-sm text-gray-300 mb-1">Segment: {payload[0].payload.segment}</p>
          <div className="space-y-1">
            <p className="text-sm text-red-400">
              LIMIT: {payload[0].payload.limit} km/h
            </p>
            <p className="text-sm text-blue-400">
              REAL: {payload[0].payload.real} km/h
            </p>
            <p className="text-sm text-[#4ade80]">
              ECO: {payload[0].payload.eco} km/h
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: '400px' }} data-testid="speed-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="distance" 
            stroke="#9ca3af"
            label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis 
            stroke="#9ca3af"
            label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="limit" 
            stroke="#ef4444" 
            strokeWidth={2}
            name="LIMIT"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="real" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="REAL"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="eco" 
            stroke="#4ade80" 
            strokeWidth={2}
            name="ECO"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SpeedChart;