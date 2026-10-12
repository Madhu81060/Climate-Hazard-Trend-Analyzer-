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
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/40 to-teal-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                Climate Insight
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                summary_insights.risk_assessment === 'High'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : summary_insights.risk_assessment === 'Moderate'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Risk Level: {summary_insights.risk_assessment}
              </span>
            </div>

            <h3 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {summary_insights.headline}
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {summary_insights.frequency_insight} {summary_insights.duration_insight}
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end justify-center min-w-[180px] p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
            <span className="text-xs text-slate-500 font-semibold">Net Period Change</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              {isPositive ? (
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              ) : isZero ? (
                <Minus className="w-6 h-6 text-slate-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-teal-600" />
              )}
              <span className={`text-3xl font-extrabold font-mono ${isPositive ? 'text-emerald-700' : isZero ? 'text-slate-600' : 'text-teal-700'}`}>
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
        <div className="bg-white border border-emerald-100 rounded-xl p-4.5 space-y-2 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Decade Trend Rate</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {trend_statistics.decade_change_percent > 0 ? `+${trend_statistics.decade_change_percent}` : trend_statistics.decade_change_percent}
            <span className="text-xs font-normal text-slate-500 ml-1.5">events / decade</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Linear slope: {trend_statistics.slope} yr⁻¹ (R² = {trend_statistics.r_squared})
          </p>
        </div>

        {/* Metric 2: Mann-Kendall Test */}
        <div className="bg-white border border-emerald-100 rounded-xl p-4.5 space-y-2 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Mann-Kendall Test</span>
            <BarChart2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold font-mono text-slate-900 capitalize">
              {trend_statistics.mann_kendall_trend.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
              isSignificant ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              p={trend_statistics.mann_kendall_p_value.toFixed(4)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Tau: {trend_statistics.mann_kendall_tau} • {isSignificant ? 'Statistically significant (p < 0.05)' : 'Not statistically significant'}
          </p>
        </div>

        {/* Metric 3: Climatological Threshold */}
        <div className="bg-white border border-emerald-100 rounded-xl p-4.5 space-y-2 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">95th Percentile Threshold</span>
            <Thermometer className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {data_quality.calculated_threshold}
            <span className="text-xs font-normal text-slate-500 ml-1">
              {data_quality.threshold_unit}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Derived from regional climatology ({request_params.threshold_percentile}th percentile)
          </p>
        </div>

        {/* Metric 4: Data Quality & Completeness */}
        <div className="bg-white border border-emerald-100 rounded-xl p-4.5 space-y-2 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Data Completeness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {data_quality.data_completeness_pct}%
          </div>
          <p className="text-[11px] text-slate-500">
            {data_quality.total_days_processed.toLocaleString()} days evaluated • {data_quality.missing_days_interpolated} gaps filled
          </p>
        </div>
      </div>

      {/* Objective Scientific Footnote */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-slate-700">
        <AlertTriangle className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900">Climatological Context: </span>
          <span>{summary_insights.scientific_significance}</span>
        </div>
      </div>
    </div>
  );
}
