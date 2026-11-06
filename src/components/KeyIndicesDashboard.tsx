/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Flame,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  FileJson,
  BarChart3,
  PieChart,
  Calendar,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Pin,
  PinOff,
} from 'lucide-react';
import {
  FireRegion,
  MonthlyFireRecord,
  generateFireCalendarData,
  calculateAnnualSummaries,
  calculateHistoricalMedian,
  filterRecordsByDateRange,
  generateHotspotsCSV,
  generateAnalyticsJSON,
} from '../utils/fireHarmonization';

interface KeyIndicesDashboardProps {
  region: FireRegion;
  startDateYM: string;
  endDateYM: string;
  focusYear: number;
  regimeFilter: 'all' | 'wildfire' | 'anthropogenic';
  isPinned: boolean;
  onTogglePin: () => void;
}

export const KeyIndicesDashboard: React.FC<KeyIndicesDashboardProps> = ({
  region,
  startDateYM,
  endDateYM,
  focusYear,
  regimeFilter,
  isPinned,
  onTogglePin,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'seasonTrend' | 'anomalyBar' | 'regimeDonut'>('seasonTrend');
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{ label: string; value: number; baseline: number } | null>(null);

  // Generate dataset
  const allRecords = useMemo(() => generateFireCalendarData(region), [region]);
  const filteredRecords = useMemo(
    () => filterRecordsByDateRange(allRecords, startDateYM, endDateYM),
    [allRecords, startDateYM, endDateYM]
  );

  // Totals & KPI Calculations
  const totalHarmonized = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + r.harmonizedCount, 0),
    [filteredRecords]
  );

  const totalWildfire = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + r.wildfireCount, 0),
    [filteredRecords]
  );

  const totalAnthropogenic = useMemo(
    () => filteredRecords.reduce((sum, r) => sum + r.anthropogenicCount, 0),
    [filteredRecords]
  );

  const wildfirePercent = Number(((totalWildfire / Math.max(1, totalHarmonized)) * 100).toFixed(1));
  const anthropogenicPercent = Number((100 - wildfirePercent).toFixed(1));

  // Current month / focus year calculation
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const focusYearRecords = useMemo(
    () => allRecords.filter((r) => r.year === focusYear),
    [allRecords, focusYear]
  );

  // Latest available record in focus year
  const currentMonthRecord = focusYearRecords[focusYearRecords.length - 1] || allRecords[allRecords.length - 1];
  const historicalMedian = useMemo(
    () => calculateHistoricalMedian(allRecords, currentMonthRecord.month),
    [allRecords, currentMonthRecord]
  );

  const anomalyPct = currentMonthRecord.anomalyPercent;

  // Early Warning Risk Alert Level
  const earlyWarning = useMemo(() => {
    if (anomalyPct > 50 || currentMonthRecord.anomalyZScore > 2.0) {
      return {
        level: 'CRITICAL',
        badge: 'Red Flag Warning',
        color: 'text-rose-400 bg-rose-500/20 border-rose-500/50 shadow-rose-500/20',
        note: 'Drought and extreme heat driving severe fire weather index.',
      };
    }
    if (anomalyPct > 20 || currentMonthRecord.anomalyZScore > 1.0) {
      return {
        level: 'ELEVATED',
        badge: 'Above Normal Risk',
        color: 'text-amber-400 bg-amber-500/20 border-amber-500/50 shadow-amber-500/20',
        note: 'Hotspots exceed climatological median; monitoring recommended.',
      };
    }
    return {
      level: 'NORMAL',
      badge: 'Baseline Seasonal',
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/20',
      note: 'Fire activity within standard historical 2000-2020 distribution envelope.',
    };
  }, [anomalyPct, currentMonthRecord]);

  // CSV Export Download
  const handleDownloadCSV = () => {
    const csv = generateHotspotsCSV(region, filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `AikyaApex_ActiveFires_${region.id}_${startDateYM}_to_${endDateYM}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSON Analytics Download
  const handleDownloadJSON = () => {
    const json = generateAnalyticsJSON(region, filteredRecords, {
      start: startDateYM,
      end: endDateYM,
    });
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `AikyaApex_Analytics_${region.id}.json`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart 1: Historical Median vs Current Fire Season Trend Data
  const trendData = useMemo(() => {
    return months.map((mName, idx) => {
      const mNum = idx + 1;
      const rec = focusYearRecords.find((r) => r.month === mNum);
      const median = calculateHistoricalMedian(allRecords, mNum);
      return {
        month: mName,
        count: rec ? rec.harmonizedCount : null,
        baseline: median,
      };
    });
  }, [focusYearRecords, allRecords, months]);

  const maxChartVal = Math.max(
    ...trendData.map((d) => Math.max(d.count ?? 0, d.baseline)),
    100
  );

  return (
    <div className="w-full h-full flex flex-col font-sans select-none text-slate-100 space-y-4">
      {/* 1. SIDEBAR HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display">
              Multi-Year Key Indices
            </h3>
            <span className="text-[10px] text-slate-400">Anomaly &amp; Early Warning</span>
          </div>
        </div>

        <button
          onClick={onTogglePin}
          className={`p-1.5 rounded-xl border text-xs transition-colors ${
            isPinned
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
          }`}
          title={isPinned ? 'Unpin sidebar (auto-collapse on hover out)' : 'Pin sidebar'}
        >
          {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. KPI STAT TILES */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        {/* Tile 1: Total Fires Detected */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Total Fires</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-xl font-bold font-mono text-orange-400 leading-none">
            {totalHarmonized.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">Harmonized 2000–2026</div>
        </div>

        {/* Tile 2: Current Anomaly % */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Current Anomaly</span>
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div
            className={`text-xl font-bold font-mono leading-none ${
              anomalyPct > 0 ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {anomalyPct > 0 ? '+' : ''}
            {anomalyPct.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400">vs Historical Median</div>
        </div>

        {/* Tile 3: Peak Burning Month */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Peak Month</span>
            <Calendar className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 leading-none">
            {months[region.peakSeasonMonths[0] - 1]}
          </div>
          <div className="text-[10px] text-slate-400">Record: {region.historicRecordYear}</div>
        </div>

        {/* Tile 4: Early Warning Risk Alert Level */}
        <div className={`p-3 rounded-2xl border shadow-lg space-y-1 ${earlyWarning.color}`}>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase">
            <span>Risk Level</span>
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <div className="text-base font-bold font-mono leading-none">
            {earlyWarning.level}
          </div>
          <div className="text-[9px] truncate">{earlyWarning.badge}</div>
        </div>
      </div>

      {/* 3. INTERACTIVE CHARTS TAB NAVIGATION */}
      <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold shrink-0">
        <button
          onClick={() => setActiveChartTab('seasonTrend')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            activeChartTab === 'seasonTrend'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Baseline vs Trend
        </button>
        <button
          onClick={() => setActiveChartTab('anomalyBar')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            activeChartTab === 'anomalyBar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly Anomaly
        </button>
        <button
          onClick={() => setActiveChartTab('regimeDonut')}
          className={`flex-1 py-1 rounded-lg transition-all ${
            activeChartTab === 'regimeDonut'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Fire Regimes
        </button>
      </div>

      {/* 4. CHART VIEWPORT */}
      <div className="flex-1 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg flex flex-col justify-between overflow-hidden">
        {activeChartTab === 'seasonTrend' && (
          <div className="w-full h-full flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">
                {focusYear} Fire Season vs Climatological Median
              </span>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-slate-400 inline-block" />
                  <span>Historical Median</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2 rounded-full bg-orange-500 inline-block" />
                  <span>{focusYear}</span>
                </span>
              </div>
            </div>

            {/* SVG Interactive Trend Chart */}
            <div className="relative w-full h-44 flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 320 140">
                {/* Horizontal grid lines */}
                <line x1="20" y1="20" x2="310" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <line x1="20" y1="70" x2="310" y2="70" stroke="#334155" strokeDasharray="3 3" />
                <line x1="20" y1="120" x2="310" y2="120" stroke="#334155" />

                {/* Historical Median Baseline Area & Curve */}
                {(() => {
                  const points = trendData.map((d, i) => {
                    const x = 30 + i * 23;
                    const y = 120 - (d.baseline / maxChartVal) * 100;
                    return `${x},${y}`;
                  });
                  return (
                    <polyline
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      points={points.join(' ')}
                    />
                  );
                })()}

                {/* Focus Year Actual Curve */}
                {(() => {
                  const actualPoints = trendData
                    .filter((d) => d.count !== null)
                    .map((d, i) => {
                      const x = 30 + i * 23;
                      const y = 120 - ((d.count ?? 0) / maxChartVal) * 100;
                      return { x, y, count: d.count!, month: d.month, baseline: d.baseline };
                    });

                  return (
                    <>
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        points={actualPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                      />
                      {actualPoints.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#f97316"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="hover:r-6 cursor-pointer transition-all"
                          onMouseEnter={() =>
                            setHoveredChartPoint({
                              label: `${p.month} ${focusYear}`,
                              value: p.count,
                              baseline: p.baseline,
                            })
                          }
                          onMouseLeave={() => setHoveredChartPoint(null)}
                        />
                      ))}
                    </>
                  );
                })()}

                {/* Month tick labels */}
                {months.map((m, i) => (
                  <text
                    key={m}
                    x={30 + i * 23}
                    y="136"
                    fontSize="8"
                    fill="#94a3b8"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {m[0]}
                  </text>
                ))}
              </svg>
            </div>

            {/* Hover Tooltip Output */}
            <div className="h-6 flex items-center justify-between text-[11px] font-mono px-1 bg-slate-950/60 rounded-lg">
              {hoveredChartPoint ? (
                <>
                  <span className="text-slate-300">{hoveredChartPoint.label}:</span>
                  <span className="font-bold text-orange-400">
                    {hoveredChartPoint.value.toLocaleString()} fires
                  </span>
                  <span className="text-slate-400">
                    (Median: {hoveredChartPoint.baseline.toLocaleString()})
                  </span>
                </>
              ) : (
                <span className="text-slate-400 text-[10px]">
                  Hover over data points to inspect monthly deviation
                </span>
              )}
            </div>
          </div>
        )}

        {activeChartTab === 'anomalyBar' && (
          <div className="w-full h-full flex flex-col justify-between space-y-2">
            <span className="text-[11px] font-bold text-slate-300">
              Monthly Hotspot Anomaly Distribution ({focusYear})
            </span>
            <div className="w-full h-44 flex items-center justify-between gap-1 px-1">
              {focusYearRecords.map((r) => {
                const isPositive = r.anomalyPercent >= 0;
                const barHeight = Math.min(65, Math.abs(r.anomalyPercent) * 0.5);
                return (
                  <div key={r.month} className="flex-1 flex flex-col items-center justify-center h-full">
                    {/* Upper bar (positive) */}
                    <div className="h-16 flex items-end justify-center w-full">
                      {isPositive && (
                        <div
                          style={{ height: `${barHeight}px` }}
                          className="w-full max-w-[14px] bg-rose-500 rounded-t-sm shadow-sm hover:brightness-125 transition-all"
                          title={`${months[r.month - 1]}: +${r.anomalyPercent}%`}
                        />
                      )}
                    </div>
                    {/* Baseline axis */}
                    <div className="w-full h-px bg-slate-700" />
                    {/* Lower bar (negative) */}
                    <div className="h-16 flex items-start justify-center w-full">
                      {!isPositive && (
                        <div
                          style={{ height: `${barHeight}px` }}
                          className="w-full max-w-[14px] bg-cyan-500 rounded-b-sm shadow-sm hover:brightness-125 transition-all"
                          title={`${months[r.month - 1]}: ${r.anomalyPercent}%`}
                        />
                      )}
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1">
                      {months[r.month - 1][0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeChartTab === 'regimeDonut' && (
          <div className="w-full h-full flex flex-col justify-between space-y-3">
            <span className="text-[11px] font-bold text-slate-300">
              Fire Regime Classification: Wildfire vs Anthropogenic
            </span>

            {/* Visual Donut / Bar representation */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <path
                    className="text-slate-800"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Wildfire stroke */}
                  <path
                    className="text-rose-500"
                    strokeDasharray={`${wildfirePercent}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-sm font-bold font-mono text-white">{wildfirePercent}%</span>
                  <span className="text-[8px] text-slate-400 uppercase">Wildfire</span>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
                  <div>
                    <div className="text-slate-300 font-sans font-bold">Wildfires:</div>
                    <div className="text-rose-400 font-bold">{totalWildfire.toLocaleString()} fires</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <div className="text-slate-300 font-sans font-bold">Anthropogenic:</div>
                    <div className="text-amber-400 font-bold">
                      {totalAnthropogenic.toLocaleString()} fires
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-sans bg-slate-950/60 p-2 rounded-xl">
              Harmonization categorizes fire regimes using land cover buffers, diurnal ignition timing, and
              spatial proximity to agricultural corridors.
            </p>
          </div>
        )}
      </div>

      {/* 5. DATA EXPORT ACTIONS */}
      <div className="space-y-2 pt-1 shrink-0">
        <button
          onClick={handleDownloadCSV}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md border border-emerald-400/40 active:scale-95 transition-all cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Download Data (CSV)</span>
        </button>

        <button
          onClick={handleDownloadJSON}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 active:scale-95 transition-all cursor-pointer"
        >
          <FileJson className="w-4 h-4 text-cyan-400" />
          <span>Download Analytics Report (JSON)</span>
        </button>
      </div>
    </div>
  );
};
