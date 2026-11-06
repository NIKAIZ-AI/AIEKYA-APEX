/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Flame,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Maximize2,
  ChevronRight,
  TrendingUp,
  Download,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import {
  FireRegion,
  MonthlyFireRecord,
  generateFireCalendarData,
  calculateAnnualSummaries,
  calculateHistoricalMedian,
} from '../utils/fireHarmonization';

export type CalendarColorRamp = 'inferno' | 'viridis' | 'ylorrd' | 'diverging';
export type DisplayMetric = 'harmonized' | 'anomaly' | 'fre';

interface BurningCalendarMatrixProps {
  region: FireRegion;
  onSelectYearMonth?: (year: number, month: number) => void;
  onOpenGlobe?: () => void;
}

export const BurningCalendarMatrix: React.FC<BurningCalendarMatrixProps> = ({
  region,
  onSelectYearMonth,
  onOpenGlobe,
}) => {
  const [colorRamp, setColorRamp] = useState<CalendarColorRamp>('inferno');
  const [metric, setMetric] = useState<DisplayMetric>('harmonized');
  const [hoveredCell, setHoveredCell] = useState<{
    record: MonthlyFireRecord;
    x: number;
    y: number;
    historicalMedian: number;
  } | null>(null);

  // Generate 2000-2026 monthly records for active region
  const records = useMemo(() => generateFireCalendarData(region), [region]);
  const annualSummaries = useMemo(() => calculateAnnualSummaries(records), [records]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 27 }, (_, i) => 2026 - i); // 2026 down to 2000

  // Find max values for normalization
  const maxHarmonized = useMemo(() => Math.max(...records.map((r) => r.harmonizedCount), 1), [records]);
  const maxFRE = useMemo(() => Math.max(...records.map((r) => r.totalFRE), 1), [records]);

  // Color calculation function
  const getCellColor = (rec: MonthlyFireRecord) => {
    if (metric === 'anomaly') {
      const a = rec.anomalyPercent;
      if (a < -50) return '#1d4ed8'; // blue below baseline
      if (a < -15) return '#38bdf8';
      if (a < 15) return '#64748b'; // neutral slate
      if (a < 50) return '#f97316'; // orange above baseline
      return '#dc2626'; // extreme red anomaly
    }

    const value = metric === 'fre' ? rec.totalFRE : rec.harmonizedCount;
    const maxValue = metric === 'fre' ? maxFRE : maxHarmonized;
    const t = Math.min(1, Math.max(0, value / maxValue));

    if (colorRamp === 'inferno') {
      if (t < 0.15) return '#1b0c41';
      if (t < 0.35) return '#4f0e66';
      if (t < 0.55) return '#a32b5b';
      if (t < 0.75) return '#f07414';
      if (t < 0.9) return '#f9b623';
      return '#fcffa4';
    } else if (colorRamp === 'viridis') {
      if (t < 0.2) return '#440154';
      if (t < 0.4) return '#3b528b';
      if (t < 0.6) return '#21908d';
      if (t < 0.8) return '#5dc963';
      return '#fde725';
    } else if (colorRamp === 'diverging') {
      if (t < 0.25) return '#1e40af';
      if (t < 0.5) return '#93c5fd';
      if (t < 0.75) return '#fb923c';
      return '#b91c1c';
    } else {
      // YlOrRd
      if (t < 0.2) return '#ffffb2';
      if (t < 0.4) return '#fecc5c';
      if (t < 0.6) return '#fd8d3c';
      if (t < 0.8) return '#f03b20';
      return '#bd0026';
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-orange-900/40 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] flex flex-col bg-gradient-to-br from-[#1a0f0b] via-[#24140e] to-[#301a12] p-5 space-y-4 select-none">
      {/* 1. MATRIX HEADER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-white font-display">
                Multi-Year Burning Activity Calendar Grid
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                2000 - 2026 Time Series
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Harmonized MODIS &amp; VIIRS fire activity for {region.name}
            </p>
          </div>
        </div>

        {/* View & Color Ramp Switchers */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Metric Selector */}
          <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800 font-bold">
            <button
              onClick={() => setMetric('harmonized')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metric === 'harmonized'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hotspot Count
            </button>
            <button
              onClick={() => setMetric('anomaly')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metric === 'anomaly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Anomaly % vs Median
            </button>
            <button
              onClick={() => setMetric('fre')}
              className={`px-3 py-1 rounded-lg transition-all ${
                metric === 'fre'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Radiative Energy (FRE)
            </button>
          </div>

          {/* Color Ramp Selector */}
          <div className="flex p-0.5 rounded-xl bg-slate-900 border border-slate-800 font-bold uppercase text-[10px]">
            {(['inferno', 'viridis', 'ylorrd', 'diverging'] as CalendarColorRamp[]).map((cr) => (
              <button
                key={cr}
                onClick={() => setColorRamp(cr)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  colorRamp === cr
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CALENDAR MATRIX GRID (Months on X, Years on Y) */}
      <div className="flex-1 overflow-auto rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-3 scrollbar-thin">
        <div className="min-w-[780px]">
          {/* Month Header Row (X-Axis) */}
          <div className="grid grid-cols-[65px_repeat(12,1fr)_85px] gap-1.5 pb-2 text-center text-xs font-mono font-bold text-slate-400 border-b border-slate-800">
            <span className="text-left pl-1">Year</span>
            {months.map((m, idx) => {
              const isPeak = region.peakSeasonMonths.includes(idx + 1);
              return (
                <div key={m} className="flex flex-col items-center">
                  <span className={isPeak ? 'text-amber-400 font-bold' : ''}>{m}</span>
                  {isPeak && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />}
                </div>
              );
            })}
            <span>Annual Total</span>
          </div>

          {/* Year Rows (Y-Axis 2026 -> 2000) */}
          <div className="divide-y divide-slate-800/60 pt-1 space-y-1">
            {years.map((year) => {
              const yearRecords = records.filter((r) => r.year === year);
              const summary = annualSummaries.find((s) => s.year === year);
              const isHistoricRecord = year === region.historicRecordYear;

              return (
                <div
                  key={year}
                  className={`grid grid-cols-[65px_repeat(12,1fr)_85px] gap-1.5 items-center py-1 rounded-lg transition-colors ${
                    isHistoricRecord ? 'bg-amber-950/25 border border-amber-600/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Year Label */}
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-left pl-1">
                    <span className={isHistoricRecord ? 'text-amber-400' : 'text-slate-300'}>{year}</span>
                    {isHistoricRecord && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans">
                        Peak
                      </span>
                    )}
                  </div>

                  {/* 12 Month Cells */}
                  {months.map((_, idx) => {
                    const monthNum = idx + 1;
                    const rec = yearRecords.find((r) => r.month === monthNum);

                    if (!rec) {
                      return (
                        <div
                          key={monthNum}
                          className="h-9 rounded-lg bg-slate-900 border border-slate-800/50 flex items-center justify-center text-[10px] text-slate-600 font-mono"
                        >
                          -
                        </div>
                      );
                    }

                    const bg = getCellColor(rec);
                    const historicalMedian = calculateHistoricalMedian(records, monthNum);

                    return (
                      <div
                        key={monthNum}
                        style={{ backgroundColor: bg }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            record: rec,
                            historicalMedian,
                            x: Math.min(window.innerWidth - 320, Math.max(10, rect.left)),
                            y: Math.min(window.innerHeight - 250, rect.bottom + 8),
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => onSelectYearMonth && onSelectYearMonth(rec.year, rec.month)}
                        className="h-9 rounded-lg flex flex-col items-center justify-center p-0.5 text-white shadow-sm transition-all hover:scale-110 hover:z-30 hover:ring-2 hover:ring-white cursor-pointer relative"
                      >
                        <span className="text-[10px] font-mono font-bold drop-shadow leading-none text-white/95">
                          {metric === 'anomaly'
                            ? `${rec.anomalyPercent > 0 ? '+' : ''}${rec.anomalyPercent.toFixed(0)}%`
                            : rec.harmonizedCount > 999
                            ? `${(rec.harmonizedCount / 1000).toFixed(1)}k`
                            : rec.harmonizedCount}
                        </span>
                        {rec.isRecordAnomaly && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse mt-0.5 shadow" />
                        )}
                      </div>
                    );
                  })}

                  {/* Annual Total Column */}
                  <div className="font-mono text-xs font-bold text-center text-slate-300">
                    {summary ? summary.totalHarmonized.toLocaleString() : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE FLOATING HOVER TOOLTIP */}
      {hoveredCell && (
        <div
          style={{ left: `${hoveredCell.x}px`, top: `${hoveredCell.y}px` }}
          className="fixed z-50 w-76 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.8)] text-white text-xs space-y-2.5 pointer-events-none animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <strong className="text-sm font-bold font-display">
                {months[hoveredCell.record.month - 1]} {hoveredCell.record.year}
              </strong>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              {hoveredCell.record.activeSensor}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-xl bg-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Harmonized Hotspots</span>
              <span className="text-sm font-bold text-orange-400">
                {hoveredCell.record.harmonizedCount.toLocaleString()}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-sans">Anomaly vs Median</span>
              <span
                className={`text-sm font-bold ${
                  hoveredCell.record.anomalyPercent > 0 ? 'text-rose-400' : 'text-cyan-400'
                }`}
              >
                {hoveredCell.record.anomalyPercent > 0 ? '+' : ''}
                {hoveredCell.record.anomalyPercent}%
              </span>
            </div>
          </div>

          {/* Sensor Breakdown (MODIS vs VIIRS) */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono space-y-1">
            <div className="text-slate-400 font-bold font-sans uppercase">Sensor Origin Breakdown:</div>
            <div className="flex justify-between">
              <span>MODIS 1km Raw:</span>
              <span className="text-cyan-300 font-bold">
                {hoveredCell.record.rawModisCount ? hoveredCell.record.rawModisCount.toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>VIIRS 375m Raw:</span>
              <span className="text-amber-300 font-bold">
                {hoveredCell.record.rawViirsCount ? hoveredCell.record.rawViirsCount.toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800/60">
              <span>Historical Median:</span>
              <span className="text-slate-300">{hoveredCell.historicalMedian.toLocaleString()} fires</span>
            </div>
          </div>

          {/* Fire Regime Breakdown (Wildfire vs Anthropogenic) */}
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] space-y-1">
            <div className="flex justify-between text-slate-400 font-bold uppercase">
              <span>Wildfire (Natural)</span>
              <span>Anthropogenic (Clearing)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                style={{ width: `${hoveredCell.record.wildfirePercent}%` }}
                className="h-full bg-rose-500"
              />
              <div
                style={{ width: `${hoveredCell.record.anthropogenicPercent}%` }}
                className="h-full bg-amber-500"
              />
            </div>
            <div className="flex justify-between font-mono text-[9px] text-slate-400">
              <span>{hoveredCell.record.wildfirePercent}%</span>
              <span>{hoveredCell.record.anthropogenicPercent}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
