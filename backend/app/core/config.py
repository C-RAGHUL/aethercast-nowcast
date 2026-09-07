"""
Core configuration settings for the AI/ML Thunderstorm & Lightning Nowcasting System.
"""
from pydantic import BaseModel
from typing import List, Dict, Any

class Settings(BaseModel):
    PROJECT_NAME: str = "AetherCast - AI Thunderstorm & Lightning Nowcasting"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Geographic Domain (Central Plains / Midwest Storm Corridor)
    # Centered around Kansas City / Missouri Valley
    MIN_LAT: float = 37.5
    MAX_LAT: float = 41.5
    MIN_LON: float = -96.5
    MAX_LON: float = -91.5
    GRID_ROWS: int = 50
    GRID_COLS: int = 60
    
    # Temporal Nowcasting Window (0 to 120 minutes)
    NOWCAST_STEPS_MIN: List[int] = [0, 15, 30, 45, 60, 75, 90, 105, 120]
    
    # Risk Classification Thresholds (Probability 0.0 - 1.0)
    RISK_THRESHOLD_LOW: float = 0.25      # 25% - 50%
    RISK_THRESHOLD_MEDIUM: float = 0.50   # 50% - 75%
    RISK_THRESHOLD_HIGH: float = 0.75     # > 75%
    
    # Meteorological Severity Thresholds
    SEVERE_DBZ_THRESHOLD: float = 45.0    # dBZ for severe convective core
    EXTREME_DBZ_THRESHOLD: float = 55.0   # dBZ for hail / supercell core
    SEVERE_FLASH_RATE_PER_MIN: int = 25   # Total lightning strikes/min
    EXTREME_FLASH_RATE_PER_MIN: int = 60  # Flash jump indicative of severe wind/hail
    
    # Provider Settings
    ACTIVE_PROVIDER: str = "synthetic"  # synthetic | nexrad_live | goes_live
    NEXRAD_RADAR_ID: str = "KEAX"       # Pleasant Hill / Kansas City NEXRAD
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

settings = Settings()
