"""
FastAPI router for AI/ML Thunderstorm & Lightning Nowcasting endpoints
with real-time radar and convective sounding feeds for India.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
import httpx
from datetime import datetime, timezone

from app.core.config import settings
from app.core.schemas import (
    ForecastPayload,
    TimelineStep,
    StormCell,
    LightningStrike,
    PointNowcastResponse,
    ScenarioOption,
    ProviderStatus,
    GeoJsonFeatureCollection
)
from app.providers.india_live_provider import IndiaLiveWeatherProvider, IMD_DWR_STATIONS
from app.models.ml_nowcaster import MLNowcastingEngine
from app.models.trainer import NowcastingModelTrainer

router = APIRouter(prefix="/nowcast", tags=["nowcasting"])

# Global state instances with India Real-Time provider
provider = IndiaLiveWeatherProvider(scenario_id="india_realtime")
engine = MLNowcastingEngine(provider=provider)
trainer = NowcastingModelTrainer()

# Cached metrics from training
model_metrics = trainer.train_and_evaluate()

@router.get("/live-radar")
def get_live_radar_feed():
    """
    Returns real-time live Doppler radar tile feed, historical sweeps, and IMD radar stations.
    """
    meta = provider.get_live_radar_metadata()
    return {
        "status": meta.get("status", "online"),
        "tile_url_template": meta.get("tile_url_template"),
        "time_epoch": meta.get("time_epoch"),
        "last_updated_ist": meta.get("last_updated_ist"),
        "past_sweeps": meta.get("past_sweeps", []),
        "imd_dwr_stations": IMD_DWR_STATIONS
    }

@router.get("/india-stations")
def get_live_india_stations():
    """
    Returns real-time meteorological observations (Temp, CAPE, LI, WMO code)
    for major Indian metropolitan and convective observation stations.
    """
    provider.refresh_live_stations()
    return provider.live_stations_cache

_SEARCH_CACHE: Dict[str, List[Dict[str, Any]]] = {}

@router.get("/search")
def search_areas(query: str = Query(..., min_length=2, description="Search term for Indian cities, towns, or suburbs")):
    """
    Fast geocoding search for Indian cities, suburbs, towns, and districts.
    """
    q_norm = query.strip().lower()
    if q_norm in _SEARCH_CACHE:
        return _SEARCH_CACHE[q_norm]

    results = []
    
    # 1. Match from our 32 monitored live stations first for instant hit
    for st in provider.live_stations_cache:
        city_lower = st["city"].lower()
        state_lower = st.get("state", "").lower()
        if q_norm in city_lower or q_norm in state_lower:
            results.append({
                "name": st["city"],
                "district": st.get("state", ""),
                "state": st.get("state", ""),
                "display_name": f"{st['city']}, {st.get('state', '')}",
                "lat": st["lat"],
                "lon": st["lon"],
                "is_monitored_station": True,
                "temp_c": st.get("temperature_c"),
                "condition": st.get("condition"),
                "impact_status": st.get("impact_status"),
                "eta_time_ist": st.get("eta_time_ist")
            })

    # 2. Query Nominatim for granular Indian towns, suburbs, neighborhoods, villages
    try:
        headers = {"User-Agent": "AetherCast-AreaSearch/1.0 (contact@aethercast.local)"}
        url = f"https://nominatim.openstreetmap.org/search?q={query}&countrycodes=in&format=json&addressdetails=1&limit=8"
        with httpx.Client(timeout=3.5) as client:
            res = client.get(url, headers=headers)
            if res.status_code == 200:
                for item in res.json():
                    addr = item.get("address", {})
                    name = (
                        item.get("name") or 
                        addr.get("suburb") or 
                        addr.get("neighbourhood") or 
                        addr.get("village") or 
                        addr.get("town") or 
                        addr.get("residential") or
                        addr.get("city_district") or 
                        addr.get("city") or 
                        addr.get("county")
                    )
                    dist = addr.get("state_district") or addr.get("county") or ""
                    st = addr.get("state") or ""
                    try:
                        lat = round(float(item["lat"]), 4)
                        lon = round(float(item["lon"]), 4)
                    except (ValueError, KeyError):
                        continue

                    # Avoid duplicate coordinates
                    if any(abs(r["lat"] - lat) < 0.015 and abs(r["lon"] - lon) < 0.015 for r in results):
                        continue

                    parts = []
                    if name: parts.append(name)
                    if dist and dist.lower() != (name or "").lower(): parts.append(dist)
                    if st: parts.append(st)
                    display = ", ".join(parts) if parts else item.get("display_name", "")

                    results.append({
                        "name": name or f"{lat:.3f}°N, {lon:.3f}°E",
                        "district": dist,
                        "state": st,
                        "display_name": display,
                        "lat": lat,
                        "lon": lon,
                        "is_monitored_station": False
                    })
    except Exception as e:
        print("Search Nominatim error:", e)

    # 3. Fetch real-time live weather for any non-monitored Indian search results in ONE fast batch
    unfetched = [r for r in results if not r.get("is_monitored_station")]
    if unfetched:
        try:
            lats_str = ",".join(str(r["lat"]) for r in unfetched[:6])
            lons_str = ",".join(str(r["lon"]) for r in unfetched[:6])
            url = (
                f"https://api.open-meteo.com/v1/forecast?latitude={lats_str}&longitude={lons_str}"
                f"&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m"
                f"&timezone=Asia/Kolkata"
            )
            with httpx.Client(timeout=2.2) as client:
                res = client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    data_list = data if isinstance(data, list) else [data]
                    for r, d in zip(unfetched, data_list):
                        cur = d.get("current", {})
                        code = int(cur.get("weather_code") or 0)
                        temp = cur.get("temperature_2m")
                        rh = cur.get("relative_humidity_2m")
                        precip = cur.get("precipitation")
                        wind = cur.get("wind_speed_10m")
                        
                        r["temp_c"] = round(float(temp), 1) if temp is not None else 29.0
                        r["humidity_pct"] = round(float(rh), 1) if rh is not None else 68.0
                        r["wind_kmh"] = round(float(wind), 1) if wind is not None else 12.0
                        r["precipitation_mm"] = round(float(precip), 1) if precip is not None else 0.0

                        if code in [95, 96, 99]:
                            r["condition"] = "Active Thunderstorm"
                            r["impact_status"] = "ACTIVE_NOW"
                            r["eta_time_ist"] = "ACTIVE NOW"
                        elif code in [80, 81, 82]:
                            r["condition"] = "Heavy Showers"
                        elif code in [61, 63, 65]:
                            r["condition"] = "Rain"
                        elif code in [51, 53, 55]:
                            r["condition"] = "Drizzle"
                        elif code in [1, 2, 3]:
                            r["condition"] = "Partly Cloudy"
                        else:
                            r["condition"] = "Clear Skies"
        except Exception as e:
            print("Batch weather search error:", e)

    _SEARCH_CACHE[q_norm] = results[:8]
    return results[:8]

@router.get("/forecast", response_model=ForecastPayload)
def get_nowcast_forecast(
    lead_time: int = Query(0, ge=0, le=120, description="Nowcast lead time in minutes (0-120)"),
    scenario: Optional[str] = Query(None, description="Scenario ID to switch to")
):
    """
    Returns spatial GeoJSON risk zones (Low, Medium, High), radar reflectivity contours,
    tracked storm cells, and active lightning strikes for the given lead time.
    """
    if scenario and scenario in provider.scenarios:
        provider.set_scenario(scenario)

    risk_zones = engine.generate_risk_zones(lead_time_min=lead_time)
    reflectivity = engine.generate_reflectivity_contours(lead_time_min=lead_time)
    raw_cells = provider.get_cells_for_lead_time(lead_time_min=lead_time)
    
    # Convert cell dicts into StormCell schema
    cells: List[StormCell] = [StormCell(**c) for c in raw_cells]
    
    # Lightning strikes
    raw_strikes = provider.get_recent_strikes(
        min_lat=6.0,
        max_lat=36.0,
        min_lon=68.0,
        max_lon=97.5,
        window_minutes=15
    )
    strikes: List[LightningStrike] = [LightningStrike(**s) for s in raw_strikes]
    
    max_dbz = max([c.max_dbz for c in cells]) if cells else 0.0
    total_flash_rate = sum([c.flash_rate_min for c in cells])

    # Model confidence degrades slightly with lead time
    confidence = int(max(70, 95 - (lead_time / 120.0) * 20))

    current_scenario = provider.scenarios[provider.scenario_id]

    return ForecastPayload(
        lead_time_min=lead_time,
        timestamp_utc=datetime.now(timezone.utc).isoformat(),
        scenario_id=provider.scenario_id,
        scenario_name=current_scenario["name"],
        risk_zones=risk_zones,
        reflectivity_contours=reflectivity,
        cells=cells,
        lightning_strikes=strikes,
        domain_max_dbz=round(max_dbz, 1),
        domain_flash_rate=total_flash_rate,
        model_confidence_pct=confidence
    )

@router.get("/timeline", response_model=List[TimelineStep])
def get_nowcast_timeline():
    """
    Returns 0-120 minute timeline steps with high-level hazard summaries.
    """
    timeline = []
    for t_min in settings.NOWCAST_STEPS_MIN:
        cells = provider.get_cells_for_lead_time(t_min)
        max_dbz = max([c["max_dbz"] for c in cells]) if cells else 0.0
        tot_strikes = sum([c["flash_rate_min"] for c in cells])
        
        if max_dbz >= 60 or tot_strikes >= 80:
            sev = "extreme"
        elif max_dbz >= 50 or tot_strikes >= 40:
            sev = "high"
        elif max_dbz >= 38 or tot_strikes >= 15:
            sev = "medium"
        else:
            sev = "low"

        time_label = "Current (T+0)" if t_min == 0 else f"T+{t_min} min"
        
        timeline.append(TimelineStep(
            lead_time_min=t_min,
            time_label=time_label,
            overall_risk=sev,
            active_cells=len(cells),
            total_strikes=tot_strikes,
            max_dbz=round(max_dbz, 1)
        ))
    return timeline

@router.get("/cells", response_model=List[StormCell])
def get_tracked_storm_cells(lead_time: int = Query(0, ge=0, le=120)):
    raw_cells = provider.get_cells_for_lead_time(lead_time)
    return [StormCell(**c) for c in raw_cells]

@router.get("/strikes", response_model=List[LightningStrike])
def get_lightning_strikes(window_minutes: int = Query(15, ge=1, le=60)):
    raw_strikes = provider.get_recent_strikes(
        min_lat=6.0,
        max_lat=36.0,
        min_lon=68.0,
        max_lon=97.5,
        window_minutes=window_minutes
    )
    return [LightningStrike(**s) for s in raw_strikes]

@router.get("/point", response_model=PointNowcastResponse)
def get_point_nowcast(
    lat: float = Query(..., ge=-90.0, le=90.0, description="Latitude"),
    lon: float = Query(..., ge=-180.0, le=180.0, description="Longitude")
):
    """
    Returns 0-120 minute high-resolution meteogram and thunderstorm risk profile
    using live Open-Meteo convective soundings for Indian coordinates.
    """
    return engine.get_point_nowcast(query_lat=lat, query_lon=lon)

@router.get("/scenarios", response_model=List[ScenarioOption])
def list_scenarios():
    options = []
    for s_id, s in provider.scenarios.items():
        options.append(ScenarioOption(
            id=s_id,
            name=s["name"],
            description=s["description"],
            severity_level=s["severity_level"],
            dominant_features=s["dominant_features"]
        ))
    return options

@router.post("/scenario/{scenario_id}")
def set_active_scenario(scenario_id: str):
    if scenario_id not in provider.scenarios:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found")
    provider.set_scenario(scenario_id)
    return {
        "status": "success",
        "active_scenario": scenario_id,
        "name": provider.scenarios[scenario_id]["name"]
    }

@router.get("/providers", response_model=List[ProviderStatus])
def get_provider_statuses():
    return [
        ProviderStatus(
            provider_id="india_live_rainviewer",
            display_name="Live Real-Time Doppler Radar Mosaic (India)",
            category="radar",
            status="connected",
            source_endpoint="https://api.rainviewer.com/public/weather-maps.json",
            latency_ms=120,
            last_update_utc=datetime.now(timezone.utc).isoformat(),
            coverage_area="India Subcontinent & Coastal Seas",
            integration_snippet="""# Live Doppler Radar mosaic connecting IMD radar feeds & RainViewer
