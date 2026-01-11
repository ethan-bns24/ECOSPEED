import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const TimeChart = ({ segments }) => {
  // Calculate totals in minutes
  const totalEcoTime = segments.reduce((sum, s) => sum + s.eco_time, 0) / 60;
  const totalLimitTime = segments.reduce((sum, s) => sum + s.limit_time, 0) / 60;

  const data = [
    {
      name: 'ECO',
      time: parseFloat(totalEcoTime.toFixed(2)),
      color: '#4ade80'
    },
    {
      name: 'LIMIT',
      time: parseFloat(totalLimitTime.toFixed(2)),
      color: '#ef4444'
    }
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a4d2e] border border-white/20 rounded-lg p-4 shadow-lg">
          <p className="text-sm text-white font-semibold mb-1">{payload[0].payload.name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            Time: {payload[0].value} minutes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: '400px' }} data-testid="time-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
          />
          <YAxis 
            stroke="#9ca3af"
            label={{ value: 'Time (minutes)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Bar dataKey="time" name="Travel Time (minutes)" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TimeChart;