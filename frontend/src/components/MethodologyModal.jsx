import React from 'react';
import { X, CheckCircle, AlertTriangle, BookOpen, Layers } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 space-y-5 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Climatological Methodology & Assumptions</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1 text-rose-400">
              1. Heatwave Definition Logic (Percentile-Based)
            </h4>
            <p>
              In accordance with World Meteorological Organization (WMO) and IPCC guidelines, heatwaves are context-specific rather than based on a static global temperature (e.g., 40°C in New Delhi represents normal summer heat, whereas in London it is unprecedented).
            </p>
            <p className="mt-1 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-amber-300">
              Rule: An event is flagged when maximum daily temperature (Tmax) exceeds the local 95th percentile for at least 3 consecutive days.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1 text-indigo-400">
              2. Trend Detection Techniques
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>Ordinary Least Squares (OLS) Linear Regression:</strong> Computes the annual slope (events/year), decade rate of change, and goodness-of-fit (R²).
              </li>
              <li>
                <strong>Mann-Kendall Non-Parametric Test:</strong> Climate hazard counts frequently violate normal distribution assumptions. The Mann-Kendall test provides rank-based evaluation for monotonic trend direction and two-tailed p-value significance (p &lt; 0.05).
              </li>
              <li>
                <strong>5-Year Centered Rolling Average:</strong> Smooths high-frequency interannual climate oscillations (such as ENSO / El Niño–Southern Oscillation).
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1 text-emerald-400">
              3. Data Ingestion & Quality Handling
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>Data Source:</strong> ECMWF ERA5 reanalysis dataset ingested through the Open-Meteo Historical Archive API (0.25° grid resolution, ~11 km).
              </li>
              <li>
                <strong>Gap Filling:</strong> Continuous calendar date-indexing with linear interpolation for isolated missing days (≤ 3 days).
              </li>
              <li>
                <strong>Sanity Bounds:</strong> Real-world physical clipping applied (-90°C to +65°C for temperature, 0 to 1,500 mm for rainfall).
              </li>
              <li>
                <strong>NoSQL Caching:</strong> Multi-tiered caching (MongoDB / TinyDB) persists both raw historical payloads and processed indicators with 7-day TTL to minimize external API loads.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-100 text-sm mb-1 text-amber-400">
              4. Climatological Assumptions & Honest Caveats
            </h4>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>Reanalysis vs Station Bias:</strong> ERA5 reanalysis provides continuous spatio-temporal global coverage, but may slightly underrepresent micro-scale Urban Heat Island (UHI) extremes compared to high-density municipal station networks.
              </li>
              <li>
                <strong>Baseline Selection:</strong> Thresholds calculated over the analyzed period represent local relative extremes.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
