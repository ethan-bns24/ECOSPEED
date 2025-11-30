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
import requests
import time
from geopy.geocoders import Nominatim

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
    empty_mass: float  # kg (mass_kg)
    extra_load: float  # kg (passengers weight)
    drag_coefficient: float  # Cd
    frontal_area: float  # m²
    rolling_resistance: float  # Crr
    motor_efficiency: float  # 0-1 (eta_drive)
    regen_efficiency: float  # 0-1
    aux_power_kw: float = 2.0  # kW (auxiliary power for HVAC, etc.)
    battery_kwh: float = 60.0  # kWh (battery capacity)

class RouteRequest(BaseModel):
    start: str
    end: str
    vehicle_profile: VehicleProfile
    user_max_speed: int = 130  # Maximum speed limit in km/h
    num_passengers: int = 1  # Number of passengers (driver included)
    avg_weight_kg: float = 75.0  # Average weight per person in kg
    use_climate: bool = False  # Use HVAC
    climate_intensity: float = 50.0  # HVAC intensity (0-100%)
    battery_start_pct: float = 100.0  # Battery percentage at departure
    battery_end_pct: float = 20.0  # Target battery percentage on arrival
    rho_air: float = 1.225  # Air density (kg/m³)

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
    start_location: str
    end_location: str
    route_coordinates: List[List[float]] = []  # Full route coordinates [[lat, lon], ...] for map display

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
    vehicle: VehicleProfile,
    total_mass_kg: float = None,
    aux_power_kw: float = None,
    rho_air: float = 1.225,
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
    
    # Total vehicle mass (use provided or calculate from vehicle profile)
    if total_mass_kg is None:
        total_mass = vehicle.empty_mass + vehicle.extra_load
    else:
        total_mass = total_mass_kg
    
    # Use provided aux_power or vehicle default
    if aux_power_kw is None:
        aux_power = vehicle.aux_power_kw
    else:
        aux_power = aux_power_kw
    
    # Use provided air density or default
    air_density = rho_air if rho_air else AIR_DENSITY
    
    # Time to travel this segment (seconds)
    time_s = distance_m / speed_ms if speed_ms > 0 else 0
    
    # Calculate slope angle
    if distance_m > 0:
        slope = elevation_change_m / distance_m
        # Limit slope to realistic values (-50% to +50%)
        slope = max(-0.5, min(0.5, slope))
    else:
        slope = 0
    
    # 1. Gravity force (positive uphill, negative downhill)
    F_gravity = total_mass * GRAVITY * slope
    
    # 2. Rolling resistance force
    F_rolling = vehicle.rolling_resistance * total_mass * GRAVITY * math.cos(math.atan(slope))
    
    # 3. Aerodynamic drag force (using CdA directly from drag_coefficient)
    # Note: In Streamlit code, drag_coefficient is actually CdA (Cd × A)
    F_aero = 0.5 * air_density * vehicle.drag_coefficient * (speed_ms ** 2)
    
    # Total resistance force
    F_total = F_gravity + F_rolling + F_aero
    
    # Power required at wheels (Watts)
    power_wheels_w = F_total * speed_ms
    
    # Electrical power (accounting for motor efficiency or regen)
    # IMPORTANT: This correctly separates uphill and downhill segments:
    # - Uphill (power_wheels_w > 0): Energy consumed with motor efficiency (e.g., 95%)
    #   → If we need 100W at wheels, we consume 100/0.95 = 105.3W electrical
    # - Downhill (power_wheels_w < 0): Energy recovered with regen efficiency (e.g., 85%)
    #   → If we can recover 100W at wheels, we only get 100*0.85 = 85W electrical
    # This means even with equal uphill/downhill (net slope = 0), we still consume energy
    # because motor efficiency < 100% and regen efficiency < 100%
    if power_wheels_w >= 0:
        # Consuming energy (uphill/flat) - divide by efficiency (losses)
        power_elec_w = power_wheels_w / max(vehicle.motor_efficiency, 1e-6)
    else:
        # Recovering energy (downhill) - multiply by regen efficiency (losses)
        # Note: power_wheels_w is negative here, so result is still negative (recovered energy)
        power_elec_w = power_wheels_w * vehicle.regen_efficiency
    
    # Add auxiliary power (HVAC, etc.) - always positive (consumed)
    power_aux_w = aux_power * 1000  # Convert kW to W
    power_total_w = power_elec_w + power_aux_w
    
    # Energy (Watt-hours)
    # Note: power_total_w can be negative for downhill segments (recovered energy)
    # but will be less negative than power_wheels_w due to regen efficiency < 100%
    energy_wh = power_total_w * (time_s / 3600.0)
    
    # Convert to kWh
    # Result: positive for consumption, negative for recovery (but less than ideal due to losses)
    energy_kwh = energy_wh / 1000.0
    
    return energy_kwh

