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
        <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-900 border-b border-slate-100 pb-1">
            Year: {label}
          </p>
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5 font-medium" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-slate-800">
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
    <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span>Interactive Climatological Time-Series Trends</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hover over any year to inspect annual events, duration, and regression trends
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('frequency')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'frequency'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Frequency & Trend</span>
          </button>
          <button
            onClick={() => setActiveTab('duration')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'duration'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Event Duration</span>
          </button>
          <button
            onClick={() => setActiveTab('intensity')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'intensity'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar
                dataKey="hazard_frequency"
                name="Hazard Events / Year"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                opacity={0.9}
              />
              <Line
                type="monotone"
                dataKey="rolling_mean_5yr"
                name="5-Yr Rolling Mean"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={false}
              />
              <Line
                type="linear"
                dataKey="linear_trend_value"
                name="OLS Regression Trendline"
                stroke="#d97706"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} unit=" d" />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar
                dataKey="total_hazard_days"
                name="Total Hazard Days in Year"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
              <Line
                type="monotone"
                dataKey="mean_duration_days"
                name="Mean Event Duration (days)"
                stroke="#047857"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#047857' }}
              />
              <Line
                type="monotone"
                dataKey="max_duration_days"
                name="Max Single Spell Duration (days)"
                stroke="#0284c7"
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
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="cumulative_intensity"
                name={`Cumulative Excess (${thresholdUnit || 'units'})`}
                stroke="#059669"
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
