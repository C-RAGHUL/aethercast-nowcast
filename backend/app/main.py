"""
FastAPI Application Entrypoint for AI/ML Thunderstorm & Lightning Nowcasting.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.core.config import settings
from app.api.nowcast import router as nowcast_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI/ML-based Thunderstorm and Lightning Nowcasting System with 0-120 minute lead-time risk envelopes."
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(nowcast_router, prefix=settings.API_V1_STR)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check for production static frontend build (in ./static or ../frontend/dist)
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if not os.path.exists(STATIC_DIR):
    FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")
    if os.path.exists(FRONTEND_DIST):
        STATIC_DIR = FRONTEND_DIST

if os.path.exists(STATIC_DIR):
    assets_path = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api") or full_path == "docs" or full_path == "openapi.json":
            return {"error": "Not Found"}
        
        target_file = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)
        
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "online"}
else:
    @app.get("/")
    def root():
        return {
            "system": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs",
            "api_endpoints": {
                "forecast": f"{settings.API_V1_STR}/nowcast/forecast?lead_time=30",
                "timeline": f"{settings.API_V1_STR}/nowcast/timeline",
                "cells": f"{settings.API_V1_STR}/nowcast/cells",
                "strikes": f"{settings.API_V1_STR}/nowcast/strikes",
                "point_meteogram": f"{settings.API_V1_STR}/nowcast/point?lat=39.1&lon=-94.6",
                "scenarios": f"{settings.API_V1_STR}/nowcast/scenarios",
                "providers": f"{settings.API_V1_STR}/nowcast/providers",
                "metrics": f"{settings.API_V1_STR}/nowcast/model-metrics"
            },
            "server_time_utc": datetime.now(timezone.utc).isoformat()
        }

    @app.get("/health")
    def health_check():
        return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}
