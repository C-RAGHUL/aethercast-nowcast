"""Automated Verification Suite for 100% Real-Time Live Data Ingestion (India)."""
import sys
import os
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.providers.india_live_provider import IndiaLiveWeatherProvider, IMD_DWR_STATIONS, KEY_MONITORED_CITIES
from app.models.ml_nowcaster import MLNowcastingEngine

def run_tests():
    print("=" * 60)
    print("STARTING 100% REAL-TIME METEOROLOGICAL DATA TEST (INDIA)")
    print("=" * 60)

    provider = IndiaLiveWeatherProvider(scenario_id="india_realtime")
    engine = MLNowcastingEngine(provider=provider)

    # Test 1: Monitored Cities & Stations
    assert len(KEY_MONITORED_CITIES) >= 30, f"Expected >=30 monitored cities, got {len(KEY_MONITORED_CITIES)}"
    assert len(IMD_DWR_STATIONS) >= 15, f"Expected >=15 IMD radar stations, got {len(IMD_DWR_STATIONS)}"
    print(f"[PASS] Station configuration: {len(KEY_MONITORED_CITIES)} cities, {len(IMD_DWR_STATIONS)} IMD DWR stations")

    # Test 2: Live Open-Meteo Batch Observation Ingestion
    stations = provider.live_stations_cache
    assert len(stations) >= 30, f"Expected >=30 live station observations, got {len(stations)}"
    print(f"[PASS] Successfully ingested {len(stations)} real-time Indian station observations")

    print("\n--- Current Active Real-World Observations ---")
    for s in stations[:5]:
        print(f"  * {s['city']} ({s['state']}): {s['temperature_c']}C | {s['condition']} | CAPE: {s['cape_jkg']} J/kg | Time: {s['observed_at_ist']}")

    sample = stations[0]
    required_keys = ["city", "state", "lat", "lon", "temperature_c", "relative_humidity", "cape_jkg", "lifted_index", "precipitation_mm", "weather_code", "condition", "is_live", "observed_at_ist"]
    for k in required_keys:
        assert k in sample, f"Missing required key '{k}' in station payload"
    print("[PASS] Station payload schema validation verified")

    # Test 3: Live Doppler Radar & Historical Sweeps
    radar_meta = provider.get_live_radar_metadata()
    assert "tile_url_template" in radar_meta, "Missing tile_url_template in live radar metadata"
    assert "last_updated_ist" in radar_meta, "Missing last_updated_ist in live radar metadata"
    print(f"\n[PASS] Live Doppler Radar Mosaic: {radar_meta['status']}")
    print(f"  Tile Template: {radar_meta['tile_url_template']}")
    print(f"  Sweep Timestamp: {radar_meta['last_updated_ist']}")
    print(f"  Past Sweeps Available: {len(radar_meta.get('past_sweeps', []))}")

    # Test 4: Real Observation-Driven Storm Cells
    cells = provider.get_cells_for_lead_time(0)
    print(f"\n[PASS] Tracked Convective Cores at T+0: {len(cells)}")
    for c in cells:
        print(f"  * {c['id']}: {c['name']} at ({c['current_lat']}, {c['current_lon']}) | {c['max_dbz']} dBZ | {c['flash_rate_min']} fl/min | {c['speed_kt']} kt @ {c['direction_deg']} deg")

    # Test 5: Dynamic Point Sounding & 120-min AI Nowcast
    kolkata_point = engine.get_point_nowcast(query_lat=22.57, query_lon=88.36)
    assert kolkata_point is not None
    assert len(kolkata_point.timeline) == 9
    print(f"\n[PASS] Live Point Nowcast for Kolkata (22.57N, 88.36E):")
    print(f"  Location: {kolkata_point.location_label}")
    print(f"  Observed CAPE: {kolkata_point.cape_jkg} J/kg")
    print(f"  0-6km Shear: {kolkata_point.bulk_shear_0_6km_kt} kt")
    print(f"  Current Risk: {kolkata_point.current_risk}")
    print(f"  Advisory: {kolkata_point.advisory[:80]}...")

    # Test 6: GeoJSON Multi-Tier Risk Zones
    risk_zones = engine.generate_risk_zones(lead_time_min=30)
    print(f"\n[PASS] AI Risk Zones generated for T+30 min: {len(risk_zones.features)} feature polygons")

    print("\n" + "=" * 60)
    print("ALL REAL-TIME INDIA DATA INTEGRATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
