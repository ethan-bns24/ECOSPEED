# 🔄 ECOSPEED API Changelog

## Version 1.2.0 (Latest)

### ✅ Major Changes

#### 1. Removed Demo Mode
- All routes now use OpenRouteService API
- No more hardcoded demo routes
- Real-time route calculation for any start/end locations

#### 2. Segment Grouping by Speed Limit
- Consecutive segments with the same speed limit are automatically merged
- Cleaner visualization with fewer segments
- Better performance and readability

#### 3. Energy Savings vs Speed Limit
- KPI cards now show energy saved compared to speed limit (not just real speed)
- More accurate representation of eco-driving benefits
- Trip summary shows comprehensive comparison

#### 4. Improved Geocoding
- Increased timeout from 1s to 10s
- Retry mechanism (up to 3 attempts)
- Better error messages
- Rate limiting respect (1s delay between requests)

#### 5. Proper Uphill/Downhill Energy Calculation
- **Elementary segment calculation**: Each segment between two consecutive GPS points is calculated individually with its own slope
- **No slope averaging**: Slopes are never averaged between uphill and downhill portions
- Correctly separates uphill and downhill segments
- Accounts for motor efficiency losses (consumption ~90-95%)
- Accounts for regen efficiency losses (recovery ~65-85%)
- Even with net elevation change = 0, energy is consumed due to efficiency losses
- Energies are summed (including negative regeneration values) when grouping segments by speed limit

#### 6. Complete English Translation
- All UI text translated to English
- All documentation in English
- Consistent terminology throughout

#### 7. Removed Branding
- Removed "Made with Emergent" badge
- Clean, unbranded interface

## Version 1.1.0

### ✅ OpenRouteService Integration

#### 1. Speed Limit Detection by Road Type
The backend now uses **road types** returned by OpenRouteService API to automatically determine speed limits:

- **Motorway**: 130 km/h
- **Trunk**: 110 km/h  
- **Primary/Secondary/Tertiary**: 90 km/h
- **Residential/Unclassified**: 50 km/h
- **Service**: 30 km/h

#### 2. Detailed Segment Extraction
The `get_route_from_ors()` function has been improved to:
- Retrieve **detailed segments** with navigation instructions
- Extract **road type** (`waytype`) for each segment using API extras
- Map each coordinate point to its corresponding segment
- Assign appropriate speed limit to each point

#### 3. Elevation Data
- Extraction of elevations from 3D coordinates if available
- Fallback to OpenRouteService elevation API if necessary
- Linear interpolation if number of elevation points differs

#### 4. New Parameter `user_max_speed`
Added optional parameter `user_max_speed` (default: 130 km/h) in `RouteRequest` to limit maximum speed on the route.

## Data Structure

### Route Points
Each point now contains:
```python
{
    "lat": float,
    "lon": float,
    "elevation": float,      # In meters
    "speed_limit": int       # Speed limit in km/h
}
```

### Segments
Segments include:
- Distance and duration
- Start/end coordinates and elevations
- Speed limit (from road type)
- Energy consumption for LIMIT/REAL/ECO scenarios
- Time for each scenario

## Usage

### Example Request
```json
{
    "start": "Paris, France",
    "end": "Lyon, France",
    "user_max_speed": 130,
    "vehicle_profile": {
        "name": "Tesla Model 3",
        "empty_mass": 1850,
        "extra_load": 150,
        "drag_coefficient": 0.58,
        "frontal_area": 1.0,
        "rolling_resistance": 0.008,
        "motor_efficiency": 0.95,
        "regen_efficiency": 0.85,
        "aux_power_kw": 2.0,
        "battery_kwh": 75
    },
    "num_passengers": 1,
    "avg_weight_kg": 75,
    "use_climate": false,
    "climate_intensity": 50,
    "battery_start_pct": 100,
    "battery_end_pct": 20,
    "rho_air": 1.225
}
```

## Benefits

1. **More realistic calculations**: Speeds are adapted to actual road types
2. **Better accuracy**: Real speed limits are taken into account
3. **Improved optimization**: Eco-speed algorithm can better optimize based on road context
4. **Cleaner visualization**: Grouped segments make results easier to read
5. **Better energy comparison**: Savings vs speed limit is more meaningful

## Technical Notes

- OpenRouteService API must be called with `instructions: true` and `extra_info: ["waytype"]` to get detailed segments
- If detailed segments are not available, the system uses a default limit of 50 km/h
- API key must be valid and configured in `backend/.env`
- Geocoding uses Nominatim with retry mechanism for reliability

---

**Date**: 2025-01-XX  
**Version**: 1.2.0
