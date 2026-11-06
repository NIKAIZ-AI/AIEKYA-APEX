/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  Compass,
  Map,
  Calendar,
  TrendingUp,
  Globe,
  FileText,
  RotateCw,
  Eye,
  EyeOff,
  Crosshair,
  Satellite,
  X,
  Layers,
  MapPin,
  Sparkles,
  Info,
  Activity,
  Home,
} from 'lucide-react';
import { MissionControlLanding } from './components/MissionControlLanding';
import { AOIPage } from './components/AOIPage';
import { Interactive2DMap } from './components/Interactive2DMap';
import { BurningCalendarMatrix } from './components/BurningCalendarMatrix';
import { KeyIndicesPage } from './components/KeyIndicesPage';
import { GlobeViewport } from './components/GlobeViewport';
import { PipelineArchitectureModal } from './components/PipelineArchitectureModal';
import { SATELLITES, SatelliteConfig } from './utils/orbital';
import { FireDecade } from './utils/decadeFireHeatmap';
import { PRESET_FIRE_REGIONS, FireRegion } from './utils/fireHarmonization';
import { UserAudience } from './components/LeftAOISidebar';

export type ActivePage = 'home' | 'aoi' | 'map2d' | 'calendar' | 'analytics' | 'globe3d';

export const PAGE_THEMES: Record<ActivePage, { bg: string; name: string; accentColor: string; description: string }> = {
  home: {
    bg: 'bg-gradient-to-br from-[#0a0e17] via-[#101522] to-[#151c2c]',
    name: 'Deep Space Charcoal',
    accentColor: '#E65F2B',
    description: 'Mission Control Overview',
  },
  aoi: {
    bg: 'bg-gradient-to-br from-[#06141a] via-[#0a1e27] to-[#0f2c39]',
    name: 'Petroleum Slate Teal',
    accentColor: '#22d3ee',
    description: 'Geospatial AOI Query',
  },
  map2d: {
    bg: 'bg-gradient-to-br from-[#060b14] via-[#0b1322] to-[#101b30]',
    name: 'Tactical Radar Navy',
    accentColor: '#60a5fa',
    description: 'Cartographic 2D Explorer',
  },
  calendar: {
    bg: 'bg-gradient-to-br from-[#180e0a] via-[#24140e] to-[#2f1911]',
    name: 'Volcanic Ember Basalt',
    accentColor: '#fbbf24',
    description: 'Multi-Decadal Matrix Grid',
  },
  analytics: {
    bg: 'bg-gradient-to-br from-[#100d1e] via-[#17132c] to-[#211a3d]',
    name: 'Scientific Midnight Indigo',
    accentColor: '#fb7185',
    description: 'Historical Anomaly Trends',
  },
  globe3d: {
    bg: 'bg-[#010409]',
    name: 'Cosmic Void Black',
    accentColor: '#34d399',
    description: '4K Blue Marble Earth & Orbits',
  },
};

