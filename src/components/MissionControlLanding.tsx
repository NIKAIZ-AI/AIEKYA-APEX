/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Flame,
  ArrowRight,
  Radio,
  Satellite,
  Compass,
  Map,
  Calendar,
  TrendingUp,
  Globe,
  Layers,
  ShieldAlert,
  Activity,
  Terminal,
} from 'lucide-react';
import { FireRegion } from '../utils/fireHarmonization';

interface MissionControlLandingProps {
  onNavigateToMap: () => void;
  onNavigateToAOI: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToAnalytics: () => void;
  onNavigateToGlobe: () => void;
  selectedRegion: FireRegion;
}

export const MissionControlLanding: React.FC<MissionControlLandingProps> = ({
  onNavigateToMap,
  onNavigateToAOI,
  onNavigateToCalendar,
  onNavigateToAnalytics,
  onNavigateToGlobe,
  selectedRegion,
}) => {
  return (
    <div
      className="w-full h-full overflow-y-auto font-inter p-6 lg:p-10 space-y-10 scrollbar-thin select-none bg-gradient-to-br from-[#0a0e17] via-[#101522] to-[#151c2c] text-[#EAECEF]"
    >
      {/* 1. HEADER / NAV (MINIMAL, TECHNICAL MISSION CONTROL) */}
      <header
        style={{ borderColor: '#3D726D' }}
        className="w-full pb-4 border-b flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: '#E65F2B' }}
            className="w-3.5 h-3.5 rounded-sm animate-pulse"
          />
          <span
            style={{ color: '#EAECEF' }}
            className="font-rajdhani text-xl font-bold tracking-wider uppercase"
          >
            AIKYA APEX // MISSION CONTROL
          </span>
          <span
            style={{ borderColor: '#3D726D', color: '#3D726D' }}
            className="font-spacemono text-[10px] uppercase tracking-mono px-2 py-0.5 border rounded"
          >
            NASA SPACE APPS 2026
          </span>
        </div>

        <div className="flex items-center gap-6 text-xs font-spacemono uppercase tracking-mono text-[#EAECEF]/70">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
            <span className="text-emerald-400 font-bold">ORBITAL TELEMETRY: NOMINAL</span>
          </span>
          <span className="hidden sm:inline">SENSOR FLEET: MODIS + VIIRS</span>
          <span className="hidden md:inline">SYS UTC: 2026-11-06T11:46:00Z</span>
        </div>
      </header>

      {/* 2. HERO SECTION (MASSIVE H1, STARK CONTRAST, LEFT-ALIGNED) */}
      <section className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <span
            style={{ backgroundColor: '#E65F2B', color: '#EAECEF' }}
            className="font-spacemono text-xs font-bold uppercase tracking-mono px-3 py-1 rounded"
          >
            ACTIVE SENSOR NETWORK
          </span>
          <span
            style={{ color: '#3D726D' }}
            className="font-spacemono text-xs uppercase tracking-mono"
          >
            GRID LAT: {selectedRegion.latMin}° / LON: {selectedRegion.lonMin}°
          </span>
        </div>

        <h1
          style={{ color: '#EAECEF' }}
          className="font-rajdhani text-5xl sm:text-6xl lg:text-7xl font-bold uppercase leading-[0.95] tracking-tight"
        >
          GLOBAL CANOPY THERMAL IMAGING
        </h1>

        <p className="font-inter text-lg text-[#EAECEF]/80 max-w-3xl leading-relaxed">
          Autonomous multi-satellite orbital harmonization merging Terra/Aqua MODIS (1,000m) and Suomi-NPP/NOAA-20
          VIIRS (375m) radiance observations. Continuous multi-decadal time series (2000–2026) normalizing spatial
          resolution, footprint growth, and diurnal observation schedules.
        </p>

        {/* PRIMARY ACTION BUTTON IN IGNITION ORANGE */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={onNavigateToMap}
            className="btn-ignition font-spacemono font-bold text-sm uppercase tracking-mono px-7 py-4 rounded flex items-center gap-3 cursor-pointer"
          >
            <Flame className="w-5 h-5 text-white" />
            <span>VIEW ACTIVE FIRES</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={onNavigateToGlobe}
            style={{
              backgroundColor: '#212C3D',
              borderColor: '#3D726D',
              color: '#EAECEF',
            }}
            className="font-spacemono font-bold text-sm uppercase tracking-mono px-6 py-4 rounded border hover:bg-[#28374d] hover:border-[#4f8a84] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-300" />
            <span>LAUNCH 3D EARTH GLOBE</span>
          </button>
        </div>
      </section>

      {/* 3. LIVE DATA DASHBOARD (3 DATA CARDS WITH MUTED PINE BORDER & SPACE MONO) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            style={{ color: '#EAECEF' }}
            className="font-rajdhani text-2xl font-bold uppercase tracking-wider"
          >
            LIVE SENSOR TELEMETRY &amp; HARMONIZED INDICES
          </h2>
          <span
            style={{ color: '#3D726D' }}
            className="font-spacemono text-xs uppercase tracking-mono"
          >
            REF REGION: {selectedRegion.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Active Anomalies */}
          <div
            style={{
              backgroundColor: '#212C3D',
              borderColor: '#3D726D',
            }}
            className="p-6 rounded-lg border flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: '#EAECEF' }}
                className="font-spacemono text-xs uppercase tracking-mono font-bold"
              >
                ACTIVE THERMAL ANOMALIES
              </span>
              <Activity className="w-5 h-5 text-[#E65F2B]" />
            </div>

            <div>
              <div
                style={{ color: '#E65F2B' }}
                className="font-spacemono text-4xl lg:text-5xl font-bold tracking-tight"
              >
                14,892
              </div>
              <div
                style={{ color: '#3D726D' }}
                className="font-spacemono text-xs uppercase tracking-mono mt-1"
              >
                DETECTIONS / LAST 24H ORBITAL PASS
              </div>
            </div>

            <div
              style={{ borderColor: 'rgba(61, 114, 109, 0.3)' }}
              className="pt-3 border-t text-xs font-inter text-[#EAECEF]/70 flex justify-between"
            >
              <span>CONFIDENCE: &gt; 80%</span>
              <span className="font-spacemono text-emerald-400">+12.4% VS BASELINE</span>
            </div>
          </div>

          {/* Card 2: Acres Burned */}
          <div
            style={{
              backgroundColor: '#212C3D',
              borderColor: '#3D726D',
            }}
            className="p-6 rounded-lg border flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: '#EAECEF' }}
                className="font-spacemono text-xs uppercase tracking-mono font-bold"
              >
                AREA BURNED EXTENT
              </span>
              <Layers className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <div
                style={{ color: '#EAECEF' }}
                className="font-spacemono text-4xl lg:text-5xl font-bold tracking-tight"
              >
                3,284,190
              </div>
              <div
                style={{ color: '#3D726D' }}
                className="font-spacemono text-xs uppercase tracking-mono mt-1"
              >
                CUMULATIVE ESTIMATED ACRES
              </div>
            </div>

            <div
              style={{ borderColor: 'rgba(61, 114, 109, 0.3)' }}
              className="pt-3 border-t text-xs font-inter text-[#EAECEF]/70 flex justify-between"
            >
              <span>FRP RADIATIVE POWER: 48.2 MW</span>
              <span className="font-spacemono text-[#E65F2B]">SEVERITY INDEX: HIGH</span>
            </div>
          </div>

          {/* Card 3: CO2 Emissions */}
          <div
            style={{
              backgroundColor: '#212C3D',
              borderColor: '#3D726D',
            }}
            className="p-6 rounded-lg border flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span
                style={{ color: '#EAECEF' }}
                className="font-spacemono text-xs uppercase tracking-mono font-bold"
              >
                ESTIMATED CO2 EMISSIONS
              </span>
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>

            <div>
              <div
                style={{ color: '#EAECEF' }}
                className="font-spacemono text-4xl lg:text-5xl font-bold tracking-tight"
              >
                142.8 MT
              </div>
              <div
                style={{ color: '#3D726D' }}
                className="font-spacemono text-xs uppercase tracking-mono mt-1"
              >
                MEGATONS CO2-EQUIVALENT RELEASE
              </div>
            </div>

            <div
              style={{ borderColor: 'rgba(61, 114, 109, 0.3)' }}
              className="pt-3 border-t text-xs font-inter text-[#EAECEF]/70 flex justify-between"
            >
              <span>PLUME INJECTION: 6.8 KM</span>
              <span className="font-spacemono text-cyan-400">ATMOSPHERIC IMPACT: MOD</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MISSION STATEMENT (CLEAN, WIDE-COLUMN TEXT SECTION) */}
      <section
        style={{
          backgroundColor: '#212C3D',
          borderColor: '#3D726D',
        }}
        className="p-8 rounded-lg border space-y-5"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-[#3D726D]" />
          <h2
            style={{ color: '#EAECEF' }}
            className="font-rajdhani text-2xl font-bold uppercase tracking-wider"
          >
            MISSION DIRECTIVE &amp; HARMONIZATION PROTOCOL
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#EAECEF]/85 font-inter text-base leading-relaxed">
          <p>
            The Aikya Apex Initiative addresses the fundamental sensor transition challenge in global wildland fire
            monitoring. For over two decades, NASA’s MODIS instruments aboard Terra and Aqua provided baseline
            measurements of fire occurrence and thermal energy release. In 2012, the VIIRS instrument on Suomi-NPP
            introduced 375m sub-pixel thermal sensitivity, detecting roughly 3.2 times more fire pixels due to its
            sharper point spread function and constrained limb-viewing footprint.
          </p>

          <p>
            Without rigorous cross-sensor calibration, longitudinal climate records exhibit an artificial step-change
            jump that misleads emergency responders, climate modelers, and public land managers. Aikya Apex applies
            power-law cluster aggregation, Spectral Band Adjustment Factors (SBAF), and RossThick-LiSparse BRDF
            directional corrections to reconcile the time series into an authoritative, single-truth historical record.
          </p>
        </div>

        <div
          style={{ borderColor: '#3D726D' }}
          className="pt-6 border-t flex flex-wrap items-center justify-between gap-4 font-spacemono text-xs uppercase tracking-mono"
        >
          <div className="flex items-center gap-4 text-[#EAECEF]/70">
            <span>SATELLITE CROSSING: TERRA 10:30 AM</span>
            <span>·</span>
            <span>AQUA 01:30 PM</span>
            <span>·</span>
            <span>SNPP 01:30 PM</span>
            <span>·</span>
            <span>NOAA-20 01:30 PM</span>
          </div>

          <button
            onClick={onNavigateToAOI}
            style={{ color: '#E65F2B' }}
            className="font-bold flex items-center gap-2 hover:underline cursor-pointer"
          >
            <span>CONFIGURE AREA OF INTEREST</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5. EXPLORATION GRID (DIRECT SYSTEM MODULE SHORTCUTS) */}
      <section className="space-y-4">
        <h3
          style={{ color: '#EAECEF' }}
          className="font-rajdhani text-xl font-bold uppercase tracking-wider"
        >
          SYSTEM CAPABILITIES &amp; SCIENTIFIC MODULES
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-spacemono text-xs">
          <button
            onClick={onNavigateToAOI}
            style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
            className="p-5 rounded-lg border text-left hover:border-[#E65F2B] transition-all space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#3D726D] group-hover:text-[#E65F2B]">
              <Compass className="w-5 h-5" />
              <span className="text-[10px]">MODULE 01</span>
            </div>
            <div className="font-rajdhani text-lg font-bold text-white uppercase">AREA OF INTEREST</div>
            <p className="font-inter text-xs text-[#EAECEF]/70 normal-case">
              Select predefined tropical/boreal biomes or input custom latitude/longitude polygons.
            </p>
          </button>

          <button
            onClick={onNavigateToMap}
            style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
            className="p-5 rounded-lg border text-left hover:border-[#E65F2B] transition-all space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#3D726D] group-hover:text-[#E65F2B]">
              <Map className="w-5 h-5" />
              <span className="text-[10px]">MODULE 02</span>
            </div>
            <div className="font-rajdhani text-lg font-bold text-white uppercase">INTERACTIVE 2D MAP</div>
            <p className="font-inter text-xs text-[#EAECEF]/70 normal-case">
              Explore hotspot clusters color-coded by Fire Radiative Power (MW) with timeline playback scrubber.
            </p>
          </button>

          <button
            onClick={onNavigateToCalendar}
            style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
            className="p-5 rounded-lg border text-left hover:border-[#E65F2B] transition-all space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#3D726D] group-hover:text-[#E65F2B]">
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">MODULE 03</span>
            </div>
            <div className="font-rajdhani text-lg font-bold text-white uppercase">BURNING CALENDAR</div>
            <p className="font-inter text-xs text-[#EAECEF]/70 normal-case">
              Full 2000–2026 multi-year matrix with accessible color palettes and anomaly deviation tooltips.
            </p>
          </button>

          <button
            onClick={onNavigateToAnalytics}
            style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
            className="p-5 rounded-lg border text-left hover:border-[#E65F2B] transition-all space-y-2 cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[#3D726D] group-hover:text-[#E65F2B]">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px]">MODULE 04</span>
            </div>
            <div className="font-rajdhani text-lg font-bold text-white uppercase">KEY INDICES</div>
            <p className="font-inter text-xs text-[#EAECEF]/70 normal-case">
              Seasonal baseline curves, wildfire vs clearing regimes, and one-click CSV / JSON report downloads.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
