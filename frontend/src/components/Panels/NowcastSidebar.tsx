import React, { useState } from 'react';
import { X } from 'lucide-react';
import { 
  CloudLightning, 
  Activity, 
  Gauge, 
  Wind, 
  Layers, 
  Cpu, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Clock,
  Zap,
  AlertTriangle,
  MapPin,
  Thermometer,
  Droplets,
  Search
} from 'lucide-react';
import { ForecastPayload, ScenarioOption, StormCell, LiveStation } from '../../types/nowcast';

interface NowcastSidebarProps {
  forecast: ForecastPayload | null;
  scenarios: ScenarioOption[];
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  onOpenArchitecture: () => void;
  onOpenMetrics: () => void;
  onSelectCell?: (cell: StormCell) => void;
  liveStations?: LiveStation[];
  onSelectStation?: (lat: number, lon: number) => void;
  onClose?: () => void;
  currentLeadTime?: number;
}

export const NowcastSidebar: React.FC<NowcastSidebarProps> = ({
  forecast,
  scenarios,
  currentScenarioId,
  onSelectScenario,
  onOpenArchitecture,
  onOpenMetrics,
  onSelectCell,
  liveStations = [],
  onSelectStation,
  onClose,
  currentLeadTime = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'areas' | 'cells'>('areas');
  const [areaFilter, setAreaFilter] = useState<'all' | 'active' | 'high_cape'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'intensifying':
      case 'initiating':
        return <TrendingUp className="w-3.5 h-3.5 text-rose-400" />;
      case 'weakening':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Minus className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'extreme':
        return 'bg-purple-950/80 text-purple-300 border-purple-500/60';
      case 'severe':
        return 'bg-red-950/80 text-red-300 border-red-500/60';
      case 'moderate':
        return 'bg-orange-950/80 text-orange-300 border-orange-500/60';
      default:
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-500/60';
    }
  };

  // Count active storms across stations
  const activeCount = liveStations.filter(s => s.impact_status === 'ACTIVE_NOW' || s.is_thunderstorm).length;
  const approachingCount = liveStations.filter(s => s.impact_status === 'APPROACHING').length;

  // Filter stations based on tab filters and search
  const filteredStations = liveStations.filter(st => {
    const matchesSearch = st.city.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          st.state.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (areaFilter === 'active') {
      return st.impact_status === 'ACTIVE_NOW' || st.impact_status === 'APPROACHING' || st.is_thunderstorm;
    }
    if (areaFilter === 'high_cape') {
      return st.cape_jkg >= 2000 || st.is_high_cape;
    }
    return true;
  });

  return (
    <div className="w-80 md:w-96 h-full max-h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl flex flex-col z-30 select-none shadow-2xl overflow-hidden animate-in slide-in-from-left duration-200 min-h-0">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg shadow-md shadow-cyan-900/40">
              <CloudLightning className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-wide text-white">AetherCast</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-400 font-mono px-1 py-0.2 rounded border border-cyan-800">
                  INDIA LIVE
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>IMD DWR 100% Real-Time</span>
              </div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scenario Selector */}
      <div className="px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/30 flex items-center space-x-2 flex-shrink-0">
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex-shrink-0">
          Scenario
        </label>
        <select
          value={currentScenarioId}
          onChange={(e) => onSelectScenario(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer truncate"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Telemetry Metrics Cards */}
      <div className="px-3 py-1.5 border-b border-slate-800/80 grid grid-cols-4 gap-1 font-mono flex-shrink-0">
        <div className="bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-center">
          <div className="text-[8px] text-slate-400 uppercase">Echo Max</div>
          <div className="text-[11px] font-bold text-red-400">{forecast?.domain_max_dbz ?? '--'} dBZ</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-center">
          <div className="text-[8px] text-slate-400 uppercase">Lightning</div>
          <div className="text-[11px] font-bold text-blue-400">{forecast?.domain_flash_rate ?? '--'}/m</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-center">
          <div className="text-[8px] text-slate-400 uppercase">Cells</div>
          <div className="text-[11px] font-bold text-amber-400">{forecast?.cells.length ?? 0}</div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded px-1 py-0.5 text-center">
          <div className="text-[8px] text-slate-400 uppercase">Confidence</div>
          <div className="text-[11px] font-bold text-cyan-400">{forecast?.model_confidence_pct ?? 92}%</div>
        </div>
      </div>

      {/* Tab Switcher: Area Arrival Times vs Tracked Cells */}
      <div className="p-1.5 border-b border-slate-800 bg-slate-950/50 flex space-x-1 text-xs font-mono flex-shrink-0">
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'areas'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Area ETAs ({liveStations.length || 32})</span>
          {activeCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-1 py-0.2 rounded-full font-bold animate-pulse">
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cells')}
          className={`flex-1 py-1.5 px-2 rounded-md flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'cells'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Radar Cells ({forecast?.cells.length || 0})</span>
        </button>
      </div>

      {/* Main Content Body */}
      {activeTab === 'areas' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Sub-header with search and filter */}
          <div className="p-2 border-b border-slate-800/60 bg-slate-950/20 space-y-1.5 flex-shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search area (e.g. Kolkata, Patna, Delhi)..."
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center space-x-1 text-[10px] font-mono">
              <button
                onClick={() => setAreaFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  areaFilter === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800/40'
                }`}
              >
                All ({liveStations.length})
              </button>
              <button
                onClick={() => setAreaFilter('active')}
                className={`px-2 py-0.5 rounded transition-colors flex items-center space-x-1 cursor-pointer ${
                  areaFilter === 'active'
                    ? 'bg-red-900/80 text-red-200 border border-red-500/80 font-bold'
                    : 'text-slate-400 hover:text-red-300 bg-slate-800/40'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                <span>Active/ETA ({activeCount + approachingCount})</span>
              </button>
              <button
                onClick={() => setAreaFilter('high_cape')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  areaFilter === 'high_cape'
                    ? 'bg-amber-900/80 text-amber-200 border border-amber-600/80 font-bold'
                    : 'text-slate-400 hover:text-amber-300 bg-slate-800/40'
                }`}
              >
                High CAPE
              </button>
            </div>
          </div>

          {/* List of Indian Areas with Exact Arrival Times & Real Data */}
          <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2">
            {filteredStations.length === 0 && (
              <div className="p-6 text-center text-slate-400 font-mono text-xs">
                <p>No areas match current filter.</p>
                <button
                  onClick={() => { setAreaFilter('all'); setSearchQuery(''); }}
                  className="mt-2 text-cyan-400 underline text-[11px] cursor-pointer"
                >
                  Show all areas
                </button>
              </div>
            )}
            {filteredStations.map((st) => {
              const hasEta = typeof st.eta_minutes === 'number';
              const remainingEta = hasEta && st.eta_minutes !== undefined && st.eta_minutes !== null
                ? (st.eta_minutes - currentLeadTime)
                : null;
              
              const isSubActive = currentLeadTime > 0;
              const isOverhead = isSubActive
                ? (remainingEta !== null && remainingEta <= 0 && remainingEta >= -35)
                : (st.impact_status === 'ACTIVE_NOW' || st.is_thunderstorm);
              const isApproaching = isSubActive
                ? (remainingEta !== null && remainingEta > 0 && remainingEta <= 120)
                : (st.impact_status === 'APPROACHING');
              const isPassed = isSubActive && remainingEta !== null && remainingEta < -35;
              const isWatch = !isOverhead && !isApproaching && !isPassed && (st.impact_status === 'HIGH_INSTABILITY' || st.is_high_cape);

              return (
                <div
                  key={st.city}
                  onClick={() => onSelectStation && onSelectStation(st.lat, st.lon)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                    isOverhead
                      ? 'bg-red-950/60 hover:bg-red-950/80 border-red-500/80 text-red-100 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
                      : isApproaching
                      ? 'bg-orange-950/50 hover:bg-orange-950/70 border-orange-500/80 text-orange-100'
                      : isWatch
                      ? 'bg-amber-950/30 hover:bg-amber-950/50 border-amber-700/60 text-amber-100'
                      : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                  title="Click to inspect point nowcast & sounding"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className={`w-3.5 h-3.5 ${isOverhead ? 'text-red-400' : 'text-slate-400'}`} />
                      <span className="font-bold text-xs text-white">{st.city}</span>
                      <span className="text-[10px] text-slate-400">({st.state})</span>
                    </div>
                    <div className="text-xs font-bold text-white">
                      {st.temperature_c}°C
                    </div>
                  </div>

                  {/* Storm Arrival Time ETA Badge */}
                  <div className="mt-1.5">
                    {isOverhead ? (
                      <div className="bg-red-900/80 border border-red-500 text-red-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center justify-between animate-pulse">
                        <span className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-red-300" />
                          <span>{isSubActive ? `ACTIVE AT T+${currentLeadTime}m` : 'ACTIVE OVERHEAD NOW'}</span>
                        </span>
                        <span className="text-white">{st.eta_time_ist || 'Now'}</span>
                      </div>
                    ) : isApproaching ? (
                      <div className="bg-orange-900/80 border border-orange-500 text-orange-200 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-orange-300" />
                          <span>STORM ETA: {st.eta_time_ist}</span>
                        </span>
                        <span className="text-white font-bold">
                          {isSubActive ? `in ${remainingEta} min` : st.eta_countdown_str}
                        </span>
                      </div>
                    ) : isPassed ? (
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-1">
                        <span>Status: Storm Passed</span>
                        <span className="text-slate-500">Ahead of T+{currentLeadTime}m</span>
                      </div>
                    ) : isWatch ? (
                      <div className="bg-amber-950/70 border border-amber-600/70 text-amber-200 px-2 py-0.5 rounded text-[10px] font-mono flex items-center justify-between">
                        <span className="flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>CONVECTIVE WATCH</span>
                        </span>
                        <span className="text-amber-300 font-bold">CAPE {st.cape_jkg} J/kg</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between px-1">
                        <span>Status: Clear</span>
                        <span className="text-emerald-400">No Storm at T+{currentLeadTime}m</span>
                      </div>
                    )}
                  </div>

                  {/* Live Weather Condition & Sounding Micro-Stats */}
                  <div className="mt-1.5 pt-1 border-t border-slate-800/80 grid grid-cols-3 gap-1 font-mono text-[9px] text-slate-400">
                    <div>
                      <span>Rain: </span>
                      <span className={st.precipitation_mm > 0 ? 'text-cyan-300 font-bold' : 'text-slate-300'}>
                        {st.precipitation_mm}mm
                      </span>
                    </div>
                    <div>
                      <span>Wind: </span>
                      <span className="text-slate-300">{st.wind_kmh}km/h</span>
                    </div>
                    <div>
                      <span>RH: </span>
                      <span className="text-slate-300">{st.relative_humidity}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Radar Storm Cells List */
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Tracked Convective Cells
            </span>
            <span className="text-[10px] font-mono text-cyan-400">
              Lagrangian Advection
            </span>
          </div>

          {forecast?.cells.map((cell) => (
            <div
              key={cell.id}
              onClick={() => onSelectCell && onSelectCell(cell)}
              className="p-2.5 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 hover:border-cyan-700/70 rounded-lg transition-all space-y-1.5 cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-mono font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">
                    {cell.id}
                  </span>
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${getSeverityBadge(cell.severity)}`}>
                    {cell.severity}
                  </span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                  {getTrendIcon(cell.trend)}
                  <span className="capitalize">{cell.trend}</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-medium truncate">
                {cell.name}
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                <div>
                  <span>Motion: </span>
                  <span className="text-slate-200 font-bold">{cell.speed_kt}kt</span>
                </div>
                <div>
                  <span>Core: </span>
                  <span className="text-red-400 font-bold">{cell.max_dbz} dBZ</span>
                </div>
                <div>
                  <span>Lightning: </span>
                  <span className="text-blue-400 font-bold">{cell.flash_rate_min}/m</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="p-2 border-t border-slate-800/80 bg-slate-950/80 flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={onOpenMetrics}
          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700/70 transition-colors cursor-pointer"
          title="AI Model & CSI Metrics"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="truncate">AI Metrics</span>
        </button>

        <button
          onClick={onOpenArchitecture}
          className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-xs font-mono border border-cyan-800/70 transition-colors cursor-pointer"
          title="API & Sensor Architecture"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="truncate">Architecture</span>
        </button>
      </div>
    </div>
  );
};