def calculate_eco_speed(
    distance_m: float,
    elevation_change_m: float,
    speed_limit_kmh: float,
    vehicle: VehicleProfile,
    total_mass_kg: float = None,
    min_speed_kmh: float = 30.0
) -> float:
    """
    Calculate optimized eco-speed for a segment, taking into account ALL vehicle parameters:
    - Mass (affects gravity and rolling resistance)
    - Rolling resistance coefficient (Crr)
    - Aerodynamic drag (CdA)
    - Motor and regen efficiency
    
    Strategy:
    - Uphill: reduce speed to minimize power demand (more reduction if heavier/higher drag)
    - Downhill: moderate speed to maximize regen benefits (but never exceed speed limit)
    - Flat: slightly below speed limit for optimal efficiency (considering drag and rolling resistance)
    
    IMPORTANT: eco_speed must NEVER exceed speed_limit_kmh (legal requirement)
    
    Returns speed in km/h.
    """
    slope = elevation_change_m / distance_m if distance_m > 0 else 0
    
    # Calculate total mass (use provided or vehicle default)
    if total_mass_kg is None:
        total_mass = vehicle.empty_mass + vehicle.extra_load
    else:
        total_mass = total_mass_kg
    
    # Base vehicle mass for reference (typical empty mass)
    base_mass = vehicle.empty_mass
    # Mass ratio: how much heavier than base (1.0 = same, 1.5 = 50% heavier)
    mass_ratio = total_mass / base_mass if base_mass > 0 else 1.0
    
    # Normalize vehicle characteristics for speed adjustment
    # Reference values (typical EV)
    ref_rolling_resistance = 0.008  # Typical Crr for EVs
    ref_drag_coefficient = 0.6  # Typical CdA for EVs (m²)
    
    # Calculate resistance factors relative to reference
    rolling_factor = vehicle.rolling_resistance / ref_rolling_resistance if ref_rolling_resistance > 0 else 1.0
    drag_factor = vehicle.drag_coefficient / ref_drag_coefficient if ref_drag_coefficient > 0 else 1.0
    
    # Combined resistance factor (higher = more resistance = need lower speed)
    # Rolling resistance is more important at low speeds, drag at high speeds
    # We use a weighted average: 40% rolling, 60% drag (drag dominates at highway speeds)
    resistance_factor = 0.4 * rolling_factor + 0.6 * drag_factor
    
    # Efficiency factor (lower efficiency = need more careful speed management)
    # Average of motor and regen efficiency (both matter)
    avg_efficiency = (vehicle.motor_efficiency + vehicle.regen_efficiency) / 2.0
    ref_efficiency = 0.90  # Reference 90% average efficiency
    efficiency_factor = avg_efficiency / ref_efficiency if ref_efficiency > 0 else 1.0
    # Lower efficiency means we need to be more conservative with speed
    efficiency_adjustment = 1.0 - (1.0 - efficiency_factor) * 0.1  # Up to 10% adjustment
    
    # Adjust speed based on slope, mass, resistance, and efficiency
    if slope > 0.02:  # Significant uphill (>2% grade)
        # Reduce speed significantly on uphill
        # Heavier vehicles, higher drag, and lower efficiency need more speed reduction
        base_reduction = 0.65  # Base reduction to 65% of limit
        
        # Mass adjustment (up to 10% more reduction for 2x mass)
        mass_adjustment = min(0.10, (mass_ratio - 1.0) * 0.10)
        
        # Resistance adjustment (higher resistance = more reduction, up to 8%)
        resistance_adjustment = min(0.08, (resistance_factor - 1.0) * 0.08)
        
        # Efficiency adjustment (lower efficiency = more reduction, up to 5%)
        efficiency_adjustment_val = (1.0 - efficiency_adjustment) * 0.05
        
        speed_factor = base_reduction - mass_adjustment - resistance_adjustment - efficiency_adjustment_val
        eco_speed = max(min_speed_kmh, speed_limit_kmh * speed_factor)
        
    elif slope < -0.02:  # Significant downhill
        # Moderate speed to balance safety and regen, but never exceed limit
        # Heavier vehicles and better regen efficiency can benefit from slightly higher speed
        base_factor = 0.85
        
        # Mass adjustment (heavier = more regen benefit, up to 5% increase)
        mass_adjustment = min(0.05, (mass_ratio - 1.0) * 0.05)
        
        # Regen efficiency adjustment (better regen = can go slightly faster, up to 3%)
        regen_adjustment = min(0.03, (vehicle.regen_efficiency - 0.85) * 0.15)  # 0.85 = ref, scale to 3%
        
        # But higher drag/resistance reduces this benefit (up to 2% reduction)
        resistance_penalty = min(0.02, (resistance_factor - 1.0) * 0.02)
        
        speed_factor = base_factor + mass_adjustment + regen_adjustment - resistance_penalty
        eco_speed = min(speed_limit_kmh * speed_factor, speed_limit_kmh)
        
    else:  # Flat terrain
        # Slightly below limit for efficiency
        # Consider rolling resistance (more important at low speeds) and drag (more important at high speeds)
        base_factor = 0.88
        
        # Mass adjustment (heavier = more rolling resistance, up to 3% reduction)
        mass_adjustment = min(0.03, (mass_ratio - 1.0) * 0.03)
        
        # Resistance adjustment (higher resistance = more reduction, up to 5%)
        resistance_adjustment = min(0.05, (resistance_factor - 1.0) * 0.05)
        
        # Efficiency adjustment (lower efficiency = more reduction, up to 3%)
        efficiency_adjustment_val = (1.0 - efficiency_adjustment) * 0.03
        
        speed_factor = base_factor - mass_adjustment - resistance_adjustment - efficiency_adjustment_val
        eco_speed = speed_limit_kmh * speed_factor
    
    # CRITICAL: Ensure eco_speed NEVER exceeds speed_limit_kmh (legal requirement)
    # Also ensure it's not below minimum safe speed
    eco_speed = max(min_speed_kmh, min(eco_speed, speed_limit_kmh))
    
    return round(eco_speed, 1)

