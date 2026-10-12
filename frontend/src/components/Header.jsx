import React from 'react';
import { Leaf, FileDown, BookOpen, Database, Sparkles } from 'lucide-react';

export default function Header({ onOpenMethodology, onExportCSV, onExportPDF, isAnalyzing, hasData, isCached }) {
  return (
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Leaf className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900">
                Climate Hazard Trend Analyzer
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Long-term meteorological data ingestion & climatological hazard modeling
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {hasData && (
            <>
              {isCached && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  <span>NoSQL Cache Hit</span>
                </div>
              )}
              <button
                onClick={onExportCSV}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-300 shadow-sm transition"
                title="Download structured CSV dataset"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onExportPDF}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
                title="Generate executive PDF assessment"
              >
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>Export PDF</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenMethodology}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Methodology & Logic</span>
          </button>
        </div>
      </div>
    </header>
  );
}
