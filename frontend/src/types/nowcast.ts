export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'extreme';

export interface GeoJsonGeometry {
  type: string;
  coordinates: number[][][];
}

export interface RiskZoneProperties {
  cell_id: string;
  cell_name: string;
  risk_level: RiskLevel;
  risk_label: string;
  probability_pct: number;
  color: string;
  fill_color: string;
  lead_time_min: number;
  projected_max_dbz: number;
  flash_density_km2_hr: number;
  hail_risk_pct: number;
  wind_gust_kt: number;
  advisory: string;
}

export interface GeoJsonFeature<T = any> {
  type: 'Feature';
  geometry: GeoJsonGeometry;
  properties: T;
}

export interface GeoJsonFeatureCollection<T = any> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<T>[];
}

export interface StormCellTrackPoint {
  lead_time_min: number;
  lat: number;
  lon: number;
  max_dbz: number;
  uncertainty_radius_km: number;
}

export interface StormCell {
  id: string;
  name: string;
  current_lat: number;
  current_lon: number;
  speed_kt: number;
  direction_deg: number;
  max_dbz: number;
  echotop_kft: number;
  flash_rate_min: number;
  hail_prob_pct: number;
  downburst_prob_pct: number;
  severity: 'marginal' | 'slight' | 'moderate' | 'severe' | 'extreme';
  trend: 'intensifying' | 'steady' | 'weakening' | 'initiating';
  track: StormCellTrackPoint[];
}

export interface LightningStrike {
  id: string;
  lat: number;
  lon: number;
  timestamp_epoch: number;
  age_seconds: number;
  strike_type: 'CG' | 'IC';
  polarity: '+' | '-';
  peak_current_ka: number;
}

export interface ForecastPayload {
  lead_time_min: number;
  timestamp_utc: string;
  scenario_id: string;
  scenario_name: string;
  risk_zones: GeoJsonFeatureCollection<RiskZoneProperties>;
  reflectivity_contours: GeoJsonFeatureCollection<{
    threshold_dbz: number;
    label: string;
    color: string;
    fill_color: string;
  }>;
  cells: StormCell[];
  lightning_strikes: LightningStrike[];
  domain_max_dbz: number;
  domain_flash_rate: number;
  model_confidence_pct: number;
}

export interface TimelineStep {
  lead_time_min: number;
  time_label: string;
  overall_risk: RiskLevel;
  active_cells: number;
  total_strikes: number;
  max_dbz: number;
}

export interface PointNowcastStep {
  lead_time_min: number;
  time_label: string;
  clock_time_ist?: string;
  thunderstorm_prob_pct: number;
  lightning_risk: RiskLevel;
  dbz: number;
  rain_rate_mm_hr: number;
  hail_prob_pct: number;
  wind_gust_kt: number;
}

export interface PointNowcastResponse {
  query_lat: number;
  query_lon: number;
  location_label: string;
  small_area_name?: string;
  district?: string;
  state?: string;
  eta_minutes?: number | null;
  eta_time_ist?: string;
  impact_status?: string;
  current_temp_c?: number;
  relative_humidity_pct?: number;
  precipitation_mm_hr?: number;
  wind_speed_kmh?: number;
  wind_direction_deg?: number;
  wind_gusts_kmh?: number;
  cloud_cover_pct?: number;
  surface_pressure_hpa?: number;
  observed_at_ist?: string;
  weather_condition?: string;
  cape_jkg: number;
  bulk_shear_0_6km_kt: number;
  lifted_index: number;
  cloud_top_temp_c: number;
  cooling_rate_c_15min: number;
  current_risk: RiskLevel;
  timeline: PointNowcastStep[];
  ai_attribution: Record<string, number>;
  advisory: string;
}

export interface ScenarioOption {
  id: string;
  name: string;
  description: string;
  severity_level: string;
  dominant_features: string[];
}

export interface ProviderStatus {
  provider_id: string;
  display_name: string;
  category: 'radar' | 'satellite' | 'lightning' | 'nwp';
  status: 'connected' | 'simulated' | 'standby' | 'error';
  source_endpoint: string;
  latency_ms: number;
  last_update_utc: string;
  coverage_area: string;
  integration_snippet: string;
}

export interface LiveStation {
  city: string;
  state: string;
  lat: number;
  lon: number;
  temperature_c: number;
  relative_humidity: number;
  cape_jkg: number;
  lifted_index: number;
  precipitation_mm: number;
  cloud_cover_pct: number;
  wind_kmh: number;
  wind_deg: number;
  wind_gusts_kmh: number;
  weather_code: number;
  condition: string;
  risk_level: RiskLevel;
  is_thunderstorm: boolean;
  is_rain: boolean;
  is_high_cape: boolean;
  is_live: boolean;
  observed_at_ist: string;
  impact_status?: string;
  eta_minutes?: number | null;
  eta_time_ist?: string;
  eta_countdown_str?: string;
  impact_summary?: string;
  distance_to_core_km?: number | null;
}

export interface ImdRadarStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state: string;
  type: string;
  range_km: number;
}

export interface LayerVisibility {
  riskZones: boolean;
  radarReflectivity: boolean;
  lightningStrikes: boolean;
  stormTracks: boolean;
  cities: boolean;
  liveRadar: boolean;
  imdRadars: boolean;
  liveStations: boolean;
}

export interface AreaSearchResult {
  name: string;
  district?: string;
  state?: string;
  display_name: string;
  lat: number;
  lon: number;
  is_monitored_station?: boolean;
  temp_c?: number;
  condition?: string;
  impact_status?: string;
  eta_time_ist?: string;
  humidity_pct?: number;
  wind_kmh?: number;
  precipitation_mm?: number;
}
