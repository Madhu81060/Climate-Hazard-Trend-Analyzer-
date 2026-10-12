import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RegionSelector from './components/RegionSelector';
import HazardControls from './components/HazardControls';
import SummaryMetrics from './components/SummaryMetrics';
import HazardCharts from './components/HazardCharts';
import TemperatureSpellChart from './components/TemperatureSpellChart';
import MethodologyModal from './components/MethodologyModal';
import { fetchPresets, analyzeClimateData, downloadExport } from './services/api';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

const DEFAULT_PRESETS = [
  { name: 'New Delhi, India', lat: 28.6139, lon: 77.2090, climate: 'Subtropical / Extreme Heatwaves' },
  { name: 'Phoenix, Arizona, USA', lat: 33.4484, lon: -112.0740, climate: 'Hot Desert / Sustained High Heat' },
  { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278, climate: 'Temperate Maritime / Emerging Risk' },
  { name: 'Madrid, Spain', lat: 40.4168, lon: -3.7038, climate: 'Mediterranean / Intense Heatwaves' },
  { name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, climate: 'Humid Subtropical' },
  { name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, climate: 'Temperate / Southern Hemisphere' }
];

export default function App() {
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [selectedPreset, setSelectedPreset] = useState('New Delhi, India');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [regionName, setRegionName] = useState('New Delhi, India');

  // Hazard Controls state
  const [hazardType, setHazardType] = useState('heatwave'); // Heatwave selected by default per specs
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2023);
  const [percentile, setPercentile] = useState(95.0);
  const [minDuration, setMinDuration] = useState(3);

  // Analysis state
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Load presets on mount
  useEffect(() => {
    fetchPresets()
      .then((data) => {
        if (data.presets && data.presets.length > 0) {
          setPresets(data.presets);
        }
      })
      .catch(() => {
        // Fallback already in place
      });
  }, []);

  // Initial analysis run for New Delhi
  useEffect(() => {
    executeAnalysis(28.6139, 77.2090, 'New Delhi, India', 1990, 2023, 'heatwave', 95.0, 3);
  }, []);

  const handleSelectPreset = (presetName) => {
    setSelectedPreset(presetName);
    if (presetName === 'custom') return;

    const found = presets.find((p) => p.name === presetName);
    if (found) {
      setLatitude(found.lat);
      setLongitude(found.lon);
      setRegionName(found.name);
    }
  };

  const handleCoordinateChange = (lat, lon) => {
    setLatitude(lat);
    setLongitude(lon);
    setSelectedPreset('custom');
    setRegionName(`Lat: ${lat.toFixed(2)}°, Lon: ${lon.toFixed(2)}°`);
  };

  const executeAnalysis = async (
    lat = latitude,
    lon = longitude,
    name = regionName,
    sYear = startYear,
    eYear = endYear,
    hType = hazardType,
    perc = percentile,
    mDur = minDuration
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    const payload = {
      latitude: lat,
      longitude: lon,
      start_year: sYear,
      end_year: eYear,
      hazard_type: hType,
      threshold_percentile: perc,
      min_duration_days: mDur,
      region_name: name
    };

    try {
      const result = await analyzeClimateData(payload);
      setAnalysisData(result);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete climate hazard analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = async (format) => {
    if (!analysisData) return;
    try {
      await downloadExport(format, analysisData);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 text-slate-800 flex flex-col font-sans">
      <Header
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onExportCSV={() => handleExport('csv')}
        onExportPDF={() => handleExport('pdf')}
        isAnalyzing={isAnalyzing}
        hasData={!!analysisData}
        isCached={analysisData?.cached}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start space-x-3 text-red-800 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">Analysis Error: </strong>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Grid: Region Selection + Hazard Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RegionSelector
            presets={presets}
            selectedPreset={selectedPreset}
            onSelectPreset={handleSelectPreset}
            latitude={latitude}
            longitude={longitude}
            regionName={regionName}
            onCoordinateChange={handleCoordinateChange}
            onRegionNameChange={setRegionName}
          />

          <HazardControls
            hazardType={hazardType}
            setHazardType={setHazardType}
            startYear={startYear}
            setStartYear={setStartYear}
            endYear={endYear}
            setEndYear={setEndYear}
            percentile={percentile}
            setPercentile={setPercentile}
            minDuration={minDuration}
            setMinDuration={setMinDuration}
            onRunAnalysis={() => executeAnalysis()}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Visualizations and Insights Section */}
        {analysisData && (
          <div className="space-y-6">
            {/* Headline Insights & Statistical KPI Cards */}
            <SummaryMetrics data={analysisData} />

            {/* Interactive Charts: Frequency, Duration, Cumulative Intensity */}
            <HazardCharts
              annualMetrics={analysisData.annual_metrics}
              hazardType={analysisData.request_params.hazard_type}
              thresholdUnit={analysisData.data_quality.threshold_unit}
            />

            {/* Daily Drill-down Exceedance Spell Chart */}
            <TemperatureSpellChart
              dailySeries={analysisData.daily_sample_series}
              threshold={analysisData.data_quality.calculated_threshold}
              thresholdUnit={analysisData.data_quality.threshold_unit}
              variableName={analysisData.data_quality.variable_name}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-100 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <p>
          Climate Hazard Trend Analyzer • ECMWF ERA5 & Open-Meteo API • Full-Stack Case Study Assessment
        </p>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}
