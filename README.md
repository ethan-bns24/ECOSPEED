# ECOSPEED - Green Driving Optimizer for Electric Vehicles

![ECOSPEED Logo](https://img.shields.io/badge/ECOSPEED-EV%20Optimizer-4ade80?style=for-the-badge)

**ECOSPEED** is a green driving optimizer for electric vehicles that calculates eco-optimized speed profiles segment by segment along a route.

## 🎯 Project Objective

Web application developed for an engineering school project, demonstrating:
- Realistic physics-based energy consumption calculations
- Terrain and elevation-based optimization
- Professional and intuitive user interface
- Modern full-stack architecture (FastAPI + React)

## ✨ Main Features

### 1. Route Analysis
- Automatic route calculation with elevation data using OpenRouteService API
- Intelligent route segmentation grouped by speed limits
- Real-time geocoding with retry mechanism

### 2. EV Physics Model
Energy consumption calculation based on:
- **Gravitational force**: uphill/downhill segments (properly separated)
- **Rolling resistance**: tire friction
- **Aerodynamic drag**: air resistance
- **Regenerative braking**: energy recovery on downhill (with efficiency losses)

### 3. Three Driving Scenarios

#### LIMIT (red) 🔴
Theoretical high-speed scenario following legal speed limits.

#### REAL (blue) 🔵
Simulated actual driver behavior with variations.

#### ECO (green) 🟢
Optimized profile to minimize energy consumption while keeping travel time reasonable.

### 4. Real-time Simulated Navigation
- Eco-speed recommendations segment by segment
- Interactive map visualization
- Progress bar and current segment details
- Contextual messages for the driver

### 5. Results Dashboard
**KPI Cards:**
- ECO Energy consumed (kWh)
- Energy Saved vs Speed Limit (kWh and %)
- Extra Time vs Speed Limit (minutes)
- CO₂ Avoided (kg)

**Charts:**
- Speed profile vs distance (3 curves)
- Energy consumption by scenario (bars)
- Travel time by scenario (bars)

**Trip Summary:**
- Energy at speed limit vs ECO energy
- Energy savings with percentage
- Time comparison

## 🚗 Electric Vehicle Profiles

### Tesla Model 3
- Mass: 1850 kg (+ 150 kg load)
- Drag coefficient (CdA): 0.58
- Rolling resistance: 0.008
- Motor efficiency: 95%
- Regenerative efficiency: 85%
- Battery: 75 kWh
- Auxiliary power: 2.0 kW

### Tesla Model Y
- Mass: 2000 kg (+ 150 kg load)
- Drag coefficient (CdA): 0.62
- Rolling resistance: 0.008
- Motor efficiency: 95%
- Regenerative efficiency: 85%
- Battery: 75 kWh
- Auxiliary power: 2.0 kW

### Custom
Fully customizable parameters to test different configurations.

## 🏗️ Technical Architecture

### Technology Stack
- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 19
- **Database**: MongoDB
- **Maps**: Leaflet + OpenStreetMap (no token required)
- **Routing**: OpenRouteService API
- **Charts**: Recharts
- **Styling**: Tailwind CSS + shadcn/ui components

### Project Structure
```
/ecospeed
├── backend/
│   ├── server.py              # FastAPI with physics calculations
│   ├── polyline5_decoder.py   # OpenRouteService polyline decoder
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables
│   └── start.sh               # Startup script
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Home page
│   │   │   └── AnalysisPage.jsx     # Analysis page
│   │   ├── components/
│   │   │   ├── RouteMap.jsx         # Interactive map
│   │   │   ├── NavigationPanel.jsx  # Navigation panel
│   │   │   ├── KPICards.jsx         # KPI cards
│   │   │   ├── SpeedChart.jsx       # Speed chart
│   │   │   ├── EnergyChart.jsx      # Energy chart
│   │   │   └── TimeChart.jsx        # Time chart
│   │   └── App.js
│   ├── package.json
│   ├── .env
│   └── start.sh
├── start.sh                   # Master startup script
└── README.md
```

## 🚀 Installation and Launch

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- yarn

### Installation

#### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
yarn install
```

### Configuration

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ecospeed_db
CORS_ORIGINS=*
ORS_API_KEY=your_openrouteservice_api_key
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Launch

#### Option 1: Master Script (Recommended)
```bash
./start.sh
```

This script automatically starts:
- MongoDB (if needed)
- Backend on http://localhost:8001
- Frontend on http://localhost:3000

#### Option 2: Manual Launch

**Terminal 1 - Backend:**
```bash
cd backend
./start.sh
```

**Terminal 2 - Frontend:**
```bash
cd frontend
./start.sh
```

The application will be accessible at `http://localhost:3000`

## 🔧 OpenRouteService API Setup

**Required** for route calculation:

1. Create an account on [openrouteservice.org](https://openrouteservice.org/)
2. Get an API key (7000 requests/day free)
3. Add to `backend/.env`: `ORS_API_KEY=your_key`

See [API_KEY_SETUP.md](API_KEY_SETUP.md) for detailed instructions.

## 📊 Physics Formulas

### Energy Consumption
```
E = (F_total × distance) / motor_efficiency (uphill)
E = (F_total × distance) × regen_efficiency (downhill)

Where F_total = F_gravity + F_rolling + F_aero
```

### Forces Calculated

**Gravitational force (slope):**
```
F_gravity = m × g × slope
```
- Positive uphill (resists motion)
- Negative downhill (aids motion)

**Rolling resistance:**
```
F_rolling = Crr × m × g × cos(θ)
```

**Aerodynamic drag:**
```
F_aero = 0.5 × ρ_air × CdA × v²
```

### Regenerative Braking
On downhills and decelerations, negative energy is recovered with 65-85% efficiency.

**Important**: Even with equal uphill/downhill (net slope = 0), energy is still consumed because:
- Motor efficiency < 100% (losses when consuming)
- Regen efficiency < 100% (losses when recovering)

## 🎨 Design and UX

- **Eco green theme**: green gradient to evoke nature and ecology
- **Typography**: Space Grotesk (titles) + Work Sans (body)
- **Primary color**: `#4ade80` (eco green)
- **Glassmorphism**: cards with blur and transparency effects
- **Responsive**: optimized for desktop and mobile

## 🧪 Testing

### Test API
```bash
# Test root endpoint
curl http://localhost:8001/api/

# Test vehicle profiles
curl http://localhost:8001/api/vehicle-profiles

# Test route calculation
curl -X POST http://localhost:8001/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "start": "Paris, France",
    "end": "Lyon, France",
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
    "user_max_speed": 130,
    "num_passengers": 1,
    "avg_weight_kg": 75,
    "use_climate": false,
    "climate_intensity": 50,
    "battery_start_pct": 100,
    "battery_end_pct": 20,
    "rho_air": 1.225
  }'
```

## 📝 Code Documentation

The code is extensively commented to explain:
- Physics formulas and their simplifications
- Eco-speed optimization logic
- LIMIT/REAL/ECO data structure
- API and component architecture

## 🔄 Recent Updates

### v1.2.0 (Latest)
- ✅ Removed demo mode - all routes use OpenRouteService API
- ✅ Segment grouping by speed limit for cleaner visualization
- ✅ Energy savings calculation vs speed limit (not just vs real speed)
- ✅ Improved geocoding with retry mechanism and longer timeout
- ✅ Proper separation of uphill/downhill energy calculations
- ✅ Complete English translation
- ✅ Removed "Made with Emergent" branding

### v1.1.0
- ✅ OpenRouteService API integration
- ✅ Speed limit detection by road type
- ✅ Detailed segment extraction
- ✅ Elevation data from API

## 🤝 Contributing

Project developed for an engineering school course. Contributions are welcome for:
- Improving optimization algorithms
- Adding new vehicle profiles
- Integrating other routing providers
- Improving physics calculation accuracy

## 📄 License

This project is intended for educational and demonstration purposes.

## 🙏 Acknowledgments

- OpenStreetMap for free map tiles
- OpenRouteService for routing API
- React and FastAPI communities

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

**Quick deployment options**:
- **Frontend**: Vercel (recommended) or Netlify
- **Backend**: Railway or Render
- **Database**: MongoDB Atlas (cloud) or local MongoDB

## 📞 Support

For any questions about the project, please consult the source code or integrated documentation.

---

**Developed with ❤️ for an engineering school project**