def _merge_segments(segment_group: List[Segment], index: int) -> Segment:
    """
    Merge a group of consecutive segments with the same speed limit into a single segment.
    """
    if not segment_group:
        raise ValueError("Cannot merge empty segment group")
    
    if len(segment_group) == 1:
        # Single segment, just update index
        seg = segment_group[0]
        return Segment(
            index=index,
            distance=seg.distance,
            elevation_start=seg.elevation_start,
            elevation_end=seg.elevation_end,
            speed_limit=seg.speed_limit,
            eco_speed=seg.eco_speed,
            real_speed=seg.real_speed,
            limit_energy=seg.limit_energy,
            eco_energy=seg.eco_energy,
            real_energy=seg.real_energy,
            limit_time=seg.limit_time,
            eco_time=seg.eco_time,
            real_time=seg.real_time,
            lat_start=seg.lat_start,
            lon_start=seg.lon_start,
            lat_end=seg.lat_end,
            lon_end=seg.lon_end
        )
    
    # Merge multiple segments
    first_seg = segment_group[0]
    last_seg = segment_group[-1]
    
    # Sum all values
    total_distance = sum(s.distance for s in segment_group)
    total_limit_energy = sum(s.limit_energy for s in segment_group)
    total_eco_energy = sum(s.eco_energy for s in segment_group)
    total_real_energy = sum(s.real_energy for s in segment_group)
    total_limit_time = sum(s.limit_time for s in segment_group)
    total_eco_time = sum(s.eco_time for s in segment_group)
    total_real_time = sum(s.real_time for s in segment_group)
    
    # Calculate weighted average speeds (weighted by distance)
    total_eco_speed = sum(s.eco_speed * s.distance for s in segment_group) / total_distance if total_distance > 0 else first_seg.eco_speed
    total_real_speed = sum(s.real_speed * s.distance for s in segment_group) / total_distance if total_distance > 0 else first_seg.real_speed
    
    return Segment(
        index=index,
        distance=total_distance,
        elevation_start=first_seg.elevation_start,
        elevation_end=last_seg.elevation_end,
        speed_limit=first_seg.speed_limit,  # Same for all in group
        eco_speed=round(total_eco_speed, 1),
        real_speed=round(total_real_speed, 1),
        limit_energy=total_limit_energy,
        eco_energy=total_eco_energy,
        real_energy=total_real_energy,
        limit_time=total_limit_time,
        eco_time=total_eco_time,
        real_time=total_real_time,
        lat_start=first_seg.lat_start,
        lon_start=first_seg.lon_start,
        lat_end=last_seg.lat_end,
        lon_end=last_seg.lon_end
    )

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
    Get predefined EV vehicle profiles from Streamlit code.
    """
    profiles = [
        VehicleProfile(
            name="Tesla Model 3",
            empty_mass=1850,
            extra_load=150,
            drag_coefficient=0.58,  # CdA (Cd × A)
            frontal_area=2.2,  # Realistic frontal area in m² (for display only)
            rolling_resistance=0.008,
            motor_efficiency=0.95,
            regen_efficiency=0.85,
            aux_power_kw=2.0,
            battery_kwh=75
        ),
        VehicleProfile(
            name="Tesla Model Y",
            empty_mass=2000,
            extra_load=150,
            drag_coefficient=0.62,  # CdA
            frontal_area=2.4,  # SUV - larger frontal area
            rolling_resistance=0.008,
            motor_efficiency=0.95,
            regen_efficiency=0.85,
            aux_power_kw=2.2,
            battery_kwh=75
        ),
        VehicleProfile(
            name="Audi Q4 e-tron",
            empty_mass=2100,
            extra_load=150,
            drag_coefficient=0.70,  # CdA
            frontal_area=2.5,  # SUV - larger frontal area
            rolling_resistance=0.009,
            motor_efficiency=0.92,
            regen_efficiency=0.80,
            aux_power_kw=2.5,
            battery_kwh=82
        ),
        VehicleProfile(
            name="BMW iX3",
            empty_mass=2180,
            extra_load=150,
            drag_coefficient=0.68,  # CdA
            frontal_area=2.4,  # SUV
            rolling_resistance=0.009,
            motor_efficiency=0.93,
            regen_efficiency=0.82,
            aux_power_kw=2.3,
            battery_kwh=80
        ),
        VehicleProfile(
            name="Mercedes EQC",
            empty_mass=2425,
            extra_load=150,
            drag_coefficient=0.72,  # CdA
            frontal_area=2.5,  # Large SUV
            rolling_resistance=0.010,
            motor_efficiency=0.91,
            regen_efficiency=0.78,
            aux_power_kw=2.8,
            battery_kwh=80
        ),
        VehicleProfile(
            name="Volkswagen ID.4",
            empty_mass=2120,
            extra_load=150,
            drag_coefficient=0.66,  # CdA
            frontal_area=2.3,  # SUV
            rolling_resistance=0.009,
            motor_efficiency=0.90,
            regen_efficiency=0.75,
            aux_power_kw=2.0,
            battery_kwh=77
        ),
        VehicleProfile(
            name="Renault Zoe",
            empty_mass=1500,
            extra_load=150,
            drag_coefficient=0.65,  # CdA
            frontal_area=1.9,  # Small car
            rolling_resistance=0.010,
            motor_efficiency=0.90,
            regen_efficiency=0.70,
            aux_power_kw=1.5,
            battery_kwh=52
        ),
        VehicleProfile(
            name="BMW i3",
            empty_mass=1200,
            extra_load=150,
            drag_coefficient=0.50,  # CdA
            frontal_area=1.8,  # Very small car
            rolling_resistance=0.008,
            motor_efficiency=0.92,
            regen_efficiency=0.80,
            aux_power_kw=1.8,
            battery_kwh=42
        ),
        VehicleProfile(
            name="Nissan Leaf",
            empty_mass=1600,
            extra_load=150,
            drag_coefficient=0.68,  # CdA
            frontal_area=2.1,  # Compact car
            rolling_resistance=0.010,
            motor_efficiency=0.88,
            regen_efficiency=0.75,
            aux_power_kw=1.7,
            battery_kwh=40
        ),
        VehicleProfile(
            name="Hyundai IONIQ 5",
            empty_mass=1950,
            extra_load=150,
            drag_coefficient=0.64,  # CdA
            frontal_area=2.3,  # SUV/Crossover
            rolling_resistance=0.008,
            motor_efficiency=0.94,
            regen_efficiency=0.83,
            aux_power_kw=2.1,
            battery_kwh=73
        ),
        VehicleProfile(
            name="Kia EV6",
            empty_mass=1980,
            extra_load=150,
            drag_coefficient=0.63,  # CdA
            frontal_area=2.3,  # SUV/Crossover
            rolling_resistance=0.008,
            motor_efficiency=0.94,
            regen_efficiency=0.83,
            aux_power_kw=2.1,
            battery_kwh=77
        ),
        VehicleProfile(
            name="Custom",
            empty_mass=1900,
            extra_load=150,
            drag_coefficient=0.62,  # CdA
            frontal_area=2.2,  # Default realistic value
            rolling_resistance=0.010,
            motor_efficiency=0.90,
            regen_efficiency=0.60,
            aux_power_kw=2.0,
            battery_kwh=60
        )
    ]
    return profiles

def get_speed_limit_by_road_type(road_type: str, user_max_speed: int = 130) -> int:
    """
    Retourne la limitation de vitesse typique selon le type de route.
    Mapping des types de route ORS vers limitations de vitesse en France.
    """
    speed_mapping = {
        "motorway": min(130, user_max_speed),  # Autoroute
        "trunk": min(110, user_max_speed),     # Route express
        "primary": min(90, user_max_speed),    # Route nationale
        "secondary": min(90, user_max_speed),  # Route départementale principale
        "tertiary": min(90, user_max_speed),   # Route départementale secondaire
        "unclassified": 50,                    # Route non classée
        "residential": 50,                     # Zone résidentielle
        "service": 30,                         # Route de service
    }
    
    # Recherche par préfixe (car ORS peut retourner "motorway_link", etc.)
    if road_type:
        road_type_lower = road_type.lower()
        for key, speed in speed_mapping.items():
            if key in road_type_lower:
                return speed
    
    # Par défaut, utiliser 50 km/h (zone urbaine)
    return 50

async def get_route_from_ors(start: str, end: str, user_max_speed: int = 130) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[List[float]]]:
    """
    Get route from OpenRouteService API with detailed segments and speed limits.
    Returns tuple: (points, detailed_segments, route_coordinates)
    - points: list of points with coordinates, elevation, and speed_limit
    - detailed_segments: list of route segments with road type information
    - route_coordinates: full list of route coordinates [[lat, lon], ...] for map display
    """
    ors_api_key = os.environ.get('ORS_API_KEY', '').strip()
    
    if not ors_api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenRouteService API key not configured. Please add ORS_API_KEY to .env file or use demo mode."
        )
    
    # Geocode addresses to coordinates
    # Use a longer timeout and add retry logic for Nominatim
    geolocator = Nominatim(user_agent="ecospeed", timeout=10)
    
    def geocode_with_retry(location: str, max_retries: int = 3) -> Any:
        """Geocode a location with retry logic"""
        for attempt in range(max_retries):
            try:
                result = geolocator.geocode(location, timeout=10)
                if result:
                    return result
                # If no result, wait a bit before retrying
                if attempt < max_retries - 1:
                    time.sleep(1)
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(f"Geocoding attempt {attempt + 1} failed for '{location}': {str(e)}. Retrying...")
                    time.sleep(2)  # Wait longer between retries
                else:
                    raise e
        return None
    
    try:
        start_location = geocode_with_retry(start)
        # Small delay between requests to respect Nominatim rate limits
        time.sleep(1)
        end_location = geocode_with_retry(end)
        
        if not start_location:
            raise HTTPException(status_code=400, detail=f"Could not find location: {start}. Please try a more specific address.")
        if not end_location:
            raise HTTPException(status_code=400, detail=f"Could not find location: {end}. Please try a more specific address.")
        
        start_coords = [start_location.longitude, start_location.latitude]
        end_coords = [end_location.longitude, end_location.latitude]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Geocoding error: {str(e)}. Please check your internet connection and try again.")
    
    # Call OpenRouteService Directions API with instructions
    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {
        "Authorization": ors_api_key,
        "Content-Type": "application/json; charset=utf-8"
    }
    
    body = {
        "coordinates": [start_coords, end_coords],
        "elevation": True,
        "instructions": True,
        "geometry": True,
        "format": "geojson",  # Request GeoJSON format explicitly
        "extra_info": ["waytype", "surface"]  # Request road type information
    }
    
    try:
        # Try POST with format in params
        response = requests.post(url, json=body, headers=headers, params={"format": "geojson"}, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        # Extract route data - handle both formats
        route = None
        if "routes" in data and data["routes"]:
            route = data["routes"][0]
        elif "features" in data and data["features"]:
            # GeoJSON format
            feature = data["features"][0]
            route = feature.get("properties", {})
            route["geometry"] = feature.get("geometry", {})
            route["segments"] = feature.get("properties", {}).get("segments", [])
        
        if not route:
            raise HTTPException(status_code=500, detail="No route found in API response")
        
        # Extract geometry and elevation
        # OpenRouteService can return geometry in different formats
        coords_list = []
        geometry = route.get("geometry")
        
        if isinstance(geometry, dict):
            # GeoJSON format: {"type": "LineString", "coordinates": [[lon, lat, elev], ...]}
            if geometry.get("type") == "LineString":
                coords_list = geometry.get("coordinates", [])
            elif "coordinates" in geometry:
                coords_list = geometry.get("coordinates", [])
        elif isinstance(geometry, str):
            # Encoded polyline5 format - decode it
            try:
                from polyline5_decoder import decode_polyline5
                # Decode polyline5 - check if elevation is requested (3D encoding)
                # If elevation=True in request, polyline includes elevation as 3rd dimension
                decoded = decode_polyline5(geometry, has_elevation=True)
                
                # Extract coordinates and elevations
                if decoded and len(decoded[0]) >= 3:
                    # 3D coordinates: [lat, lon, elev]
                    coords_list = [[coord[1], coord[0]] for coord in decoded]  # Convert to [lon, lat]
                    elevations = [coord[2] for coord in decoded]
                else:
                    # 2D coordinates: [lat, lon]
                    coords_list = [[coord[1], coord[0]] for coord in decoded]  # Convert to [lon, lat]
                    elevations = []
                
                logger.info(f"Decoded {len(coords_list)} coordinates from polyline5 (3D: {len(decoded[0]) >= 3 if decoded else False})")
            except ImportError:
                logger.error("polyline5_decoder module not found. Using start/end points only.")
                coords_list = [start_coords, end_coords]
            except Exception as e:
                logger.error(f"Error decoding polyline5: {e}. Using start/end points only.")
                coords_list = [start_coords, end_coords]
        else:
            # Fallback: use start and end coordinates
            coords_list = [start_coords, end_coords]
        
        # Ensure we have at least 2 points
        if len(coords_list) < 2:
            logger.warning(f"Only {len(coords_list)} coordinate(s) received. Using start/end points.")
            coords_list = [start_coords, end_coords]
        
        # Log for debugging
        logger.info(f"Extracted {len(coords_list)} coordinates from route")
        
        # Extract elevation if not already extracted from polyline
        if not elevations:
            elevations = []
            if coords_list:
                # Check if elevation is in coordinates (3rd element)
                if len(coords_list[0]) >= 3:
                    # Elevation already in coordinates
                    elevations = [coord[2] for coord in coords_list]
                    # Remove elevation from coordinates for consistency
                    coords_list = [[coord[0], coord[1]] for coord in coords_list]
                else:
                    # Try to get elevation from elevation service
                    try:
                        elev_url = "https://api.openrouteservice.org/elevation/line"
                        elev_body = {
                            "format_in": "geojson",
                            "format_out": "json",
                            "geometry": {
                                "type": "LineString",
                                "coordinates": coords_list[:1000]  # Limit to 1000 points
                            }
                        }
                        elev_response = requests.post(elev_url, json=elev_body, headers=headers, timeout=60)
                        if elev_response.status_code == 200:
                            elev_data = elev_response.json()
                            elevations = [pt[2] for pt in elev_data.get("geometry", {}).get("coordinates", [])]
                            # Interpolate if needed
                            if len(elevations) != len(coords_list):
                                # Simple linear interpolation
                                if len(elevations) > 1:
                                    # Linear interpolation without numpy
                                    result = []
                                    for i in range(len(coords_list)):
                                        pos = i / (len(coords_list) - 1) if len(coords_list) > 1 else 0
                                        idx = pos * (len(elevations) - 1)
                                        idx_low = int(idx)
                                        idx_high = min(idx_low + 1, len(elevations) - 1)
                                        t = idx - idx_low
                                        interp_val = elevations[idx_low] * (1 - t) + elevations[idx_high] * t
                                        result.append(interp_val)
                                    elevations = result
                                else:
                                    elevations = [elevations[0] if elevations else 0.0] * len(coords_list)
                        else:
                            elevations = [0.0] * len(coords_list)
                    except Exception:
                        elevations = [0.0] * len(coords_list)
        else:
            elevations = []
        
        # Extract detailed segments with road type information
        segments = route.get("segments", [])
        detailed_segments = []
        
        # Extract steps from segments
        all_steps = []
        for seg in segments:
            seg_steps = seg.get("steps", [])
            all_steps.extend(seg_steps)
            detailed_segments.append({
                "distance": seg.get("distance", 0),
                "duration": seg.get("duration", 0),
                "steps": seg_steps
            })
        
        # If no segments, create a single segment for the whole route
        if not detailed_segments:
            summary = route.get("summary", {})
            total_dist = summary.get("distance", 0)
            detailed_segments = [{
                "distance": total_dist,
                "duration": summary.get("duration", 0),
                "steps": []
            }]
        
        # Create points with speed limits based on road type
        points = []
        total_distance = sum(seg.get("distance", 0) for seg in detailed_segments) or 1
        
        # Calculate cumulative distances for coordinate points
        coord_distances = [0]
        for i in range(len(coords_list) - 1):
            lon1, lat1 = coords_list[i][0], coords_list[i][1]
            lon2, lat2 = coords_list[i+1][0], coords_list[i+1][1]
            d = calculate_segment_distance(lat1, lon1, lat2, lon2)
            coord_distances.append(coord_distances[-1] + d)
        
        # Normalize distances
        if coord_distances[-1] > 0:
            coord_ratio = total_distance / coord_distances[-1]
            coord_distances = [d * coord_ratio for d in coord_distances]
        
        # Use waytype extras to assign speed limits
        # waytype values: [start_index, end_index, waytype_id]
        # waytype_id: 1=motorway, 2=trunk, 3=primary, 4=secondary, 5=tertiary, etc.
        waytype_mapping = {
            1: "motorway",
            2: "trunk", 
            3: "primary",
            4: "secondary",
            5: "tertiary",
            6: "unclassified",
            7: "residential",
            8: "service"
        }
        
        waytype_ranges = []
        if "extras" in route and "waytype" in route["extras"]:
            waytype_extra = route["extras"]["waytype"]
            if "values" in waytype_extra:
                waytype_ranges = waytype_extra["values"]
        
        # Assign speed limits to each point based on waytype
        for i, coord in enumerate(coords_list):
            lon, lat = coord[0], coord[1]
            elev = elevations[i] if i < len(elevations) else 0
            
            speed_limit = 50  # Default
            
            # Find waytype for this point index
            if waytype_ranges:
                for waytype_range in waytype_ranges:
                    start_idx, end_idx, waytype_id = waytype_range
                    if start_idx <= i < end_idx:
                        waytype_name = waytype_mapping.get(waytype_id, "unclassified")
                        speed_limit = get_speed_limit_by_road_type(waytype_name, user_max_speed)
                        break
            
            points.append({
                "lat": lat,
                "lon": lon,
                "elevation": elev,
                "speed_limit": speed_limit
            })
        
        # Convert coords_list from [lon, lat] to [lat, lon] for frontend
        route_coordinates = [[coord[1], coord[0]] for coord in coords_list]
        
        return points, detailed_segments, route_coordinates
        
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling OpenRouteService API: {str(e)}"
        )

@api_router.post("/route")
async def calculate_route(request: RouteRequest) -> RouteResponse:
    """
    Calculate route with eco-speed optimization using OpenRouteService API.
    Requires ORS_API_KEY to be configured.
    """
    route_id = str(uuid.uuid4())
    
    # Validate inputs
    if not request.start or not request.end:
        raise HTTPException(status_code=400, detail="Start and end locations are required")
    
    # Get route from OpenRouteService API
    try:
        route_points, detailed_segments, route_coordinates = await get_route_from_ors(request.start, request.end, request.user_max_speed)
        start_location = request.start
        end_location = request.end
    except HTTPException as e:
        raise e
    
    # Calculate total mass (vehicle + passengers)
    logging.info(f"Received parameters: num_passengers={request.num_passengers}, avg_weight_kg={request.avg_weight_kg}")
    total_passenger_weight = request.num_passengers * request.avg_weight_kg
    total_mass_kg = request.vehicle_profile.empty_mass + total_passenger_weight
    logging.info(f"Calculated total mass: {total_mass_kg} kg (vehicle: {request.vehicle_profile.empty_mass} kg + passengers: {total_passenger_weight} kg)")
    
    # Adjust auxiliary power based on HVAC
    climate_power_adjustment = 0
    if request.use_climate:
        # Add extra HVAC power based on intensity (roughly 1–3 kW)
        climate_power_adjustment = (request.climate_intensity / 100.0) * 3.0
    
    adjusted_aux_power_kw = request.vehicle_profile.aux_power_kw + climate_power_adjustment
    
    # First, create all individual segments
    individual_segments = []
    
    for i in range(len(route_points) - 1):
        p1 = route_points[i]
        p2 = route_points[i + 1]
        
        # Calculate segment distance
        distance_m = calculate_segment_distance(
            p1["lat"], p1["lon"],
            p2["lat"], p2["lon"]
        )
        
        elevation_change = p2["elevation"] - p1["elevation"]
        speed_limit = p2["speed_limit"]
        
        # Calculate eco speed (taking into account total mass)
        eco_speed = calculate_eco_speed(
            distance_m,
            elevation_change,
            speed_limit,
            request.vehicle_profile,
            total_mass_kg=total_mass_kg
        )
        
        # Simulate real speed
        real_speed = simulate_real_speed(speed_limit, eco_speed, i)
        
        # Calculate energy for each scenario with new parameters
        limit_energy = calculate_energy_consumption(
            speed_limit, distance_m, elevation_change, request.vehicle_profile,
            total_mass_kg=total_mass_kg,
            aux_power_kw=adjusted_aux_power_kw,
            rho_air=request.rho_air
        )
        eco_energy = calculate_energy_consumption(
            eco_speed, distance_m, elevation_change, request.vehicle_profile,
            total_mass_kg=total_mass_kg,
            aux_power_kw=adjusted_aux_power_kw,
            rho_air=request.rho_air
        )
        real_energy = calculate_energy_consumption(
            real_speed, distance_m, elevation_change, request.vehicle_profile,
            total_mass_kg=total_mass_kg,
            aux_power_kw=adjusted_aux_power_kw,
            rho_air=request.rho_air
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
        individual_segments.append(segment)
    
    # Group consecutive segments with the same speed_limit
    segments = []
    if individual_segments:
        current_group = [individual_segments[0]]
        segment_index = 0
        
        for i in range(1, len(individual_segments)):
            current_seg = individual_segments[i]
            prev_seg = current_group[-1]
            
            # Check if speed_limit is the same (with small tolerance for floating point)
            if abs(current_seg.speed_limit - prev_seg.speed_limit) < 0.1:
                # Same speed limit, add to current group
                current_group.append(current_seg)
            else:
                # Different speed limit, finalize current group and start new one
                merged_seg = _merge_segments(current_group, segment_index)
                segments.append(merged_seg)
                segment_index += 1
                current_group = [current_seg]
        
        # Don't forget the last group
        if current_group:
            merged_seg = _merge_segments(current_group, segment_index)
            segments.append(merged_seg)
    
    # Calculate total distance
    total_distance_m = sum(s.distance for s in segments)
    total_distance_km = total_distance_m / 1000
    
    return RouteResponse(
        route_id=route_id,
        segments=segments,
        total_distance=round(total_distance_km, 2),
        start_location=start_location,
        end_location=end_location,
        route_coordinates=route_coordinates
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

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "ECOSPEED API",
        "version": "1.2.0",
        "docs": "/docs",
        "api": "/api"
    }

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