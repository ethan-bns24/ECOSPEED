from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import math
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============================================================================
# PHYSICS CONSTANTS
# ============================================================================
GRAVITY = 9.81  # m/s²
AIR_DENSITY = 1.225  # kg/m³

# ============================================================================
# MODELS
# ============================================================================

class VehicleProfile(BaseModel):
    """Electric vehicle parameters for energy consumption calculations"""
    name: str
    empty_mass: float  # kg
    extra_load: float  # kg
    drag_coefficient: float  # Cd
    frontal_area: float  # m²
    rolling_resistance: float  # Crr
    motor_efficiency: float  # 0-1
    regen_efficiency: float  # 0-1

class RouteRequest(BaseModel):
    start: str
    end: str
    use_demo: bool = False
    vehicle_profile: VehicleProfile

class Segment(BaseModel):
    index: int
    distance: float  # meters
    elevation_start: float  # meters
    elevation_end: float  # meters
    speed_limit: float  # km/h
    eco_speed: float  # km/h
    real_speed: float  # km/h
    limit_energy: float  # kWh
    eco_energy: float  # kWh
    real_energy: float  # kWh
    limit_time: float  # seconds
    eco_time: float  # seconds
    real_time: float  # seconds
    lat_start: float
    lon_start: float
    lat_end: float
    lon_end: float

class RouteResponse(BaseModel):
    route_id: str
    segments: List[Segment]
    total_distance: float  # km
    demo_mode: bool
    start_location: str
    end_location: str

class KPIResponse(BaseModel):
    eco_energy: float  # kWh
    real_energy: float  # kWh
    limit_energy: float  # kWh
    energy_saved: float  # kWh
    energy_saved_percent: float  # %
    extra_time: float  # minutes
    co2_avoided: float  # kg
    total_distance: float  # km
    eco_time: float  # minutes
    real_time: float  # minutes
    limit_time: float  # minutes

# ============================================================================
# DEMO DATA - Le Havre → Versailles route
# ============================================================================

