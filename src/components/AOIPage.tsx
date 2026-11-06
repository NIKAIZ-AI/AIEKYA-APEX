/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Calendar,
  Filter,
  Radio,
  Sliders,
  Check,
  Flame,
  ArrowRight,
  Globe,
  Map,
  ShieldAlert,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PRESET_FIRE_REGIONS, FireRegion } from '../utils/fireHarmonization';
import { UserAudience } from './LeftAOISidebar';

interface AOIPageProps {
  selectedRegion: FireRegion;
  onSelectRegion: (region: FireRegion) => void;
  regimeFilter: 'all' | 'wildfire' | 'anthropogenic';
  onChangeRegimeFilter: (filter: 'all' | 'wildfire' | 'anthropogenic') => void;
  startDateYM: string;
  endDateYM: string;
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  audience: UserAudience;
  onChangeAudience: (aud: UserAudience) => void;
  onNavigateToMap: () => void;
  onNavigateToGlobe: () => void;
  onOpenSpecs: () => void;
}

export const AOIPage: React.FC<AOIPageProps> = ({
  selectedRegion,
  onSelectRegion,
  regimeFilter,
  onChangeRegimeFilter,
  startDateYM,
  endDateYM,
  onChangeStartDate,
  onChangeEndDate,
  audience,
  onChangeAudience,
  onNavigateToMap,
  onNavigateToGlobe,
  onOpenSpecs,
}) => {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customLat, setCustomLat] = useState<number>(-9.0);
  const [customLon, setCustomLon] = useState<number>(-59.0);
  const [customRadiusKm, setCustomRadiusKm] = useState<number>(250);

  const applyCustomAOI = () => {
    const latDelta = customRadiusKm / 111.0;
    const lonDelta = customRadiusKm / (111.0 * Math.max(0.2, Math.cos((customLat * Math.PI) / 180)));

    const customReg: FireRegion = {
      id: 'custom_aoi',
      name: `Custom AOI (${customLat.toFixed(2)}°, ${customLon.toFixed(2)}°)`,
      country: 'User Defined Polygon Area',
      latMin: Math.max(-90, Number((customLat - latDelta).toFixed(2))),
      latMax: Math.min(90, Number((customLat + latDelta).toFixed(2))),
      lonMin: Math.max(-180, Number((customLon - lonDelta).toFixed(2))),
      lonMax: Math.min(180, Number((customLon + lonDelta).toFixed(2))),
      biome: 'Custom Polygon Boundary',
      peakSeasonMonths: [7, 8, 9],
      baselineMonthlyMean: [600, 500, 800, 1400, 2900, 6100, 15400, 29800, 31200, 15800, 4800, 1400],
      historicRecordYear: 2024,
      historicRecordNote: 'Custom area of interest harmonized fire query.',
      description: `Spatial query centered at ${customLat.toFixed(2)}°, ${customLon.toFixed(2)}° with ${customRadiusKm} km radius buffer.`,
    };

    onSelectRegion(customReg);
  };

  return (
    <div className="w-full h-full overflow-y-auto p-6 space-y-6 text-slate-100 scrollbar-thin select-none bg-gradient-to-br from-[#06141a] via-[#0a1e27] to-[#0f2c39]">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-display">
                Area of Interest (AOI) &amp; Harmonization Engine
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                Spatial Query Setup
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Select or draw your geographical area of interest to query harmonized MODIS &amp; VIIRS fire records.
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onNavigateToMap}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Map className="w-4 h-4 text-cyan-200" />
            <span>Open in 2D Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onNavigateToGlobe}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-200" />
            <span>Open in 3D Globe</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN CONFIGURATION GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Biomes & Custom Lat/Lon */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preset Fire Biomes */}
          <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">
                  Global Fire Monitoring Presets
                </h2>
              </div>
              <button
                onClick={() => setIsCustomMode(!isCustomMode)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isCustomMode
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
              >
                {isCustomMode ? '✓ Lat/Lon Active' : '+ Custom Coordinates'}
              </button>
            </div>

            {!isCustomMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PRESET_FIRE_REGIONS.map((region) => {
                  const isSelected = region.id === selectedRegion.id;
                  return (
                    <button
                      key={region.id}
                      onClick={() => onSelectRegion(region)}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 border-cyan-400 shadow-md font-bold'
                          : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800/90 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-white">{region.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse mt-1" />
                        )}
                      </div>
                      <div className="text-xs text-cyan-400 font-mono mt-1">{region.country}</div>
                      <div className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                        {region.description}
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <span>
                          Lat: {region.latMin}° to {region.latMax}°
                        </span>
                        <span>
                          Lon: {region.lonMin}° to {region.lonMax}°
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Custom Coordinates Numerical Inputs */
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Center Latitude (°)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-90"
                      max="90"
                      value={customLat}
                      onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none mt-1"
                    />
                    <span className="text-[9px] text-slate-500">-90° South to +90° North</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <label className="text-[10px] text-slate-400 block font-bold uppercase">Center Longitude (°)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="-180"
                      max="180"
                      value={customLon}
                      onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent font-mono font-bold text-lg text-white outline-none mt-1"
                    />
                    <span className="text-[9px] text-slate-500">-180° West to +180° East</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                      <span>Radius Buffer</span>
                      <span className="font-mono text-cyan-400">{customRadiusKm} km</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="1200"
                      step="25"
                      value={customRadiusKm}
                      onChange={(e) => setCustomRadiusKm(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-500 h-2 bg-slate-800 rounded cursor-pointer mt-3"
                    />
                    <span className="text-[9px] text-slate-500">Bounding extent: ~{(customRadiusKm * 2)} km</span>
                  </div>
                </div>

                <button
                  onClick={applyCustomAOI}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save &amp; Activate Custom AOI Bounding Box
                </button>
              </div>
            )}
          </div>

          {/* Fire Regime Classification Section */}
          <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white font-display">
                  Fire Regime Classification Filter
                </h2>
              </div>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                Harmonized MODIS + VIIRS
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-bold">
              <button
                onClick={() => onChangeRegimeFilter('all')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  regimeFilter === 'all'
                    ? 'bg-orange-600 text-white border-orange-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-sm font-bold">All Detections</div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">Comprehensive time series</div>
              </button>
              <button
                onClick={() => onChangeRegimeFilter('wildfire')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  regimeFilter === 'wildfire'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-sm font-bold">Wildfires Only</div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">Forests &amp; natural vegetation</div>
              </button>
              <button
                onClick={() => onChangeRegimeFilter('anthropogenic')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  regimeFilter === 'anthropogenic'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <div className="text-sm font-bold">Anthropogenic Only</div>
                <div className="text-[10px] font-normal opacity-80 mt-0.5">Agricultural &amp; clearing</div>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              The harmonization engine categorizes hotspots by cross-referencing MODIS 1km and VIIRS 375m
              detections with land-cover classification and diurnal ignition patterns to decouple natural wildfire
              episodes from routine seasonal clearing.
            </p>
          </div>
        </div>

        {/* Right Column: Audience Persona, Date Window, & Quick Telemetry */}
        <div className="space-y-6">
          {/* Target Audience Mode */}
          <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display">
                  Audience Perspective
                </h3>
              </div>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                Feature 18
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onChangeAudience('responder')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  audience === 'responder'
                    ? 'bg-rose-950/40 border-rose-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-rose-300">🚨 Emergency Responder</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Surfaces red flag warnings, peak fire timing, and suppression urgency.
                </div>
              </button>

              <button
                onClick={() => onChangeAudience('scientist')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  audience === 'scientist'
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-blue-300">🔬 Climate Scientist</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Focuses on multi-decadal continuous climate trends and statistical anomalies.
                </div>
              </button>

              <button
                onClick={() => onChangeAudience('manager')}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  audience === 'manager'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300">🌲 Land Manager</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Highlights prescribed burn windows, fuel accumulation, and buffer zones.
                </div>
              </button>
            </div>
          </div>

          {/* Temporal Date Range Window */}
          <div className="p-5 rounded-2xl bg-slate-900/85 backdrop-blur-2xl border border-slate-700/60 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display">
                  Query Date Window
                </h3>
              </div>
              <div className="flex gap-1 text-[9px] font-bold">
                <button
                  onClick={() => {
                    onChangeStartDate('2000-01');
                    onChangeEndDate('2026-10');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Full 26-Yr
                </button>
                <button
                  onClick={() => {
                    onChangeStartDate('2020-01');
                    onChangeEndDate('2026-10');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  2020s Era
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <label className="text-[10px] text-slate-400 block uppercase font-bold">Start Month</label>
                <input
                  type="month"
                  min="2000-01"
                  max="2026-10"
                  value={startDateYM}
                  onChange={(e) => onChangeStartDate(e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-white outline-none mt-1"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <label className="text-[10px] text-slate-400 block uppercase font-bold">End Month</label>
                <input
                  type="month"
                  min="2000-01"
                  max="2026-10"
                  value={endDateYM}
                  onChange={(e) => onChangeEndDate(e.target.value)}
                  className="w-full bg-transparent font-mono font-bold text-white outline-none mt-1"
                />
              </div>
            </div>
          </div>

          {/* Science Specs Modal Trigger */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-700/60 shadow-xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300 font-display">
              Architecture &amp; Algorithm Specs
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore the detailed mathematical formulation reconciling MODIS and VIIRS sensor geometry, SBAF
              spectral matching, and BRDF directional corrections.
            </p>
            <button
              onClick={onOpenSpecs}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              View Harmonization Pipeline Specs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
