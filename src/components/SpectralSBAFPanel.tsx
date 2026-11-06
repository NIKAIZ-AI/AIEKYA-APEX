import React, { useState } from 'react';
import {
  MODIS_BANDS,
  VIIRS_BANDS,
  OFFICIAL_HARMONIZATION_COEFFS,
  generateSRFCurve,
  harmonizedReflectance,
  BandPairHarmonization,
} from '../utils/srf';

export const SpectralSBAFPanel: React.FC = () => {
  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [testReflectance, setTestReflectance] = useState(0.25);
  const [targetSurface, setTargetSurface] = useState<'forest' | 'cropland' | 'water' | 'desert' | 'snow'>('forest');

  const currentPair: BandPairHarmonization = OFFICIAL_HARMONIZATION_COEFFS[selectedPairIndex];
  const modisBand = MODIS_BANDS.find(b => b.id === currentPair.modisBand)!;
  const viirsBand = VIIRS_BANDS.find(b => b.id === currentPair.viirsBand)!;

  // Wavelength window for visualization
  const minWl = Math.min(modisBand.wavelengthMin, viirsBand.wavelengthMin) - 40;
  const maxWl = Math.max(modisBand.wavelengthMax, viirsBand.wavelengthMax) + 40;

  const modisSRF = generateSRFCurve(modisBand, [minWl, maxWl], 80);
  const viirsSRF = generateSRFCurve(viirsBand, [minWl, maxWl], 80);

  // Target surface spectral profiles for context
  const surfaceReflectanceFactors: Record<string, { red: number; nir: number; blue: number; green: number; swir: number }> = {
    forest: { red: 0.04, nir: 0.48, blue: 0.02, green: 0.08, swir: 0.18 },
    cropland: { red: 0.09, nir: 0.42, blue: 0.04, green: 0.12, swir: 0.22 },
    water: { red: 0.02, nir: 0.01, blue: 0.06, green: 0.04, swir: 0.005 },
    desert: { red: 0.38, nir: 0.44, blue: 0.22, green: 0.30, swir: 0.52 },
    snow: { red: 0.88, nir: 0.74, blue: 0.94, green: 0.92, swir: 0.12 },
  };

  const currentHarmonized = harmonizedReflectance(testReflectance, currentPair);
  const delta = currentHarmonized - testReflectance;
  const deltaPct = ((delta / Math.max(0.001, testReflectance)) * 100).toFixed(2);

  // SVG dimensions for SRF plot
  const svgWidth = 560;
  const svgHeight = 170;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;

  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const toSvgX = (wl: number) => padLeft + ((wl - minWl) / (maxWl - minWl)) * plotW;
  const toSvgY = (resp: number) => padTop + (1.0 - resp) * plotH;

  const modisPath = modisSRF.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${toSvgX(pt.wavelength)},${toSvgY(pt.response)}`,
    ''
  );
  const viirsPath = viirsSRF.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${toSvgX(pt.wavelength)},${toSvgY(pt.response)}`,
    ''
  );

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Pillar 1: Spectral Response Function (SRF) & SBAF Matching
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-sensor calibration using Spectral Band Adjustment Factors (Vermote et al., 2016)
          </p>
        </div>

        {/* Pair selector tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          {OFFICIAL_HARMONIZATION_COEFFS.map((pair, idx) => (
            <button
              key={pair.modisBand + pair.viirsBand}
              onClick={() => setSelectedPairIndex(idx)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedPairIndex === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {pair.spectralDomain} ({pair.modisBand.split('_')[1]} ↔ {pair.viirsBand.split('_')[1]})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive SRF Curve Visualizer */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Normalized Spectral Passband Comparison
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                MODIS {modisBand.id.split('_')[1]} ({modisBand.wavelengthCenter} nm)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block stroke-dasharray" />
                VIIRS {viirsBand.id.split('_')[1]} ({viirsBand.wavelengthCenter} nm)
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-slate-950/70 border border-slate-800/80 rounded-lg p-1">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((level) => (
                <g key={level}>
                  <line
                    x1={padLeft}
                    y1={toSvgY(level)}
                    x2={svgWidth - padRight}
                    y2={toSvgY(level)}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x={padLeft - 6}
                    y={toSvgY(level) + 3}
                    textAnchor="end"
                    className="text-[9px] fill-slate-500 font-mono"
                  >
                    {level.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Wavelength vertical ticks */}
              {[minWl, Math.round((minWl + maxWl) / 2), maxWl].map((wl) => (
                <text
                  key={wl}
                  x={toSvgX(wl)}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {wl} nm
                </text>
              ))}

              {/* MODIS Area & Curve */}
              <path
                d={`${modisPath} L ${toSvgX(maxWl)},${toSvgY(0)} L ${toSvgX(minWl)},${toSvgY(0)} Z`}
                fill="rgba(6, 182, 212, 0.12)"
              />
              <path d={modisPath} fill="none" stroke="#06b6d4" strokeWidth="2.2" />

              {/* VIIRS Area & Curve */}
              <path
                d={`${viirsPath} L ${toSvgX(maxWl)},${toSvgY(0)} L ${toSvgX(minWl)},${toSvgY(0)} Z`}
                fill="rgba(245, 158, 11, 0.12)"
              />
              <path
                d={viirsPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.2"
                strokeDasharray="4,3"
              />
            </svg>
          </div>

          <div className="mt-3 flex items-start gap-2 p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs text-slate-300">
            <span className="font-semibold text-cyan-400 shrink-0">Analysis:</span>
            <span>{currentPair.notes}</span>
          </div>
        </div>

        {/* Right: SBAF Calibration & Live Calculator */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                SBAF Empirical Calibration
              </span>
              <span className="text-xs font-mono text-emerald-400">
                R² = {currentPair.rSquared} · RMSE = {currentPair.rmse}
              </span>
            </div>

            {/* Regression Equation Formula Display */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg font-mono text-xs space-y-1 mb-4">
              <div className="text-slate-400 text-[11px]">Harmonization Transformation:</div>
              <div className="text-white font-semibold text-sm">
                R<sub>MODIS, equiv</sub> = {currentPair.slope} · R<sub>VIIRS</sub> {currentPair.offset >= 0 ? `+ ${currentPair.offset}` : `- ${Math.abs(currentPair.offset)}`}
              </div>
            </div>

            {/* Surface Type Presets */}
            <div className="space-y-1.5 mb-4">
              <label className="text-xs text-slate-400">Target Surface Preset:</label>
              <div className="grid grid-cols-5 gap-1 text-[11px]">
                {(['forest', 'cropland', 'water', 'desert', 'snow'] as const).map((surf) => (
                  <button
                    key={surf}
                    onClick={() => {
                      setTargetSurface(surf);
                      const key = currentPair.spectralDomain.toLowerCase().includes('red')
                        ? 'red'
                        : currentPair.spectralDomain.toLowerCase().includes('nir')
                        ? 'nir'
                        : currentPair.spectralDomain.toLowerCase().includes('blue')
                        ? 'blue'
                        : 'green';
                      setTestReflectance(surfaceReflectanceFactors[surf][key] || 0.25);
                    }}
                    className={`py-1 capitalize rounded border ${
                      targetSurface === surf
                        ? 'bg-slate-800 text-white border-cyan-500/50 font-medium'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {surf}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Reflectance Scrubber */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Input VIIRS Reflectance:</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {(testReflectance * 100).toFixed(1)}% (ρ = {testReflectance.toFixed(3)})
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.95"
                step="0.005"
                value={testReflectance}
                onChange={(e) => setTestReflectance(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Harmonized Output Telemetry */}
          <div className="p-3 bg-gradient-to-r from-slate-950 to-slate-900 border border-cyan-900/40 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Harmonized MODIS-Equivalent:</span>
              <span className="text-emerald-400 font-mono">
                {Number(deltaPct) >= 0 ? `+${deltaPct}%` : `${deltaPct}%`} adjustment
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-cyan-400">
              ρ = {currentHarmonized.toFixed(4)}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({(currentHarmonized * 100).toFixed(2)}% reflectance)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
