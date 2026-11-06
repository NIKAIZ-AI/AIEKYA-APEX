import React, { useState } from 'react';
import {
  calculateMODISFootprint,
  calculateVIIRSFootprint,
  calculateResamplingOverlap,
} from '../utils/footprint';

export const FootprintBowtiePanel: React.FC = () => {
  const [scanAngle, setScanAngle] = useState(38); // degrees
  const [targetGridM, setTargetGridM] = useState<500 | 1000>(1000);

  const modisFootprint = calculateMODISFootprint(scanAngle, 1000);
  const viirsFootprint = calculateVIIRSFootprint(scanAngle, 750);

  const modisResample = calculateResamplingOverlap(modisFootprint, targetGridM);
  const viirsResample = calculateResamplingOverlap(viirsFootprint, targetGridM);

  // SVG diagram scaling
  const maxDim = 5000; // meters
  const scale = 140 / maxDim;

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Pillar 2: Spatial Resolution, Bowtie Distortion & Aggregation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mitigating the optical scan angle footprint expansion and resampling to a unified Climate Modeling Grid (CMG)
          </p>
        </div>

        {/* Target Grid Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Target Harmonization Grid:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setTargetGridM(500)}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                targetGridM === 500
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              500m Sinusoidal
            </button>
            <button
              onClick={() => setTargetGridM(1000)}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                targetGridM === 1000
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1km Global CMG (0.05°)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Scan Angle Scrubber */}
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">
            Sensor Scan Angle off-Nadir: <span className="font-mono text-cyan-400 font-bold text-sm">θ = {scanAngle}°</span>
          </span>
          <span className="font-mono text-slate-400">
            Ground View Zenith: MODIS {modisFootprint.viewZenithDeg}° · VIIRS {viirsFootprint.viewZenithDeg}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="55"
          step="1"
          value={scanAngle}
          onChange={(e) => setScanAngle(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0° (Nadir)</span>
          <span>15°</span>
          <span>31.7° (VIIRS 3:1 → 2:1 Transition)</span>
          <span>44.8° (VIIRS 2:1 → 1:1 Transition)</span>
          <span>55° (Swath Edge)</span>
        </div>
      </div>

      {/* Comparative Cards: MODIS Bowtie vs VIIRS Aggregation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* MODIS Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                MODIS Pixel Footprint (Unconstrained)
              </span>
              <span className="text-xs font-mono text-rose-400">
                {modisFootprint.growthFactor}x Area Growth
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Standard optical expansion causes severe along-scan stretching and adjacent swath track overlap (the "Bowtie Effect").
            </p>

            {/* Visual Footprint Box */}
            <div className="h-44 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-center p-3 relative overflow-hidden">
              {/* Target Grid reference square */}
              <div
                style={{
                  width: `${targetGridM * scale}px`,
                  height: `${targetGridM * scale}px`,
                }}
                className="absolute border border-dashed border-emerald-500/50 bg-emerald-500/5 rounded-sm flex items-center justify-center"
              >
                <span className="text-[9px] font-mono text-emerald-400">Target {targetGridM}m</span>
              </div>

              {/* MODIS Footprint Rectangle */}
              <div
                style={{
                  width: `${Math.min(260, modisFootprint.alongScanMeters * scale)}px`,
                  height: `${Math.min(140, modisFootprint.alongTrackMeters * scale)}px`,
                }}
                className="border-2 border-cyan-400 bg-cyan-400/20 rounded flex items-center justify-center transition-all duration-150"
              >
                <span className="text-[10px] font-mono text-cyan-200 font-bold px-1 text-center">
                  {modisFootprint.alongScanMeters}m × {modisFootprint.alongTrackMeters}m
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Along-Scan</div>
              <div className="font-mono text-white font-semibold">{modisFootprint.alongScanMeters} m</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Along-Track</div>
              <div className="font-mono text-white font-semibold">{modisFootprint.alongTrackMeters} m</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">PSF Blur Ratio</div>
              <div className="font-mono text-rose-400 font-semibold">{modisResample.pointSpreadFunctionBlur}x</div>
            </div>
          </div>
        </div>

        {/* VIIRS Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                VIIRS Pixel Footprint (Onboard Aggregation)
              </span>
              <span className="text-xs font-mono text-emerald-400">
                Mode: {viirsFootprint.aggregationMode} ({viirsFootprint.growthFactor}x Growth)
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Onboard 3:1 / 2:1 aggregation and pixel deletion bounds pixel growth to ~1.6x, eliminating equatorial coverage gaps.
            </p>

            {/* Visual Footprint Box */}
            <div className="h-44 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-center p-3 relative overflow-hidden">
              {/* Target Grid reference square */}
              <div
                style={{
                  width: `${targetGridM * scale}px`,
                  height: `${targetGridM * scale}px`,
                }}
                className="absolute border border-dashed border-emerald-500/50 bg-emerald-500/5 rounded-sm flex items-center justify-center"
              >
                <span className="text-[9px] font-mono text-emerald-400">Target {targetGridM}m</span>
              </div>

              {/* VIIRS Footprint Rectangle */}
              <div
                style={{
                  width: `${Math.min(260, viirsFootprint.alongScanMeters * scale)}px`,
                  height: `${Math.min(140, viirsFootprint.alongTrackMeters * scale)}px`,
                }}
                className="border-2 border-amber-400 bg-amber-400/20 rounded flex items-center justify-center transition-all duration-150"
              >
                <span className="text-[10px] font-mono text-amber-200 font-bold px-1 text-center">
                  {viirsFootprint.alongScanMeters}m × {viirsFootprint.alongTrackMeters}m
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Along-Scan</div>
              <div className="font-mono text-white font-semibold">{viirsFootprint.alongScanMeters} m</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">Along-Track</div>
              <div className="font-mono text-white font-semibold">{viirsFootprint.alongTrackMeters} m</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">PSF Blur Ratio</div>
              <div className="font-mono text-emerald-400 font-semibold">{viirsResample.pointSpreadFunctionBlur}x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Harmonization Kernel Strategy */}
      <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-slate-300 font-medium">Harmonization Resampling Solution:</span>
          <p className="text-slate-400 text-[11px]">
            Area-weighted PSF integration maps both sensors into equal-area cells, weighting VIIRS sharper edge observations higher than MODIS blurred edge observations.
          </p>
        </div>
        <div className="text-right font-mono text-xs text-cyan-400 shrink-0 ml-4">
          Swath Width: MODIS 2,330 km · VIIRS 3,040 km
        </div>
      </div>
    </div>
  );
};
