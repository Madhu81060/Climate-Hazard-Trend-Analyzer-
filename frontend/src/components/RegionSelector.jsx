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
    <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Geographic Region</h2>
            <p className="text-xs text-slate-500">Choose a city preset or select custom coordinates</p>
          </div>
        </div>

        <button
          onClick={() => setShowMap(!showMap)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold text-emerald-800 border border-emerald-200 transition"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          <span>{showMap ? 'Hide Map Picker' : 'Open Map Picker'}</span>
          {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Preset Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Quick City Presets
          </label>
          <div className="relative">
            <select
              value={selectedPreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none font-medium cursor-pointer"
            >
              <option value="custom">⚙️ Custom Coordinates</option>
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.climate})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Latitude (-90° to 90°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            value={latitude}
            onChange={(e) => onCoordinateChange(parseFloat(e.target.value) || 0, longitude)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono font-medium"
            placeholder="e.g. 28.6139"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Longitude (-180° to 180°)
          </label>
          <input
            type="number"
            step="0.0001"
            min="-180"
            max="180"
            value={longitude}
            onChange={(e) => onCoordinateChange(latitude, parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 font-mono font-medium"
            placeholder="e.g. 77.2090"
          />
        </div>
      </div>

      {/* Collapsible Leaflet Map */}
      {showMap && (
        <div className="pt-2">
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
