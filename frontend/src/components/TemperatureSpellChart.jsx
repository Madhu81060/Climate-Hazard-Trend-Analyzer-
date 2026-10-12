import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Scatter
} from 'recharts';
import { Flame, Eye } from 'lucide-react';

export default function TemperatureSpellChart({ dailySeries, threshold, thresholdUnit, variableName }) {
  if (!dailySeries || dailySeries.length === 0) return null;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-emerald-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-900">{dataPoint.date}</p>
          <p className="text-slate-600">
            Daily Value: <strong className="font-mono text-slate-900">{dataPoint.value} {thresholdUnit}</strong>
          </p>
          <p className="text-slate-500">
            95th Percentile: <strong className="font-mono text-emerald-700">{threshold} {thresholdUnit}</strong>
          </p>
          {dataPoint.is_hazard && (
            <div className="mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-[10px]">
              🔥 Confirmed Heatwave Spell Day
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const hazardPoints = dailySeries.filter(d => d.is_hazard);

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Daily Climatological Drill-Down & Exceedance Spells</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily trajectory for recent years with 95th percentile threshold line and detected heatwave spells
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            <span>Threshold: {threshold} {thresholdUnit}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-red-600 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Hazard Days</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickFormatter={(str) => str.slice(0, 7)}
              interval={Math.floor(dailySeries.length / 8)}
            />
            <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} unit={` ${thresholdUnit}`} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine
              y={threshold}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `95th %ile (${threshold}${thresholdUnit})`,
                fill: '#059669',
                fontSize: 10,
                position: 'top',
                fontWeight: 'bold'
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#94a3b8"
              strokeWidth={1.2}
              dot={false}
              isAnimationActive={false}
            />

            <Scatter
              data={hazardPoints}
              fill="#ef4444"
              shape="circle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
