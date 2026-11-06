/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  ShieldAlert,
  Calendar,
  Download,
  FileSpreadsheet,
  FileJson,
  BarChart3,
  PieChart,
  Filter,
  Layers,
  ArrowRight,
  Info,
  CheckCircle,
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

interface KeyIndicesPageProps {
  region: FireRegion;
  startDateYM: string;
  endDateYM: string;
  focusYear: number;
  regimeFilter: 'all' | 'wildfire' | 'anthropogenic';
  onNavigateToCalendar: () => void;
  onNavigateToMap: () => void;
}

export const KeyIndicesPage: React.FC<KeyIndicesPageProps> = ({
  region,
  startDateYM,
  endDateYM,
  focusYear,
  regimeFilter,
  onNavigateToCalendar,
  onNavigateToMap,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'seasonTrend' | 'anomalyBar' | 'regimeDonut'>('seasonTrend');
  const [selectedFocusYear, setSelectedFocusYear] = useState<number>(focusYear);
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: number; baseline: number } | null>(null);

  // Generate dataset
  const allRecords = useMemo(() => generateFireCalendarData(region), [region]);
  const filteredRecords = useMemo(
    () => filterRecordsByDateRange(allRecords, startDateYM, endDateYM),
    [allRecords, startDateYM, endDateYM]
  );
  const annualSummaries = useMemo(() => calculateAnnualSummaries(allRecords), [allRecords]);

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

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const focusYearRecords = useMemo(
    () => allRecords.filter((r) => r.year === selectedFocusYear),
    [allRecords, selectedFocusYear]
  );

  const currentMonthRecord = focusYearRecords[focusYearRecords.length - 1] || allRecords[allRecords.length - 1];
  const historicalMedian = useMemo(
    () => calculateHistoricalMedian(allRecords, currentMonthRecord.month),
    [allRecords, currentMonthRecord]
  );

  const anomalyPct = currentMonthRecord.anomalyPercent;

  // Early Warning Status
  const earlyWarning = useMemo(() => {
    if (anomalyPct > 50 || currentMonthRecord.anomalyZScore > 2.0) {
      return {
        level: 'CRITICAL RED FLAG',
        badge: 'Extreme Burning Hazard',
        color: 'text-rose-400 bg-rose-500/20 border-rose-500/50 shadow-rose-500/20',
        note: 'Drought and extreme fuel aridity exceeding 95th climatological percentile. Immediate fireline resource allocation advised.',
      };
    }
    if (anomalyPct > 20 || currentMonthRecord.anomalyZScore > 1.0) {
      return {
        level: 'ELEVATED WARNING',
        badge: 'Above Normal Risk',
        color: 'text-amber-400 bg-amber-500/20 border-amber-500/50 shadow-amber-500/20',
        note: 'Hotspots exceed climatological median by +20%; routine aerial surveillance and fuel monitoring active.',
      };
    }
    return {
      level: 'NOMINAL / SEASONAL',
      badge: 'Within Baseline Range',
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/50 shadow-emerald-500/20',
      note: 'Active fire detections fall within standard multi-decadal historical envelope.',
    };
  }, [anomalyPct, currentMonthRecord]);

  // CSV Export Download
  const handleDownloadCSV = () => {
    const csv = generateHotspotsCSV(region, filteredRecords);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `AikyaApex_${region.id}_Hotspots_${startDateYM}_to_${endDateYM}.csv`);
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

  // Chart 1: Historical Median vs Current Trend
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

  const maxChartVal = Math.max(...trendData.map((d) => Math.max(d.count ?? 0, d.baseline)), 100);

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 text-slate-100 scrollbar-thin select-none bg-gradient-to-br from-[#100d1e] via-[#17132c] to-[#211a3d]">
      {/* 1. PAGE HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Historical Anomaly &amp; Key Indices Dashboard
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                26-Year Time Series
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Comprehensive statistical metrics, early warning indicators, and fire regime breakdown for {region.name}.
            </p>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md border border-emerald-400/40 active:scale-95 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download CSV Data</span>
          </button>
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Download Analytics JSON</span>
          </button>
        </div>
      </div>

      {/* 2. 4 TOP-LEVEL KPI STAT TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Total Fires */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Total Harmonized Fires</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-orange-400 leading-none">
            {totalHarmonized.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            Filtered ({startDateYM} to {endDateYM})
          </div>
        </div>

        {/* Tile 2: Anomaly % vs Median */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Current Month Anomaly</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div
            className={`text-3xl font-bold font-mono leading-none ${
              anomalyPct > 0 ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {anomalyPct > 0 ? '+' : ''}
            {anomalyPct.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">vs 2000–2020 Multi-Year Median</div>
        </div>

        {/* Tile 3: Peak Burning Month */}
        <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Peak Burning Month</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400 leading-none">
            {months[region.peakSeasonMonths[0] - 1]}
          </div>
          <div className="text-xs text-slate-400">
            Historic Record: <span className="text-white font-bold">{region.historicRecordYear}</span>
          </div>
        </div>

        {/* Tile 4: Early Warning Risk Alert */}
        <div className={`p-5 rounded-2xl border shadow-xl space-y-2 ${earlyWarning.color}`}>
          <div className="flex items-center justify-between text-xs font-bold uppercase">
            <span>Early Warning Risk</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold font-mono leading-none">
            {earlyWarning.level}
          </div>
          <div className="text-xs font-medium truncate">{earlyWarning.badge}</div>
        </div>
      </div>

      {/* 3. INTERACTIVE SCIENTIFIC CHARTS CONTAINER */}
      <div className="p-6 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-5">
        {/* Navigation Tabs for Charts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveChartTab('seasonTrend')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'seasonTrend'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Baseline Climatology vs {selectedFocusYear} Trend
            </button>
            <button
              onClick={() => setActiveChartTab('anomalyBar')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'anomalyBar'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Anomaly Distribution
            </button>
            <button
              onClick={() => setActiveChartTab('regimeDonut')}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeChartTab === 'regimeDonut'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Fire Regime Classification
            </button>
          </div>

          {/* Focus Year Dropdown Selector */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Focus Season Year:</span>
            <select
              value={selectedFocusYear}
              onChange={(e) => setSelectedFocusYear(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 font-bold text-white outline-none cursor-pointer"
            >
              {annualSummaries.map((s) => (
                <option key={s.year} value={s.year}>
                  {s.year} {s.year === region.historicRecordYear ? '🔥 (Record Year)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Viewport for Active Chart */}
        <div className="min-h-[300px]">
          {activeChartTab === 'seasonTrend' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  {selectedFocusYear} monthly fire season progression compared against 2000–2020 climatological median
                </span>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 inline-block border-t border-dashed" />
                    <span className="text-slate-400">Multi-Year Median Baseline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                    <span className="text-orange-400 font-bold">{selectedFocusYear} Observed</span>
                  </div>
                </div>
              </div>

              {/* Large Responsive SVG Chart */}
              <div className="relative w-full h-64 bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200">
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2="580" y2="30" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="80" x2="580" y2="80" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="130" x2="580" y2="130" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="180" x2="580" y2="180" stroke="#475569" strokeWidth="1.5" />

                  {/* Baseline curve */}
                  {(() => {
                    const points = trendData.map((d, i) => {
                      const x = 55 + i * 46;
                      const y = 180 - (d.baseline / maxChartVal) * 150;
                      return `${x},${y}`;
                    });
                    return (
                      <polyline
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeDasharray="6 4"
                        points={points.join(' ')}
                      />
                    );
                  })()}

                  {/* Observed Season curve */}
                  {(() => {
                    const actualPoints = trendData
                      .filter((d) => d.count !== null)
                      .map((d, i) => {
                        const x = 55 + i * 46;
                        const y = 180 - ((d.count ?? 0) / maxChartVal) * 150;
                        return { x, y, count: d.count!, month: d.month, baseline: d.baseline };
                      });

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="3.5"
                          points={actualPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                        />
                        {actualPoints.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill="#f97316"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="hover:r-8 cursor-pointer transition-all"
                            onMouseEnter={() =>
                              setHoveredPoint({
                                label: `${p.month} ${selectedFocusYear}`,
                                value: p.count,
                                baseline: p.baseline,
                              })
                            }
                            onMouseLeave={() => setHoveredPoint(null)}
                          />
                        ))}
                      </>
                    );
                  })()}

                  {/* Month X-axis labels */}
                  {months.map((m, i) => (
                    <text
                      key={m}
                      x={55 + i * 46}
                      y="196"
                      fontSize="10"
                      fill="#94a3b8"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {m}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Hover Tooltip output */}
              <div className="h-8 flex items-center justify-between text-xs font-mono px-3 bg-slate-950/80 rounded-xl border border-slate-800">
                {hoveredPoint ? (
                  <>
                    <span className="text-slate-300 font-bold">{hoveredPoint.label}:</span>
                    <span className="font-bold text-orange-400">
                      {hoveredPoint.value.toLocaleString()} hotspots
                    </span>
                    <span className="text-slate-400">
                      Historical Median: {hoveredPoint.baseline.toLocaleString()}
                    </span>
                    <span
                      className={`font-bold ${
                        hoveredPoint.value >= hoveredPoint.baseline ? 'text-rose-400' : 'text-cyan-400'
                      }`}
                    >
                      {hoveredPoint.value >= hoveredPoint.baseline ? '+' : ''}
                      {(
                        ((hoveredPoint.value - hoveredPoint.baseline) / Math.max(1, hoveredPoint.baseline)) *
                        100
                      ).toFixed(1)}
                      % Anomaly
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">
                    Hover over any circular marker on the curve to inspect monthly deviations from the 26-year median.
                  </span>
                )}
              </div>
            </div>
          )}

          {activeChartTab === 'anomalyBar' && (
            <div className="space-y-4">
              <span className="text-xs text-slate-300 font-medium">
                Percentage departure of monthly active fire hotspot count relative to the multi-year baseline
              </span>
              <div className="w-full h-64 bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex items-center justify-between gap-3">
                {focusYearRecords.map((r) => {
                  const isPositive = r.anomalyPercent >= 0;
                  const barHeight = Math.min(100, Math.abs(r.anomalyPercent) * 0.85);
                  return (
                    <div key={r.month} className="flex-1 flex flex-col items-center justify-center h-full">
                      {/* Positive Bar */}
                      <div className="h-24 flex items-end justify-center w-full">
                        {isPositive && (
                          <div
                            style={{ height: `${barHeight}px` }}
                            className="w-full max-w-[24px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md shadow-md hover:brightness-125 transition-all"
                            title={`${months[r.month - 1]}: +${r.anomalyPercent}%`}
                          />
                        )}
                      </div>
                      {/* Center Axis */}
                      <div className="w-full h-0.5 bg-slate-700" />
                      {/* Negative Bar */}
                      <div className="h-24 flex items-start justify-center w-full">
                        {!isPositive && (
                          <div
                            style={{ height: `${barHeight}px` }}
                            className="w-full max-w-[24px] bg-gradient-to-b from-cyan-600 to-cyan-400 rounded-b-md shadow-md hover:brightness-125 transition-all"
                            title={`${months[r.month - 1]}: ${r.anomalyPercent}%`}
                          />
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 mt-2">
                        {months[r.month - 1]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeChartTab === 'regimeDonut' && (
            <div className="space-y-4">
              <span className="text-xs text-slate-300 font-medium">
                Proportion of natural wildfires vs anthropogenic agricultural / deforestation burning
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-6 rounded-xl border border-slate-800 items-center">
                {/* Donut representation */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-800"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-rose-500"
                        strokeDasharray={`${wildfirePercent}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono text-white">{wildfirePercent}%</span>
                      <span className="text-xs text-slate-400 uppercase tracking-wider">Wildfires</span>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-rose-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-500" />
                        Wildfire Regimes
                      </span>
                      <span className="font-mono font-bold text-white">{wildfirePercent}%</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      High-intensity crown and understory forest fires detected in contiguous wilderness zones.
                    </p>
                    <div className="font-mono text-xs text-rose-300 font-bold pt-1">
                      {totalWildfire.toLocaleString()} total detections
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500" />
                        Anthropogenic Regimes
                      </span>
                      <span className="font-mono font-bold text-white">{anthropogenicPercent}%</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Agricultural burning, pasture maintenance, and land clearing along human corridors.
                    </p>
                    <div className="font-mono text-xs text-amber-300 font-bold pt-1">
                      {totalAnthropogenic.toLocaleString()} total detections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
