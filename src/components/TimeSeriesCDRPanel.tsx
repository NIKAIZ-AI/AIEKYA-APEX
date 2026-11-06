import React, { useState } from 'react';
import {
  VALIDATION_SITES,
  generateTimeSeries,
  calculateHarmonizationMetrics,
  ValidationSite,
} from '../utils/timeSeries';

export const TimeSeriesCDRPanel: React.FC = () => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('amazon');
  const [product, setProduct] = useState<'NDVI' | 'EVI' | 'ReflectanceRed' | 'ReflectanceNIR'>('NDVI');
  const [mode, setMode] = useState<'harmonized' | 'raw' | 'both'>('harmonized');

  const site: ValidationSite = VALIDATION_SITES.find((s) => s.id === selectedSiteId) || VALIDATION_SITES[0];
  const records = generateTimeSeries(site, product);
  const metrics = calculateHarmonizationMetrics(records);

  // SVG Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 25;
  const padTop = 20;
  const padBottom = 30;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const minYear = 2000;
  const maxYear = 2026.8;

  // Determine min & max Y
  const allValues = records.flatMap((r) => [
    r.groundTruthBaseline,
    r.harmonizedValue,
    r.unharmonizedDiscontinuity,
    r.terraModis ?? 0,
    r.snppViirs ?? 0,
  ]).filter((v) => v > 0);

  const minY = Math.max(0, Math.min(...allValues) * 0.85);
  const maxY = Math.min(1.0, Math.max(...allValues) * 1.15);

  const toX = (decYear: number) => padLeft + ((decYear - minYear) / (maxYear - minYear)) * plotW;
  const toY = (val: number) => padTop + (1.0 - (val - minY) / (maxY - minY)) * plotH;

  // Build SVG Paths
  const harmonizedPath = records.reduce(
    (acc, r, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${toX(r.decimalYear)},${toY(r.harmonizedValue)}`,
    ''
  );

  const rawDiscontinuityPath = records.reduce(
    (acc, r, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${toX(r.decimalYear)},${toY(r.unharmonizedDiscontinuity)}`,
    ''
  );

  // Sensor transition zones
  const snppLaunchX = toX(2011.8);
  const terraDriftX = toX(2020.2);

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Pillar 4: 26-Year Multi-Decadal Climate Data Record Continuity (2000 – 2026)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-sensor continuity bridging Terra/Aqua MODIS to Suomi-NPP &amp; NOAA-20/21 VIIRS
          </p>
        </div>

        {/* Product selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {(['NDVI', 'EVI', 'ReflectanceRed', 'ReflectanceNIR'] as const).map((prod) => (
            <button
              key={prod}
              onClick={() => setProduct(prod)}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                product === prod
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {prod === 'ReflectanceRed' ? 'Red ρ' : prod === 'ReflectanceNIR' ? 'NIR ρ' : prod}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Site Selector Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Global Benchmark Site:</span>
        <div className="flex flex-wrap gap-1.5">
          {VALIDATION_SITES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSiteId(s.id)}
              className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                selectedSiteId === s.id
                  ? 'bg-slate-800 text-cyan-400 border-cyan-500/50 font-semibold shadow-sm'
                  : 'bg-slate-950/70 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {s.name.split(' (')[0]}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="ml-auto flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          <button
            onClick={() => setMode('harmonized')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mode === 'harmonized' ? 'bg-emerald-500/20 text-emerald-300 font-medium' : 'text-slate-400'
            }`}
          >
            Harmonized CDR
          </button>
          <button
            onClick={() => setMode('raw')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mode === 'raw' ? 'bg-rose-500/20 text-rose-300 font-medium' : 'text-slate-400'
            }`}
          >
            Raw Unharmonized
          </button>
          <button
            onClick={() => setMode('both')}
            className={`px-2.5 py-1 rounded transition-colors ${
              mode === 'both' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'
            }`}
          >
            Overlay Comparison
          </button>
        </div>
      </div>

      {/* Interactive 26-Year Time Series Chart */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-mono text-slate-400">
            Site: <span className="text-white font-medium">{site.name}</span> · Biome: <span className="text-cyan-400">{site.biome}</span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {(mode === 'harmonized' || mode === 'both') && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-3.5 h-0.5 bg-emerald-400 inline-block" />
                Harmonized Continuity
              </span>
            )}
            {(mode === 'raw' || mode === 'both') && (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-3.5 h-0.5 bg-rose-400 inline-block stroke-dasharray" />
                Raw Discontinuity
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 bg-cyan-500/20 border border-cyan-500/50 inline-block" />
              Sensor Transition
            </span>
          </div>
        </div>

        <div className="relative w-full overflow-hidden bg-slate-950/70 border border-slate-800/80 rounded-lg p-1">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1.0].map((fraction) => {
              const val = minY + fraction * (maxY - minY);
              const y = toY(val);
              return (
                <g key={fraction}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {val.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Event Markers / Vertical Boundaries */}
            {/* 2011: VIIRS Launch */}
            <line
              x1={snppLaunchX}
              y1={padTop}
              x2={snppLaunchX}
              y2={svgHeight - padBottom}
              stroke="rgba(245, 158, 11, 0.35)"
              strokeDasharray="3,3"
            />
            <text
              x={snppLaunchX + 4}
              y={padTop + 12}
              className="text-[8.5px] fill-amber-400 font-mono"
            >
              2012: VIIRS Era Begins
            </text>

            {/* 2020: Terra Orbit Drift */}
            <line
              x1={terraDriftX}
              y1={padTop}
              x2={terraDriftX}
              y2={svgHeight - padBottom}
              stroke="rgba(244, 63, 94, 0.35)"
              strokeDasharray="3,3"
            />
            <text
              x={terraDriftX + 4}
              y={padTop + 12}
              className="text-[8.5px] fill-rose-400 font-mono"
            >
              2020: MODIS Drift
            </text>

            {/* Year X-axis ticks */}
            {[2000, 2004, 2008, 2012, 2016, 2020, 2024, 2026].map((yr) => (
              <text
                key={yr}
                x={toX(yr)}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 font-mono"
              >
                {yr}
              </text>
            ))}

            {/* Raw Unharmonized Path */}
            {(mode === 'raw' || mode === 'both') && (
              <path
                d={rawDiscontinuityPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.8"
                strokeDasharray="4,2"
                opacity={0.85}
              />
            )}

            {/* Harmonized Unified Path */}
            {(mode === 'harmonized' || mode === 'both') && (
              <path
                d={harmonizedPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.2"
              />
            )}
          </svg>
        </div>

        {/* Statistical Cross-Calibration Verification Metrics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Raw Discontinuity RMSE
            </span>
            <div className="text-lg font-mono font-bold text-rose-400 mt-0.5">
              ±{metrics.unharmonizedRmse}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Bias: +{metrics.unharmonizedBias}</span>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Harmonized Residual RMSE
            </span>
            <div className="text-lg font-mono font-bold text-emerald-400 mt-0.5">
              ±{metrics.harmonizedRmse}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Bias: {metrics.harmonizedBias}</span>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Residual Error Reduction
            </span>
            <div className="text-lg font-mono font-bold text-cyan-400 mt-0.5">
              {metrics.residualImprovementPct}%
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Continuity verified</span>
          </div>

          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg">
            <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider block">
              Multi-Decadal R² Fit
            </span>
            <div className="text-lg font-mono font-bold text-white mt-0.5">
              {metrics.rSquaredHarmonized}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">2000–2026 Seamless</span>
          </div>
        </div>
      </div>
    </div>
  );
};
