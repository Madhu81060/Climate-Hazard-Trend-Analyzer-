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
        <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
          <p className="font-bold text-slate-100">{dataPoint.date}</p>
          <p className="text-slate-300">
            Daily Value: <strong className="font-mono text-white">{dataPoint.value} {thresholdUnit}</strong>
          </p>
          <p className="text-slate-400">
            95th Percentile: <strong className="font-mono text-amber-400">{threshold} {thresholdUnit}</strong>
          </p>
          {dataPoint.is_hazard && (
            <div className="mt-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[10px]">
              🔥 Confirmed Heatwave Spell Day
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Only highlight days that are hazard days
  const hazardPoints = dailySeries.filter(d => d.is_hazard);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Daily Climatological Drill-Down & Exceedance Spells</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily trajectory for recent years with 95th percentile threshold line and detected heatwave spells
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span>Threshold: {threshold} {thresholdUnit}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Hazard Days</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dailySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(str) => str.slice(0, 7)}
              interval={Math.floor(dailySeries.length / 8)}
            />
            <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit={` ${thresholdUnit}`} />
            <Tooltip content={<CustomTooltip />} />
            
            <ReferenceLine
              y={threshold}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `95th %ile (${threshold}${thresholdUnit})`,
                fill: '#f59e0b',
                fontSize: 10,
                position: 'top'
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

            {/* Red points on days that belong to a confirmed hazard event */}
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
