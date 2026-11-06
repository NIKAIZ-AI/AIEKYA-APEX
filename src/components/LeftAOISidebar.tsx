/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Calendar,
  Layers,
  Flame,
  Radio,
  Sliders,
  Sparkles,
  Info,
  Pin,
  PinOff,
  Filter,
  Check,
  Cpu,
} from 'lucide-react';
import { PRESET_FIRE_REGIONS, FireRegion } from '../utils/fireHarmonization';

export type UserAudience = 'responder' | 'scientist' | 'manager';

interface LeftAOISidebarProps {
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
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenSpecsModal: () => void;
}

export const LeftAOISidebar: React.FC<LeftAOISidebarProps> = ({
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
  isPinned,
  onTogglePin,
  onOpenSpecsModal,
}) => {
  const [isCustomAOI, setIsCustomAOI] = useState(false);
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
    <div className="w-full h-full flex flex-col font-sans select-none text-slate-100 space-y-4">
      {/* 1. SIDEBAR HEADER */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display">
              Area of Interest &amp; Engine
            </h3>
            <span className="text-[10px] text-slate-400">Spatial &amp; Sensor Filters</span>
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

      {/* 2. TARGET AUDIENCE SELECTOR */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>Audience Perspective</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            Mode Active
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button
            onClick={() => onChangeAudience('responder')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              audience === 'responder'
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            🚨 Responder
          </button>
          <button
            onClick={() => onChangeAudience('scientist')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              audience === 'scientist'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            🔬 Scientist
          </button>
          <button
            onClick={() => onChangeAudience('manager')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              audience === 'manager'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            🌲 Land Mgr
          </button>
        </div>
      </div>

      {/* 3. AOI PRESETS & CUSTOM LAT/LON INPUTS */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Area of Interest (AOI)</span>
          </span>

          <button
            onClick={() => setIsCustomAOI(!isCustomAOI)}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
              isCustomAOI
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isCustomAOI ? '✓ Lat/Lon Active' : '+ Lat/Lon Input'}
          </button>
        </div>

        {!isCustomAOI ? (
          /* Preset Biomes */
          <div className="grid grid-cols-2 gap-2">
            {PRESET_FIRE_REGIONS.map((region) => {
              const isSelected = region.id === selectedRegion.id;
              return (
                <button
                  key={region.id}
                  onClick={() => onSelectRegion(region)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-cyan-400 shadow-md font-bold'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{region.name.split(' (')[0]}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">{region.country}</div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Custom Latitude / Longitude numerical inputs */
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <label className="text-[10px] text-slate-400 block font-bold uppercase">Center Lat (°)</label>
                <input
                  type="number"
                  step="0.1"
                  min="-90"
                  max="90"
                  value={customLat}
                  onChange={(e) => setCustomLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono font-bold text-white outline-none mt-0.5"
                />
              </div>

              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                <label className="text-[10px] text-slate-400 block font-bold uppercase">Center Lon (°)</label>
                <input
                  type="number"
                  step="0.1"
                  min="-180"
                  max="180"
                  value={customLon}
                  onChange={(e) => setCustomLon(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono font-bold text-white outline-none mt-0.5"
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase">
                <span>Radius Buffer</span>
                <span className="font-mono text-cyan-400">{customRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={customRadiusKm}
                onChange={(e) => setCustomRadiusKm(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded cursor-pointer mt-1"
              />
            </div>

            <button
              onClick={applyCustomAOI}
              className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              Update AOI Bounding Box
            </button>
          </div>
        )}
      </div>

      {/* 4. FIRE REGIME FILTER (Wildfire vs Anthropogenic) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-orange-400" />
            <span>Fire Regime Classification</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button
            onClick={() => onChangeRegimeFilter('all')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              regimeFilter === 'all'
                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            All Fires
          </button>
          <button
            onClick={() => onChangeRegimeFilter('wildfire')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              regimeFilter === 'wildfire'
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Wildfires
          </button>
          <button
            onClick={() => onChangeRegimeFilter('anthropogenic')}
            className={`py-1.5 px-2 rounded-xl border transition-all text-center ${
              regimeFilter === 'anthropogenic'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Clearing
          </button>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight">
          Separates natural forest fires from agricultural residue burning and land clearing.
        </p>
      </div>

      {/* 5. DATE RANGE SELECTOR */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 shadow-lg space-y-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-display flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Query Date Window</span>
          </span>

          <div className="flex gap-1 text-[9px] font-bold">
            <button
              onClick={() => {
                onChangeStartDate('2000-01');
                onChangeEndDate('2026-10');
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Full 26-Yr
            </button>
            <button
              onClick={() => {
                onChangeStartDate('2020-01');
                onChangeEndDate('2026-10');
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              2020s Era
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <label className="text-[9px] text-slate-400 block uppercase font-bold">Start Month</label>
            <input
              type="month"
              min="2000-01"
              max="2026-10"
              value={startDateYM}
              onChange={(e) => onChangeStartDate(e.target.value)}
              className="w-full bg-transparent font-mono font-bold text-white outline-none mt-0.5"
            />
          </div>

          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
            <label className="text-[9px] text-slate-400 block uppercase font-bold">End Month</label>
            <input
              type="month"
              min="2000-01"
              max="2026-10"
              value={endDateYM}
              onChange={(e) => onChangeEndDate(e.target.value)}
              className="w-full bg-transparent font-mono font-bold text-white outline-none mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* 6. SCIENCE ARCHITECTURE MODAL BUTTON */}
      <button
        onClick={onOpenSpecsModal}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs active:scale-95 transition-all cursor-pointer"
      >
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span>Harmonization Pipeline Specs</span>
      </button>
    </div>
  );
};
