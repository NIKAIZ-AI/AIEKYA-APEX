import React, { useState } from 'react';
import {
  BIOME_BRDF_PARAMS,
  normalizeToNBAR,
  calculateRossThick,
  calculateLiSparseR,
} from '../utils/brdf';

export const BRDFPanel: React.FC = () => {
  const [selectedBiomeKey, setSelectedBiomeKey] = useState<string>('forest');
  const [vza, setVza] = useState<number>(35); // degrees
  const [sza, setSza] = useState<number>(45); // degrees
  const [raa, setRaa] = useState<number>(40); // degrees
  const [observedReflectance, setObservedReflectance] = useState<number>(0.05);

  const biome = BIOME_BRDF_PARAMS[selectedBiomeKey] || BIOME_BRDF_PARAMS.forest;
  const weights = biome.red;

  const nbarResult = normalizeToNBAR(
    observedReflectance,
    { vza, sza, raa },
    weights,
    45 // Standard 45° SZA
  );

  // Generate directional scattering profile across VZA range (-70° to +70°)
  const curvePoints: Array<{ vzaDeg: number; reflectance: number; isHotspot: boolean }> = [];
  for (let angle = -70; angle <= 70; angle += 2) {
    const kVol = calculateRossThick(Math.abs(angle), sza, angle < 0 ? 180 : 0);
    const kGeo = calculateLiSparseR(Math.abs(angle), sza, angle < 0 ? 180 : 0);
    const modeled = weights.f_iso + weights.f_vol * kVol + weights.f_geo * kGeo;
    const isHotspot = Math.abs(angle - sza) < 2;
    curvePoints.push({
      vzaDeg: angle,
      reflectance: Math.max(0.005, modeled),
      isHotspot,
    });
  }

  // SVG parameters
  const svgWidth = 520;
  const svgHeight = 160;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 25;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const maxRef = Math.max(...curvePoints.map((p) => p.reflectance)) * 1.25;
  const toX = (angle: number) => padLeft + ((angle + 70) / 140) * plotW;
  const toY = (refVal: number) => padTop + (1.0 - refVal / maxRef) * plotH;

  const curvePath = curvePoints.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${toX(pt.vzaDeg)},${toY(pt.reflectance)}`,
    ''
  );

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Pillar 3: BRDF Normalization (NBAR - Nadir BRDF-Adjusted Reflectance)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            RossThick-LiSparse-R (RTLSR) kernel-driven model for angular anisotropy and solar geometry standardization
          </p>
        </div>

        {/* Biome selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {Object.entries(BIOME_BRDF_PARAMS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedBiomeKey(key);
                setObservedReflectance(val.red.f_iso);
              }}
              className={`px-2.5 py-1 font-medium rounded transition-colors ${
                selectedBiomeKey === key
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Directional Reflectance Curve Plot */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Principal Plane Directional Scattering Profile
            </span>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cyan-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Current VZA: {vza}°
              </span>
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                Hotspot: θ = {sza}°
              </span>
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-slate-950/70 border border-slate-800/80 rounded-lg p-1">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
              {/* Nadir Center line */}
              <line
                x1={toX(0)}
                y1={padTop}
                x2={toX(0)}
                y2={svgHeight - padBottom}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="3,3"
              />
              <text x={toX(0)} y={padTop + 10} textAnchor="middle" className="text-[9px] fill-slate-400 font-mono">
                Nadir (0°)
              </text>

              {/* Curve area */}
              <path
                d={`${curvePath} L ${toX(70)},${toY(0)} L ${toX(-70)},${toY(0)} Z`}
                fill="rgba(6, 182, 212, 0.1)"
              />
              <path d={curvePath} fill="none" stroke="#06b6d4" strokeWidth="2.2" />

              {/* Observed position marker */}
              <circle
                cx={toX(vza)}
                cy={toY(observedReflectance)}
                r="5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* Standard NBAR target marker (Nadir, SZA=45) */}
              <circle
                cx={toX(0)}
                cy={toY(nbarResult.nbar)}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />

              {/* X Axis Ticks */}
              {[-60, -30, 0, 30, 60].map((deg) => (
                <text
                  key={deg}
                  x={toX(deg)}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500 font-mono"
                >
                  {deg > 0 ? `+${deg}°` : `${deg}°`}
                </text>
              ))}
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs p-2 bg-slate-950/40 rounded-lg border border-slate-800/60">
            <div>
              <span className="text-slate-400 text-[10px]">f_iso (Isotropic)</span>
              <div className="font-mono text-white font-semibold">{weights.f_iso}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">f_vol (RossThick)</span>
              <div className="font-mono text-white font-semibold">{weights.f_vol}</div>
            </div>
            <div>
              <span className="text-slate-400 text-[10px]">f_geo (LiSparse)</span>
              <div className="font-mono text-white font-semibold">{weights.f_geo}</div>
            </div>
          </div>
        </div>

        {/* Right: Angular Controls & NBAR Telemetry */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Viewing & Illumination Geometry
            </span>

            {/* VZA Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">View Zenith Angle (VZA):</span>
                <span className="font-mono text-cyan-400 font-semibold">{vza}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="65"
                value={vza}
                onChange={(e) => setVza(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SZA Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Solar Zenith Angle (SZA):</span>
                <span className="font-mono text-amber-400 font-semibold">{sza}°</span>
              </div>
              <input
                type="range"
                min="10"
                max="75"
                value={sza}
                onChange={(e) => setSza(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* RAA Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Relative Azimuth Angle (RAA):</span>
                <span className="font-mono text-emerald-400 font-semibold">{raa}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={raa}
                onChange={(e) => setRaa(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Observed Reflectance */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Observed Directional Reflectance:</span>
                <span className="font-mono text-white font-semibold">{(observedReflectance * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.80"
                step="0.005"
                value={observedReflectance}
                onChange={(e) => setObservedReflectance(parseFloat(e.target.value))}
                className="w-full accent-slate-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* NBAR Output */}
          <div className="mt-4 p-3 bg-gradient-to-r from-slate-950 to-slate-900 border border-emerald-900/50 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Standardized NBAR (VZA=0°, SZA=45°):</span>
              <span className="font-mono text-emerald-400">
                c-factor = {nbarResult.correctionFactor.toFixed(3)}
              </span>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400">
              ρ<sub>NBAR</sub> = {nbarResult.nbar.toFixed(4)}{' '}
              <span className="text-xs font-normal text-slate-400">
                ({(nbarResult.nbar * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
