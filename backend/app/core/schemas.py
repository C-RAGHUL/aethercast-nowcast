"""
Pydantic schemas and GeoJSON models for thunderstorm & lightning nowcasting.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal

class Geometry(BaseModel):
    type: str = "Polygon"
    coordinates: List[List[List[float]]]  # [[[lon, lat], ...]]

class GeoJsonFeature(BaseModel):
    type: str = "Feature"
    geometry: Geometry
    properties: Dict[str, Any]

class GeoJsonFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeature]

class StormCellTrackPoint(BaseModel):
    lead_time_min: int
    lat: float
    lon: float
    max_dbz: float
    uncertainty_radius_km: float

class StormCell(BaseModel):
    id: str
    name: str
    current_lat: float
    current_lon: float
    speed_kt: float
    direction_deg: float
    max_dbz: float
    echotop_kft: float
    flash_rate_min: int
    hail_prob_pct: int
    downburst_prob_pct: int
    severity: Literal["marginal", "slight", "moderate", "severe", "extreme"]
    trend: Literal["intensifying", "steady", "weakening", "initiating"]
    track: List[StormCellTrackPoint]

class LightningStrike(BaseModel):
    id: str
    lat: float
    lon: float
    timestamp_epoch: float
    age_seconds: int
    strike_type: Literal["CG", "IC"]  # Cloud-to-Ground or Intra-Cloud
    polarity: Literal["+", "-"]
    peak_current_ka: float

class RadarGridPoint(BaseModel):
    lat: float
    lon: float
    dbz: float

class ForecastPayload(BaseModel):
    lead_time_min: int
    timestamp_utc: str
    scenario_id: str
    scenario_name: str
    risk_zones: GeoJsonFeatureCollection
    reflectivity_contours: GeoJsonFeatureCollection
    cells: List[StormCell]
    lightning_strikes: List[LightningStrike]
    domain_max_dbz: float
    domain_flash_rate: int
    model_confidence_pct: int

class TimelineStep(BaseModel):
    lead_time_min: int
    time_label: str
    overall_risk: Literal["low", "medium", "high", "extreme"]
    active_cells: int
    total_strikes: int
    max_dbz: float

class PointNowcastStep(BaseModel):
    lead_time_min: int
    time_label: str
    clock_time_ist: Optional[str] = None
    thunderstorm_prob_pct: int
    lightning_risk: Literal["none", "low", "medium", "high", "extreme"]
    dbz: float
    rain_rate_mm_hr: float
    hail_prob_pct: int
    wind_gust_kt: int

class PointNowcastResponse(BaseModel):
    query_lat: float
    query_lon: float
    location_label: str
    small_area_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    eta_minutes: Optional[int] = None
    eta_time_ist: Optional[str] = None
    impact_status: Optional[str] = None
    current_temp_c: Optional[float] = None
    relative_humidity_pct: Optional[float] = None
    precipitation_mm_hr: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    wind_gusts_kmh: Optional[float] = None
    cloud_cover_pct: Optional[int] = None
    surface_pressure_hpa: Optional[float] = None
    observed_at_ist: Optional[str] = None
    weather_condition: Optional[str] = None
    cape_jkg: float
    bulk_shear_0_6km_kt: float
    lifted_index: float
    cloud_top_temp_c: float
    cooling_rate_c_15min: float
    current_risk: Literal["none", "low", "medium", "high", "extreme"]
    timeline: List[PointNowcastStep]
    ai_attribution: Dict[str, float]  # Feature importances/weights contributing to risk
    advisory: str

class ScenarioOption(BaseModel):
    id: str
    name: str
    description: str
    severity_level: str
    dominant_features: List[str]

class ProviderStatus(BaseModel):
    provider_id: str
    display_name: str
    category: Literal["radar", "satellite", "lightning", "nwp"]
    status: Literal["connected", "simulated", "standby", "error"]
    source_endpoint: str
    latency_ms: int
    last_update_utc: str
    coverage_area: str
    integration_snippet: str
