import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { ForecastPayload, LayerVisibility, StormCell, LiveStation, ImdRadarStation, PointNowcastResponse } from '../../types/nowcast';
import { Crosshair, Map, Globe, Moon, Radio, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface NowcastMapProps {
  forecast: ForecastPayload | null;
  layers: LayerVisibility;
  selectedCoord: { lat: number; lon: number } | null;
  onSelectCoordinate: (lat: number, lon: number) => void;
  onSelectCell?: (cell: StormCell) => void;
  liveStations?: LiveStation[];
  basemapStyle?: 'osm' | 'satellite';
  onSelectBasemap?: (style: 'osm' | 'satellite') => void;
  recenterTrigger?: number;
  selectedPointData?: PointNowcastResponse | null;
  currentLeadTime?: number;
}

export const NowcastMap: React.FC<NowcastMapProps> = ({
  forecast,
  layers,
  selectedCoord,
  onSelectCoordinate,
  liveStations = [],
  basemapStyle = 'osm',
  onSelectBasemap,
  recenterTrigger,
  selectedPointData,
  currentLeadTime = 0,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(5);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(false);
  const [liveRadarInfo, setLiveRadarInfo] = useState<{
    urlTemplate: string;
    updatedIst: string;
    imdStations: ImdRadarStation[];
  } | null>(null);

  // Layer groups with strict visual depth
  const baseTileGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const imdHoverRingGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const liveRadarGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const riskLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const radarLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const lightningLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const stormTrackLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const liveStationsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const imdStationsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const pinLayerGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Fetch Live Real-Time Radar feed & IMD stations for India
  useEffect(() => {
    fetch('/api/nowcast/live-radar')
      .then((res) => res.json())
      .then((data) => {
        if (data.tile_url_template) {
          setLiveRadarInfo({
            urlTemplate: data.tile_url_template,
            updatedIst: data.last_updated_ist || 'Live Real-Time',
            imdStations: data.imd_dwr_stations || []
          });
        }
      })
      .catch(console.error);
  }, []);

  // Initialize Leaflet Map centered on India
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [22.0, 81.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 14,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Track zoom for decluttering
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    // Add layer groups in order of depth:
    baseTileGroupRef.current.addTo(map);
    imdHoverRingGroupRef.current.addTo(map);
    liveRadarGroupRef.current.addTo(map);
    riskLayerGroupRef.current.addTo(map);
    radarLayerGroupRef.current.addTo(map);
    stormTrackLayerGroupRef.current.addTo(map);
    lightningLayerGroupRef.current.addTo(map);
    imdStationsGroupRef.current.addTo(map);
    liveStationsGroupRef.current.addTo(map);
    pinLayerGroupRef.current.addTo(map);

    // Click handler for point nowcast anywhere in India
    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Math.round(e.latlng.lat * 1000) / 1000;
      const lon = Math.round(e.latlng.lng * 1000) / 1000;
      onSelectCoordinate(lat, lon);
    });

    mapInstanceRef.current = map;

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    const resizeObserver = new ResizeObserver(() => {
      invalidate();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Layer (Map / Satellite)
  useEffect(() => {
    const tileGroup = baseTileGroupRef.current;
    tileGroup.clearLayers();

    if (basemapStyle === 'satellite') {
      const esriSat = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Tiles &copy; Esri', maxZoom: 18 }
      );
      esriSat.addTo(tileGroup);
    } else {
      const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });
      osm.addTo(tileGroup);
    }
  }, [basemapStyle]);

  // Update Live Real-Time Doppler Radar Tile Layer
  useEffect(() => {
    const group = liveRadarGroupRef.current;
    group.clearLayers();

    if (layers.liveRadar && liveRadarInfo?.urlTemplate) {
      const liveTile = L.tileLayer(liveRadarInfo.urlTemplate, {
        opacity: 0.85,
        maxNativeZoom: 7,
        maxZoom: 18,
        zIndex: 5
      });
      liveTile.addTo(group);
    }
  }, [layers.liveRadar, liveRadarInfo]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.0, 81.5], 5, { animate: true });
    }
  };

  useEffect(() => {
    if (recenterTrigger && mapInstanceRef.current) {
      mapInstanceRef.current.setView([22.0, 81.5], 5, { animate: true });
    }
  }, [recenterTrigger]);

  // Render Decluttered Live Indian Stations with Real Arrival Times (Zoom-Aware)
  useEffect(() => {
    const group = liveStationsGroupRef.current;
    group.clearLayers();
    if (!layers.liveStations || !liveStations || liveStations.length === 0) return;

    const isZoomed = currentZoom >= 7;

    liveStations.forEach((st) => {
      const isOverhead = st.impact_status === 'ACTIVE_NOW' || st.is_thunderstorm;
      const isApproaching = st.impact_status === 'APPROACHING';
      const isHighCape = st.is_high_cape || (st.cape_jkg || 0) >= 2000;
      const isRain = st.is_rain || (st.precipitation_mm || 0) > 0;

      let htmlContent = '';
      let iconW = 12;
      let iconH = 12;
      let anchorX = 6;
      let anchorY = 6;

      if (isOverhead) {
        // Active thunderstorms get prominent pulsing warning pill
        htmlContent = `
          <div class="flex items-center space-x-1 bg-red-950/95 text-red-200 border border-red-500 px-2 py-0.5 rounded-full shadow-[0_0_14px_rgba(239,68,68,0.9)] font-mono text-[10px] font-bold select-none cursor-pointer hover:scale-110 transition-transform animate-pulse">
            <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>⚡ ${st.city}</span>
            <span class="text-white">${st.temperature_c}°</span>
          </div>
        `;
        iconW = 115;
        iconH = 22;
        anchorX = 57;
        anchorY = 11;
      } else if (isApproaching) {
        // Approaching storm gets orange warning pill with ETA clock time
        htmlContent = `
          <div class="flex items-center space-x-1 bg-orange-950/95 text-orange-200 border border-orange-500 px-2 py-0.5 rounded-full shadow-[0_0_12px_rgba(249,115,22,0.8)] font-mono text-[10px] font-bold select-none cursor-pointer hover:scale-110 transition-transform">
            <span class="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span>⚠️ ${st.city}</span>
            <span class="text-amber-200">${st.eta_time_ist || 'ETA'}</span>
          </div>
        `;
        iconW = 125;
        iconH = 22;
        anchorX = 62;
        anchorY = 11;
      } else if (isZoomed) {
        // When zoomed in, show clean micro-pills
        let dotBg = isHighCape ? 'bg-amber-400' : isRain ? 'bg-blue-400' : 'bg-emerald-400';
        htmlContent = `
          <div class="flex items-center space-x-1 bg-slate-900/90 text-slate-200 border border-slate-700/80 px-1.5 py-0.5 rounded shadow font-mono text-[9px] select-none cursor-pointer hover:scale-105 transition-transform">
            <span class="w-1.5 h-1.5 rounded-full ${dotBg}"></span>
            <span class="font-bold">${st.city}</span>
            <span class="text-slate-400">${st.temperature_c}°</span>
          </div>
        `;
        iconW = 85;
        iconH = 18;
        anchorX = 42;
        anchorY = 9;
      } else {
        // At country zoom (Zoom 4-6): Minimal clean glowing micro-dot
        let dotColor = isHighCape
          ? 'bg-amber-400 ring-2 ring-amber-500/40 shadow-[0_0_6px_#f59e0b]'
          : isRain
          ? 'bg-sky-400 ring-2 ring-sky-500/40 shadow-[0_0_6px_#38bdf8]'
          : 'bg-emerald-400/80 hover:bg-emerald-400 shadow-[0_0_4px_#34d399]';

        htmlContent = `
          <div class="w-2.5 h-2.5 rounded-full ${dotColor} cursor-pointer hover:scale-150 transition-transform select-none"></div>
        `;
        iconW = 10;
        iconH = 10;
        anchorX = 5;
        anchorY = 5;
      }

      const icon = L.divIcon({
        className: 'custom-clean-station',
        html: htmlContent,
        iconSize: [iconW, iconH],
        iconAnchor: [anchorX, anchorY]
      });

      const marker = L.marker([st.lat, st.lon], { icon });

      // Build Rich ETA Banner for Tooltip
      let etaHtml = '';
      if (isOverhead) {
        etaHtml = `
          <div class="bg-red-950/90 border border-red-500/80 text-red-200 px-2 py-0.5 rounded text-[10px] font-bold">
            ⚡ ACTIVE OVERHEAD NOW (${st.eta_time_ist || 'Active'})
          </div>
        `;
      } else if (isApproaching) {
        etaHtml = `
          <div class="bg-orange-950/90 border border-orange-500/80 text-orange-200 px-2 py-0.5 rounded text-[10px] font-bold">
            ⚠️ STORM ARRIVAL ETA: ${st.eta_time_ist} (${st.eta_countdown_str})
          </div>
        `;
      } else if (isHighCape) {
        etaHtml = `
          <div class="bg-amber-950/80 border border-amber-600/80 text-amber-200 px-2 py-0.5 rounded text-[10px]">
            ⚡ Convective Watch (High CAPE: ${st.cape_jkg} J/kg)
          </div>
        `;
      } else {
        etaHtml = `
          <div class="text-slate-400 text-[10px]">✓ Clear • No storm in 120m corridor</div>
        `;
      }

      marker.bindTooltip(`
        <div class="p-2.5 font-mono text-xs space-y-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl min-w-[210px]">
          <div class="flex items-center justify-between border-b border-slate-800 pb-1">
            <span class="font-bold text-white text-sm">${st.city}, ${st.state}</span>
            <span class="text-[10px] text-emerald-400 uppercase font-semibold">● Live Obs</span>
          </div>
          <div class="text-[11px] text-slate-300 font-semibold">${st.condition}</div>
          
          ${etaHtml}

          <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] pt-1 text-slate-400 border-t border-slate-800/80">
            <div>Temp: <span class="text-white font-bold">${st.temperature_c}°C</span></div>
            <div>Humidity: <span class="text-white">${st.relative_humidity}%</span></div>
            <div>CAPE: <span class="${isHighCape ? 'text-amber-300 font-bold' : 'text-slate-300'}">${st.cape_jkg} J/kg</span></div>
            <div>Lifted Index: <span class="text-white">${st.lifted_index}</span></div>
            <div>Rain: <span class="text-cyan-300">${st.precipitation_mm} mm</span></div>
            <div>Wind: <span class="text-slate-300">${st.wind_kmh} km/h</span></div>
          </div>
          <div class="text-[9px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between">
            <span>${st.observed_at_ist}</span>
            <span class="text-cyan-400 font-bold">Click to Inspect</span>
          </div>
        </div>
      `, { sticky: true, opacity: 0.98 });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectCoordinate(st.lat, st.lon);
      });

      marker.addTo(group);
    });
  }, [layers.liveStations, liveStations, currentZoom, onSelectCoordinate]);

  // Render IMD Doppler Radar Sites (Ring shown on hover only to avoid clutter)
  useEffect(() => {
    const stationGroup = imdStationsGroupRef.current;
    const ringGroup = imdHoverRingGroupRef.current;
    stationGroup.clearLayers();
    ringGroup.clearLayers();

    if (!layers.imdRadars || !liveRadarInfo?.imdStations) return;

    liveRadarInfo.imdStations.forEach((radar) => {
      const icon = L.divIcon({
        className: 'custom-imd-radar-dot',
        html: `
          <div class="w-3 h-3 rounded-full bg-cyan-400 border border-slate-900 shadow-[0_0_8px_#22d3ee] cursor-pointer hover:scale-125 transition-transform flex items-center justify-center">
            <div class="w-1 h-1 bg-slate-950 rounded-full"></div>
          </div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([radar.lat, radar.lon], { icon });

      marker.bindTooltip(`
        <div class="p-2 font-mono text-xs space-y-1 bg-slate-900 border border-cyan-800/80 rounded shadow-xl">
          <div class="text-cyan-400 font-bold flex items-center space-x-1">
            <span>${radar.name}</span>
          </div>
          <div class="text-[10px] text-slate-300">${radar.type} | Surveillance: <span class="text-cyan-300 font-bold">${radar.range_km} km</span></div>
          <div class="text-[9px] text-slate-400">Hover shows surveillance ring. Click to inspect.</div>
        </div>
      `, { sticky: true });

      // Draw range ring dynamically on hover!
      marker.on('mouseover', () => {
        ringGroup.clearLayers();
        L.circle([radar.lat, radar.lon], {
          radius: radar.range_km * 1000,
          color: '#06b6d4',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: 'rgba(6, 182, 212, 0.06)',
          fillOpacity: 0.06,
          interactive: false
        }).addTo(ringGroup);
      });

      marker.on('mouseout', () => {
        ringGroup.clearLayers();
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectCoordinate(radar.lat, radar.lon);
      });

      marker.addTo(stationGroup);
    });
  }, [layers.imdRadars, liveRadarInfo, onSelectCoordinate]);

  // Selected Point Crosshair Pin & Auto-Pan
  useEffect(() => {
    const layer = pinLayerGroupRef.current;
    layer.clearLayers();
    if (!selectedCoord) return;

    if (mapInstanceRef.current) {
      const targetZoom = Math.max(mapInstanceRef.current.getZoom(), 11);
      mapInstanceRef.current.flyTo([selectedCoord.lat, selectedCoord.lon], targetZoom, {
        animate: true,
        duration: 1.2,
      });
    }

    const crosshairIcon = L.divIcon({
      className: 'custom-crosshair',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div class="w-8 h-8 border-2 border-cyan-400 rounded-full animate-ping opacity-75"></div>
          <div class="absolute w-5 h-5 border-2 border-cyan-300 rounded-full flex items-center justify-center bg-cyan-950/50">
            <div class="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>
          </div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [0, 0]
    });

    const marker = L.marker([selectedCoord.lat, selectedCoord.lon], { icon: crosshairIcon, interactive: false });

    if (selectedPointData) {
      const activeStep = selectedPointData.timeline?.find((s) => s.lead_time_min === currentLeadTime);
      const isSub = currentLeadTime > 0 && !!activeStep;

      const areaTitle = selectedPointData.small_area_name || selectedPointData.location_label;
      const subTitleTime = isSub ? ` • ${activeStep.time_label} (${activeStep.clock_time_ist})` : '';
      const statBadge = isSub ? `${activeStep.dbz} dBZ` : (selectedPointData.current_temp_c !== undefined ? `${selectedPointData.current_temp_c}°C` : '');
      const condBadge = isSub 
        ? (activeStep.dbz >= 45 ? '⚡ Thunderstorm' : activeStep.dbz >= 25 ? '🌧️ Rain' : '⛅ Clear') 
        : (selectedPointData.weather_condition || '');
      const statSub = isSub 
        ? `Rain: ${activeStep.rain_rate_mm_hr} mm/h | ${activeStep.thunderstorm_prob_pct}% Risk`
        : (selectedPointData.eta_time_ist ? `Storm ETA: ${selectedPointData.eta_time_ist}` : 'Clear');

      marker.bindTooltip(`
        <div class="p-2 font-sans text-xs bg-slate-900/95 border border-cyan-500 rounded-xl shadow-2xl text-white min-w-[185px]">
          <div class="flex items-center justify-between">
            <span class="font-bold text-cyan-300 text-sm truncate">${areaTitle}</span>
            <span class="text-[10px] text-cyan-400 font-mono font-bold">${subTitleTime}</span>
          </div>
          <div class="text-[11px] text-slate-300 truncate">${selectedPointData.district ? selectedPointData.district + ', ' : ''}${selectedPointData.state || ''}</div>
          <div class="mt-1 flex items-center space-x-2 font-mono text-xs">
            <span class="text-amber-300 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/80">${statBadge}</span>
            <span class="text-slate-200 text-[11px]">${condBadge}</span>
          </div>
          <div class="mt-1 text-[10px] text-cyan-300 font-mono font-semibold">${statSub}</div>
        </div>
      `, { permanent: true, direction: 'top', offset: [0, -14], opacity: 0.98 });
    }

    marker.addTo(layer);
  }, [selectedCoord, selectedPointData, currentLeadTime]);

  // Data Layers: Risk Zones, Reflectivity, Lightning, Storm Tracks
  useEffect(() => {
    const riskLayer = riskLayerGroupRef.current;
    const radarLayer = radarLayerGroupRef.current;
    const lightningLayer = lightningLayerGroupRef.current;
    const stormTrackLayer = stormTrackLayerGroupRef.current;

    riskLayer.clearLayers();
    radarLayer.clearLayers();
    lightningLayer.clearLayers();
    stormTrackLayer.clearLayers();

    if (!forecast) return;

    // 1. Semi-Transparent Risk Zones (Hazard Halos)
    if (layers.riskZones && forecast.risk_zones) {
      forecast.risk_zones.features.forEach((feature) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
        const fillAlpha = props.risk_level === 'high' ? 0.24 : props.risk_level === 'medium' ? 0.16 : 0.08;

        const polygon = L.polygon(coords, {
          color: props.color,
          weight: props.risk_level === 'high' ? 2.0 : 1.4,
          fillColor: props.color,
          fillOpacity: fillAlpha,
          dashArray: props.risk_level === 'low' ? '4, 4' : undefined
        });

        polygon.bindTooltip(`
          <div class="p-1 font-mono text-xs">
            <div class="font-bold" style="color: ${props.color}">${props.risk_label}</div>
            <div class="text-slate-300">Prob: <span class="text-white font-bold">${props.probability_pct}%</span> | Core: ${props.projected_max_dbz} dBZ</div>
          </div>
        `, { sticky: true, opacity: 0.95 });

        polygon.addTo(riskLayer);
      });
    }

    // 2. Reflectivity Contours
    if (layers.radarReflectivity && forecast.reflectivity_contours) {
      forecast.reflectivity_contours.features.forEach((feature) => {
        const props = feature.properties;
        const coords = feature.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);

        const contour = L.polygon(coords, {
          color: props.color,
          weight: 1.0,
          fillColor: props.fill_color,
          fillOpacity: 0.28,
          interactive: false
        });

        contour.addTo(radarLayer);
      });
    }

    // 3. Lightning Strikes (Clean crisp dots without giant ping halos)
    if (layers.lightningStrikes && forecast.lightning_strikes) {
      forecast.lightning_strikes.forEach((s) => {
        const isCG = s.strike_type === 'CG';
        const color = isCG ? '#60a5fa' : '#c084fc';

        const strikeIcon = L.divIcon({
          className: 'custom-clean-strike',
          html: `<div class="w-2 h-2 rounded-full shadow" style="background-color: ${color};"></div>`,
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        });

        const marker = L.marker([s.lat, s.lon], { icon: strikeIcon });
        marker.bindTooltip(`
          <div class="font-mono text-xs p-1">
            <div class="font-bold text-blue-400">⚡ ${s.strike_type} Flash (${s.peak_current_ka} kA)</div>
            <div class="text-slate-400 text-[9px]">${s.age_seconds}s ago</div>
          </div>
        `, { sticky: true });

        marker.addTo(lightningLayer);
      });
    }

    // 4. Storm Cell Tracks (Clean directional motion line only, NO giant cluttering rings!)
    if (layers.stormTracks && forecast.cells) {
      forecast.cells.forEach((cell) => {
        const cellIcon = L.divIcon({
          className: 'custom-clean-cell-icon',
          html: `
            <div class="flex items-center space-x-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none">
              <div class="w-3.5 h-3.5 rounded-full border-2 border-white bg-red-600 shadow-[0_0_8px_#ef4444] flex items-center justify-center">
                <div class="w-1 h-1 bg-white rounded-full"></div>
              </div>
              <span class="bg-slate-950/90 text-red-300 font-mono text-[9px] px-1 py-0.5 rounded border border-red-800 shadow whitespace-nowrap">
                ${cell.speed_kt}kt
              </span>
            </div>
          `,
          iconSize: [60, 20],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([cell.current_lat, cell.current_lon], { icon: cellIcon });
        marker.addTo(stormTrackLayer);

        // Projected track line (Clean dashed trajectory)
        if (cell.track && cell.track.length > 1) {
          const latLngs = cell.track.map((pt) => [pt.lat, pt.lon] as [number, number]);
          L.polyline(latLngs, {
            color: '#f43f5e',
            weight: 2,
            dashArray: '4, 4',
            opacity: 0.8
          }).addTo(stormTrackLayer);
        }
      });
    }
  }, [forecast, layers]);

  return (
    <div className="relative w-full h-full select-none">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Collapsible Hazard Scale Legend (Bottom Left) */}
      <div className="absolute bottom-6 left-6 z-10 font-mono text-xs max-w-xs">
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center space-x-1.5 text-slate-300 text-[10px] transition-colors"
        >
          <span>Hazard Scale</span>
          {isLegendOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {isLegendOpen && (
          <div className="mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-2.5 rounded-lg shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Risk scale */}
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-2.5 bg-red-500/30 border border-red-400 rounded-sm"></div>
                <span className="text-red-300">High Risk (&gt;75% Prob)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-2.5 bg-orange-500/25 border border-orange-400 rounded-sm"></div>
                <span className="text-orange-300">Medium Risk (50–75%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-2.5 bg-yellow-500/20 border border-yellow-400 border-dashed rounded-sm"></div>
                <span className="text-yellow-300">Low Risk (25–50%)</span>
              </div>
            </div>

            {/* Reflectivity dBZ color bar */}
            <div className="pt-1.5 border-t border-slate-800">
              <div className="text-[9px] text-slate-400 mb-0.5 flex justify-between">
                <span>Radar Reflectivity</span>
                <span>dBZ</span>
              </div>
              <div className="h-1.5 w-full rounded-sm bg-gradient-to-r from-sky-400 via-green-500 via-yellow-400 via-red-500 to-purple-600"></div>
              <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                <span>20</span>
                <span>35</span>
                <span>45</span>
                <span>55</span>
                <span>65+</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
