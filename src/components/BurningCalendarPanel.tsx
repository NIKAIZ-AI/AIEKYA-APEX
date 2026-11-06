import React, { useState, useMemo } from 'react';
import {
  Download,
  Flame,
  AlertTriangle,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  PRESET_FIRE_REGIONS,
  FireRegion,
  MonthlyFireRecord,
  generateFireCalendarData,
  generateHotspotsCSV,
  calculateAnnualSummaries,
} from '../utils/fireHarmonization';
import { FireDecade } from '../utils/decadeFireHeatmap';
import { DecadeFireProjector } from './DecadeFireProjector';

interface BurningCalendarPanelProps {
  onSelectRegionCoords?: (coords: { lat: number; lon: number; name: string }) => void;
  fireDecade?: FireDecade;
  onChangeFireDecade?: (decade: FireDecade) => void;
  showFireHeatmap?: boolean;
  onToggleFireHeatmap?: (show: boolean) => void;
  onOpenGlobe?: () => void;
}

type ColorRampType = 'inferno' | 'ylorrd' | 'viridis' | 'anomaly';

export const BurningCalendarPanel: React.FC<BurningCalendarPanelProps> = ({
  onSelectRegionCoords,
  fireDecade = '2020s',
  onChangeFireDecade = () => {},
  showFireHeatmap = true,
  onToggleFireHeatmap = () => {},
  onOpenGlobe,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('amazon');
  const [colorRamp, setColorRamp] = useState<ColorRampType>('inferno');
  const [displayMetric, setDisplayMetric] = useState<'count' | 'anomaly' | 'frp'>('count');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [showFullMatrix, setShowFullMatrix] = useState<boolean>(false);

  // Custom Bounding Box State
  const [isCustomAOI, setIsCustomAOI] = useState(false);
  const [customLatMin, setCustomLatMin] = useState(-15.0);
  const [customLatMax, setCustomLatMax] = useState(-3.0);
  const [customLonMin, setCustomLonMin] = useState(-68.0);
  const [customLonMax, setCustomLonMax] = useState(-50.0);

  // Active Region
  const activeRegion: FireRegion = useMemo(() => {
    if (isCustomAOI) {
      return {
        id: 'custom_aoi',
        name: `Custom AOI [${customLatMin.toFixed(1)}°, ${customLonMin.toFixed(1)}°]`,
        country: 'User Defined Area',
        latMin: customLatMin,
        latMax: customLatMax,
        lonMin: customLonMin,
        lonMax: customLonMax,
        biome: 'Regional Mosaic',
        peakSeasonMonths: [7, 8, 9],
        baselineMonthlyMean: [450, 320, 280, 410, 890, 2400, 5800, 14200, 18500, 8400, 2800, 950],
        historicRecordYear: 2024,
        historicRecordNote: 'High drought-driven burning activity.',
        description: 'Custom coordinates defined by user bounding box.',
      };
    }
    return PRESET_FIRE_REGIONS.find((r) => r.id === selectedRegionId) || PRESET_FIRE_REGIONS[0];
  }, [selectedRegionId, isCustomAOI, customLatMin, customLatMax, customLonMin, customLonMax]);

  // Generate harmonized data
  const allRecords = useMemo(() => generateFireCalendarData(activeRegion), [activeRegion]);

  const annualSummaries = useMemo(
    () => calculateAnnualSummaries(allRecords),
    [allRecords]
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from(new Set(allRecords.map((r) => r.year))).sort((a, b) => b - a);

  // Filter records for selected year
  const selectedYearRecords = useMemo(
    () => allRecords.filter((r) => r.year === selectedYear),
    [allRecords, selectedYear]
  );

  const selectedYearSummary = useMemo(
    () => annualSummaries.find((s) => s.year === selectedYear),
    [annualSummaries, selectedYear]
  );

  // Notify parent of coordinates for 3D globe focus
  const handleRegionChange = (region: FireRegion) => {
    setSelectedRegionId(region.id);
    setIsCustomAOI(false);
    if (onSelectRegionCoords) {
      onSelectRegionCoords({
        lat: (region.latMin + region.latMax) / 2,
        lon: (region.lonMin + region.lonMax) / 2,
        name: region.name,
      });
    }
  };

  // Find max values for color scaling
  const maxMonthlyCount = useMemo(
    () => Math.max(...allRecords.map((r) => r.harmonizedCount), 1),
    [allRecords]
  );

  const maxFRP = useMemo(
    () => Math.max(...allRecords.map((r) => r.meanFRP), 1),
    [allRecords]
  );

  // Color generator for accessible ramp
  const getCellColor = (record: MonthlyFireRecord): string => {
    if (displayMetric === 'anomaly') {
      const z = record.anomalyZScore;
      if (z > 2.0) return '#dc2626'; // Red
      if (z > 1.0) return '#ea580c'; // Orange
      if (z > 0.0) return '#f59e0b'; // Amber
      if (z > -1.0) return '#64748b'; // Slate
      return '#2563eb'; // Royal Blue below average
    }

    const value = displayMetric === 'frp' ? record.meanFRP : record.harmonizedCount;
    const maxVal = displayMetric === 'frp' ? maxFRP : maxMonthlyCount;
    const t = Math.min(1.0, Math.max(0.04, value / maxVal));

    if (colorRamp === 'inferno') {
      if (t < 0.2) return '#241442';
      if (t < 0.5) return '#7a1f6d';
      if (t < 0.8) return '#cb4627';
      return '#f99e1a';
    } else if (colorRamp === 'viridis') {
      if (t < 0.25) return '#440154';
      if (t < 0.5) return '#31688e';
      if (t < 0.75) return '#35b779';
      return '#fde725';
    } else {
      // YlOrRd
      if (t < 0.25) return '#ffffcc';
      if (t < 0.5) return '#fecc5c';
      if (t < 0.75) return '#fd8d3c';
      return '#e31a1c';
    }
  };

  // CSV download trigger
  const handleDownloadCSV = () => {
    const csvContent = generateHotspotsCSV(activeRegion, allRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `AikyaApex_Hotspots_${activeRegion.id}_2000_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalHarmonized = useMemo(
    () => allRecords.reduce((acc, r) => acc + r.harmonizedCount, 0),
    [allRecords]
  );

  return (
    <div className="space-y-4 pb-8">
      {/* 1. 3D Globe Fire Evolution Projector with Smooth Opacity Animation */}
      <DecadeFireProjector
        selectedDecade={fireDecade}
        onSelectDecade={onChangeFireDecade}
        showHeatmapOnGlobe={showFireHeatmap}
        onToggleHeatmapOnGlobe={onToggleFireHeatmap}
        onFocusCluster={(lat, lon, name) => {
          if (onSelectRegionCoords) {
            onSelectRegionCoords({ lat, lon, name });
          }
        }}
      />

      {/* 2. Regional Biome Selector (3D Inflated Cards) */}
      <div className="bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl p-4 shadow-[0_12px_28px_-6px_rgba(180,160,135,0.22),inset_0_1.5px_0_rgba(255,255,255,0.95)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 font-display">
            <MapPin className="w-3.5 h-3.5 text-royal-blue text-blue-600" />
            Global Fire Monitoring Biomes
          </span>
          <button
            onClick={() => setIsCustomAOI(!isCustomAOI)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border transition-all ${
              isCustomAOI
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-[#ede5da] text-stone-700 border-[#ded4c5] hover:bg-white'
            }`}
          >
            {isCustomAOI ? '✓ Custom AOI' : '+ Custom Lat/Lon'}
          </button>
        </div>

        {/* Region Pills */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_FIRE_REGIONS.map((region) => {
            const isSelected = !isCustomAOI && region.id === selectedRegionId;
            return (
              <button
                key={region.id}
                onClick={() => handleRegionChange(region)}
                className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-all duration-150 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-[0_4px_10px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] font-bold'
                    : 'bg-[#ede5da] text-stone-700 border-[#ded3c3] hover:bg-white hover:text-stone-900'
                }`}
              >
                {region.name.split(' (')[0]}
              </button>
            );
          })}
        </div>

        {/* Custom Bounding Box (if toggled) */}
        {isCustomAOI && (
          <div className="p-3 bg-white/90 border border-stone-200 rounded-xl grid grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-stone-500 block font-semibold">Min Lat</label>
              <input
                type="number"
                value={customLatMin}
                onChange={(e) => setCustomLatMin(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f5efe6] border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block font-semibold">Max Lat</label>
              <input
                type="number"
                value={customLatMax}
                onChange={(e) => setCustomLatMax(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f5efe6] border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block font-semibold">Min Lon</label>
              <input
                type="number"
                value={customLonMin}
                onChange={(e) => setCustomLonMin(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f5efe6] border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-500 block font-semibold">Max Lon</label>
              <input
                type="number"
                value={customLonMax}
                onChange={(e) => setCustomLonMax(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#f5efe6] border border-stone-300 rounded-lg px-2 py-1 text-stone-900 font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Key Telemetry Figures (3D Inflated Cards) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl shadow-[0_8px_20px_-4px_rgba(180,160,135,0.18),inset_0_1.5px_0_rgba(255,255,255,0.95)]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-display">
            Harmonized Hotspots
          </div>
          <div className="text-xl font-bold text-orange-600 font-mono mt-0.5">
            {totalHarmonized.toLocaleString()}
          </div>
          <div className="text-[10px] text-stone-500">2000–2026 Time Series</div>
        </div>

        <div className="p-3 bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl shadow-[0_8px_20px_-4px_rgba(180,160,135,0.18),inset_0_1.5px_0_rgba(255,255,255,0.95)]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-display">
            Record Fire Year
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono mt-0.5">
            {activeRegion.historicRecordYear}
          </div>
          <div className="text-[10px] text-stone-500 truncate">{activeRegion.country}</div>
        </div>
      </div>

      {/* 4. Burning Calendar Visualizer: Annual & Monthly Phenology */}
      <div className="bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl p-4 shadow-[0_12px_28px_-6px_rgba(180,160,135,0.22),inset_0_1.5px_0_rgba(255,255,255,0.95)] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider font-display">
              Burning Activity Calendar
            </span>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex gap-1 text-[11px] font-semibold bg-[#ede4d8] p-1 rounded-xl">
            <button
              onClick={() => setDisplayMetric('count')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                displayMetric === 'count'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hotspots
            </button>
            <button
              onClick={() => setDisplayMetric('anomaly')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                displayMetric === 'anomaly'
                  ? 'bg-white text-stone-900 shadow-sm font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Anomaly %
            </button>
          </div>
        </div>

        {/* Year Selector Pill Carousel */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-stone-500">
            <span>Select Focus Year:</span>
            <span className="font-bold text-stone-800">{selectedYear}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {years.slice(0, 15).map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-xl shrink-0 transition-all active:scale-95 ${
                  selectedYear === yr
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-[#ede5da] text-stone-700 hover:bg-white'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Month Flame Calendar Strip for Selected Year */}
        <div className="space-y-1.5 pt-1">
          <div className="grid grid-cols-12 gap-1 text-center font-mono text-[10px] font-bold text-stone-600">
            {months.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-1">
            {months.map((_, idx) => {
              const monthNum = idx + 1;
              const rec = selectedYearRecords.find((r) => r.month === monthNum);
              if (!rec) return <div key={idx} className="h-10 rounded-lg bg-stone-200" />;

              const isPeak = activeRegion.peakSeasonMonths.includes(monthNum);
              const color = getCellColor(rec);

              return (
                <div
                  key={monthNum}
                  style={{ backgroundColor: color }}
                  className="h-11 rounded-xl flex flex-col items-center justify-center p-0.5 text-white shadow-sm transition-transform hover:scale-105 cursor-pointer relative group"
                  title={`${months[idx]} ${selectedYear}: ${rec.harmonizedCount.toLocaleString()} hotspots (Anomaly: ${(rec.anomalyPercent).toFixed(0)}%)`}
                >
                  <span className="text-[10px] font-mono font-bold drop-shadow-sm leading-none">
                    {rec.harmonizedCount > 999
                      ? `${(rec.harmonizedCount / 1000).toFixed(1)}k`
                      : rec.harmonizedCount}
                  </span>
                  {isPeak && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5 shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Year Analysis Strip */}
        {selectedYearSummary && (
          <div className="p-3 bg-white/90 border border-stone-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-bold text-stone-900">
              <span>{selectedYear} Annual Summary:</span>
              <span className="font-mono text-orange-600">
                {selectedYearSummary.totalHarmonized.toLocaleString()} hotspots
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span>Active Constellation:</span>
              <span className="font-semibold text-blue-700">
                {selectedYear >= 2012 ? 'MODIS + VIIRS (Harmonized)' : 'Terra + Aqua MODIS'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-600">
              <span>Peak Month &amp; Anomaly:</span>
              <span className="font-mono font-bold text-emerald-700">
                {months[selectedYearSummary.peakMonth - 1]} ({selectedYearSummary.annualAnomalyPct >= 0 ? '+' : ''}{selectedYearSummary.annualAnomalyPct.toFixed(1)}% vs baseline)
              </span>
            </div>
          </div>
        )}

        {/* Expandable 26-Year Historical Matrix Toggle */}
        <div>
          <button
            onClick={() => setShowFullMatrix(!showFullMatrix)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-stone-700 bg-[#ede5da] hover:bg-white rounded-xl border border-[#ded3c3] transition-all"
          >
            <span>{showFullMatrix ? 'Collapse 26-Year Matrix' : 'View Full 2000-2026 Climatology Matrix'}</span>
            {showFullMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showFullMatrix && (
            <div className="mt-3 p-2 bg-white/95 border border-stone-200 rounded-xl max-h-72 overflow-y-auto space-y-1 font-mono text-[10px]">
              <div className="grid grid-cols-[45px_repeat(12,1fr)_55px] gap-1 text-center font-bold text-stone-500 border-b border-stone-200 pb-1">
                <span>Year</span>
                {months.map((m) => (
                  <span key={m}>{m}</span>
                ))}
                <span>Total</span>
              </div>
              {years.map((y) => {
                const yRecs = allRecords.filter((r) => r.year === y);
                const sum = annualSummaries.find((s) => s.year === y);
                return (
                  <div
                    key={y}
                    className="grid grid-cols-[45px_repeat(12,1fr)_55px] gap-1 items-center py-0.5 hover:bg-stone-100 rounded"
                  >
                    <span className="font-bold text-stone-800 text-left">{y}</span>
                    {months.map((_, idx) => {
                      const rec = yRecs.find((r) => r.month === idx + 1);
                      if (!rec) return <span key={idx} className="text-stone-300">-</span>;
                      return (
                        <span
                          key={idx}
                          style={{ backgroundColor: getCellColor(rec) }}
                          className="text-white text-center rounded py-0.5 font-bold"
                          title={`${months[idx]} ${y}: ${rec.harmonizedCount}`}
                        >
                          {rec.harmonizedCount > 999 ? `${(rec.harmonizedCount / 1000).toFixed(0)}k` : rec.harmonizedCount}
                        </span>
                      );
                    })}
                    <span className="font-bold text-stone-700 text-right">
                      {sum ? (sum.totalHarmonized > 999 ? `${(sum.totalHarmonized / 1000).toFixed(0)}k` : sum.totalHarmonized) : '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Accessible Color Ramp Selector */}
      <div className="bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl p-3.5 shadow-[0_8px_20px_-4px_rgba(180,160,135,0.18),inset_0_1.5px_0_rgba(255,255,255,0.95)] flex items-center justify-between text-xs">
        <span className="font-bold text-stone-700">Accessible Palette:</span>
        <div className="flex gap-1.5">
          {(['inferno', 'viridis', 'ylorrd'] as ColorRampType[]).map((ramp) => (
            <button
              key={ramp}
              onClick={() => setColorRamp(ramp)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold capitalize border transition-all ${
                colorRamp === ramp
                  ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                  : 'bg-[#ede5da] text-stone-700 border-[#ded4c5] hover:bg-white'
              }`}
            >
              {ramp}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Prominent 3D Inflated Tactile CSV Download Button */}
      <button
        onClick={handleDownloadCSV}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_12px_24px_-4px_rgba(16,185,129,0.38),inset_0_1.5px_0_rgba(255,255,255,0.45)] hover:shadow-[0_16px_28px_-4px_rgba(16,185,129,0.48)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 border border-emerald-500"
      >
        <Download className="w-4 h-4" />
        <span>Download Harmonized Hotspots CSV (2000–2026)</span>
      </button>
    </div>
  );
};
