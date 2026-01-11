"""
Vercel Serverless Function Entry Point for ECOSPEED Backend
This file adapts the FastAPI app to work as a Vercel serverless function
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

# Set PYTHONPATH for imports
os.environ['PYTHONPATH'] = str(backend_dir)

# Import the FastAPI app
from server import app

# Vercel expects a handler function
# For FastAPI, we use Mangum adapter
try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except ImportError:
    # If mangum is not available, create a simple handler
    async def handler(request):
        return await app(request.scope, request.receive, request.send)

