"""
High-fidelity Physical Convective Simulation Provider.
Generates realistic radar reflectivity, satellite IR, lightning strikes,
and thermodynamic parameters across various meteorological scenarios.
"""
from typing import List, Dict, Any, Tuple
import numpy as np
import math
import time
from app.providers.base import (
    BaseRadarProvider,
    BaseSatelliteProvider,
    BaseLightningProvider,
    BaseAtmosphericProvider
)

class SyntheticConvectiveProvider(
    BaseRadarProvider,
    BaseSatelliteProvider,
    BaseLightningProvider,
    BaseAtmosphericProvider
):
    def __init__(self, scenario_id: str = "squall_line"):
        self.scenario_id = scenario_id
        self._init_scenarios()

    def set_scenario(self, scenario_id: str):
        if scenario_id in self.scenarios:
            self.scenario_id = scenario_id

    def _init_scenarios(self):
        self.scenarios = {
            "squall_line": {
                "name": "Severe Linear Mesoscale Convective System (Squall Line)",
                "description": "Fast-moving bow echo line with severe winds, hail, and intense lightning front sweeping east-northeast.",
                "severity_level": "extreme",
                "dominant_features": ["Leading Gust Front", "Bow Echo Core", "Trailing Stratiform", "High Flash Rate"],
                "cape": 3100.0,
                "shear_0_6km": 48.0,
                "lifted_index": -7.5,
                "cells": [
                    {"id": "SL-01", "name": "Northern Core - Des Moines Valley", "base_lat": 40.8, "base_lon": -95.6, "speed_kt": 38.0, "dir_deg": 245.0, "peak_dbz": 58.0, "sigma_lat": 0.22, "sigma_lon": 0.16, "flash_rate": 35, "trend": "steady"},
                    {"id": "SL-02", "name": "Central Apex Bow Echo - St. Joseph/KC", "base_lat": 39.7, "base_lon": -95.2, "speed_kt": 44.0, "dir_deg": 250.0, "peak_dbz": 64.0, "sigma_lat": 0.26, "sigma_lon": 0.18, "flash_rate": 65, "trend": "intensifying"},
                    {"id": "SL-03", "name": "Southern Convective Flank - Clinton", "base_lat": 38.4, "base_lon": -94.7, "speed_kt": 36.0, "dir_deg": 240.0, "peak_dbz": 56.0, "sigma_lat": 0.24, "sigma_lon": 0.19, "flash_rate": 28, "trend": "steady"},
                    {"id": "SL-04", "name": "Secondary Inflow Flank - Sedalia", "base_lat": 38.9, "base_lon": -93.8, "speed_kt": 34.0, "dir_deg": 245.0, "peak_dbz": 49.0, "sigma_lat": 0.18, "sigma_lon": 0.15, "flash_rate": 18, "trend": "initiating"}
                ]
            },
            "supercell": {
                "name": "Isolated Right-Moving Supercell with Hook Echo",
                "description": "Explosive discrete supercell tracking along warm front with extreme hail risk (>2 in) and concentrated lightning core.",
                "severity_level": "extreme",
                "dominant_features": ["Hook Echo & BWER", "Mesocyclone Rotation", "Giant Hail Core", "Flash Jump"],
                "cape": 3800.0,
                "shear_0_6km": 55.0,
                "lifted_index": -9.0,
                "cells": [
                    {"id": "SC-01", "name": "Primary Dominant Supercell - Lawrence / KC Metro", "base_lat": 39.1, "base_lon": -95.4, "speed_kt": 28.0, "dir_deg": 265.0, "peak_dbz": 67.0, "sigma_lat": 0.28, "sigma_lon": 0.25, "flash_rate": 85, "trend": "intensifying"},
                    {"id": "SC-02", "name": "Flanking Line Inflow Cluster", "base_lat": 38.5, "base_lon": -95.8, "speed_kt": 26.0, "dir_deg": 260.0, "peak_dbz": 51.0, "sigma_lat": 0.18, "sigma_lon": 0.15, "flash_rate": 22, "trend": "steady"}
                ]
            },
            "convective_initiation": {
                "name": "Dryline Convective Initiation & Cell Development",
                "description": "Rapid afternoon cloud top cooling along dryline with initial cumulus congestus erupting into vigorous severe multicells.",
                "severity_level": "moderate",
                "dominant_features": ["Rapid Cloud-Top Cooling", "Pre-Radar Updrafts", "Cell Explosive Growth", "Boundary Convergence"],
                "cape": 2400.0,
                "shear_0_6km": 35.0,
                "lifted_index": -5.5,
                "cells": [
                    {"id": "CI-01", "name": "Topeka Dryline Initiation Core", "base_lat": 39.3, "base_lon": -95.9, "speed_kt": 22.0, "dir_deg": 240.0, "peak_dbz": 38.0, "sigma_lat": 0.15, "sigma_lon": 0.12, "flash_rate": 12, "trend": "initiating"},
                    {"id": "CI-02", "name": "Emporia Boundary Merger", "base_lat": 38.5, "base_lon": -96.1, "speed_kt": 20.0, "dir_deg": 235.0, "peak_dbz": 35.0, "sigma_lat": 0.14, "sigma_lon": 0.12, "flash_rate": 8, "trend": "initiating"}
                ]
            },
            "pulse_thunderstorms": {
                "name": "Summer High-CAPE Pulse Thunderstorms & Microbursts",
                "description": "Pop-up multi-cellular storms in high humidity and weak shear, producing short-lived microbursts and frequent cloud-to-ground lightning.",
                "severity_level": "slight",
                "dominant_features": ["Localized Downbursts", "Stochastic Updrafts", "High Precipitation", "Frequent CG Lightning"],
                "cape": 2900.0,
                "shear_0_6km": 18.0,
                "lifted_index": -6.0,
                "cells": [
                    {"id": "PL-01", "name": "Columbia Pulse Cell", "base_lat": 38.9, "base_lon": -92.4, "speed_kt": 12.0, "dir_deg": 210.0, "peak_dbz": 52.0, "sigma_lat": 0.18, "sigma_lon": 0.18, "flash_rate": 20, "trend": "weakening"},
                    {"id": "PL-02", "name": "Chillicothe Updraft Cell", "base_lat": 39.8, "base_lon": -93.6, "speed_kt": 14.0, "dir_deg": 220.0, "peak_dbz": 55.0, "sigma_lat": 0.20, "sigma_lon": 0.19, "flash_rate": 24, "trend": "steady"},
                    {"id": "PL-03", "name": "Jefferson City Cluster", "base_lat": 38.5, "base_lon": -92.2, "speed_kt": 10.0, "dir_deg": 200.0, "peak_dbz": 48.0, "sigma_lat": 0.16, "sigma_lon": 0.16, "flash_rate": 15, "trend": "initiating"}
                ]
            }
        }

    def _get_advected_cell_position(self, cell: Dict[str, Any], lead_time_min: int) -> Tuple[float, float, float, float]:
        """
        Calculates advected lat, lon, peak_dbz, and flash rate for a cell at lead_time_min.
        Applies semi-Lagrangian advection and life-cycle growth/decay kinetics.
        """
        speed_kt = cell["speed_kt"]
        dir_deg = cell["dir_deg"]
        
        # 1 knot = 1.852 km/h
        # 1 deg lat ~ 111.1 km; 1 deg lon ~ 85.7 km at 39.5 deg N
        dt_hours = lead_time_min / 60.0
        v_rad = math.radians(dir_deg)
        
        # Meteorological direction: dir_deg is the direction the wind/storm is coming FROM.
        # Advection movement vector points towards: (dir_deg - 180) degrees
        motion_rad = math.radians((dir_deg - 180.0) % 360.0)
        vx_kmh = speed_kt * 1.852 * math.sin(motion_rad)
        vy_kmh = speed_kt * 1.852 * math.cos(motion_rad)
        
        d_lat = (vy_kmh * dt_hours) / 111.1
        d_lon = (vx_kmh * dt_hours) / 85.7
        
        lat = cell["base_lat"] + d_lat
        lon = cell["base_lon"] + d_lon
        
        # Growth / decay curve based on cell trend and lead time
        trend = cell.get("trend", "steady")
        peak_dbz = cell["peak_dbz"]
        flash_rate = cell["flash_rate"]
        
        if trend == "intensifying":
            # Intensifies up to +60 min, then plateaus
            factor = min(1.25, 1.0 + (lead_time_min / 120.0) * 0.35)
            peak_dbz = min(72.0, peak_dbz * factor)
            flash_rate = int(flash_rate * factor * factor)
        elif trend == "initiating":
            # Rapid growth from shallow cumulus to severe core over 60 min
            growth = (lead_time_min / 60.0)
            peak_dbz = min(62.0, peak_dbz + growth * 18.0)
            flash_rate = int(flash_rate + growth * 35.0)
        elif trend == "weakening":
            # Decays over 120 min
            decay = max(0.4, 1.0 - (lead_time_min / 120.0) * 0.5)
            peak_dbz = max(20.0, peak_dbz * decay)
            flash_rate = max(1, int(flash_rate * decay))
        else: # steady
            # Slight natural pulse cycle
            pulse = math.sin(lead_time_min * 0.05) * 2.0
            peak_dbz = peak_dbz + pulse
            flash_rate = max(5, int(flash_rate + pulse * 3))

        return lat, lon, peak_dbz, flash_rate

    def get_cells_for_lead_time(self, lead_time_min: int) -> List[Dict[str, Any]]:
        scenario = self.scenarios.get(self.scenario_id, self.scenarios["squall_line"])
        output_cells = []
        
        for c in scenario["cells"]:
            lat, lon, dbz, fr = self._get_advected_cell_position(c, lead_time_min)
            
            # Generate projected track points (0 to 120 min)
            track_points = []
            for t_step in [0, 15, 30, 45, 60, 75, 90, 105, 120]:
                t_lat, t_lon, t_dbz, _ = self._get_advected_cell_position(c, t_step)
                # Uncertainty radius expands with lead time
                u_radius = 4.0 + (t_step / 120.0) * 18.0
                track_points.append({
                    "lead_time_min": t_step,
                    "lat": round(t_lat, 4),
                    "lon": round(t_lon, 4),
                    "max_dbz": round(t_dbz, 1),
                    "uncertainty_radius_km": round(u_radius, 1)
                })

            # Determine severity classification
            if dbz >= 62 or fr >= 50:
                sev = "extreme"
            elif dbz >= 52 or fr >= 25:
                sev = "severe"
            elif dbz >= 42 or fr >= 10:
                sev = "moderate"
            elif dbz >= 35:
                sev = "slight"
            else:
                sev = "marginal"

            # Downburst and hail probabilities
            hail_prob = int(min(98, max(5, (dbz - 42) * 3.6))) if dbz >= 42 else 0
            downburst_prob = int(min(95, max(5, (dbz - 40) * 3.2))) if dbz >= 40 else 0

            output_cells.append({
                "id": c["id"],
                "name": c["name"],
                "current_lat": round(lat, 4),
                "current_lon": round(lon, 4),
                "speed_kt": c["speed_kt"],
                "direction_deg": c["dir_deg"],
                "max_dbz": round(dbz, 1),
                "echotop_kft": round(30.0 + (dbz / 65.0) * 22.0, 1),
                "flash_rate_min": fr,
                "hail_prob_pct": hail_prob,
                "downburst_prob_pct": downburst_prob,
                "severity": sev,
                "trend": c.get("trend", "steady"),
                "track": track_points,
                "sigma_lat": c["sigma_lat"],
                "sigma_lon": c["sigma_lon"]
            })
            
        return output_cells

    def get_reflectivity_grid(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int,
        lead_time_min: int = 0
    ) -> np.ndarray:
        """
        Synthesizes composite radar reflectivity grid (dBZ) using Gaussian convective cores
        and realistic anisotropic stratiform rain shields.
        """
        lats = np.linspace(min_lat, max_lat, grid_rows)
        lons = np.linspace(min_lon, max_lon, grid_cols)
        lon_mesh, lat_mesh = np.meshgrid(lons, lats)
        
        # Base background noise (-5 to 5 dBZ)
        grid = np.random.uniform(-5.0, 5.0, size=(grid_rows, grid_cols)).astype(np.float32)
        
        cells = self.get_cells_for_lead_time(lead_time_min)
        
        for c in cells:
            c_lat = c["current_lat"]
            c_lon = c["current_lon"]
            peak_dbz = c["max_dbz"]
            s_lat = c["sigma_lat"]
            s_lon = c["sigma_lon"]
            
            # Distance metric with orientation alignment
            dir_rad = math.radians(c["direction_deg"])
            dx = (lon_mesh - c_lon) * 85.7
            dy = (lat_mesh - c_lat) * 111.1
            
            # Anisotropic elongation along squall line / frontal axis
            rot_x = dx * math.cos(dir_rad) + dy * math.sin(dir_rad)
            rot_y = -dx * math.sin(dir_rad) + dy * math.cos(dir_rad)
            
            # Core Gaussian profile
            dist_sq = (rot_x / (s_lon * 90.0)) ** 2 + (rot_y / (s_lat * 120.0)) ** 2
            core_contribution = peak_dbz * np.exp(-0.5 * dist_sq)
            
            # Trailing stratiform precipitation shield behind the core
            stratiform_offset_x = rot_x - 12.0
            stratiform_dist_sq = (stratiform_offset_x / (s_lon * 180.0)) ** 2 + (rot_y / (s_lat * 180.0)) ** 2
            stratiform_contribution = (peak_dbz * 0.55) * np.exp(-0.5 * stratiform_dist_sq)
            
            cell_dbz = np.maximum(core_contribution, stratiform_contribution)
            grid = np.maximum(grid, cell_dbz)

        # Clip values to physically realistic radar limits (-10 to 75 dBZ)
        return np.clip(grid, -10.0, 75.0)

    def get_cloud_top_temperature(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int
    ) -> np.ndarray:
        """IR Brightness Temperature (-80C to 20C). Inverted relation to dBZ echotop."""
        ref_grid = self.get_reflectivity_grid(min_lat, max_lat, min_lon, max_lon, grid_rows, grid_cols, lead_time_min=0)
        # Deep convection reaches tropopause (-65 to -75 C)
        ir_grid = 15.0 - (np.clip(ref_grid, 0, 70) / 70.0) * 85.0
        return ir_grid.astype(np.float32)

    def get_cooling_rate_15min(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int
    ) -> np.ndarray:
        scenario = self.scenarios.get(self.scenario_id, self.scenarios["squall_line"])
        cooling = np.zeros((grid_rows, grid_cols), dtype=np.float32)
        if self.scenario_id == "convective_initiation":
            # Strong cooling rate up to -12 C / 15 min where cells initiate
            cooling -= np.random.uniform(4.0, 11.5, size=(grid_rows, grid_cols))
        return cooling

    def get_recent_strikes(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        window_minutes: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Generates realistic lightning strike events around active convective cores.
        """
        cells = self.get_cells_for_lead_time(0)
        strikes = []
        strike_counter = 1
        now_epoch = time.time()
        
        for c in cells:
            fr = c["flash_rate_min"]
            # Total strikes over the window proportional to flash rate
            num_strikes = int(fr * (window_minutes / 2.5))
            c_lat = c["current_lat"]
            c_lon = c["current_lon"]
            
            for _ in range(num_strikes):
                # Spatial jitter around core
                jitter_lat = np.random.normal(0, c["sigma_lat"] * 0.65)
                jitter_lon = np.random.normal(0, c["sigma_lon"] * 0.65)
                s_lat = round(float(c_lat + jitter_lat), 4)
                s_lon = round(float(c_lon + jitter_lon), 4)
                
                # Filter if outside bounds
                if not (min_lat <= s_lat <= max_lat and min_lon <= s_lon <= max_lon):
                    continue
                
                age_sec = int(np.random.uniform(0, window_minutes * 60))
                # 80% IC (Intra-cloud), 20% CG (Cloud-to-ground)
                s_type = "CG" if np.random.random() < 0.25 else "IC"
                polarity = "+" if np.random.random() < 0.12 else "-"
                peak_ka = round(float(np.random.exponential(22.0) + 8.0), 1)
                
                strikes.append({
                    "id": f"FL-{strike_counter:04d}",
                    "lat": s_lat,
                    "lon": s_lon,
                    "timestamp_epoch": now_epoch - age_sec,
                    "age_seconds": age_sec,
                    "strike_type": s_type,
                    "polarity": polarity,
                    "peak_current_ka": peak_ka
                })
                strike_counter += 1

        # Sort with freshest strikes first
        strikes.sort(key=lambda s: s["age_seconds"])
        return strikes

    def get_flash_density_grid(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int,
        lead_time_min: int = 0
    ) -> np.ndarray:
        ref = self.get_reflectivity_grid(min_lat, max_lat, min_lon, max_lon, grid_rows, grid_cols, lead_time_min)
        # Flash density roughly scales exponentially with reflectivity above 35 dBZ
        density = np.where(ref > 35.0, np.exp((ref - 35.0) / 7.5), 0.0)
        return density.astype(np.float32)

    def get_thermodynamic_profile(self, lat: float, lon: float) -> Dict[str, float]:
        scenario = self.scenarios.get(self.scenario_id, self.scenarios["squall_line"])
        return {
            "cape_jkg": scenario["cape"],
            "shear_0_6km_kt": scenario["shear_0_6km"],
            "lifted_index": scenario["lifted_index"],
            "cin_jkg": -25.0,
            "precipitable_water_mm": 42.0
        }

    def get_steering_flow(self, lat: float, lon: float) -> Tuple[float, float]:
        return (35.0, 245.0)

    def get_provider_metadata(self) -> Dict[str, Any]:
        return {
            "source": "Physical Convective Simulation Engine (Synthetic)",
            "scenario": self.scenarios[self.scenario_id]["name"],
            "update_interval_sec": 60,
            "status": "active"
        }
