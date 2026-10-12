import React, { useState } from 'react';
import { MapPin, Globe, Compass, ChevronDown, ChevronUp } from 'lucide-react';
import MapPicker from './MapPicker';

export default function RegionSelector({
  presets,
  selectedPreset,
  onSelectPreset,
  latitude,
  longitude,
  regionName,
  onCoordinateChange,
  onRegionNameChange
}) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Geographic Region</h2>
            <p className="text-xs text-slate-400">Choose a city preset or select custom coordinates</p>
          </div>
        </div>

        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>{showMap ? 'Hide Map Picker' : 'Open Map Picker'}</span>
          {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Quick City Presets
          </label>
          <div className="relative">
            <select
              value={selectedPreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium cursor-pointer"
            >
              <option value="custom">⚙️ Custom Coordinates</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.climate})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Latitude (-90° to 90°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            value={latitude}
            onChange={(e) => onCoordinateChange(parseFloat(e.target.value) || 0, longitude)}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
            placeholder="e.g. 28.6139"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Longitude (-180° to 180°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-180"
            max="180"
            value={longitude}
            onChange={(e) => onCoordinateChange(latitude, parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-800/90 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
            placeholder="e.g. 77.2090"
          />
        </div>
      </div>

      {/* Collapsible Leaflet Map */}
      {showMap && (
        <div className="pt-2 animate-fadeIn">
          <MapPicker
            latitude={latitude}
            longitude={longitude}
            regionName={regionName}
            onLocationChange={(lat, lon) => {
              onCoordinateChange(lat, lon);
            }}
          />
        </div>
      )}
    </div>
  );
}
