"""
Verification script to test the backend API and AI/ML nowcasting models.
"""
import sys
import os

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

def run_tests():
    print("=== 1. Testing Module Imports ===")
    from app.core.config import settings
    from app.providers.synthetic_provider import SyntheticConvectiveProvider
    from app.models.ml_nowcaster import MLNowcastingEngine
    from app.models.trainer import NowcastingModelTrainer
    from app.main import app
    print("[OK] Successfully imported all modules.")

    print("\n=== 2. Testing Synthetic Provider ===")
    provider = SyntheticConvectiveProvider("squall_line")
    cells_t0 = provider.get_cells_for_lead_time(0)
    cells_t60 = provider.get_cells_for_lead_time(60)
    print(f"[OK] Generated {len(cells_t0)} cells at T+0m.")
    print(f"[OK] Cell 0 advected from lon {cells_t0[0]['current_lon']} to {cells_t60[0]['current_lon']} at T+60m.")
    assert cells_t60[0]['current_lon'] > cells_t0[0]['current_lon'], "Storm cell should move east-northeast!"

    strikes = provider.get_recent_strikes(settings.MIN_LAT, settings.MAX_LAT, settings.MIN_LON, settings.MAX_LON, 15)
    print(f"[OK] Generated {len(strikes)} lightning strikes.")
    assert len(strikes) > 0, "Strikes should be generated around convective cells."

    print("\n=== 3. Testing ML Nowcaster Engine ===")
    engine = MLNowcastingEngine(provider)
    risk_zones = engine.generate_risk_zones(30)
    print(f"[OK] Generated {len(risk_zones.features)} risk zone polygons for T+30m.")
    levels = set(f.properties["risk_level"] for f in risk_zones.features)
    print(f"[OK] Risk levels present: {levels}")
    assert "high" in levels or "medium" in levels, "Risk zones should have high or medium levels."

    contours = engine.generate_reflectivity_contours(30)
    print(f"[OK] Generated {len(contours.features)} dBZ reflectivity contours.")

    point_fc = engine.get_point_nowcast(39.1, -94.6)
    print(f"[OK] Point forecast for KC ({point_fc.location_label}): Current risk '{point_fc.current_risk}', advisory: '{point_fc.advisory[:45]}...'")
    assert len(point_fc.timeline) == 9, "Point forecast should have 9 intervals (0 to 120m)."

    print("\n=== 4. Testing Model Trainer & Metrics ===")
    trainer = NowcastingModelTrainer()
    metrics = trainer.train_and_evaluate()
    print(f"[OK] Trained ensemble classifier:")
    print(f"   - Critical Success Index (CSI): {metrics['critical_success_index_csi']}")
    print(f"   - Probability of Detection (POD): {metrics['probability_of_detection_pod']}")
    print(f"   - False Alarm Ratio (FAR): {metrics['false_alarm_ratio_far']}")
    print(f"   - ROC-AUC: {metrics['roc_auc_score']}")
    print(f"   - Top feature: {max(metrics['feature_importances'], key=metrics['feature_importances'].get)}")

    print("\n=== 5. Testing FastAPI Endpoints ===")
    from starlette.testclient import TestClient
    client = TestClient(app)
    
    r_root = client.get("/")
    assert r_root.status_code == 200, f"Root returned {r_root.status_code}"
    
    r_forecast = client.get("/api/nowcast/forecast?lead_time=45")
    assert r_forecast.status_code == 200, f"Forecast returned {r_forecast.status_code}"
    fc_data = r_forecast.json()
    assert fc_data["lead_time_min"] == 45
    assert len(fc_data["risk_zones"]["features"]) > 0
    print("[OK] GET /api/nowcast/forecast returned 200 OK with valid GeoJSON payload.")

    r_timeline = client.get("/api/nowcast/timeline")
    assert r_timeline.status_code == 200
    print(f"[OK] GET /api/nowcast/timeline returned {len(r_timeline.json())} timeline steps.")

    r_point = client.get("/api/nowcast/point?lat=39.1&lon=-94.6")
    assert r_point.status_code == 200
    print(f"[OK] GET /api/nowcast/point returned 200 OK with meteogram.")

    r_providers = client.get("/api/nowcast/providers")
    assert r_providers.status_code == 200
    print(f"[OK] GET /api/nowcast/providers returned {len(r_providers.json())} data connectors.")

    print("\n*** ALL BACKEND AND ML TESTS PASSED PERFECTLY! ***")

if __name__ == "__main__":
    run_tests()