export default function App() {
  // Navigation: Dedicated single page at a time
  const [activePage, setActivePage] = useState<ActivePage>('home');
  // Sidebar starts collapsed (icon-only); expands on hover
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  // Global AOI & Harmonization State
  const [selectedRegion, setSelectedRegion] = useState<FireRegion>(PRESET_FIRE_REGIONS[0]);
  const [regimeFilter, setRegimeFilter] = useState<'all' | 'wildfire' | 'anthropogenic'>('all');
  const [startDateYM, setStartDateYM] = useState<string>('2000-01');
  const [endDateYM, setEndDateYM] = useState<string>('2026-10');
  const [audience, setAudience] = useState<UserAudience>('responder');
  const [focusYear, setFocusYear] = useState<number>(2024);

  // Timeline Playback State (for 2D Map)
  const [timelineDate, setTimelineDate] = useState<string>('2024-09');
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(false);

  // 3D Earth Globe State
  const [fireDecade, setFireDecade] = useState<FireDecade>('2020s');
  const [showFireHeatmap, setShowFireHeatmap] = useState<boolean>(true);
  const [isAutoRotateEnabled, setIsAutoRotateEnabled] = useState<boolean>(true);
  const [globeTheme, setGlobeTheme] = useState<'space' | 'beige'>('space');
  const [simulationSpeed, setSimulationSpeed] = useState<number>(30);
  const [isOrbitalPaused, setIsOrbitalPaused] = useState(false);
  const [selectedSatId, setSelectedSatId] = useState<string>('terra');
  const [showModisSwath, setShowModisSwath] = useState(true);
  const [showViirsSwath, setShowViirsSwath] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showGraticule, setShowGraticule] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'global' | 'terra' | 'snpp' | 'polar' | 'overlap' | 'region'>('global');
  const [selectedSatelliteModal, setSelectedSatelliteModal] = useState<SatelliteConfig | null>(null);

  const targetRegionCoords = {
    lat: (selectedRegion.latMin + selectedRegion.latMax) / 2,
    lon: (selectedRegion.lonMin + selectedRegion.lonMax) / 2,
    name: selectedRegion.name,
  };

  // Timeline auto-advance playback loop
  useEffect(() => {
    if (!isTimelinePlaying) return;

    const interval = setInterval(() => {
      setTimelineDate((prev) => {
        const [y, m] = prev.split('-').map(Number);
        let nextM = m + 1;
        let nextY = y;
        if (nextM > 12) {
          nextM = 1;
          nextY += 1;
        }
        if (nextY > 2026 || (nextY === 2026 && nextM > 10)) {
          nextY = 2000;
          nextM = 1;
        }
        return `${nextY}-${String(nextM).padStart(2, '0')}`;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isTimelinePlaying]);

  const navItems = [
    {
      id: 'home' as ActivePage,
      label: 'Mission Control',
      subtext: 'Overview & Global Telemetry',
      icon: Activity,
      color: 'text-[#E65F2B]',
      activeBg: 'bg-[#212C3D] border-[#E65F2B] text-white shadow-lg shadow-orange-950/40',
    },
    {
      id: 'aoi' as ActivePage,
      label: 'Area of Interest (AOI)',
      subtext: 'Presets & Lat/Lon Coordinates',
      icon: Compass,
      color: 'text-cyan-400',
      activeBg: 'bg-[#212C3D] border-cyan-400 text-white shadow-lg shadow-cyan-950/40',
    },
    {
      id: 'map2d' as ActivePage,
      label: 'Interactive 2D Map',
      subtext: 'Hotspots & Timeline Scrubber',
      icon: Map,
      color: 'text-blue-400',
      activeBg: 'bg-[#212C3D] border-blue-400 text-white shadow-lg shadow-blue-950/40',
    },
    {
      id: 'calendar' as ActivePage,
      label: 'Burning Calendar Grid',
      subtext: '2000–2026 Multi-Year Matrix',
      icon: Calendar,
      color: 'text-amber-400',
      activeBg: 'bg-[#212C3D] border-amber-400 text-white shadow-lg shadow-amber-950/40',
    },
    {
      id: 'analytics' as ActivePage,
      label: 'Key Indices & Analytics',
      subtext: 'Trends, Anomaly % & Regimes',
      icon: TrendingUp,
      color: 'text-rose-400',
      activeBg: 'bg-[#212C3D] border-rose-400 text-white shadow-lg shadow-rose-950/40',
    },
    {
      id: 'globe3d' as ActivePage,
      label: 'Interactive 3D Globe',
      subtext: '4K Blue Marble & Satellites',
      icon: Globe,
      color: 'text-emerald-400',
      activeBg: 'bg-[#212C3D] border-emerald-400 text-white shadow-lg shadow-emerald-950/40',
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#11141A] font-sans text-[#EAECEF] flex select-none">
      {/* ========================================================= */}
      {/* 1. HOVER-TO-EXPAND LEFT VERTICAL SIDEBAR                  */}
      {/* Defaults to icon-only (w-18); expands on cursor hover     */}
      {/* ========================================================= */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        className={`h-full flex flex-col justify-between bg-[#11141A]/95 backdrop-blur-2xl border-r border-[#3D726D]/50 shadow-[10px_0_35px_rgba(0,0,0,0.8)] z-40 transition-all duration-300 ease-in-out shrink-0 ${
          isSidebarHovered ? 'w-72 p-4' : 'w-18 p-3 items-center'
        }`}
      >
        {/* Top: Brand Wordmark */}
        <div className="space-y-4 w-full">
          <div
            className={`flex items-center pb-3 border-b border-[#3D726D]/40 ${
              isSidebarHovered ? 'justify-between' : 'justify-center'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E65F2B] via-orange-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-orange-500/30 shrink-0">
                <Flame className="w-5 h-5 text-white" />
              </div>
              {isSidebarHovered && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="font-rajdhani text-lg font-bold tracking-wider text-white uppercase">
                      AIKYA APEX
                    </span>
                    <span className="font-spacemono text-[9px] uppercase tracking-mono px-1.5 py-0.2 rounded bg-[#E65F2B]/20 text-[#E65F2B] border border-[#E65F2B]/40">
                      NASA 26
                    </span>
                  </div>
                  <p className="font-spacemono text-[9px] text-[#3D726D] uppercase tracking-mono truncate mt-0.5">
                    MODIS + VIIRS CORE
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border transition-all duration-200 cursor-pointer relative group ${
                    isSidebarHovered ? 'p-2.5 text-left' : 'p-2.5 justify-center'
                  } ${
                    isActive
                      ? `${item.activeBg} font-bold`
                      : 'bg-[#212C3D]/40 border-[#3D726D]/30 text-[#EAECEF]/60 hover:bg-[#212C3D] hover:text-[#EAECEF] hover:border-[#3D726D]'
                  }`}
                >
                  <div className={`shrink-0 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {isSidebarHovered ? (
                    <div className="overflow-hidden">
                      <div className="font-rajdhani text-sm font-bold uppercase tracking-wider text-white leading-tight">
                        {item.label}
                      </div>
                      <div className="font-spacemono text-[9px] text-[#3D726D] uppercase tracking-mono truncate mt-0.5">
                        {item.subtext}
                      </div>
                    </div>
                  ) : (
                    /* Floating Tooltip when collapsed */
                    <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#212C3D] border border-[#3D726D] text-xs font-rajdhani uppercase font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}

                  {/* Active Indicator Beacon */}
                  {isActive && !isSidebarHovered && (
                    <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-[#E65F2B] animate-ping" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-3 pt-3 border-t border-[#3D726D]/40 w-full">
          {isSidebarHovered ? (
            /* Expanded Info Card */
            <div className="p-3 rounded-xl bg-[#212C3D]/80 border border-[#3D726D]/50 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-spacemono uppercase tracking-mono text-[#3D726D]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#E65F2B]" />
                  <span>TARGET GRID</span>
                </span>
                <span className="text-[#E65F2B] font-bold">
                  {selectedRegion.latMin}° / {selectedRegion.lonMin}°
                </span>
              </div>
              <div className="font-rajdhani text-xs font-bold text-white uppercase truncate">
                {selectedRegion.name}
              </div>
              <div className="font-spacemono text-[9px] text-[#EAECEF]/60 truncate">
                {selectedRegion.country}
              </div>
            </div>
          ) : (
            /* Collapsed Target Pin */
            <div
              className="flex justify-center cursor-pointer"
              title={`${selectedRegion.name} (${selectedRegion.country})`}
            >
              <div className="p-2 rounded-xl bg-[#212C3D] border border-[#3D726D] text-[#E65F2B]">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Science Specs Modal Trigger */}
          <button
            onClick={() => setIsSpecModalOpen(true)}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-[#212C3D] hover:bg-[#2c3b52] text-[#EAECEF] border border-[#3D726D] text-xs font-spacemono uppercase tracking-mono font-bold active:scale-95 transition-all cursor-pointer ${
              isSidebarHovered ? 'p-2.5' : 'p-2.5'
            }`}
            title="Open Science & Harmonization Specs Modal"
          >
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
            {isSidebarHovered && <span>SCIENCE SPECS</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE: RENDERS ONLY ONE FOCUSED PAGE AT A TIME */}
      {/* ========================================================= */}
      <main className={`relative flex-1 h-full overflow-hidden flex flex-col transition-all duration-500 ease-in-out ${PAGE_THEMES[activePage].bg}`}>
        {/* PAGE 1: MISSION CONTROL LANDING PAGE */}
        {activePage === 'home' && (
          <MissionControlLanding
            onNavigateToMap={() => setActivePage('map2d')}
            onNavigateToAOI={() => setActivePage('aoi')}
            onNavigateToCalendar={() => setActivePage('calendar')}
            onNavigateToAnalytics={() => setActivePage('analytics')}
            onNavigateToGlobe={() => setActivePage('globe3d')}
            selectedRegion={selectedRegion}
          />
        )}

        {/* PAGE 2: AREA OF INTEREST (AOI) & ENGINE CONTROLS */}
        {activePage === 'aoi' && (
          <AOIPage
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              setFocusYear(reg.historicRecordYear);
            }}
            regimeFilter={regimeFilter}
            onChangeRegimeFilter={setRegimeFilter}
            startDateYM={startDateYM}
            endDateYM={endDateYM}
            onChangeStartDate={setStartDateYM}
            onChangeEndDate={setEndDateYM}
            audience={audience}
            onChangeAudience={setAudience}
            onNavigateToMap={() => setActivePage('map2d')}
            onNavigateToGlobe={() => setActivePage('globe3d')}
            onOpenSpecs={() => setIsSpecModalOpen(true)}
          />
        )}

        {/* PAGE 3: INTERACTIVE 2D MAP */}
        {activePage === 'map2d' && (
          <div className="w-full h-full p-4 flex flex-col">
            <Interactive2DMap
              region={selectedRegion}
              regimeFilter={regimeFilter}
              timelineDate={timelineDate}
              onChangeTimelineDate={setTimelineDate}
              isPlaying={isTimelinePlaying}
              onTogglePlay={() => setIsTimelinePlaying(!isTimelinePlaying)}
              onOpenGlobe={() => setActivePage('globe3d')}
            />
          </div>
        )}

        {/* PAGE 4: BURNING ACTIVITY CALENDAR GRID */}
        {activePage === 'calendar' && (
          <div className="w-full h-full p-4 flex flex-col">
            <BurningCalendarMatrix
              region={selectedRegion}
              onSelectYearMonth={(y, m) => {
                setFocusYear(y);
                setTimelineDate(`${y}-${String(m).padStart(2, '0')}`);
                setActivePage('map2d');
              }}
              onOpenGlobe={() => setActivePage('globe3d')}
            />
          </div>
        )}

        {/* PAGE 5: KEY INDICES & ANALYTICS DASHBOARD */}
        {activePage === 'analytics' && (
          <KeyIndicesPage
            region={selectedRegion}
            startDateYM={startDateYM}
            endDateYM={endDateYM}
            focusYear={focusYear}
            regimeFilter={regimeFilter}
            onNavigateToCalendar={() => setActivePage('calendar')}
            onNavigateToMap={() => setActivePage('map2d')}
          />
        )}

        {/* PAGE 6: INTERACTIVE 3D EARTH GLOBE */}
        {activePage === 'globe3d' && (
          <div className="relative w-full h-full">
            <GlobeViewport
              simulationSpeed={simulationSpeed}
              isPaused={isOrbitalPaused}
              selectedSatId={selectedSatId}
              onSelectSatellite={(sat) => {
                setSelectedSatId(sat.id);
                setSelectedSatelliteModal(sat);
                setCameraPreset(sat.sensor === 'MODIS' ? 'terra' : 'snpp');
              }}
              showModisSwath={showModisSwath}
              showViirsSwath={showViirsSwath}
              showOrbits={showOrbits}
              showGraticule={showGraticule}
              cameraPreset={cameraPreset}
              targetRegionCoords={targetRegionCoords}
              fireDecade={fireDecade}
              showFireHeatmap={showFireHeatmap}
              isAutoRotateEnabled={isAutoRotateEnabled}
              globeTheme={globeTheme}
            />

            {/* Satellite Details Pop-up Modal */}
            {selectedSatelliteModal && (
              <div
                style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
                className="absolute top-4 left-4 z-30 w-84 p-4 rounded-xl border shadow-[0_16px_40px_rgba(0,0,0,0.85)] text-[#EAECEF] space-y-3 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="flex items-start justify-between pb-2 border-b border-[#3D726D]/50">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm"
                      style={{ backgroundColor: selectedSatelliteModal.colorHex }}
                    >
                      <Satellite className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-rajdhani text-base font-bold uppercase tracking-wider text-white">
                        {selectedSatelliteModal.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-spacemono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-900/40 text-blue-300">
                          {selectedSatelliteModal.sensor}
                        </span>
                        <span className="font-spacemono text-[10px] text-[#3D726D]">
                          {selectedSatelliteModal.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSatelliteModal(null)}
                    className="p-1 text-[#EAECEF]/60 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 font-spacemono text-xs">
                  <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#3D726D]/40">
                    <span className="text-[10px] text-[#3D726D] block uppercase tracking-mono">ORBIT ALTITUDE</span>
                    <span className="font-bold text-cyan-400">
                      {selectedSatelliteModal.altitudeKm} km LEO
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#3D726D]/40">
                    <span className="text-[10px] text-[#3D726D] block uppercase tracking-mono">OPTICAL SWATH</span>
                    <span className="font-bold text-[#E65F2B]">
                      {selectedSatelliteModal.swathWidthKm} km
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#11141A] border border-[#3D726D]/40 text-xs space-y-1">
                  <div className="font-spacemono text-[10px] text-[#3D726D] uppercase tracking-mono font-bold">
                    ACTIVE FIRE CHANNELS:
                  </div>
                  <div className="font-inter text-xs text-[#EAECEF]/85">
                    {selectedSatelliteModal.sensor === 'MODIS'
                      ? 'Band 21/22 (3.96 μm) + Band 31 (11.0 μm) · 1,000m resolution'
                      : 'I4 band (3.74 μm) + I5 band (11.45 μm) · 375m sub-pixel resolution'}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setCameraPreset(selectedSatelliteModal.sensor === 'MODIS' ? 'terra' : 'snpp');
                    }}
                    className="flex-1 btn-ignition font-spacemono font-bold text-xs uppercase tracking-mono py-2 px-3 rounded flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>TRACK SPACECRAFT</span>
                  </button>
                  <button
                    onClick={() => setSelectedSatelliteModal(null)}
                    className="px-3 py-2 rounded bg-[#11141A] text-[#EAECEF]/70 hover:text-white font-spacemono text-xs border border-[#3D726D]/40 cursor-pointer"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            )}

            {/* Floating Top Controls inside 3D Globe */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setIsAutoRotateEnabled(!isAutoRotateEnabled)}
                style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-spacemono text-xs uppercase tracking-mono font-bold rounded border backdrop-blur-xl transition-all cursor-pointer ${
                  isAutoRotateEnabled ? 'text-cyan-300 border-cyan-400' : 'text-[#EAECEF]/60'
                }`}
                title="Toggle continuous rotation"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isAutoRotateEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                <span>{isAutoRotateEnabled ? 'ROTATE: ON' : 'ROTATE: OFF'}</span>
              </button>

              <button
                onClick={() => setShowFireHeatmap(!showFireHeatmap)}
                style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-spacemono text-xs uppercase tracking-mono font-bold rounded border backdrop-blur-xl transition-all cursor-pointer ${
                  showFireHeatmap ? 'text-[#E65F2B] border-[#E65F2B]' : 'text-[#EAECEF]/60'
                }`}
              >
                {showFireHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>HEATMAP</span>
              </button>

              {/* Camera Presets */}
              <div
                style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
                className="flex items-center gap-1 p-1 rounded border font-spacemono text-xs font-bold"
              >
                <button
                  onClick={() => setCameraPreset('global')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    cameraPreset === 'global' ? 'bg-[#E65F2B] text-white' : 'text-[#EAECEF]/70 hover:bg-[#11141A]'
                  }`}
                >
                  GLOBAL
                </button>
                <button
                  onClick={() => setCameraPreset('region')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    cameraPreset === 'region' ? 'bg-[#E65F2B] text-white' : 'text-[#EAECEF]/70 hover:bg-[#11141A]'
                  }`}
                >
                  AOI
                </button>
                <button
                  onClick={() => setCameraPreset('polar')}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    cameraPreset === 'polar' ? 'bg-[#E65F2B] text-white' : 'text-[#EAECEF]/70 hover:bg-[#11141A]'
                  }`}
                >
                  POLAR
                </button>
                <button
                  onClick={() => setShowGraticule(!showGraticule)}
                  className={`px-2 py-1 rounded text-[10px] cursor-pointer ${
                    showGraticule ? 'text-cyan-400' : 'text-[#EAECEF]/40'
                  }`}
                >
                  GRID
                </button>
              </div>
            </div>

            {/* Floating Decade Selector Bottom Left */}
            <div
              style={{ backgroundColor: '#212C3D', borderColor: '#3D726D' }}
              className="absolute bottom-4 left-4 z-20 p-3 rounded-lg border shadow-lg font-spacemono text-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-mono text-[#3D726D] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-[#E65F2B]" />
                  <span>3D HEATMAP CLIMATE DECADE:</span>
                </span>
                <span className="text-[10px] font-bold text-[#E65F2B]">
                  {fireDecade === 'all' ? '26-YR CLIMATE' : fireDecade.toUpperCase()}
                </span>
              </div>

              <div className="flex gap-1.5">
                {(['2000s', '2010s', '2020s', 'all'] as FireDecade[]).map((dec) => (
                  <button
                    key={dec}
                    onClick={() => setFireDecade(dec)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-mono transition-all cursor-pointer ${
                      fireDecade === dec
                        ? 'bg-[#E65F2B] text-white shadow-sm'
                        : 'bg-[#11141A] text-[#EAECEF]/70 hover:text-white border border-[#3D726D]/30'
                    }`}
                  >
                    {dec === 'all' ? 'ALL-TIME' : dec}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. SCIENCE SPECS PIPELINE ARCHITECTURE MODAL */}
      <PipelineArchitectureModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </div>
  );
}
