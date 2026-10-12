import { runClientSideAnalysis } from './climateEngine';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function fetchPresets() {
  try {
    const res = await fetch(`${BASE_URL}/api/presets`);
    if (res.ok) return await res.json();
  } catch (e) {
    // Backend offline, fallback to preset list
  }
  return {
    presets: [
      { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, climate: 'Subtropical / Extreme Heatwaves' },
      { name: 'Phoenix, Arizona, USA', lat: 33.4484, lon: -112.0740, climate: 'Hot Desert / Sustained High Heat' },
      { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278, climate: 'Temperate Maritime / Emerging Risk' },
      { name: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, climate: 'Mediterranean / Intense Heatwaves' },
      { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, climate: 'Humid Subtropical' },
      { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, climate: 'Temperate / Southern Hemisphere' },
      { name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, climate: 'Arid Desert / Extreme Summer' },
      { name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, climate: 'Tropical Monsoon / Heat & Humidity' },
      { name: 'Paris, France', lat: 48.8566, lon: 2.3522, climate: 'Oceanic / European Heat Spells' }
    ]
  };
}

export async function analyzeClimateData(payload) {
  // 1. Try FastAPI backend first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout for full historical analysis

    const res = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.info('Backend API unavailable; running via client-side climatological engine...', err);
  }

  // 2. Seamless fallback: Run identical scientific climate engine in the browser directly
  return await runClientSideAnalysis(payload);
}

export async function downloadExport(format, analysisData) {
  // Try backend export first
  try {
    const endpoint = `${BASE_URL}/api/export/${format}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? 'climate_hazard_report.pdf' : 'climate_hazard_data.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return;
    }
  } catch (e) {
    // Backend offline, generate client-side CSV
  }

  // Client-side CSV generator fallback
  if (format === 'csv') {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += '# CLIMATE HAZARD TREND ANALYZER REPORT\r\n';
    csvContent += `Region,${analysisData.request_params.region_name}\r\n`;
    csvContent += `Headline,${analysisData.summary_insights.headline}\r\n`;
    csvContent += `Mann-Kendall Trend,${analysisData.trend_statistics.mann_kendall_trend}\r\n\r\n`;
    csvContent += 'Year,Hazard Frequency,Total Hazard Days,Mean Duration,Cumulative Intensity,Linear Trendline\r\n';

    analysisData.annual_metrics.forEach((m) => {
      csvContent += `${m.year},${m.hazard_frequency},${m.total_hazard_days},${m.mean_duration_days},${m.cumulative_intensity},${m.linear_trend_value}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'climate_hazard_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // Print dialog for PDF
    window.print();
  }
}
