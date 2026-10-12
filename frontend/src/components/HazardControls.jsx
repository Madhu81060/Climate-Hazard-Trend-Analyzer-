import React, { useState } from 'react';
import { Flame, CloudRain, Sun, Sliders, Play, Loader2, Calendar } from 'lucide-react';

export default function HazardControls({
  hazardType,
  setHazardType,
  startYear,
  setStartYear,
  endYear,
  setEndYear,
  percentile,
  setPercentile,
  minDuration,
  setMinDuration,
  onRunAnalysis,
  isAnalyzing
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hazardOptions = [
    {
      id: 'heatwave',
      label: 'Heatwave',
      icon: Flame,
      desc: '3+ days with Tmax > 95th percentile'
    },
    {
      id: 'heavy_rainfall',
      label: 'Extreme Rainfall',
      icon: CloudRain,
      desc: 'Precipitation > 95th percentile events'
    },
    {
      id: 'drought',
      label: 'Prolonged Drought',
      icon: Sun,
      desc: '15+ consecutive dry days (<1.0mm)'
    }
  ];

  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-5">
      {/* Hazard Type Selector (Heatwave default) */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2.5">
          Select Climate Hazard
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {hazardOptions.map((h) => {
            const Icon = h.icon;
            const isSelected = hazardType === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => setHazardType(h.id)}
                className={`flex items-start space-x-3 p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                      {h.label}
                    </span>
                    {h.id === 'heatwave' && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{h.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-slate-100">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Start Year: <strong className="text-emerald-700 font-mono">{startYear}</strong></span>
            </label>
            <span className="text-[11px] text-slate-400">Min: 1950</span>
          </div>
          <input
            type="range"
            min="1950"
            max="2018"
            value={startYear}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setStartYear(val);
              if (endYear - val < 4) setEndYear(val + 5);
            }}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1950</span>
            <span>1990 (Standard)</span>
            <span>2018</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>End Year: <strong className="text-emerald-700 font-mono">{endYear}</strong></span>
            </label>
            <span className="text-[11px] text-slate-400">Max: 2023</span>
          </div>
          <input
            type="range"
            min={startYear + 4}
            max="2023"
            value={endYear}
            onChange={(e) => setEndYear(parseInt(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{startYear + 4}</span>
            <span>2020</span>
            <span>2023 (Recent)</span>
          </div>
        </div>
      </div>

      {/* Advanced Scientific Parameters (Collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-emerald-700 hover:text-emerald-800 flex items-center space-x-1.5 font-semibold transition"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showAdvanced ? 'Hide Threshold Settings' : 'Custom Climatological Thresholds (Advanced)'}</span>
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Percentile Threshold: <strong className="text-emerald-700 font-mono">{percentile}th</strong>
              </label>
              <input
                type="range"
                min="80"
                max="99"
                step="1"
                value={percentile}
                onChange={(e) => setPercentile(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Standard WMO Heatwave threshold is 95th percentile</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Consecutive Days: <strong className="text-emerald-700 font-mono">{minDuration} days</strong>
              </label>
              <input
                type="range"
                min="2"
                max="7"
                step="1"
                value={minDuration}
                onChange={(e) => setMinDuration(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Filters transient single-day spikes</span>
            </div>
          </div>
        )}
      </div>

      {/* Run Analysis Action Button */}
      <button
        onClick={onRunAnalysis}
        disabled={isAnalyzing}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Ingesting Historical Weather & Calculating Trends...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Run Climatological Hazard Analysis ({startYear} – {endYear})</span>
          </>
        )}
      </button>
    </div>
  );
}
