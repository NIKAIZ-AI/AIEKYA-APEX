/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Maximize2,
  Crosshair,
  MapPin,
  Compass,
  Filter,
  Eye,
  Info,
} from 'lucide-react';
import { FireRegion, SpatialFireHotspot, generateSpatialHotspots } from '../utils/fireHarmonization';

interface Interactive2DMapProps {
  region: FireRegion;
  regimeFilter: 'all' | 'wildfire' | 'anthropogenic';
  onUpdateAOICoords?: (coords: { latMin: number; latMax: number; lonMin: number; lonMax: number }) => void;
  timelineDate: string; // e.g. "2024-09"
  onChangeTimelineDate: (date: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenGlobe?: () => void;
}

export const Interactive2DMap: React.FC<Interactive2DMapProps> = ({
  region,
  regimeFilter,
  onUpdateAOICoords,
  timelineDate,
  onChangeTimelineDate,
  isPlaying,
  onTogglePlay,
  onOpenGlobe,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const aoiLayerRef = useRef<L.Rectangle | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite'>('dark');
  const [isDrawingAOI, setIsDrawingAOI] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState<SpatialFireHotspot | null>(null);

  // Generate spatial hotspots for active region and regime
  const [hotspots, setHotspots] = useState<SpatialFireHotspot[]>([]);

  useEffect(() => {
    // Dynamically generate hotspots based on region and regime
    const pts = generateSpatialHotspots(region, 150, regimeFilter);
    setHotspots(pts);
  }, [region, regimeFilter, timelineDate]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const centerLat = (region.latMin + region.latMax) / 2;
    const centerLon = (region.lonMin + region.lonMax) / 2;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLon],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    const darkTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
      }
    );

