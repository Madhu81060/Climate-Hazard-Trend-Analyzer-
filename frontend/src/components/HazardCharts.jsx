import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, TrendingUp, Clock, Zap } from 'lucide-react';

export default function HazardCharts({ annualMetrics, hazardType, thresholdUnit }) {
  const [activeTab, setActiveTab] = useState('frequency'); // 'frequency', 'duration', 'intensity'

  if (!annualMetrics || annualMetrics.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
          <p className="font-bold text-slate-100 border-b border-slate-800 pb-1">
            Year: {label}
          </p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-semibold text-slate-200">
                {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-rose-400" />
            <span>Interactive Climatological Time-Series Trends</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hover over any year to inspect annual events, duration, and regression trends
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'frequency'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Frequency & Trend</span>
          </button>
          <button
            onClick={() => setActiveTab('duration')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'duration'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Event Duration</span>
          </button>
          <button
            onClick={() => setActiveTab('intensity')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'intensity'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Cumulative Intensity</span>
          </button>
        </div>
      </div>

      {/* Chart Views */}
      <div className="w-full h-80 pt-2">
        {activeTab === 'frequency' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={annualMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar
                dataKey="hazard_frequency"
                name="Hazard Events / Year"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              <Line
                type="monotone"
                dataKey="rolling_mean_5yr"
                name="5-Yr Rolling Mean"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="linear"
                dataKey="linear_trend_value"
                name="OLS Regression Trendline"
                stroke="#eab308"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'duration' && (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={annualMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" d" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar
                dataKey="total_hazard_days"
                name="Total Hazard Days in Year"
                fill="#fb923c"
                radius={[4, 4, 0, 0]}
                opacity={0.7}
              />
              <Line
                type="monotone"
                dataKey="mean_duration_days"
                name="Mean Event Duration (days)"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="max_duration_days"
                name="Max Single Spell Duration (days)"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'intensity' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={annualMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="cumulative_intensity"
                name={`Cumulative Excess (${thresholdUnit || 'units'})`}
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#intensityGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