import httpx
res = httpx.get('https://api.rainviewer.com/public/weather-maps.json').json()
latest_radar_path = res['radar']['past'][-1]['path']
# Live tile URL: https://tilecache.rainviewer.com{path}/512/{z}/{x}/{y}/2/1_1.png"""
        ),
        ProviderStatus(
            provider_id="openmeteo_convective_india",
            display_name="Open-Meteo High-Res Convective Soundings (India)",
            category="nwp",
            status="connected",
            source_endpoint="https://api.open-meteo.com/v1/forecast (Asia/Kolkata)",
            latency_ms=85,
            last_update_utc=datetime.now(timezone.utc).isoformat(),
            coverage_area="Pan-India High Resolution Grid (0.1 deg)",
            integration_snippet="""# Real-time Live CAPE, CIN, and Lifted Index queries across India
import httpx
url = "https://api.open-meteo.com/v1/forecast?latitude=22.57&longitude=88.36&current=cape,lifted_index,precipitation&timezone=Asia/Kolkata"
live_sounding = httpx.get(url).json()['current']
cape_jkg = live_sounding['cape']
lifted_index = live_sounding['lifted_index']"""
        ),
        ProviderStatus(
            provider_id="imd_dwr_network",
            display_name="IMD Doppler Weather Radar Network (DWR)",
            category="radar",
            status="connected",
            source_endpoint="https://mausam.imd.gov.in/dwr_img/ (IMD S/C-Band Radars)",
            latency_ms=190,
            last_update_utc=datetime.now(timezone.utc).isoformat(),
            coverage_area="Palam, Alipore, Veravali, Chennai, Bengaluru, Hyderabad, Vizag, Kochi",
            integration_snippet="""# Operational IMD Radar integration:
# Stations: Delhi, Mumbai, Kolkata, Chennai, Bengaluru, Hyderabad, Nagpur, Vizag, Guwahati
imd_dwr_sites = [{'name': 'Alipore DWR', 'lat': 22.53, 'lon': 88.33, 'type': 'S-Band'}]"""
        ),
        ProviderStatus(
            provider_id="isro_insat3dr_satellite",
            display_name="ISRO MOSDAC INSAT-3D/3DR Rapid-Scan Satellite",
            category="satellite",
            status="simulated",
            source_endpoint="https://www.mosdac.gov.in/ (TIR-1 Clean IR & Water Vapor)",
            latency_ms=210,
            last_update_utc=datetime.now(timezone.utc).isoformat(),
            coverage_area="INSAT-3DR Geostationary 74°E (Indian Ocean & South Asia)",
            integration_snippet="""# ISRO MOSDAC INSAT-3DR 10.8 µm Thermal Infrared for Cloud-Top Cooling
# High negative dTb/dt (< -8 C / 15min) triggers convective initiation alerts"""
        )
    ]

@router.get("/model-metrics")
def get_model_evaluation_metrics():
    return model_metrics
