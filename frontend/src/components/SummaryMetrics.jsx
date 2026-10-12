import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, ShieldCheck, Thermometer, Clock, Activity, BarChart2 } from 'lucide-react';

export default function SummaryMetrics({ data }) {
  if (!data) return null;

  const { summary_insights, trend_statistics, data_quality, request_params } = data;
  const pctChange = trend_statistics.total_period_change_percent;
  const isPositive = pctChange > 0;
  const isZero = pctChange === 0;

  const isSignificant = trend_statistics.is_statistically_significant;

  return (
    <div className="space-y-4">
      {/* Executive Headline Insight Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-rose-500/30 rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Climate Insight
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                summary_insights.risk_assessment === 'High'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : summary_insights.risk_assessment === 'Moderate'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                Risk Level: {summary_insights.risk_assessment}
              </span>
            </div>

            <h3 className="text-xl lg:text-2xl font-extrabold text-white tracking-tight leading-snug">
              {summary_insights.headline}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {summary_insights.frequency_insight} {summary_insights.duration_insight}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center min-w-[180px] p-4 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-xs text-slate-400 font-medium">Net Period Change</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              {isPositive ? (
                <TrendingUp className="w-6 h-6 text-rose-400" />
              ) : isZero ? (
                <Minus className="w-6 h-6 text-slate-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-emerald-400" />
              )}
              <span className={`text-3xl font-extrabold font-mono ${isPositive ? 'text-rose-400' : isZero ? 'text-slate-300' : 'text-emerald-400'}`}>
                {isPositive ? `+${pctChange}%` : `${pctChange}%`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {request_params.start_year} vs {request_params.end_year} baseline
            </span>
          </div>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Rate of Change */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Decade Trend Rate</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {trend_statistics.decade_change_percent > 0 ? `+${trend_statistics.decade_change_percent}` : trend_statistics.decade_change_percent}
            <span className="text-xs font-normal text-slate-400 ml-1.5">events / decade</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Linear slope: {trend_statistics.slope} yr⁻¹ (R² = {trend_statistics.r_squared})
          </p>
        </div>

        {/* Metric 2: Mann-Kendall Test */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Mann-Kendall Test</span>
            <BarChart2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold font-mono text-white capitalize">
              {trend_statistics.mann_kendall_trend.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono ${
              isSignificant ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
            }`}>
              p={trend_statistics.mann_kendall_p_value.toFixed(4)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Tau: {trend_statistics.mann_kendall_tau} • {isSignificant ? 'Statistically significant (p < 0.05)' : 'Not statistically significant'}
          </p>
        </div>

        {/* Metric 3: Climatological Threshold */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">95th Percentile Threshold</span>
            <Thermometer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data_quality.calculated_threshold}
            <span className="text-xs font-normal text-slate-400 ml-1">
              {data_quality.threshold_unit}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Derived from regional climatology ({request_params.threshold_percentile}th percentile)
          </p>
        </div>

        {/* Metric 4: Data Quality & Completeness */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4.5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Data Completeness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {data_quality.data_completeness_pct}%
          </div>
          <p className="text-[11px] text-slate-400">
            {data_quality.total_days_processed.toLocaleString()} days evaluated • {data_quality.missing_days_interpolated} gaps filled
          </p>
        </div>
      </div>

      {/* Objective Scientific Footnote */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-400">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Climatological Context: </span>
          <span>{summary_insights.scientific_significance}</span>
        </div>
      </div>
    </div>
  );
}
