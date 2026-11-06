import React, { useState } from 'react';

interface CaseStudy {
  id: string;
  title: string;
  location: string;
  coordinates: string;
  scienceFocus: string;
  description: string;
  modisStats: { res: string; red: number; nir: number; ndvi: number; lstK?: number };
  viirsStats: { res: string; red: number; nir: number; ndvi: number; lstK?: number };
  harmonizedStats: { res: string; red: number; nir: number; ndvi: number; lstK?: number; confidence: string };
  keyTakeaway: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: 'amazon',
    title: 'Amazon Deforestation & Canopy Drought',
    location: 'Rondônia, Brazil',
    coordinates: '10.82° S, 62.91° W',
    scienceFocus: 'Vegetation Index (NDVI) & Canopy Water Content',
    description:
      'Fishbone deforestation patterns along highway BR-364. Raw MODIS vs VIIRS shows a systematic +0.032 NDVI offset due to VIIRS I1 broader passband, creating artificial greening signals if unharmonized.',
    modisStats: { res: '250m / 1000m', red: 0.042, nir: 0.448, ndvi: 0.828 },
    viirsStats: { res: '375m / 750m', red: 0.051, nir: 0.456, ndvi: 0.798 },
    harmonizedStats: { res: '500m Unified', red: 0.043, nir: 0.450, ndvi: 0.825, confidence: '99.4% (QA: Nominal)' },
    keyTakeaway: 'SBAF + RTLSR NBAR eliminates false vegetation recovery trends in the multi-decade deforestation record.',
  },
  {
    id: 'wildfire',
    title: 'California Wildfire & Active Fire Boundary',
    location: 'Sierra Nevada Foothills, CA',
    coordinates: '39.81° N, 121.43° W',
    scienceFocus: 'Thermal Anomaly (MWIR/TIR) & Fire Radiative Power (FRP)',
    description:
      'Comparison of MODIS 1km active fire pixel vs VIIRS 375m I-band. VIIRS detects small sub-pixel perimeter flare-ups 4x earlier than MODIS due to reduced pixel growth off-nadir.',
    modisStats: { res: '1000m', red: 0.18, nir: 0.22, ndvi: 0.10, lstK: 348 },
    viirsStats: { res: '375m', red: 0.19, nir: 0.24, ndvi: 0.11, lstK: 382 },
    harmonizedStats: { res: '500m Standardized', red: 0.18, nir: 0.23, ndvi: 0.11, lstK: 365, confidence: '98.8% (FRP Harmonized)' },
    keyTakeaway: 'Harmonized active fire product preserves VIIRS perimeter precision while calibrating FRP to MODIS historical energy baseline.',
  },
  {
    id: 'phenology',
    title: 'Corn Belt Agricultural Phenology',
    location: 'Champaign County, Illinois',
    coordinates: '40.11° N, 88.24° W',
    scienceFocus: 'Crop Emergence, Peak Greenness & Senescence Dates',
    description:
      'Intensive corn-soybean rotation. Unharmonized datasets lead to a 6-day artificial shift in estimated peak greenness timing because of differences in morning (Terra 10:30) vs afternoon (Aqua/VIIRS 1:30) solar illumination.',
    modisStats: { res: '250m', red: 0.038, nir: 0.520, ndvi: 0.864 },
    viirsStats: { res: '375m', red: 0.045, nir: 0.510, ndvi: 0.838 },
    harmonizedStats: { res: '500m Standardized', red: 0.039, nir: 0.518, ndvi: 0.860, confidence: '99.7% (Phenology Phase Locked)' },
    keyTakeaway: 'NBAR standardization to 45° solar zenith locks peak greenness within ±0.8 days across the 25-year series.',
  },
  {
    id: 'cryosphere',
    title: 'Greenland Ice Sheet Melt Dynamics',
    location: 'Jakobshavn Glacier, Greenland',
    coordinates: '69.17° N, 49.83° W',
    scienceFocus: 'Broadband Snow Albedo & Supraglacial Lakes',
    description:
      'High solar zenith angles (>65°) at high latitudes amplify BRDF anisotropy. Snow grain metamorphism requires consistent optical-to-NIR ratios without sensor bandwidth bias.',
    modisStats: { res: '500m', red: 0.840, nir: 0.710, ndvi: -0.084 },
    viirsStats: { res: '750m', red: 0.825, nir: 0.695, ndvi: -0.085 },
    harmonizedStats: { res: '500m Standardized', red: 0.838, nir: 0.708, ndvi: -0.084, confidence: '99.1% (Snow Albedo Verified)' },
    keyTakeaway: 'RTLSR snow kernel corrects extreme grazing-angle solar scattering, ensuring accurate long-term albedo trends.',
  },
];