def get_demo_route() -> List[Dict[str, Any]]:
    """
    Returns a realistic Le Havre → Versailles route with ~200km distance.
    This is mock data for demo mode when API keys are not available.
    """
    # Approximate route: Le Havre → A13 → Versailles (200km)
    # Split into ~40 segments of 5km each
    
    base_segments = [
        # Le Havre exit (flat, urban)
        {"lat": 49.4944, "lon": 0.1079, "elevation": 5, "speed_limit": 50},
        {"lat": 49.4850, "lon": 0.1300, "elevation": 8, "speed_limit": 70},
        {"lat": 49.4700, "lon": 0.1600, "elevation": 12, "speed_limit": 90},
        
        # A13 motorway - slight hills
        {"lat": 49.4500, "lon": 0.2200, "elevation": 20, "speed_limit": 130},
        {"lat": 49.4300, "lon": 0.3000, "elevation": 35, "speed_limit": 130},
        {"lat": 49.4100, "lon": 0.3800, "elevation": 45, "speed_limit": 130},
        {"lat": 49.3900, "lon": 0.4600, "elevation": 40, "speed_limit": 130},
        {"lat": 49.3700, "lon": 0.5400, "elevation": 30, "speed_limit": 130},
        {"lat": 49.3500, "lon": 0.6200, "elevation": 25, "speed_limit": 130},
        {"lat": 49.3300, "lon": 0.7000, "elevation": 35, "speed_limit": 130},
        
        # Continuing on A13
        {"lat": 49.3100, "lon": 0.7800, "elevation": 50, "speed_limit": 130},
        {"lat": 49.2900, "lon": 0.8600, "elevation": 60, "speed_limit": 130},
        {"lat": 49.2700, "lon": 0.9400, "elevation": 55, "speed_limit": 130},
        {"lat": 49.2500, "lon": 1.0200, "elevation": 45, "speed_limit": 130},
        {"lat": 49.2300, "lon": 1.1000, "elevation": 40, "speed_limit": 130},
        {"lat": 49.2100, "lon": 1.1800, "elevation": 50, "speed_limit": 130},
        {"lat": 49.1900, "lon": 1.2600, "elevation": 65, "speed_limit": 130},
        {"lat": 49.1700, "lon": 1.3400, "elevation": 70, "speed_limit": 130},
        {"lat": 49.1500, "lon": 1.4200, "elevation": 60, "speed_limit": 130},
        {"lat": 49.1300, "lon": 1.5000, "elevation": 50, "speed_limit": 130},
        
        # Mid-route
        {"lat": 49.1100, "lon": 1.5800, "elevation": 55, "speed_limit": 130},
        {"lat": 49.0900, "lon": 1.6600, "elevation": 65, "speed_limit": 130},
        {"lat": 49.0700, "lon": 1.7400, "elevation": 75, "speed_limit": 130},
        {"lat": 49.0500, "lon": 1.8200, "elevation": 80, "speed_limit": 130},
        {"lat": 49.0300, "lon": 1.9000, "elevation": 75, "speed_limit": 130},
        {"lat": 49.0100, "lon": 1.9800, "elevation": 65, "speed_limit": 130},
        {"lat": 48.9900, "lon": 2.0600, "elevation": 60, "speed_limit": 130},
        {"lat": 48.9700, "lon": 2.1400, "elevation": 70, "speed_limit": 130},
        {"lat": 48.9500, "lon": 2.2200, "elevation": 85, "speed_limit": 130},
        {"lat": 48.9300, "lon": 2.3000, "elevation": 90, "speed_limit": 130},
        
        # Approaching Versailles area
        {"lat": 48.9100, "lon": 2.3800, "elevation": 85, "speed_limit": 130},
        {"lat": 48.8950, "lon": 2.4500, "elevation": 80, "speed_limit": 110},
        {"lat": 48.8800, "lon": 2.5000, "elevation": 75, "speed_limit": 90},
        {"lat": 48.8650, "lon": 2.5500, "elevation": 70, "speed_limit": 90},
        {"lat": 48.8500, "lon": 2.6000, "elevation": 80, "speed_limit": 90},
        {"lat": 48.8350, "lon": 2.6500, "elevation": 95, "speed_limit": 90},
        {"lat": 48.8200, "lon": 2.7000, "elevation": 110, "speed_limit": 90},
        
        # Entering Versailles (hills, slower)
        {"lat": 48.8100, "lon": 2.7500, "elevation": 120, "speed_limit": 70},
        {"lat": 48.8050, "lon": 2.8000, "elevation": 130, "speed_limit": 50},
        {"lat": 48.8014, "lon": 2.1301, "elevation": 135, "speed_limit": 50},  # Versailles center
    ]
    
    return base_segments

# ============================================================================
# PHYSICS CALCULATIONS
# ============================================================================

