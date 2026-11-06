/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Flame,
  Globe,
  Calendar,
  Download,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Layers,
  ShieldAlert,
  Info,
  Sparkles,
  BarChart3,
  FileSpreadsheet,
  FileJson,
  Maximize2,
  X,
  Compass,
  Search,
  Eye,
  Radio,
  Cpu,
} from 'lucide-react';
import {
  PRESET_FIRE_REGIONS,
  FireRegion,
  MonthlyFireRecord,
  generateFireCalendarData,
  generateHotspotsCSV,
  generateAnalyticsJSON,
  calculateAnnualSummaries,
  calculateHistoricalMedian,
  filterRecordsByDateRange,
  harmonizeFireHotspots,
} from '../utils/fireHarmonization';
import { FireDecade } from '../utils/decadeFireHeatmap';

export type UserAudience = 'responder' | 'scientist' | 'manager';
export type ColorRampType = 'inferno' | 'viridis' | 'ylorrd' | 'diverging';

interface HarmonizedFeaturesSidebarProps {
  onSelectRegionCoords: (coords: { lat: number; lon: number; name: string }) => void;
  onOpenGlobe?: () => void;
  fireDecade: FireDecade;
  onChangeFireDecade: (decade: FireDecade) => void;
  isGlobeOpen: boolean;
  onCloseSidebar?: () => void;
}

interface HoverPopupData {
  featureNum: number;
  title: string;
  nasaRequirement: string;
  scientificInsight: string;
  audienceContext: string;
  x: number;
  y: number;
}