export const CaseStudySandbox: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('amazon');
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 to 100
  const [activeLayer, setActiveLayer] = useState<'ndvi' | 'trueColor' | 'thermal'>('ndvi');

  const currentCase = CASE_STUDIES.find((c) => c.id === selectedCaseId) || CASE_STUDIES[0];

  return (
    <div className="space-y-4 text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Harmonization Laboratory &amp; Case Study Inspector
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical multi-sensor validation across critical Earth system monitoring regions
          </p>
        </div>

        {/* Case selector tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
          {CASE_STUDIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                selectedCaseId === c.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.title.split(' &')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Split-Wipe Imagery Canvas */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Interactive Split Comparison: Raw vs. Harmonized
              </span>
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-950 border border-slate-800 rounded text-[11px]">
                <button
                  onClick={() => setActiveLayer('ndvi')}
                  className={`px-2 py-0.5 rounded ${activeLayer === 'ndvi' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400'}`}
                >
                  NDVI
                </button>
                <button
                  onClick={() => setActiveLayer('trueColor')}
                  className={`px-2 py-0.5 rounded ${activeLayer === 'trueColor' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400'}`}
                >
                  True Color (RGB)
                </button>
                <button
                  onClick={() => setActiveLayer('thermal')}
                  className={`px-2 py-0.5 rounded ${activeLayer === 'thermal' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
                >
                  Thermal LST
                </button>
              </div>
            </div>

            {/* Simulated Satellite Image Stage with Wipe Slider */}
            <div className="relative h-64 w-full bg-slate-950 rounded-lg border border-slate-800 overflow-hidden select-none">
              {/* Background: Harmonized Product (Right layer) */}
              <div
                className="absolute inset-0 flex items-center justify-center p-6 text-center"
                style={{
                  background:
                    activeLayer === 'ndvi'
                      ? 'radial-gradient(ellipse at 60% 50%, #15803d 0%, #166534 40%, #14532d 70%, #052e16 100%)'
                      : activeLayer === 'thermal'
                      ? 'radial-gradient(ellipse at 50% 50%, #dc2626 0%, #b45309 45%, #1e1b4b 100%)'
                      : 'radial-gradient(ellipse at 50% 50%, #1e3a2f 0%, #132a22 50%, #0a1713 100%)',
                }}
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 border border-emerald-500/40 rounded text-[10px] font-mono text-emerald-400">
                  Harmonized Standardized Product
                </div>
                <div className="text-white/80 font-mono text-xs max-w-sm">
                  <div className="font-bold text-emerald-300 mb-1">Harmonized Surface Grid</div>
                  <div>SBAF adjusted · RTLSR NBAR standardized · 500m CMG</div>
                  <div className="text-emerald-400 text-sm font-bold mt-2">
                    NDVI: {currentCase.harmonizedStats.ndvi.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Foreground: Raw Unharmonized Sensor (Left clipped layer) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <div
                  className="w-[800px] h-full flex items-center justify-center p-6 text-center"
                  style={{
                    background:
                      activeLayer === 'ndvi'
                        ? 'radial-gradient(ellipse at 30% 50%, #166534 0%, #14532d 40%, #0f3922 70%, #022011 100%)'
                        : activeLayer === 'thermal'
                        ? 'radial-gradient(ellipse at 50% 50%, #b91c1c 0%, #92400e 45%, #0f172a 100%)'
                        : 'radial-gradient(ellipse at 50% 50%, #284435 0%, #182e24 50%, #09150f 100%)',
                  }}
                >
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 border border-amber-500/40 rounded text-[10px] font-mono text-amber-400">
                    Raw VIIRS (Unharmonized)
                  </div>
                  <div className="text-white/80 font-mono text-xs max-w-sm -ml-40">
                    <div className="font-bold text-amber-300 mb-1">Raw Uncalibrated Observation</div>
                    <div>Bandwidth discrepancy · Angular VZA bias</div>
                    <div className="text-amber-400 text-sm font-bold mt-2">
                      NDVI: {currentCase.viirsStats.ndvi.toFixed(3)} (Δ = -{(currentCase.harmonizedStats.ndvi - currentCase.viirsStats.ndvi).toFixed(3)})
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Handle Line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] z-10 cursor-ew-resize flex items-center justify-center"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="w-5 h-8 bg-slate-900 border border-cyan-400 rounded flex items-center justify-center text-[10px] text-cyan-300">
                  ↔
                </div>
              </div>
            </div>

            {/* Slider Control */}
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
              <span>← Raw VIIRS View</span>
              <input
                type="range"
                min="5"
                max="95"
                value={sliderPos}
                onChange={(e) => setSliderPos(parseInt(e.target.value, 10))}
                className="w-48 accent-cyan-400 h-1 bg-slate-800 rounded cursor-pointer"
              />
              <span>Harmonized Multi-Sensor View →</span>
            </div>
          </div>

          <div className="mt-3 p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-lg text-xs">
            <span className="font-semibold text-emerald-400 mr-1.5">Impact:</span>
            <span className="text-slate-300">{currentCase.keyTakeaway}</span>
          </div>
        </div>

        {/* Right: Telemetry & Radiometric Comparison Card */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{currentCase.title}</span>
                <span className="text-[11px] font-mono text-cyan-400">{currentCase.coordinates}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentCase.description}</p>
            </div>

            {/* Pixel Telemetry Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-4 bg-slate-950 p-2 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                <span>Metric</span>
                <span>MODIS</span>
                <span>Raw VIIRS</span>
                <span className="text-emerald-400">Harmonized</span>
              </div>

              <div className="divide-y divide-slate-800/60 font-mono text-[11px]">
                <div className="grid grid-cols-4 p-2 bg-slate-900/40">
                  <span className="text-slate-400">Resolution</span>
                  <span>{currentCase.modisStats.res}</span>
                  <span>{currentCase.viirsStats.res}</span>
                  <span className="text-emerald-400">{currentCase.harmonizedStats.res}</span>
                </div>
                <div className="grid grid-cols-4 p-2 bg-slate-900/20">
                  <span className="text-slate-400">Red Reflectance</span>
                  <span>{currentCase.modisStats.red.toFixed(3)}</span>
                  <span>{currentCase.viirsStats.red.toFixed(3)}</span>
                  <span className="text-emerald-400 font-semibold">{currentCase.harmonizedStats.red.toFixed(3)}</span>
                </div>
                <div className="grid grid-cols-4 p-2 bg-slate-900/40">
                  <span className="text-slate-400">NIR Reflectance</span>
                  <span>{currentCase.modisStats.nir.toFixed(3)}</span>
                  <span>{currentCase.viirsStats.nir.toFixed(3)}</span>
                  <span className="text-emerald-400 font-semibold">{currentCase.harmonizedStats.nir.toFixed(3)}</span>
                </div>
                <div className="grid grid-cols-4 p-2 bg-slate-900/20">
                  <span className="text-slate-400">NDVI</span>
                  <span className="text-cyan-400">{currentCase.modisStats.ndvi.toFixed(3)}</span>
                  <span className="text-amber-400">{currentCase.viirsStats.ndvi.toFixed(3)}</span>
                  <span className="text-emerald-400 font-bold">{currentCase.harmonizedStats.ndvi.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Harmonization Quality Assurance */}
          <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-400 text-[10px]">Quality Assurance (QA) Status</div>
              <div className="font-mono text-emerald-400 font-semibold">{currentCase.harmonizedStats.confidence}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">Continuity Offset</div>
              <div className="font-mono text-cyan-400">
                Δ = {Math.abs(currentCase.harmonizedStats.ndvi - currentCase.modisStats.ndvi).toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
