"""
Abstract Base Classes establishing strict contracts for weather data providers.
Allows seamless plug-in of real radar (NEXRAD), satellite (GOES-16 ABI),
lightning (GOES GLM, Blitzortung), and NWP soundings (HRRR, GFS).
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple
import numpy as np

class BaseRadarProvider(ABC):
    """Interface for Doppler Composite Reflectivity Grids and Radial Velocity."""
    
    @abstractmethod
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
        """Returns 2D grid of radar reflectivity in dBZ [-10 to 75]."""
        pass

    @abstractmethod
    def get_provider_metadata(self) -> Dict[str, Any]:
        """Returns metadata regarding data source, radar stations, and sweep time."""
        pass


class BaseSatelliteProvider(ABC):
    """Interface for Geostationary Satellite Cloud Top Properties (e.g. GOES ABI Band 13)."""
    
    @abstractmethod
    def get_cloud_top_temperature(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int
    ) -> np.ndarray:
        """Returns 2D grid of Brightness Temperature in Celsius (-80 to 30 C)."""
        pass

    @abstractmethod
    def get_cooling_rate_15min(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        grid_rows: int,
        grid_cols: int
    ) -> np.ndarray:
        """Returns 2D grid of 15-minute temperature drop rate (indicating rapid updraft growth)."""
        pass


class BaseLightningProvider(ABC):
    """Interface for Total Lightning Flashes (Intra-cloud and Cloud-to-ground)."""
    
    @abstractmethod
    def get_recent_strikes(
        self,
        min_lat: float,
        max_lat: float,
        min_lon: float,
        max_lon: float,
        window_minutes: int = 15
    ) -> List[Dict[str, Any]]:
        """Returns list of strike events (lat, lon, epoch, polarity, peak_current_ka, strike_type)."""
        pass

    @abstractmethod
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
        """Returns 2D grid of strike rate (strikes / km^2 / hr)."""
        pass


class BaseAtmosphericProvider(ABC):
    """Interface for NWP Atmospheric Soundings and Stability Indices (e.g. HRRR, RAP)."""
    
    @abstractmethod
    def get_thermodynamic_profile(self, lat: float, lon: float) -> Dict[str, float]:
        """Returns CAPE, CIN, Lifted Index, Bulk Wind Shear (0-6 km), Precipitable Water."""
        pass

    @abstractmethod
    def get_steering_flow(self, lat: float, lon: float) -> Tuple[float, float]:
        """Returns (speed_knots, direction_degrees) of the 700-500mb mean storm steering wind."""
        pass