def calculate_segment_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS points using Haversine formula.
    Returns distance in meters.
    """
    R = 6371000  # Earth radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def calculate_energy_consumption(
    speed_kmh: float,
    distance_m: float,
    elevation_change_m: float,
    vehicle: VehicleProfile
) -> float:
    """
    Calculate energy consumption for a segment using physics-based model.
    
    Forces considered:
    1. Gravity force (uphill/downhill)
    2. Rolling resistance
    3. Aerodynamic drag
    4. Inertia (simplified)
    
    Returns energy in kWh.
    """
    if speed_kmh <= 0:
        return 0.0
    
    # Convert speed to m/s
    speed_ms = speed_kmh / 3.6
    
    # Total vehicle mass
    total_mass = vehicle.empty_mass + vehicle.extra_load
    
    # Time to travel this segment (seconds)
    time_s = distance_m / speed_ms if speed_ms > 0 else 0
    
    # Calculate slope angle
    if distance_m > 0:
        slope = elevation_change_m / distance_m
    else:
        slope = 0
    
    # 1. Gravity force (positive uphill, negative downhill)
    F_gravity = total_mass * GRAVITY * slope
    
    # 2. Rolling resistance force
    F_rolling = vehicle.rolling_resistance * total_mass * GRAVITY * math.cos(math.atan(slope))
    
    # 3. Aerodynamic drag force
    F_aero = 0.5 * AIR_DENSITY * vehicle.drag_coefficient * vehicle.frontal_area * (speed_ms ** 2)
    
    # Total resistance force
    F_total = F_gravity + F_rolling + F_aero
    
    # Power required (Watts)
    power_w = F_total * speed_ms
    
    # Energy (Watt-seconds = Joules)
    energy_j = power_w * time_s
    
    # Convert to kWh
    energy_kwh = energy_j / (3600 * 1000)
    
    # Apply motor efficiency (or regen efficiency if negative)
    if energy_kwh > 0:
        # Consuming energy (uphill/flat)
        energy_kwh = energy_kwh / vehicle.motor_efficiency
    else:
        # Recovering energy (downhill)
        energy_kwh = energy_kwh * vehicle.regen_efficiency
    
    return energy_kwh

def calculate_eco_speed(
    distance_m: float,
    elevation_change_m: float,
    speed_limit_kmh: float,
    vehicle: VehicleProfile,
    min_speed_kmh: float = 60.0
) -> float:
    """
    Calculate optimized eco-speed for a segment.
    
    Strategy:
    - Uphill: reduce speed to minimize power demand (but not below min_speed)
    - Downhill: moderate speed to maximize regen benefits
    - Flat: slightly below speed limit for optimal efficiency
    
    Returns speed in km/h.
    """
    slope = elevation_change_m / distance_m if distance_m > 0 else 0
    
    if slope > 0.02:  # Significant uphill (>2% grade)
        # Reduce speed significantly on uphill
        eco_speed = max(min_speed_kmh, speed_limit_kmh * 0.65)
    elif slope < -0.02:  # Significant downhill
        # Moderate speed to balance safety and regen
        eco_speed = min(speed_limit_kmh * 0.85, 110)
    else:  # Flat terrain
        # Slightly below limit for efficiency
        eco_speed = speed_limit_kmh * 0.88
    
    # Ensure eco_speed is within reasonable bounds
    eco_speed = max(min_speed_kmh, min(eco_speed, speed_limit_kmh))
    
    return round(eco_speed, 1)

def simulate_real_speed(
    speed_limit_kmh: float,
    eco_speed_kmh: float,
    segment_index: int
) -> float:
    """
    Simulate realistic driver behavior.
    
    Real speed is typically:
    - Close to speed limit on motorways
    - More variable in urban areas
    - Sometimes above or below limit
    """
    # Use segment index as seed for consistent but varied behavior
    random.seed(segment_index)
    
    # Base: slightly below limit
    base_speed = speed_limit_kmh * 0.92
    
    # Add random variation (-10% to +5%)
    variation = random.uniform(-0.10, 0.05)
    real_speed = base_speed * (1 + variation)
    
    # Clamp to reasonable range
    real_speed = max(50, min(real_speed, speed_limit_kmh * 1.05))
    
    return round(real_speed, 1)

# ============================================================================
# API ENDPOINTS
# ============================================================================

@api_router.get("/")
async def root():
    return {"message": "Ecospeed API - Green Driving Optimizer for Electric Vehicles"}

@api_router.get("/vehicle-profiles")
async def get_vehicle_profiles() -> List[VehicleProfile]:
    """
    Get predefined EV vehicle profiles.
    """
    profiles = [
        VehicleProfile(
            name="Tesla Model 3",
            empty_mass=1611,
            extra_load=150,
            drag_coefficient=0.23,
            frontal_area=2.22,
            rolling_resistance=0.007,
            motor_efficiency=0.90,
            regen_efficiency=0.70
        ),
        VehicleProfile(
            name="Nissan Leaf",
            empty_mass=1580,
            extra_load=150,
            drag_coefficient=0.28,
            frontal_area=2.27,
            rolling_resistance=0.008,
            motor_efficiency=0.87,
            regen_efficiency=0.65
        ),
        VehicleProfile(
            name="Renault Zoe",
            empty_mass=1468,
            extra_load=150,
            drag_coefficient=0.29,
            frontal_area=2.13,
            rolling_resistance=0.0075,
            motor_efficiency=0.88,
            regen_efficiency=0.68
        ),
        VehicleProfile(
            name="Custom",
            empty_mass=1600,
            extra_load=150,
            drag_coefficient=0.28,
            frontal_area=2.2,
            rolling_resistance=0.008,
            motor_efficiency=0.88,
            regen_efficiency=0.68
        )
    ]
    return profiles

@api_router.post("/route")
async def calculate_route(request: RouteRequest) -> RouteResponse:
    """
    Calculate route with eco-speed optimization.
    
    If use_demo=True or if routing API is not configured,
    returns demo route (Le Havre → Versailles).
    """
    route_id = str(uuid.uuid4())
    
    # For now, always use demo mode (API integration can be added later)
    demo_points = get_demo_route()
    
    segments = []
    
    for i in range(len(demo_points) - 1):
        p1 = demo_points[i]
        p2 = demo_points[i + 1]
        
        # Calculate segment distance
        distance_m = calculate_segment_distance(
            p1["lat"], p1["lon"],
            p2["lat"], p2["lon"]
        )
        
        elevation_change = p2["elevation"] - p1["elevation"]
        speed_limit = p2["speed_limit"]
        
        # Calculate eco speed
        eco_speed = calculate_eco_speed(
            distance_m,
            elevation_change,
            speed_limit,
            request.vehicle_profile
        )
        
        # Simulate real speed
        real_speed = simulate_real_speed(speed_limit, eco_speed, i)
        
        # Calculate energy for each scenario
        limit_energy = calculate_energy_consumption(
            speed_limit, distance_m, elevation_change, request.vehicle_profile
        )
        eco_energy = calculate_energy_consumption(
            eco_speed, distance_m, elevation_change, request.vehicle_profile
        )
        real_energy = calculate_energy_consumption(
            real_speed, distance_m, elevation_change, request.vehicle_profile
        )
        
        # Calculate time for each scenario (in seconds)
        limit_time = (distance_m / (speed_limit / 3.6)) if speed_limit > 0 else 0
        eco_time = (distance_m / (eco_speed / 3.6)) if eco_speed > 0 else 0
        real_time = (distance_m / (real_speed / 3.6)) if real_speed > 0 else 0
        
        segment = Segment(
            index=i,
            distance=distance_m,
            elevation_start=p1["elevation"],
            elevation_end=p2["elevation"],
            speed_limit=speed_limit,
            eco_speed=eco_speed,
            real_speed=real_speed,
            limit_energy=limit_energy,
            eco_energy=eco_energy,
            real_energy=real_energy,
            limit_time=limit_time,
            eco_time=eco_time,
            real_time=real_time,
            lat_start=p1["lat"],
            lon_start=p1["lon"],
            lat_end=p2["lat"],
            lon_end=p2["lon"]
        )
        segments.append(segment)
    
    # Calculate total distance
    total_distance_m = sum(s.distance for s in segments)
    total_distance_km = total_distance_m / 1000
    
    return RouteResponse(
        route_id=route_id,
        segments=segments,
        total_distance=round(total_distance_km, 2),
        demo_mode=True,
        start_location="Le Havre, France" if request.use_demo else request.start,
        end_location="Versailles, France" if request.use_demo else request.end
    )

@api_router.get("/route/{route_id}/kpis")
async def get_route_kpis(route_id: str) -> KPIResponse:
    """
    This is a placeholder. In a real implementation, you would:
    1. Retrieve the route from database using route_id
    2. Calculate KPIs based on actual segment data
    
    For now, we'll compute from a demo route.
    """
    # This endpoint would normally fetch stored route data
    # For simplicity, we're returning placeholder KPIs
    raise HTTPException(status_code=501, detail="KPI calculation should be done on frontend based on route segments")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()