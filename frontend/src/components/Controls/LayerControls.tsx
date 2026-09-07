import React, { useState, useRef, useEffect } from 'react';
import { Layers, ShieldAlert, Radio, Zap, Navigation, MapPin, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { LayerVisibility } from '../../types/nowcast';

interface LayerControlsProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onCleanView?: () => void;
}

export const LayerControls: React.FC<LayerControlsProps> = ({ layers, onToggleLayer, onCleanView }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <div ref={containerRef} className="relative font-mono text-xs z-40 select-none">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`backdrop-blur-md border px-2.5 sm:px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-1.5 sm:space-x-2 transition-all cursor-pointer ${
          isExpanded
            ? 'bg-cyan-950 border-cyan-500 text-cyan-200'
            : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
        }`}
        title="Toggle Overlay Layers Panel"
      >
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-[11px]">Layers</span>
        <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {activeCount}
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {/* Expanded Floating Dropdown (Anchored to Right Edge of Screen) */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 rounded-xl p-2.5 shadow-2xl w-64 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-800">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Display Overlays</span>
            {onCleanView && (
              <button
                onClick={onCleanView}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80 cursor-pointer"
                title="Quick preset: Show only live radar and active storms"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>Clean Map</span>
              </button>
            )}
          </div>

          {/* Live Real-Time Radar Mosaic */}
          <button
            onClick={() => onToggleLayer('liveRadar')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.liveRadar ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="flex items-center space-x-1.5">
                <span>Live Doppler Radar</span>
                <span className="text-[9px] bg-cyan-900 text-cyan-300 px-1 rounded uppercase font-bold">Live</span>
              </span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.liveRadar ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-600'}`} />
          </button>

          {/* Live Indian Stations */}
          <button
            onClick={() => onToggleLayer('liveStations')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.liveStations ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-800' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>32 India Live Stations</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.liveStations ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-600'}`} />
          </button>

          {/* Risk Zones */}
          <button
            onClick={() => onToggleLayer('riskZones')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.riskZones ? 'bg-slate-800 text-amber-300 font-medium' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>AI Hazard Zones (L/M/H)</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.riskZones ? 'bg-amber-400' : 'bg-slate-600'}`} />
          </button>

          {/* Storm Cell Tracks */}
          <button
            onClick={() => onToggleLayer('stormTracks')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.stormTracks ? 'bg-slate-800 text-rose-300 font-medium' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Navigation className="w-3.5 h-3.5 text-rose-400" />
              <span>Storm Motion Vectors</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.stormTracks ? 'bg-rose-400' : 'bg-slate-600'}`} />
          </button>

          {/* Lightning Strikes */}
          <button
            onClick={() => onToggleLayer('lightningStrikes')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.lightningStrikes ? 'bg-slate-800 text-blue-300 font-medium' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Lightning Flashes</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.lightningStrikes ? 'bg-blue-400' : 'bg-slate-600'}`} />
          </button>

          {/* IMD Radar Network */}
          <button
            onClick={() => onToggleLayer('imdRadars')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.imdRadars ? 'bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>IMD DWR Network</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.imdRadars ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-600'}`} />
          </button>

          {/* Radar Reflectivity Contours */}
          <button
            onClick={() => onToggleLayer('radarReflectivity')}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left ${
              layers.radarReflectivity ? 'bg-slate-800 text-green-300 font-medium' : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-green-400" />
              <span>Reflectivity Contours</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${layers.radarReflectivity ? 'bg-green-400' : 'bg-slate-600'}`} />
          </button>
        </div>
      )}
    </div>
  );
};