    const satTiles = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
      }
    );

    darkTiles.addTo(map);

    const layersGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layersGroup;

    // Invalidate map size after DOM mount
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    if (basemap === 'dark') {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      ).addTo(map);
    } else {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(map);
    }
  }, [basemap]);

  // Center and fit bounds when region changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds(
      [region.latMin, region.lonMin],
      [region.latMax, region.lonMax]
    );

    map.flyToBounds(bounds, {
      padding: [40, 40],
      duration: 1.2,
    });

    // Update AOI Bounding Box Overlay
    if (aoiLayerRef.current) {
      map.removeLayer(aoiLayerRef.current);
    }

    const aoiRect = L.rectangle(bounds, {
      color: '#06b6d4',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#0891b2',
      fillOpacity: 0.12,
    }).addTo(map);

    aoiLayerRef.current = aoiRect;
  }, [region]);

  // Render Hotspot Markers with Fire Density and Click Popups
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    hotspots.forEach((hs) => {
      // Color ramp based on FRP intensity (MW)
      let fillColor = '#fbbf24'; // yellow moderate
      let radius = 6;
      if (hs.frp > 100) {
        fillColor = '#ef4444'; // intense red
        radius = 11;
      } else if (hs.frp > 50) {
        fillColor = '#f97316'; // glowing orange
        radius = 8;
      }

      const marker = L.circleMarker([hs.lat, hs.lon], {
        radius,
        fillColor,
        color: '#ffffff',
        weight: 1.2,
        opacity: 0.9,
        fillOpacity: 0.85,
      });

      // Hover / Click Details Pop-up
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 11px; color: #0f172a; min-width: 200px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
            <strong style="color: ${fillColor}; font-size: 12px; font-weight: 700;">
              🔥 ${hs.regime === 'wildfire' ? 'Wildfire Detection' : 'Anthropogenic Fire'}
            </strong>
            <span style="font-size: 9px; padding: 2px 4px; border-radius: 4px; background: #e2e8f0; font-family: monospace;">
              ${hs.sensor}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; margin-bottom: 6px;">
            <div><strong>FRP:</strong> ${hs.frp} MW</div>
            <div><strong>Temp:</strong> ${hs.brightnessTempK} K</div>
            <div><strong>Confidence:</strong> ${hs.confidence}%</div>
            <div><strong>Lat/Lon:</strong> ${hs.lat.toFixed(2)}°, ${hs.lon.toFixed(2)}°</div>
          </div>
          <div style="font-size: 9px; color: #64748b; background: #f8fafc; padding: 4px; border-radius: 4px;">
            <strong>Land Cover:</strong> ${hs.landCover}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-fire-popup',
      });

      marker.on('mouseover', () => setHoveredHotspot(hs));
      marker.on('mouseout', () => setHoveredHotspot(null));

      layerGroup.addLayer(marker);
    });
  }, [hotspots]);

  // Convert timeline month-year slider value
  const years = Array.from({ length: 27 }, (_, i) => 2000 + i);
  const [timelineYear, timelineMonth] = timelineDate.split('-').map(Number);
  const currentStep = (timelineYear - 2000) * 12 + (timelineMonth - 1);
  const maxSteps = 26 * 12 + 9; // up to Oct 2026

  const handleStepChange = (val: number) => {
    const y = 2000 + Math.floor(val / 12);
    const m = (val % 12) + 1;
    onChangeTimelineDate(`${y}-${String(m).padStart(2, '0')}`);
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-blue-900/40 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.7)] flex flex-col bg-gradient-to-br from-[#060b14] via-[#0b1322] to-[#101b30] select-none">
      {/* 1. TOP FLOATING MAP CONTROL STRIP */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Basemap Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-lg text-xs font-bold text-slate-300">
            <button
              onClick={() => setBasemap('dark')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                basemap === 'dark'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white hover:bg-slate-800'
              }`}
            >
              Dark Base
            </button>
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                basemap === 'satellite'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'hover:text-white hover:bg-slate-800'
              }`}
            >
              Satellite Imagery
            </button>
          </div>

          {/* Region Indicator Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-lg text-xs">
            <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span className="font-bold text-white truncate max-w-[200px]">{region.name}</span>
            <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">
              {region.latMin}° to {region.latMax}°, {region.lonMin}° to {region.lonMax}°
            </span>
          </div>

          {/* Hotspot Count Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-lg text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-slate-300 hidden md:inline">Hotspots:</span>
            <span className="font-bold text-orange-400">{hotspots.length}</span>
          </div>
        </div>

        {/* 2. TOP RIGHT LAUNCH 3D GLOBE SHORTCUT */}
        {onOpenGlobe && (
          <button
            onClick={onOpenGlobe}
            className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_4px_16px_rgba(37,99,235,0.4)] border border-cyan-400/50 backdrop-blur-xl active:scale-95 transition-all cursor-pointer"
            title="Switch to full photorealistic 3D Earth Globe"
          >
            <Compass className="w-4 h-4 text-cyan-200" />
            <span>Launch 3D Earth</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-400/25 text-cyan-100">
              3D
            </span>
          </button>
        )}
      </div>

      {/* 3. LEAFLET MAP VIEWPORT */}
      <div ref={mapContainerRef} className="w-full flex-1 z-10" />

      {/* 4. BOTTOM FLOATING TIMELINE PLAYBACK SCRUBBER */}
      <div className="absolute bottom-4 left-4 right-4 z-20 p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Playback' : 'Play Timeline'}</span>
            </button>

            <button
              onClick={() => onChangeTimelineDate('2000-01')}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset to 2000"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Timeline Period:</span>
              <span className="font-mono font-bold text-cyan-400 text-sm bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {timelineDate}
              </span>
            </div>
          </div>

          {/* Color Ramp Legend */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
            <span className="text-slate-400">Radiative Power (FRP):</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span>&lt; 50 MW</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>50 - 100 MW</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>&gt; 100 MW (Intense)</span>
            </div>
          </div>
        </div>

        {/* Scrubber Range Slider */}
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={maxSteps}
            value={currentStep}
            onChange={(e) => handleStepChange(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Timeline Decade Milestone Labels */}
        <div className="flex justify-between text-[10px] font-mono text-slate-400 px-1">
          <span>2000 (MODIS Launch)</span>
          <span>2006</span>
          <span>2012 (VIIRS Suomi-NPP)</span>
          <span>2018 (NOAA-20)</span>
          <span>2024 (Record Amazon Season)</span>
          <span>2026 (Current)</span>
        </div>
      </div>
    </div>
  );
};
