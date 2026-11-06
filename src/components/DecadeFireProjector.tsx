import React from 'react';
import { Flame, Eye, EyeOff, Sparkles, Navigation } from 'lucide-react';
import { FireDecade, DECADE_METADATA, GLOBAL_FIRE_CLUSTERS } from '../utils/decadeFireHeatmap';

interface DecadeFireProjectorProps {
  selectedDecade: FireDecade;
  onSelectDecade: (decade: FireDecade) => void;
  showHeatmapOnGlobe: boolean;
  onToggleHeatmapOnGlobe: (show: boolean) => void;
  onFocusCluster?: (lat: number, lon: number, name: string) => void;
}

export const DecadeFireProjector: React.FC<DecadeFireProjectorProps> = ({
  selectedDecade,
  onSelectDecade,
  showHeatmapOnGlobe,
  onToggleHeatmapOnGlobe,
  onFocusCluster,
}) => {
  const meta = DECADE_METADATA[selectedDecade];
  const decades: { id: FireDecade; label: string }[] = [
    { id: '2000s', label: '2000s' },
    { id: '2010s', label: '2010s' },
    { id: '2020s', label: '2020s' },
    { id: 'all', label: 'All-Time' },
  ];

  return (
    <div className="bg-[#faf7f2]/95 border border-[#e6ded5] rounded-2xl p-4 shadow-[0_12px_28px_-6px_rgba(180,160,135,0.22),inset_0_1.5px_0_rgba(255,255,255,0.95)] space-y-3.5">
      {/* Header with 3D Inflated Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block font-display">
              Decade Fire Evolution
            </span>
            <span className="text-[10px] text-stone-500">
              Smooth 3D Globe Projection
            </span>
          </div>
        </div>

        {/* 3D Inflated Heatmap Visibility Toggle */}
        <button
          onClick={() => onToggleHeatmapOnGlobe(!showHeatmapOnGlobe)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 active:scale-95 ${
            showHeatmapOnGlobe
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-[0_4px_12px_rgba(249,115,22,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]'
              : 'bg-[#ede5da] text-stone-600 border-[#d9cebf] hover:bg-[#e4dacd] shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]'
          }`}
          title="Smoothly fade fire heatmap ON or OFF on the 3D globe"
        >
          {showHeatmapOnGlobe ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          <span>{showHeatmapOnGlobe ? 'Heatmap ON' : 'Heatmap OFF'}</span>
        </button>
      </div>

      {/* 3D Inflated Decade Switcher Pills */}
      <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#ede4d8]/80 border border-[#ded3c3] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
        {decades.map(({ id, label }) => {
          const isSelected = selectedDecade === id;
          return (
            <button
              key={id}
              onClick={() => onSelectDecade(id)}
              className={`py-2 px-1 text-xs font-bold rounded-lg transition-all duration-200 text-center ${
                isSelected
                  ? 'bg-white text-stone-900 border border-[#e0d6c7] shadow-[0_4px_12px_rgba(180,160,135,0.35),inset_0_1px_0_rgba(255,255,255,1)] transform scale-[1.02]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Decade Telemetry Summary Card */}
      <div className="p-3 bg-white/80 border border-[#e8dfd2] rounded-xl space-y-2 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-stone-900">{meta.label}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {meta.periodYears}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200/80">
          <div>
            <span className="text-[10px] text-stone-500 block">Activity Severity:</span>
            <span className="text-emerald-700 font-bold text-sm">
              {meta.globalAverageIndex}{' '}
              <span className="text-[10px] text-stone-400 font-normal">/ 100</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block">Dominant Epicenter:</span>
            <span className="text-royal-blue font-bold text-[11px] text-blue-700 truncate block">
              {meta.dominantEpicenter}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-stone-600 leading-snug pt-0.5">
          {meta.trendDescription}
        </p>
      </div>

      {/* Epicenter Quick-Focus Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
          Quick-Focus Regional Epicenters:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {GLOBAL_FIRE_CLUSTERS.slice(0, 5).map((cluster) => {
            const intensity = cluster.intensity[selectedDecade];
            const isHigh = intensity >= 0.85;
            return (
              <button
                key={cluster.id}
                onClick={() => {
                  if (onFocusCluster) {
                    onFocusCluster(cluster.lat, cluster.lon, cluster.name);
                  }
                }}
                className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-[#f0e8dc] border border-[#ded4c5] hover:bg-white hover:border-amber-400 text-stone-700 hover:text-stone-900 transition-all duration-150 flex items-center gap-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.03)] active:scale-95"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isHigh ? 'bg-orange-500 animate-pulse' : 'bg-emerald-600'
                  }`}
                />
                <span>{cluster.name.split(' (')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
