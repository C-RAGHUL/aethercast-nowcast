import React, { useState, useEffect, useCallback } from 'react';
import { 
  ForecastPayload, 
  TimelineStep, 
  ScenarioOption, 
  PointNowcastResponse, 
  LayerVisibility 
} from './types/nowcast';
import { NowcastMap } from './components/Map/NowcastMap';
import { TimelinePlayer } from './components/Controls/TimelinePlayer';
import { LayerControls } from './components/Controls/LayerControls';
import { SearchBar } from './components/Controls/SearchBar';
import { NowcastSidebar } from './components/Panels/NowcastSidebar';
import { PointInspector } from './components/Panels/PointInspector';
import { ArchitectureModal } from './components/Modals/ArchitectureModal';
import { ModelMetricsModal } from './components/Modals/ModelMetricsModal';
import { 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Crosshair, 
  Map as MapIcon, 
  Globe 
} from 'lucide-react';

export const App: React.FC = () => {
  const [currentLeadTime, setCurrentLeadTime] = useState<number>(0);
  const [forecast, setForecast] = useState<ForecastPayload | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioOption[]>([]);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('india_realtime');

  // Overlays (Clean, uncluttered defaults)
  const [layers, setLayers] = useState<LayerVisibility>({
    riskZones: true,
    radarReflectivity: false,
    lightningStrikes: false,
    stormTracks: true,
    cities: false,
    liveRadar: true,
    imdRadars: false,
    liveStations: true,
  });

  // Basemap & View Controls
  const [basemapStyle, setBasemapStyle] = useState<'osm' | 'satellite'>('osm');
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);

  // Point Inspector (Floating Overlay)
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [pointData, setPointData] = useState<PointNowcastResponse | null>(null);
  const [isLoadingPoint, setIsLoadingPoint] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Modals & Panels (Floating Glass Drawers)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [liveStations, setLiveStations] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load scenarios, timeline, and live India stations on mount
  useEffect(() => {
    fetch('/api/nowcast/scenarios')
      .then((res) => res.json())
      .then((data: ScenarioOption[]) => {
        setScenarios(data);
        if (data.length > 0) setCurrentScenarioId(data[0].id);
      })
      .catch((err) => {
        console.error('Failed to load scenarios', err);
        setErrorMsg('Could not connect to backend server. Make sure the FastAPI backend is running on port 8000.');
      });

    fetch('/api/nowcast/timeline')
      .then((res) => res.json())
      .then((data: TimelineStep[]) => setTimelineSteps(data))
      .catch(console.error);

    fetch('/api/nowcast/india-stations')
      .then((res) => res.json())
      .then((data) => setLiveStations(data))
      .catch(console.error);
  }, []);

  // Fetch forecast whenever lead time or scenario changes
  const fetchForecast = useCallback((leadTime: number, scenarioId: string) => {
    setIsRefreshing(true);
    fetch(`/api/nowcast/forecast?lead_time=${leadTime}&scenario=${scenarioId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: ForecastPayload) => {
        setForecast(data);
        setErrorMsg(null);
      })
      .catch((err) => {
        console.error('Failed to fetch nowcast forecast', err);
      })
      .finally(() => setIsRefreshing(false));
  }, []);

  useEffect(() => {
    fetchForecast(currentLeadTime, currentScenarioId);
  }, [currentLeadTime, currentScenarioId, fetchForecast]);

  // Fetch point nowcast on-demand
  const fetchPointNowcast = useCallback((lat: number, lon: number) => {
    setIsLoadingPoint(true);
    setSelectedCoord({ lat, lon });
    setIsInspectorOpen(true);

    fetch(`/api/nowcast/point?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data: PointNowcastResponse) => setPointData(data))
      .catch(console.error)
      .finally(() => setIsLoadingPoint(false));
  }, []);

  const handleScenarioChange = (newScenarioId: string) => {
    setCurrentScenarioId(newScenarioId);
    setCurrentLeadTime(0);
    fetch(`/api/nowcast/timeline`)
      .then((res) => res.json())
      .then((data: TimelineStep[]) => setTimelineSteps(data))
      .catch(console.error);
    if (selectedCoord) {
      fetchPointNowcast(selectedCoord.lat, selectedCoord.lon);
    }
  };

  const toggleLayer = (layerKey: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const handleCleanView = () => {
    setLayers({
      riskZones: true,
      radarReflectivity: false,
      lightningStrikes: false,
      stormTracks: true,
      cities: false,
      liveRadar: true,
      imdRadars: false,
      liveStations: true,
    });
  };

  const activeStormsCount = liveStations.filter(
    (s) => s.impact_status === 'ACTIVE_NOW' || s.is_thunderstorm
  ).length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden select-none font-sans relative">
      {/* Top Banner Alert if Connection Fails */}
      {errorMsg && (
        <div className="bg-red-950/90 border-b border-red-800 text-red-300 text-xs px-4 py-2 flex items-center justify-between z-50 font-mono">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => fetchForecast(currentLeadTime, currentScenarioId)}
            className="hover:underline text-red-200"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Spacious, Sleek Navigation Header */}
      <header className="h-12 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/90 px-3 sm:px-4 flex items-center justify-between z-30 font-mono text-xs shadow-md gap-2 sm:gap-4">
        {/* Left Section: Logo & Panel Toggles */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span className="font-bold text-white tracking-wider flex items-center space-x-1.5">
              <span className="text-cyan-400">⚡</span>
              <span className="font-extrabold tracking-wide text-sm">AETHERCAST</span>
            </span>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 font-mono px-1.5 py-0.5 rounded border border-cyan-800 hidden md:inline">
              INDIA LIVE
            </span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer text-xs ${
              isSidebarOpen
                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title="Open Area ETAs & Storm Cells Panel"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">32 Areas & ETAs</span>
            <span className="sm:hidden">ETAs</span>
            {activeStormsCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {activeStormsCount}
              </span>
            )}
          </button>
        </div>

        {/* Center Section: Area Search Bar (Primary Navigation) */}
        <div className="flex-1 min-w-[220px] sm:min-w-[300px] md:min-w-[360px] max-w-lg mx-2 sm:mx-4">
          <SearchBar
            onSelectArea={(lat, lon) => fetchPointNowcast(lat, lon)}
            placeholder="Search area, suburb, or city in India..."
          />
        </div>

        {/* Right Section: Basemap (Map/Satellite), Recenter, Layers, Refresh */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* Basemap Switcher (Map, Satellite) */}
          <div className="flex bg-slate-950/90 border border-slate-800 p-0.5 rounded-lg items-center space-x-0.5 font-mono text-[11px] shadow-sm">
            <button
              onClick={() => setBasemapStyle('osm')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                basemapStyle === 'osm' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Standard Street Map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setBasemapStyle('satellite')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                basemapStyle === 'satellite' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="High-Resolution Satellite Imagery"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>
          </div>

          {/* Center India */}
          <button
            onClick={() => setRecenterTrigger((c) => c + 1)}
            className="flex bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 px-2 py-1.5 rounded-lg transition-colors items-center space-x-1 text-xs cursor-pointer"
            title="Recenter Map on India"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Center India</span>
          </button>

          {/* Layer Controls Dropdown */}
          <LayerControls
            layers={layers}
            onToggleLayer={toggleLayer}
            onCleanView={handleCleanView}
          />

          {/* Refresh Button */}
          <button
            onClick={() => fetchForecast(currentLeadTime, currentScenarioId)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors border border-slate-700 cursor-pointer"
            title="Refresh radar volume sweep"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Workspace (Full-Screen Edge-to-Edge Map Canvas) */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {/* Full-Screen Map (Zero Squeezing) */}
        <NowcastMap
          forecast={forecast}
          layers={layers}
          selectedCoord={selectedCoord}
          onSelectCoordinate={fetchPointNowcast}
          liveStations={liveStations}
          basemapStyle={basemapStyle}
          onSelectBasemap={setBasemapStyle}
          recenterTrigger={recenterTrigger}
          selectedPointData={pointData}
          currentLeadTime={currentLeadTime}
        />

        {/* Floating Left Sidebar (Area ETAs & Radar Cells) */}
        {isSidebarOpen && (
          <div className="absolute top-3 left-3 bottom-3 z-30 pointer-events-auto flex flex-col">
            <NowcastSidebar
              forecast={forecast}
              scenarios={scenarios}
              currentScenarioId={currentScenarioId}
              onSelectScenario={handleScenarioChange}
              onOpenArchitecture={() => setIsArchitectureOpen(true)}
              onOpenMetrics={() => setIsMetricsOpen(true)}
              onSelectCell={(cell) => {
                fetchPointNowcast(cell.current_lat, cell.current_lon);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              liveStations={liveStations}
              onSelectStation={(lat, lon) => {
                fetchPointNowcast(lat, lon);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              onClose={() => setIsSidebarOpen(false)}
              currentLeadTime={currentLeadTime}
            />
          </div>
        )}

        {/* Floating Right Point Inspector (Live Soundings & Arrival Countdown) */}
        {isInspectorOpen && (
          <div className="absolute top-3 right-3 bottom-3 z-30 pointer-events-auto flex flex-col">
            <PointInspector
              data={pointData}
              isLoading={isLoadingPoint}
              onClose={() => setIsInspectorOpen(false)}
              currentLeadTime={currentLeadTime}
              onSelectLeadTime={setCurrentLeadTime}
            />
          </div>
        )}

        {/* Floating Bottom Timeline Scrubber Player */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex justify-center w-full px-4">
          <div className="pointer-events-auto w-full max-w-2xl flex justify-center">
            <TimelinePlayer
              currentLeadTime={currentLeadTime}
              onLeadTimeChange={setCurrentLeadTime}
              timelineSteps={timelineSteps}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <ModelMetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
      />
    </div>
  );
};
