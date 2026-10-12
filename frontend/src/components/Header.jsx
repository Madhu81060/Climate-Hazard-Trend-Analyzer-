import React from 'react';
import { Flame, FileDown, BookOpen, Database, Sparkles } from 'lucide-react';

export default function Header({ onOpenMethodology, onExportCSV, onExportPDF, isAnalyzing, hasData, isCached }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-rose-900/30">
            <Flame className="w-6 h-6 text-slate-950 fill-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg lg:text-xl font-bold tracking-tight text-white">
                Climate Hazard Trend Analyzer
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Long-term historical weather ingestion & statistical hazard trend modeling
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {hasData && (
            <>
              {isCached && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <Database className="w-3.5 h-3.5" />
                  <span>NoSQL Cache Hit</span>
                </div>
              )}
              <button
                onClick={onExportCSV}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                title="Download structured CSV dataset"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={onExportPDF}
                disabled={isAnalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-900/30 transition"
                title="Generate executive PDF assessment"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </>
          )}

          <button
            onClick={onOpenMethodology}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Methodology & Logic</span>
          </button>
        </div>
      </div>
    </header>
  );
}