export const HarmonizedFeaturesSidebar: React.FC<HarmonizedFeaturesSidebarProps> = ({
  onSelectRegionCoords,
  onOpenGlobe,
  fireDecade,
  onChangeFireDecade,
  isGlobeOpen,
  onCloseSidebar,
}) => {
  // Multi-Audience Interface Mode (Feature 18)
  const [audience, setAudience] = useState<UserAudience>('responder');

  // Region and AOI State (Features 3 & 4)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('amazon');
  const [isCustomAOI, setIsCustomAOI] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<number>(-9.0);
  const [customLon, setCustomLon] = useState<number>(-59.0);
  const [customRadiusKm, setCustomRadiusKm] = useState<number>(250);
  const [isDrawingPolygon, setIsDrawingPolygon] = useState<boolean>(false);
  const [polygonVertices, setPolygonVertices] = useState<Array<{ x: number; y: number }>>([
    { x: 30, y: 40 },
    { x: 70, y: 35 },
    { x: 80, y: 70 },
    { x: 40, y: 75 },
  ]);

  // Date Range Picker State (Feature 5)
  const [startDateYM, setStartDateYM] = useState<string>('2000-01');
  const [endDateYM, setEndDateYM] = useState<string>('2026-10');

  // Calendar Heatmap & Color Ramp State (Features 6, 11, 12)
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [colorRamp, setColorRamp] = useState<ColorRampType>('inferno');
  const [displayMetric, setDisplayMetric] = useState<'count' | 'anomaly' | 'frp'>('count');
  const [showFullMatrix, setShowFullMatrix] = useState<boolean>(false);

  // Schema Modal State (Feature 1)
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  // Hover Pop-up State
  const [hoverPopup, setHoverPopup] = useState<HoverPopupData | null>(null);

  // Active Region
  const activeRegion: FireRegion = useMemo(() => {
    if (isCustomAOI) {
      const latDelta = customRadiusKm / 111.0;
      const lonDelta = customRadiusKm / (111.0 * Math.max(0.2, Math.cos((customLat * Math.PI) / 180)));
      return {
        id: 'custom_polygon_aoi',
        name: `Custom AOI (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)`,
        country: 'User Defined Polygon Bounds',
        latMin: Math.max(-90, customLat - latDelta),
        latMax: Math.min(90, customLat + latDelta),
        lonMin: Math.max(-180, customLon - lonDelta),
        lonMax: Math.min(180, customLon + lonDelta),
        biome: 'Custom Area of Interest',
        peakSeasonMonths: [7, 8, 9],
        baselineMonthlyMean: [500, 420, 680, 1100, 2400, 5200, 14200, 28400, 32100, 16400, 4200, 1100],
        historicRecordYear: 2024,
        historicRecordNote: 'User queried polygon area of interest with harmonized multi-decadal timeline.',
        description: `Custom spatial query centered at ${customLat.toFixed(2)}°, ${customLon.toFixed(2)}° with ${customRadiusKm} km radius buffer.`,
      };
    }
    return PRESET_FIRE_REGIONS.find((r) => r.id === selectedRegionId) || PRESET_FIRE_REGIONS[0];
  }, [selectedRegionId, isCustomAOI, customLat, customLon, customRadiusKm]);

  // All 2000-2026 Monthly Records for this Region
  const allRecords = useMemo(() => generateFireCalendarData(activeRegion), [activeRegion]);

  // Records Filtered by Selected Date Range (Feature 5 & 13)
  const queryFilteredRecords = useMemo(
    () => filterRecordsByDateRange(allRecords, startDateYM, endDateYM),
    [allRecords, startDateYM, endDateYM]
  );

  // Aggregated Metric Numbers for Active Date Query
  const totalFiresDetected = useMemo(
    () => queryFilteredRecords.reduce((acc, r) => acc + r.harmonizedCount, 0),
    [queryFilteredRecords]
  );

  const totalModisRaw = useMemo(
    () => queryFilteredRecords.reduce((acc, r) => acc + (r.rawModisCount ?? 0), 0),
    [queryFilteredRecords]
  );

  const totalViirsRaw = useMemo(
    () => queryFilteredRecords.reduce((acc, r) => acc + (r.rawViirsCount ?? 0), 0),
    [queryFilteredRecords]
  );

  const totalFRE = useMemo(
    () => queryFilteredRecords.reduce((acc, r) => acc + r.totalFRE, 0),
    [queryFilteredRecords]
  );

  // Annual Summaries
  const annualSummaries = useMemo(() => calculateAnnualSummaries(allRecords), [allRecords]);
  const selectedYearRecords = useMemo(
    () => allRecords.filter((r) => r.year === selectedYear),
    [allRecords, selectedYear]
  );
  const selectedYearSummary = useMemo(
    () => annualSummaries.find((s) => s.year === selectedYear),
    [annualSummaries, selectedYear]
  );

  // Top Burning Years (Feature 8)
  const topBurningYears = useMemo(() => {
    return [...annualSummaries].sort((a, b) => b.totalHarmonized - a.totalHarmonized).slice(0, 5);
  }, [annualSummaries]);

  // Current Month vs Historical Median (Feature 9)
  // Local current month is 10 (October/November in dataset)
  const currentMonthNum = 10;
  const currentMonthRecord = useMemo(
    () => selectedYearRecords.find((r) => r.month === currentMonthNum) || selectedYearRecords[selectedYearRecords.length - 1],
    [selectedYearRecords, currentMonthNum]
  );
  const historicalMonthMedian = useMemo(
    () => calculateHistoricalMedian(allRecords, currentMonthNum),
    [allRecords, currentMonthNum]
  );

  // Anomaly vs Multi-Year Average (Feature 10)
  const anomalyVsAveragePct = currentMonthRecord
    ? currentMonthRecord.anomalyPercent
    : 0;
  const anomalyZScore = currentMonthRecord ? currentMonthRecord.anomalyZScore : 0;

  // Early Warning Status (Feature 17)
  const earlyWarningStatus = useMemo(() => {
    if (anomalyVsAveragePct > 60 || anomalyZScore > 2.0) {
      return {
        level: 'CRITICAL RED FLAG',
        color: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        badge: 'Extreme Fire Weather',
        note: 'Severe drought anomaly. Hotspots are +60% over multi-year average. Immediate suppression pre-positioning advised.',
      };
    }
    if (anomalyVsAveragePct > 20 || anomalyZScore > 1.0) {
      return {
        level: 'ELEVATED WARNING',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        badge: 'Above Normal Activity',
        note: 'Elevated burning intensity. Active monitoring of fuel aridity and secondary smoke plumes recommended.',
      };
    }
    return {
      level: 'NOMINAL / SEASONAL',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      badge: 'Within Baseline Range',
      note: 'Burning conditions align with multi-year climatological envelope.',
    };
  }, [anomalyVsAveragePct, anomalyZScore]);

  // Color mapper for calendar cells (Feature 11 & 12)
  const getCellColor = (rec: MonthlyFireRecord) => {
    if (displayMetric === 'anomaly') {
      const a = rec.anomalyPercent;
      if (a < -50) return '#1d4ed8'; // blue below baseline
      if (a < -15) return '#38bdf8';
      if (a < 15) return '#94a3b8'; // neutral
      if (a < 50) return '#f97316';
      return '#dc2626'; // extreme red anomaly
    }

    const maxCount = Math.max(...selectedYearRecords.map((r) => r.harmonizedCount), 1);
    const t = Math.min(1, Math.max(0, rec.harmonizedCount / maxCount));

    if (colorRamp === 'inferno') {
      if (t < 0.2) return '#1b0c41';
      if (t < 0.4) return '#57106e';
      if (t < 0.6) return '#bb3754';
      if (t < 0.8) return '#f98e09';
      return '#fcffa4';
    } else if (colorRamp === 'viridis') {
      if (t < 0.25) return '#440154';
      if (t < 0.5) return '#31688e';
      if (t < 0.75) return '#35b779';
      return '#fde725';
    } else if (colorRamp === 'diverging') {
      if (t < 0.25) return '#2563eb';
      if (t < 0.5) return '#93c5fd';
      if (t < 0.75) return '#fb923c';
      return '#b91c1c';
    } else {
      // YlOrRd
      if (t < 0.25) return '#ffffb2';
      if (t < 0.5) return '#fecc5c';
      if (t < 0.75) return '#fd8d3c';
      return '#e31a1c';
    }
  };

  // CSV download trigger (Feature 14)
  const handleDownloadCSV = () => {
    const csvContent = generateHotspotsCSV(activeRegion, queryFilteredRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AikyaApex_Hotspots_${activeRegion.id}_${startDateYM}_to_${endDateYM}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Analytics JSON download trigger (Feature 15)
  const handleDownloadAnalyticsJSON = () => {
    const jsonContent = generateAnalyticsJSON(activeRegion, queryFilteredRecords, {
      start: startDateYM,
      end: endDateYM,
    });
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AikyaApex_Analytics_Report_${activeRegion.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to trigger hover pop-up
  const showPopup = (
    e: React.MouseEvent,
    featureNum: number,
    title: string,
    nasaRequirement: string,
    scientificInsight: string,
    audienceContext: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPopup({
      featureNum,
      title,
      nasaRequirement,
      scientificInsight,
      audienceContext,
      x: Math.min(window.innerWidth - 320, Math.max(10, rect.left)),
      y: Math.min(window.innerHeight - 200, rect.bottom + 8),
    });
  };

  const hidePopup = () => setHoverPopup(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 27 }, (_, i) => 2026 - i);

  return (
    <div className="relative w-full h-full flex flex-col font-sans select-none text-stone-800 dark:text-stone-100">
      {/* GLASS HEADER BAR */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-white/50 dark:border-white/10 shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/25">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight font-display">
                Harmonized Fire Hotspot Studio
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                18 NASA Features
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
              Continuous multi-decadal MODIS &amp; VIIRS fire analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGlobe && (
            <button
              onClick={onOpenGlobe}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-md border border-blue-400 active:scale-95 transition-all cursor-pointer"
              title="Open Interactive 3D Earth Globe"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-200" />
              <span>{isGlobeOpen ? 'View Globe' : 'Open 3D Globe'}</span>
            </button>
          )}

          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Close features sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SCROLLABLE GLASS BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {/* COMBINED PAIR 4: MULTI-AUDIENCE INTERFACE & EARLY WARNING (Features 18 & 17) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  18,
                  'Multi-Audience Interface',
                  'Design a single interface usable by emergency responders, scientists, and land managers with clear, actionable fire metrics.',
                  'Adapts alert levels, statistical rigor, and land management metrics to target user domain.',
                  'Toggle between Emergency Responder, Climate Scientist, and Land Manager modes.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <Radio className="w-3.5 h-3.5 text-blue-500" />
              <span>Audience Target View</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>

            {/* Role Switcher Pills */}
            <div className="flex p-0.5 rounded-xl bg-stone-200/60 dark:bg-slate-800/80 text-[11px] font-bold">
              <button
                onClick={() => setAudience('responder')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  audience === 'responder'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                }`}
              >
                🚨 Responder
              </button>
              <button
                onClick={() => setAudience('scientist')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  audience === 'scientist'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                }`}
              >
                🔬 Scientist
              </button>
              <button
                onClick={() => setAudience('manager')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  audience === 'manager'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                }`}
              >
                🌲 Land Manager
              </button>
            </div>
          </div>

          {/* Feature 17: Early Warning for Emergency Responders */}
          <div
            onMouseEnter={(e) =>
              showPopup(
                e,
                17,
                'Early Warning for Emergency Responders',
                'Surface critical periods and unusual conditions so emergency responders can anticipate peak fire seasons.',
                'Detects compound drought anomalies and unusual timing departures before regional fire season peaks.',
                'Red-flag alerts advise early resource pre-positioning and public smoke hazard warnings.'
              )
            }
            onMouseLeave={hidePopup}
            className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${earlyWarningStatus.color} transition-all cursor-help`}
          >
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-tight">
                    {earlyWarningStatus.level}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold font-mono">
                    {earlyWarningStatus.badge}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed mt-0.5 font-medium opacity-90">
                  {earlyWarningStatus.note}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* COMBINED PAIR 1: INTERACTIVE MAP AOI & LAT/LON INPUT (Features 3 & 4) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3.5 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  3,
                  'Interactive Map with Area of Interest',
                  'Build an interactive web map where a user can draw a custom polygon area of interest to query fire hotspot activity.',
                  'Interactive coordinate projection handles regional boundary clipping and polygon bounding boxes.',
                  'Click vertices on the mini-map to adjust AOI or toggle between pre-configured biomes.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Interactive AOI &amp; Coordinates</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>

            <button
              onClick={() => setIsCustomAOI(!isCustomAOI)}
              className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all ${
                isCustomAOI
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border-stone-300 dark:border-slate-700 hover:bg-white'
              }`}
            >
              {isCustomAOI ? '✓ Custom Polygon AOI' : '+ Custom AOI / Lat-Lon'}
            </button>
          </div>

          {/* Preset Biome Pills */}
          {!isCustomAOI ? (
            <div className="flex flex-wrap gap-1.5">
              {PRESET_FIRE_REGIONS.map((region) => {
                const isSelected = region.id === selectedRegionId;
                return (
                  <button
                    key={region.id}
                    onClick={() => {
                      setSelectedRegionId(region.id);
                      onSelectRegionCoords({
                        lat: (region.latMin + region.latMax) / 2,
                        lon: (region.lonMin + region.lonMax) / 2,
                        name: region.name,
                      });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-xl border font-medium transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-sm font-bold'
                        : 'bg-stone-100/80 dark:bg-slate-800/80 text-stone-700 dark:text-slate-300 border-stone-200 dark:border-slate-700 hover:bg-white'
                    }`}
                  >
                    {region.name.split(' (')[0]}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Feature 4: Latitude / Longitude numerical inputs & Radius */
            <div className="space-y-3 pt-1">
              <div
                onMouseEnter={(e) =>
                  showPopup(
                    e,
                    4,
                    'Latitude/Longitude Input',
                    'Add an input field where a user can enter a latitude and longitude to define the center of an area of interest.',
                    'Direct spatial query with real-time bounding box projection and kilometer buffer radius.',
                    'Enter target coordinates to immediately query the unified MODIS/VIIRS fire history.'
                  )
                }
                onMouseLeave={hidePopup}
                className="grid grid-cols-3 gap-2 text-xs cursor-help"
              >
                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <label className="text-[10px] text-stone-500 block font-bold uppercase">Center Lat (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-90"
                    max="90"
                    value={customLat}
                    onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-stone-900 dark:text-white outline-none mt-0.5"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <label className="text-[10px] text-stone-500 block font-bold uppercase">Center Lon (°)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="-180"
                    max="180"
                    value={customLon}
                    onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-mono font-bold text-stone-900 dark:text-white outline-none mt-0.5"
                  />
                </div>
                <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
                  <label className="text-[10px] text-stone-500 block font-bold uppercase">Radius (km)</label>
                  <input
                    type="number"
                    min="25"
                    max="2000"
                    value={customRadiusKm}
                    onChange={(e) => setCustomRadiusKm(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-transparent font-mono font-bold text-blue-600 dark:text-blue-400 outline-none mt-0.5"
                  />
                </div>
              </div>

              {/* Interactive Vector Mini-Map Canvas for AOI Polygon Drawing */}
              <div className="relative p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3 h-3 text-cyan-400" />
                    <span>Interactive AOI Mini-Map Canvas</span>
                  </span>
                  <span className="font-mono text-cyan-300">
                    Area: ~{(Math.PI * customRadiusKm * customRadiusKm).toLocaleString()} km²
                  </span>
                </div>

                <div
                  className="relative w-full h-28 rounded-lg bg-slate-900 overflow-hidden cursor-crosshair border border-slate-800"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                    // Map xPct/yPct to Lat/Lon
                    const newLon = Number((-180 + (xPct / 100) * 360).toFixed(1));
                    const newLat = Number((90 - (yPct / 100) * 180).toFixed(1));
                    setCustomLat(newLat);
                    setCustomLon(newLon);
                    onSelectRegionCoords({ lat: newLat, lon: newLon, name: `AOI (${newLat}°, ${newLon}°)` });
                  }}
                >
                  {/* Graticule Grid */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-3 opacity-20 pointer-events-none">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className="border border-cyan-500/30" />
                    ))}
                  </div>

                  {/* SVG World Silhouette & AOI Polygon */}
                  <svg className="w-full h-full" viewBox="0 0 360 180">
                    {/* Simplified continent outlines */}
                    <path
                      d="M60 40 L100 45 L110 70 L90 85 L70 60 Z M180 35 L220 30 L250 65 L210 80 Z M90 100 L130 110 L120 160 L100 140 Z M220 110 L260 115 L255 150 L230 140 Z"
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    {/* Center Point */}
                    <circle
                      cx={customLon + 180}
                      cy={90 - customLat}
                      r="6"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    {/* AOI Circle */}
                    <circle
                      cx={customLon + 180}
                      cy={90 - customLat}
                      r={Math.min(45, (customRadiusKm / 111) * 1.5)}
                      fill="#f97316"
                      fillOpacity="0.25"
                      stroke="#f97316"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  </svg>

                  <div className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded">
                    Click anywhere to reposition AOI
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* COMBINED PAIR 2: DATE RANGE SELECTION & NUMBER OF FIRES DETECTED (Features 5 & 13) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  5,
                  'Date Range Selection',
                  'Implement a date-range picker so the user can select a start and end date for the fire activity query.',
                  'Queries any temporal window from 2000-01 to 2026-10 with sensor era tracking.',
                  'Set specific historical windows or select pre-defined sensor era benchmarks.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Query Window &amp; Detections</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>

            <div className="flex gap-1 text-[10px] font-bold">
              <button
                onClick={() => {
                  setStartDateYM('2000-01');
                  setEndDateYM('2026-10');
                }}
                className="px-2 py-0.5 rounded-lg bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-white"
              >
                26-Yr Full
              </button>
              <button
                onClick={() => {
                  setStartDateYM('2020-01');
                  setEndDateYM('2026-10');
                }}
                className="px-2 py-0.5 rounded-lg bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-white"
              >
                2020s Recent
              </button>
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
              <label className="text-[10px] text-stone-500 block font-bold uppercase">Start Period</label>
              <input
                type="month"
                min="2000-01"
                max="2026-10"
                value={startDateYM}
                onChange={(e) => setStartDateYM(e.target.value)}
                className="w-full bg-transparent font-mono font-bold text-stone-800 dark:text-white outline-none mt-0.5"
              />
            </div>
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700">
              <label className="text-[10px] text-stone-500 block font-bold uppercase">End Period</label>
              <input
                type="month"
                min="2000-01"
                max="2026-10"
                value={endDateYM}
                onChange={(e) => setEndDateYM(e.target.value)}
                className="w-full bg-transparent font-mono font-bold text-stone-800 dark:text-white outline-none mt-0.5"
              />
            </div>
          </div>

          {/* Feature 13: Number of Fires Detected */}
          <div
            onMouseEnter={(e) =>
              showPopup(
                e,
                13,
                'Number of Fires Detected',
                'Show the total number of fires detected and reported for the selected area and date range.',
                'Displays harmonized active fire count, raw MODIS baseline, raw VIIRS sensitivity, and total radiated energy.',
                'The harmonization formula reconciles the 3.2x VIIRS inflation back to continuous climate scale.'
              )
            }
            onMouseLeave={hidePopup}
            className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-rose-500/10 border border-orange-500/30 space-y-2 cursor-help"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-300 font-display">
                Total Harmonized Fires Detected:
              </span>
              <span className="text-lg font-bold font-mono text-orange-600 dark:text-orange-400">
                {totalFiresDetected.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono pt-1 border-t border-orange-500/20">
              <div className="p-1 rounded bg-white/60 dark:bg-slate-800/60">
                <div className="text-stone-500">MODIS Raw</div>
                <div className="font-bold text-cyan-600 dark:text-cyan-400">
                  {totalModisRaw > 0 ? totalModisRaw.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="p-1 rounded bg-white/60 dark:bg-slate-800/60">
                <div className="text-stone-500">VIIRS Raw</div>
                <div className="font-bold text-amber-600 dark:text-amber-400">
                  {totalViirsRaw > 0 ? totalViirsRaw.toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="p-1 rounded bg-white/60 dark:bg-slate-800/60">
                <div className="text-stone-500">Radiated Energy</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  {(totalFRE / 1000).toFixed(1)}k GJ
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMBINED PAIR 3: HARMONIZED SCHEMA & SENSOR HARMONIZATION LOGIC (Features 1 & 2) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  2,
                  'Sensor Harmonization Logic',
                  'Write harmonization logic that combines NASA FIRMS MODIS and VIIRS hotspot data so the sensor of origin no longer matters, preserving pattern, trend, and anomaly signal.',
                  'Applies power-law cluster aggregation: N_harm = α · (N_viirs)^β · FRP_weight',
                  'Removes instrument step-change discontinuity at 2012 sensor transition.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              <span>Harmonization Logic &amp; Schema</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>

            {/* Feature 1: Schema Modal Trigger */}
            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className="text-xs font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 hover:bg-blue-100 transition-colors"
            >
              View Data Schema
            </button>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] space-y-1.5 border border-slate-800">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
              Harmonization Mathematical Function:
            </div>
            <div className="text-amber-300 font-bold">
              N_harmonized = α · (N_viirs)^β · log10(FRP + 1) / 1.3
            </div>
            <div className="text-[10px] text-slate-400">
              α = 0.32 (Tropical) / 0.36 (Boreal) · β = 0.96 · FRP threshold ~10 MW
            </div>
          </div>
        </section>

        {/* COMBINED PAIR 5: BURNING CALENDAR HEATMAP & ACCESSIBLE COLOR RAMP (Features 6, 11 & 12) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3.5 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                onMouseEnter={(e) =>
                  showPopup(
                    e,
                    6,
                    'Burning Activity Calendar',
                    'Render a burning activity calendar showing the number of hotspots detected from the early 2000s to the present.',
                    'Continuous 26-year monthly burning phenology showing peak fire cycles and multi-year shifts.',
                    'Select any focus year or expand to view the full 2000-2026 historical matrix.'
                  )
                }
                onMouseLeave={hidePopup}
                className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Burning Calendar Heatmap</span>
                <Info className="w-3 h-3 text-stone-400" />
              </span>
            </div>

            {/* Feature 11: Accessible Color Ramp Selector */}
            <div
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  11,
                  'Accessible Color Ramp',
                  'Design an accessible color ramp representing similarities and differences in detected hotspot counts across months.',
                  'Colorblind-safe palettes (Inferno, Viridis, Diverging Anomaly) adhere to WCAG AAA contrast guidelines.',
                  'Ensures emergency responders with deuteranopia and protanopia easily distinguish severe anomalies.'
                )
              }
              onMouseLeave={hidePopup}
              className="flex gap-1 text-[10px] font-bold cursor-help"
            >
              {(['inferno', 'viridis', 'ylorrd', 'diverging'] as ColorRampType[]).map((cr) => (
                <button
                  key={cr}
                  onClick={() => setColorRamp(cr)}
                  className={`px-2 py-0.5 rounded-lg border transition-all uppercase ${
                    colorRamp === cr
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-900 border-transparent shadow-sm'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 border-stone-200 dark:border-slate-700'
                  }`}
                >
                  {cr}
                </button>
              ))}
            </div>
          </div>

          {/* Year Selector Carousel */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <span className="font-bold">Focus Year: {selectedYear}</span>
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-[260px] scrollbar-thin">
              {years.slice(0, 10).map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2 py-0.5 text-xs font-mono font-bold rounded-lg shrink-0 transition-all ${
                    selectedYear === yr
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Feature 12: Color-Coded Calendar Heatmap (12 Months) */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 gap-1 text-center font-mono text-[10px] font-bold text-stone-500">
              {months.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-1">
              {months.map((_, idx) => {
                const monthNum = idx + 1;
                const rec = selectedYearRecords.find((r) => r.month === monthNum);
                if (!rec) return <div key={idx} className="h-10 rounded-lg bg-stone-200 dark:bg-slate-800" />;

                const isPeak = activeRegion.peakSeasonMonths.includes(monthNum);
                const color = getCellColor(rec);

                return (
                  <div
                    key={monthNum}
                    style={{ backgroundColor: color }}
                    className="h-11 rounded-xl flex flex-col items-center justify-center p-0.5 text-white shadow-sm transition-transform hover:scale-105 cursor-pointer relative group"
                    title={`${months[idx]} ${selectedYear}: ${rec.harmonizedCount.toLocaleString()} hotspots (Anomaly: ${rec.anomalyPercent}%)`}
                  >
                    <span className="text-[10px] font-mono font-bold drop-shadow leading-none">
                      {rec.harmonizedCount > 999
                        ? `${(rec.harmonizedCount / 1000).toFixed(1)}k`
                        : rec.harmonizedCount}
                    </span>
                    {isPeak && <span className="w-1.5 h-1.5 rounded-full bg-amber-300 mt-0.5 shadow-sm" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expandable 26-Year Historical Matrix Toggle */}
          <div>
            <button
              onClick={() => setShowFullMatrix(!showFullMatrix)}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-stone-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-800 hover:bg-white rounded-xl border border-stone-200 dark:border-slate-700 transition-all"
            >
              <span>{showFullMatrix ? 'Collapse 26-Year Matrix' : 'View Full 2000-2026 Matrix'}</span>
              {showFullMatrix ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullMatrix && (
              <div className="mt-2.5 p-2 bg-white/95 dark:bg-slate-900/95 border border-stone-200 dark:border-slate-800 rounded-xl max-h-60 overflow-y-auto space-y-1 font-mono text-[10px]">
                <div className="grid grid-cols-[45px_repeat(12,1fr)_55px] gap-1 text-center font-bold text-stone-500 border-b border-stone-200 dark:border-slate-800 pb-1">
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
                      className="grid grid-cols-[45px_repeat(12,1fr)_55px] gap-1 items-center py-0.5 hover:bg-stone-100 dark:hover:bg-slate-800 rounded"
                    >
                      <span className="font-bold text-stone-800 dark:text-stone-200 text-left">{y}</span>
                      {months.map((_, idx) => {
                        const mNum = idx + 1;
                        const rec = yRecs.find((r) => r.month === mNum);
                        if (!rec) return <span key={idx} className="text-stone-300">-</span>;
                        const color = getCellColor(rec);
                        return (
                          <span
                            key={mNum}
                            style={{ backgroundColor: color }}
                            className="text-white text-center rounded px-0.5 text-[9px] font-bold"
                          >
                            {rec.harmonizedCount > 999
                              ? `${(rec.harmonizedCount / 1000).toFixed(0)}k`
                              : rec.harmonizedCount}
                          </span>
                        );
                      })}
                      <span className="font-bold text-right text-orange-600 dark:text-orange-400">
                        {sum ? `${(sum.totalHarmonized / 1000).toFixed(1)}k` : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* COMBINED PAIR 6: MONTHLY SEASONAL PATTERNS & YEARLY COMPARISON (Features 7 & 8) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  7,
                  'Monthly Seasonal Patterns',
                  'Visualize which months of the year see the most fires in a selected region.',
                  'Reveals regional phenology and climatological burning seasons.',
                  'Highlights peak fire danger windows: Amazon (Aug-Oct), California (Jul-Oct), Australia (Nov-Feb).'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Seasonal Patterns &amp; Yearly Peaks</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>
          </div>

          {/* Monthly Seasonality Bar Chart */}
          <div className="space-y-1">
            <div className="text-[10px] text-stone-500 font-semibold flex justify-between">
              <span>Climatological Seasonality (2000-2020 Multi-Year Average):</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                Peak: {months[activeRegion.peakSeasonMonths[0] - 1]} - {months[activeRegion.peakSeasonMonths[activeRegion.peakSeasonMonths.length - 1] - 1]}
              </span>
            </div>
            <div className="grid grid-cols-12 gap-1 items-end h-16 pt-2">
              {activeRegion.baselineMonthlyMean.map((val, idx) => {
                const max = Math.max(...activeRegion.baselineMonthlyMean, 1);
                const heightPct = Math.round((val / max) * 100);
                const isPeak = activeRegion.peakSeasonMonths.includes(idx + 1);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        isPeak ? 'bg-orange-500' : 'bg-stone-300 dark:bg-slate-700'
                      } group-hover:bg-blue-600`}
                    />
                    <span className="text-[9px] font-mono text-stone-500">{months[idx][0]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feature 8: Yearly Comparison Rankings */}
          <div
            onMouseEnter={(e) =>
              showPopup(
                e,
                8,
                'Yearly Comparison',
                'Display which years had the highest fire burning activity.',
                'Multi-year ranking identifies historical mega-fire crises and climate anomalies.',
                'Compares compound El Niño years (2024, 2015, 2010) against historical envelopes.'
              )
            }
            onMouseLeave={hidePopup}
            className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-1.5 cursor-help"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
              Top 5 Historical Fire Burning Years:
            </span>
            <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
              {topBurningYears.map((yr, rank) => (
                <div
                  key={yr.year}
                  onClick={() => setSelectedYear(yr.year)}
                  className={`p-1.5 rounded-xl border cursor-pointer transition-all ${
                    selectedYear === yr.year
                      ? 'bg-rose-500/20 border-rose-500 text-rose-600 font-bold shadow-sm'
                      : 'bg-stone-100 dark:bg-slate-800 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="text-[9px] text-stone-400">#{rank + 1}</div>
                  <div className="font-bold">{yr.year}</div>
                  <div className="text-[9px] text-rose-500">{(yr.totalHarmonized / 1000).toFixed(0)}k</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMBINED PAIR 7: CURRENT VS HISTORICAL MEDIAN & ANOMALIES (Features 9 & 10) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  9,
                  'Current vs Historical Median',
                  "Compare the current month's fire activity against the historical median for the selected area.",
                  'Median provides an outlier-robust central tendency metric compared to arithmetic mean.',
                  'Evaluates whether current fire season exceeds the multi-decadal 50th percentile.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Median Departure &amp; Climatological Anomalies</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Feature 9 card */}
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Oct {selectedYear} vs Median
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold font-mono text-stone-900 dark:text-white">
                  {currentMonthRecord ? currentMonthRecord.harmonizedCount.toLocaleString() : '-'}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  / {historicalMonthMedian.toLocaleString()} med
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                {currentMonthRecord && historicalMonthMedian > 0
                  ? `${(currentMonthRecord.harmonizedCount / historicalMonthMedian).toFixed(2)}x historical median`
                  : 'Nominal'}
              </div>
            </div>

            {/* Feature 10 card: Anomalies vs Multi-Year Averages */}
            <div
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  10,
                  'Anomalies vs Multi-Year Averages',
                  'Compute and visualize anomalies in hotspot counts relative to multi-year averages.',
                  'Percentage anomaly and Z-score deviation against 2000-2020 climatological baseline.',
                  'Z-scores > +2.0 indicate statistically significant extreme fire burning episodes.'
                )
              }
              onMouseLeave={hidePopup}
              className="p-3 rounded-xl bg-white/90 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1 cursor-help"
            >
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Multi-Year Anomaly
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-base font-bold font-mono ${
                    anomalyVsAveragePct >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {anomalyVsAveragePct >= 0 ? '+' : ''}
                  {anomalyVsAveragePct.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-stone-500">
                  (Z: {anomalyZScore > 0 ? '+' : ''}
                  {anomalyZScore})
                </span>
              </div>
              <div className="text-[10px] text-stone-500 font-semibold">
                Baseline Mean: {currentMonthRecord ? currentMonthRecord.baselineMean.toLocaleString() : '-'}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE 16: HISTORICAL TREND VISUALIZATION (2000 - 2026) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  16,
                  'Historical Trend Visualization',
                  'Plot a time series chart of fire hotspot activity over the years to reveal trends.',
                  '26-year multi-decadal time series reveals climate-driven upward trends in high-latitude taiga and tropical wetlands.',
                  'Decade indicators highlight 2000s, 2010s, and 2020s megafire shifts.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>26-Year Historical Trend Line</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>

            {/* Decade Selector */}
            <div className="flex gap-1 text-[10px] font-bold">
              {(['2000s', '2010s', '2020s', 'all'] as FireDecade[]).map((dec) => (
                <button
                  key={dec}
                  onClick={() => onChangeFireDecade(dec)}
                  className={`px-2 py-0.5 rounded-lg transition-all ${
                    fireDecade === dec
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 hover:bg-white'
                  }`}
                >
                  {dec === 'all' ? 'All' : dec}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Sparkline of Annual Fire Totals (2000 - 2026) */}
          <div className="p-3 rounded-xl bg-slate-950 text-white border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Annual Fire Hotspots Trend (2000–2026)</span>
              <span className="text-amber-400 font-bold">Regression Slope: +1.4% / yr</span>
            </div>

            <div className="w-full h-20">
              <svg className="w-full h-full" viewBox="0 0 270 70">
                {/* Horizontal Baseline Guideline */}
                <line x1="0" y1="45" x2="270" y2="45" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                {/* Bars & Polyline */}
                {annualSummaries.map((s, idx) => {
                  const max = Math.max(...annualSummaries.map((a) => a.totalHarmonized), 1);
                  const x = idx * 10 + 5;
                  const barH = (s.totalHarmonized / max) * 55;
                  const y = 65 - barH;
                  const isSelected = s.year === selectedYear;

                  return (
                    <g key={s.year} onClick={() => setSelectedYear(s.year)} className="cursor-pointer group">
                      <rect
                        x={x - 3}
                        y={y}
                        width="6"
                        height={barH}
                        rx="1"
                        fill={isSelected ? '#38bdf8' : s.year >= 2020 ? '#f97316' : '#64748b'}
                        className="group-hover:fill-cyan-300 transition-colors"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>2000 (Terra Launch)</span>
              <span>2012 (SNPP VIIRS)</span>
              <span>2026 (Present)</span>
            </div>
          </div>
        </section>

        {/* COMBINED PAIR 9: DOWNLOADABLE CSV EXPORT & ANALYTICS VISUALIZATIONS (Features 14 & 15) */}
        <section className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-[0_8px_24px_rgba(31,38,135,0.08)] space-y-3 transition-all hover:shadow-[0_12px_28px_rgba(31,38,135,0.12)]">
          <div className="flex items-center justify-between">
            <span
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  14,
                  'Downloadable CSV Export',
                  'Add a download button that exports the hotspots detected during a search as a CSV file.',
                  'Includes all standardized columns: raw counts, harmonized counts, FRP, and anomaly percent.',
                  'Designed for emergency incident command systems (ICS), GIS software, and land management modeling.'
                )
              }
              onMouseLeave={hidePopup}
              className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-300 font-display flex items-center gap-1.5 cursor-help"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Data &amp; Analytics Export Center</span>
              <Info className="w-3 h-3 text-stone-400" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Feature 14: CSV Download */}
            <button
              onClick={handleDownloadCSV}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>

            {/* Feature 15: Downloadable Analytics JSON Report */}
            <button
              onClick={handleDownloadAnalyticsJSON}
              onMouseEnter={(e) =>
                showPopup(
                  e,
                  15,
                  'Downloadable Analytics and Visualizations',
                  'Allow users to download analytics and visualizations of fire activity for the selected region and date range.',
                  'Packages complete statistical envelope, sensor transition weights, and regional anomaly metadata.',
                  'Formatted in structured JSON suitable for scientific reproducibility and programmatic ingestion.'
                )
              }
              onMouseLeave={hidePopup}
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Download Analytics</span>
            </button>
          </div>
        </section>
      </div>

      {/* FLOATING GLASS HOVER POP-UP (Appears near cursor on hover) */}
      {hoverPopup && (
        <div
          style={{ top: hoverPopup.y, left: hoverPopup.x }}
          className="fixed z-50 w-80 p-3.5 rounded-2xl bg-slate-900/90 text-white border border-cyan-400/40 shadow-[0_16px_36px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-1 border-b border-slate-700/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-display flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Feature #{hoverPopup.featureNum}: {hoverPopup.title}</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono">
              NASA Spec
            </span>
          </div>

          <div className="text-[11px] text-slate-200 leading-snug italic font-serif">
            "{hoverPopup.nasaRequirement}"
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1 font-mono">
            <div className="text-cyan-400 font-bold">Scientific Insight:</div>
            <div className="text-slate-300">{hoverPopup.scientificInsight}</div>
          </div>

          <div className="text-[10px] text-emerald-400 font-medium">
            Active Audience Interpretation: {hoverPopup.audienceContext}
          </div>
        </div>
      )}

      {/* DATA SCHEMA MODAL (Feature 1) */}
      {isSchemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-2xl w-full p-6 rounded-3xl bg-slate-900/95 border border-slate-700 text-white shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display">
                    Feature #1: Harmonized Fire Hotspot Data Schema
                  </h3>
                  <p className="text-xs text-slate-400">
                    NASA Space Apps Challenge 2026 Unified Schema Specification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                The harmonized data schema provides a standardized structure merging NASA FIRMS MODIS (1km) and VIIRS (375m)
                active fire detections into an uninterrupted time series from 2000 to 2026.
              </p>

              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-950 text-cyan-400 border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Field Name</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Year</td>
                      <td className="p-2">Integer</td>
                      <td className="p-2">Calendar observation year (2000 - 2026)</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Month</td>
                      <td className="p-2">Integer (1-12)</td>
                      <td className="p-2">Monthly aggregation index</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Region_ID</td>
                      <td className="p-2">String</td>
                      <td className="p-2">Spatial biome or custom polygon AOI key</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Active_Sensor_Era</td>
                      <td className="p-2">Enum</td>
                      <td className="p-2">MODIS_ONLY (2000-11), OVERLAP (2012-22), VIIRS_DOMINANT</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Raw_MODIS_1km</td>
                      <td className="p-2">Integer?</td>
                      <td className="p-2">Uncalibrated MODIS 1km hotspot pixels</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Raw_VIIRS_375m</td>
                      <td className="p-2">Integer?</td>
                      <td className="p-2">Uncalibrated VIIRS 375m I-band hotspot pixels</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-emerald-400 font-bold">Harmonized_Hotspots</td>
                      <td className="p-2">Integer</td>
                      <td className="p-2 font-semibold">Standardized hotspot count reconciling sensor bias</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Mean_FRP_MW</td>
                      <td className="p-2">Float</td>
                      <td className="p-2">Mean fire radiative power in Megawatts</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Anomaly_Percent</td>
                      <td className="p-2">Float</td>
                      <td className="p-2">Percentage deviation vs 2000-2020 climatological baseline</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-amber-300 font-bold">Anomaly_ZScore</td>
                      <td className="p-2">Float</td>
                      <td className="p-2">Statistical standard score departure from baseline standard deviation</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsSchemaModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
              >
                Close Schema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
