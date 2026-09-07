"""
Standalone runner for the FastAPI backend server.
"""
import uvicorn
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    reload = os.environ.get("ENVIRONMENT", "development") == "development"
    print(f"Starting AetherCast Backend on http://{host}:{port} (reload={reload}) ...")
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
