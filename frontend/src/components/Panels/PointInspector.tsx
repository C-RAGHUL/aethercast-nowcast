import React from 'react';
import { 
  X, 
  CloudRain, 
  Zap, 
  Wind, 
  AlertTriangle, 
  Thermometer, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Compass,
  Droplets,
  Cloud,
  Gauge
} from 'lucide-react';
import { PointNowcastResponse } from '../../types/nowcast';

interface PointInspectorProps {
  data: PointNowcastResponse | null;
  isLoading: boolean;
  onClose: () => void;
  currentLeadTime?: number;
  onSelectLeadTime?: (leadTime: number) => void;
}

export const PointInspector: React.FC<PointInspectorProps> = ({ 
  data, 
  isLoading, 
  onClose,
  currentLeadTime = 0,
  onSelectLeadTime,
}) => {
  if (!data && !isLoading) return null;

  const activeStep = data?.timeline?.find((s) => s.lead_time_min === currentLeadTime) || data?.timeline?.[0];
  const isSubsequence = currentLeadTime > 0 && !!activeStep;

  const getBarColor = (prob: number) => {
    if (prob >= 75) return 'bg-red-500';
    if (prob >= 50) return 'bg-orange-500';
    if (prob >= 25) return 'bg-yellow-400';
    return 'bg-emerald-400';
  };

  const getEtaBanner = () => {
    if (!data) return null;

    if (isSubsequence && activeStep) {
      if (activeStep.dbz >= 45 || activeStep.thunderstorm_prob_pct >= 65) {
        return (
          <div className="bg-red-950/90 border-2 border-red-500 p-3 rounded-lg text-red-200 shadow-lg shadow-red-950/50 space-y-1 animate-pulse">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-red-400 flex-shrink-0 animate-bounce" />
              <div className="font-bold text-sm tracking-wide text-white">
                ⚡ ACTIVE STORM OVERHEAD AT {activeStep.time_label}
              </div>
            </div>
            <div className="text-xs font-mono text-red-300 pl-7">
              Subsequence Time: <span className="font-bold text-white">{activeStep.clock_time_ist || 'Projected'}</span> | Core: <span className="font-bold text-white">{activeStep.dbz} dBZ</span>
            </div>
            <div className="text-[11px] text-red-200/90 font-sans pl-7">
              Severe thunderstorm active overhead at this step. Rain: {activeStep.rain_rate_mm_hr} mm/h, Hail risk {activeStep.hail_prob_pct}%, Wind gusts {activeStep.wind_gust_kt} kt.
            </div>
          </div>
        );
      }

      if (activeStep.dbz >= 25 || activeStep.thunderstorm_prob_pct >= 35) {
        return (
          <div className="bg-orange-950/90 border-2 border-orange-500 p-3 rounded-lg text-orange-200 shadow-lg shadow-orange-950/50 space-y-1">
            <div className="flex items-center space-x-2">
              <CloudRain className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div className="font-bold text-xs tracking-wide text-white">
                🌧️ CONVECTIVE RAIN AT {activeStep.time_label} ({activeStep.clock_time_ist})
              </div>
            </div>
            <div className="text-xs font-mono text-orange-300 pl-7">
              Reflectivity: {activeStep.dbz} dBZ | Rain Rate: {activeStep.rain_rate_mm_hr} mm/h | Storm Risk: {activeStep.thunderstorm_prob_pct}%
            </div>
            <div className="text-[11px] text-orange-200/90 font-sans pl-7">
              Convective showers and precipitation shield impacting local area.
            </div>
          </div>
        );
      }

      return (
        <div className="bg-emerald-950/60 border border-emerald-700/70 p-2.5 rounded-lg text-emerald-300 space-y-0.5">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="font-bold text-xs">CLEAR AT {activeStep.time_label} ({activeStep.clock_time_ist})</div>
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono pl-6">
            Advection trajectory clear of storm cores. Local echo 0 dBZ, rain rate 0 mm/h.
          </div>
        </div>
      );
    }

    const status = data.impact_status || 'CLEAR';

    if (status === 'ACTIVE_NOW') {
      return (
        <div className="bg-red-950/90 border-2 border-red-500 p-3 rounded-lg text-red-200 shadow-lg shadow-red-950/50 space-y-1 animate-pulse">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-red-400 flex-shrink-0 animate-bounce" />
            <div className="font-bold text-sm tracking-wide text-white">
              ⚡ ACTIVE OVERHEAD NOW
            </div>
          </div>
          <div className="text-xs font-mono text-red-300 pl-7">
            Impact Clock Time: <span className="font-bold text-white">{data.eta_time_ist || 'Active Now'}</span>
          </div>
          <div className="text-[11px] text-red-200/90 font-sans pl-7">
            Severe convective cell with lightning & heavy precipitation active overhead.
          </div>
        </div>
      );
    }

    if (status === 'APPROACHING') {
      return (
        <div className="bg-orange-950/90 border-2 border-orange-500 p-3 rounded-lg text-orange-200 shadow-lg shadow-orange-950/50 space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400 flex-shrink-0 animate-spin" />
            <div className="font-bold text-sm tracking-wide text-white">
              ⚠️ STORM APPROACHING LOCAL AREA
            </div>
          </div>
          <div className="text-xs font-mono text-orange-300 pl-7">
            Impact Clock Time: <span className="font-bold text-white">{data.eta_time_ist}</span>
          </div>
          <div className="text-[11px] text-orange-200/90 font-sans pl-7">
            High-reflectivity core advecting along storm motion vector towards target coordinates.
          </div>
        </div>
      );
    }

    if (status === 'HIGH_INSTABILITY') {
      return (
        <div className="bg-amber-950/60 border border-amber-600/70 p-2.5 rounded-lg text-amber-200 space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div className="font-bold text-xs tracking-wide text-amber-200">
              ⚡ CONVECTIVE WATCH: HIGH INSTABILITY
            </div>
          </div>
          <div className="text-[11px] text-amber-200/90 font-sans pl-6">
            Atmosphere primed for rapid cell initiation (CAPE: {data.cape_jkg} J/kg, LI: {data.lifted_index}).
          </div>
        </div>
      );
    }

    return (
      <div className="bg-emerald-950/60 border border-emerald-700/70 p-2.5 rounded-lg text-emerald-300 space-y-0.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="font-bold text-xs">NO STORM CELLS IN 120-MIN WINDOW</div>
        </div>
        <div className="text-[10px] text-emerald-400/80 font-mono pl-6">
          Lagrangian advection trajectory clear of high-reflectivity cores.
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 md:w-96 h-full max-h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl flex flex-col z-30 select-none shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200 min-h-0">
      {/* Header with Exact Small Area Details */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center space-x-1.5 text-[10px] text-cyan-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>EXACT LOCAL AREA NOWCAST</span>
          </div>
          {/* Small Area Title (e.g. Sector II, Salt Lake / Howrah / Sector 62, Noida) */}
          <h2 className="font-bold text-base text-white mt-0.5 truncate" title={data ? (data.small_area_name || data.location_label) : ""}>
            {data ? (data.small_area_name || data.location_label) : "Resolving Area..."}
          </h2>
          {/* District & State Subtitle */}
          <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
            {data?.district ? `${data.district}, ${data.state}` : (data?.state || data?.location_label || "")}
          </div>
          <div className="flex items-center space-x-2 mt-1 font-mono text-[10px] text-slate-400">
            <span>{data ? `[${data.query_lat.toFixed(4)}°N, ${data.query_lon.toFixed(4)}°E]` : ''}</span>
            {activeStep ? (
              <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                <span>• {activeStep.clock_time_ist || data?.observed_at_ist}</span>
                <span className={`px-1.5 py-0.2 rounded border text-[9px] font-bold ${
                  isSubsequence 
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700 animate-pulse' 
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {isSubsequence ? `SUBSEQUENCE (${activeStep.time_label})` : 'CURRENT (T+0)'}
                </span>
              </span>
            ) : (
              data?.observed_at_ist && <span className="text-emerald-400 font-semibold">• {data.observed_at_ist}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          title="Close inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center space-y-3 p-6 font-mono text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Calculating Lagrangian storm arrival times & soundings...</span>
        </div>
      ) : data ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 text-xs font-mono">
          {/* Storm Arrival ETA Banner */}
          {getEtaBanner()}

          {/* Real Measured Surface Weather vs Subsequence Projected Weather */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
              <span className="text-cyan-400">
                {isSubsequence ? `Subsequence Weather (${activeStep.time_label})` : "Local Area Micro-Weather"}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                isSubsequence 
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-mono animate-pulse' 
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              }`}>
                {isSubsequence ? `AT ${activeStep.clock_time_ist || activeStep.time_label}` : '100% LOCAL REAL OBS'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                  {isSubsequence ? <Gauge className="w-3 h-3 text-red-400" /> : <Thermometer className="w-3 h-3 text-amber-400" />}
                  <span>{isSubsequence ? 'Radar Echo Core' : 'Temperature'}</span>
                </div>
                <div className={`font-bold text-sm mt-0.5 ${isSubsequence && activeStep && activeStep.dbz >= 40 ? 'text-red-400' : 'text-white'}`}>
                  {isSubsequence && activeStep ? `${activeStep.dbz} dBZ` : (data.current_temp_c !== undefined ? `${data.current_temp_c}°C` : '--')}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                  {isSubsequence ? <Zap className="w-3 h-3 text-blue-400" /> : <Droplets className="w-3 h-3 text-blue-400" />}
                  <span>{isSubsequence ? 'Storm Probability' : 'Rel. Humidity'}</span>
                </div>
                <div className={`font-bold text-sm mt-0.5 ${isSubsequence && activeStep && activeStep.thunderstorm_prob_pct >= 50 ? 'text-red-400' : 'text-white'}`}>
                  {isSubsequence && activeStep ? `${activeStep.thunderstorm_prob_pct}% (${activeStep.lightning_risk})` : (data.relative_humidity_pct !== undefined ? `${data.relative_humidity_pct}%` : '--')}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                  <CloudRain className="w-3 h-3 text-cyan-400" />
                  <span>{isSubsequence ? 'Projected Rain Rate' : 'Precipitation'}</span>
                </div>
                <div className={`font-bold text-sm mt-0.5 ${
                  (isSubsequence && activeStep ? activeStep.rain_rate_mm_hr : (data.precipitation_mm_hr ?? 0)) > 0 ? 'text-cyan-300 font-extrabold' : 'text-white'
                }`}>
                  {isSubsequence && activeStep ? `${activeStep.rain_rate_mm_hr} mm/h` : `${data.precipitation_mm_hr ?? 0} mm/h`}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px] flex items-center space-x-1">
                  <Wind className="w-3 h-3 text-teal-400" />
                  <span>Wind / Gusts</span>
                </div>
                <div className="text-white font-bold text-xs mt-0.5">
                  {isSubsequence && activeStep 
                    ? `${activeStep.wind_gust_kt} kt (~${Math.round(activeStep.wind_gust_kt * 1.852)} km/h)` 
                    : `${data.wind_speed_kmh ?? '--'} km/h${data.wind_gusts_kmh ? ` (G ${data.wind_gusts_kmh})` : ''}`}
                </div>
              </div>
            </div>

            <div className="mt-2 bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 rounded text-[11px] text-slate-300 flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                isSubsequence && activeStep 
                  ? (activeStep.dbz >= 45 ? 'bg-red-500 animate-ping' : activeStep.dbz >= 25 ? 'bg-orange-400 animate-pulse' : 'bg-cyan-400')
                  : 'bg-cyan-400'
              }`}></span>
              <span>
                {isSubsequence && activeStep ? `Projected Condition (${activeStep.time_label}): ` : "Current Condition: "}
                <strong className="text-white">
                  {isSubsequence && activeStep
                    ? (activeStep.dbz >= 50
                        ? '⚡ Active Severe Thunderstorm / Hail Threat'
                        : activeStep.dbz >= 35
                        ? '🌧️ Heavy Convective Rain & Lightning'
                        : activeStep.dbz >= 20
                        ? '🌦️ Scattered Rain Showers'
                        : '🌤️ Clear / Stable Atmosphere')
                    : data.weather_condition}
                </strong>
              </span>
            </div>
          </div>

          {/* Thermodynamic Sounding Indices */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2">
              Atmospheric Convective Indices (Open-Meteo India)
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px]">CAPE Instability</div>
                <div className={`font-bold ${data.cape_jkg >= 2000 ? 'text-amber-400 font-extrabold' : 'text-white'}`}>
                  {data.cape_jkg} J/kg
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px]">0–6km Bulk Shear</div>
                <div className="text-white font-bold">{data.bulk_shear_0_6km_kt} kt</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Lifted Index</div>
                <div className={`font-bold ${data.lifted_index <= -4 ? 'text-red-400' : 'text-white'}`}>
                  {data.lifted_index}
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-2 rounded">
                <div className="text-slate-400 text-[10px]">Cloud-Top Temp</div>
                <div className="text-white font-bold">{data.cloud_top_temp_c}°C</div>
              </div>
            </div>
          </div>

          {/* 120-Minute Meteogram Timeline with IST Clock Times */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center justify-between">
              <span>0–120 Min Arrival & Risk Timeline</span>
              <span className="text-cyan-400 text-[9px]">Exact IST Times</span>
            </div>

            <div className="space-y-2 bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
              {data.timeline.map((step) => {
                const isCurrentStep = step.lead_time_min === currentLeadTime;
                return (
                  <div
                    key={step.lead_time_min}
                    onClick={() => onSelectLeadTime && onSelectLeadTime(step.lead_time_min)}
                    className={`p-2 rounded-lg transition-all cursor-pointer space-y-1 ${
                      isCurrentStep
                        ? 'bg-cyan-950/90 border-2 border-cyan-400 shadow-md shadow-cyan-900/60 scale-[1.01]'
                        : 'hover:bg-slate-900/60 border border-transparent hover:border-slate-800'
                    }`}
                    title="Click to jump timeline to this subsequence step"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold ${isCurrentStep ? 'text-cyan-300' : 'text-white'}`}>
                          {step.clock_time_ist || step.time_label}
                        </span>
                        <span className="text-slate-400 text-[9px]">({step.time_label})</span>
                        {isCurrentStep && (
                          <span className="bg-cyan-500 text-slate-950 text-[8px] font-bold px-1 rounded animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <span className={step.dbz > 0 ? 'text-amber-300 font-bold' : ''}>{step.dbz} dBZ</span>
                        <span className={`font-bold ${step.thunderstorm_prob_pct >= 50 ? 'text-red-400' : 'text-white'}`}>
                          {step.thunderstorm_prob_pct}%
                        </span>
                      </div>
                    </div>

                    {/* Horizontal Risk Bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-300 ${getBarColor(step.thunderstorm_prob_pct)}`}
                        style={{ width: `${step.thunderstorm_prob_pct}%` }}
                      />
                    </div>

                    {/* Micro stats */}
                    <div className="flex justify-between text-[9px] text-slate-400 pt-0.5">
                      <span className={step.rain_rate_mm_hr > 0 ? 'text-cyan-300 font-semibold' : 'text-slate-500'}>
                        Rain: {step.rain_rate_mm_hr} mm/h
                      </span>
                      <span className={step.hail_prob_pct > 0 ? 'text-amber-300 font-semibold' : 'text-slate-500'}>
                        Hail: {step.hail_prob_pct}%
                      </span>
                      <span className="text-slate-500">Gusts: {step.wind_gust_kt} kt</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Feature Attribution Breakdown */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 flex items-center space-x-1">
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>AI Model Feature Attribution</span>
            </div>
            <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg space-y-2 text-[10px]">
              {Object.entries(data.ai_attribution).map(([feature, weight]) => (
                <div key={feature} className="space-y-0.5">
                  <div className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[200px]">{feature}</span>
                    <span className="text-cyan-400 font-bold">{weight}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500/80 rounded-full" style={{ width: `${Math.min(100, weight * 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
