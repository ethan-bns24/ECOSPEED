# Ecospeed - Green Driving Optimizer for Electric Vehicles

![Ecospeed Logo](https://img.shields.io/badge/Ecospeed-EV%20Optimizer-4ade80?style=for-the-badge)

**Ecospeed** est un optimiseur de conduite écologique pour véhicules électriques qui calcule des profils de vitesse éco-optimisés segment par segment le long d'un itinéraire.

## 🎯 Objectif du projet

Application web développée pour un projet d'école d'ingénieurs, démontrant :
- Calculs physiques réalistes de consommation d'énergie
- Optimisation basée sur le terrain et l'élévation
- Interface utilisateur professionnelle et intuitive
- Architecture full-stack moderne (FastAPI + React)

## ✨ Fonctionnalités principales

### 1. Analyse d'itinéraire
- Calcul automatique de route avec données d'élévation
- Segmentation intelligente du parcours
- Mode démo intégré (Le Havre → Versailles)

### 2. Modèle physique EV
Calcul de la consommation d'énergie basé sur :
- **Force gravitationnelle** : montées/descentes
- **Résistance au roulement** : friction des pneus
- **Traînée aérodynamique** : résistance de l'air
- **Inertie** : accélérations/décélérations
- **Freinage régénératif** : récupération d'énergie en descente

### 3. Trois scénarios de conduite

#### LIMIT (rouge) 🔴
Scénario théorique à haute vitesse suivant les limitations légales.

#### REAL (bleu) 🔵
Simulation du comportement réel d'un conducteur avec variations.

#### ECO (vert) 🟢
Profil optimisé pour minimiser la consommation d'énergie tout en gardant un temps de trajet raisonnable.

### 4. Navigation temps réel simulée
- Recommandations de vitesse éco segment par segment
- Visualisation sur carte interactive
- Barre de progression et détails du segment actuel
- Messages contextuels pour le conducteur

### 5. Tableau de bord des résultats
**KPI Cards :**
- Énergie ECO consommée (kWh)
- Énergie économisée par rapport au REAL (kWh et %)
- Temps supplémentaire ECO vs REAL (minutes)
- CO₂ évité (kg)

**Graphiques :**
- Profil vitesse vs distance (3 courbes)
- Consommation d'énergie par scénario (barres)
- Temps de trajet par scénario (barres)

## 🚗 Profils de véhicules électriques

### Tesla Model 3
- Masse : 1611 kg (+ 150 kg charge)
- Coefficient de traînée : 0.23
- Surface frontale : 2.22 m²
- Efficacité moteur : 90%
- Efficacité régénération : 70%

### Nissan Leaf
- Masse : 1580 kg (+ 150 kg charge)
- Coefficient de traînée : 0.28
- Surface frontale : 2.27 m²
- Efficacité moteur : 87%
- Efficacité régénération : 65%

### Renault Zoe
- Masse : 1468 kg (+ 150 kg charge)
- Coefficient de traînée : 0.29
- Surface frontale : 2.13 m²
- Efficacité moteur : 88%
- Efficacité régénération : 68%

### Custom
Paramètres entièrement personnalisables pour tester différentes configurations.

## 🏗️ Architecture technique

### Stack technologique
- **Backend** : FastAPI (Python 3.11)
- **Frontend** : React 19
- **Base de données** : MongoDB
- **Cartes** : Leaflet + OpenStreetMap (pas de token requis)
- **Graphiques** : Recharts
- **Styling** : Tailwind CSS + shadcn/ui components

### Structure du projet
```
/app
├── backend/
│   ├── server.py           # API FastAPI avec calculs physiques
│   ├── requirements.txt    # Dépendances Python
│   └── .env               # Variables d'environnement
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Page d'accueil
│   │   │   └── AnalysisPage.jsx     # Page d'analyse
│   │   ├── components/
│   │   │   ├── RouteMap.jsx         # Carte interactive
│   │   │   ├── NavigationPanel.jsx  # Panneau de navigation
│   │   │   ├── KPICards.jsx         # Cartes KPI
│   │   │   ├── SpeedChart.jsx       # Graphique de vitesse
│   │   │   ├── EnergyChart.jsx      # Graphique d'énergie
│   │   │   └── TimeChart.jsx        # Graphique de temps
│   │   └── App.js
│   ├── package.json
│   └── .env
└── README.md
```

## 🚀 Installation et lancement

### Prérequis
- Python 3.11+
- Node.js 18+
- MongoDB
- yarn

### Installation des dépendances

#### Backend
```bash
cd /app/backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd /app/frontend
yarn install
```

### Configuration

#### Backend (.env)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ecospeed_db
CORS_ORIGINS=*
```

#### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### Lancement

#### Backend (développement)
```bash
cd /app/backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend (développement)
```bash
cd /app/frontend
yarn start
```

L'application sera accessible sur `http://localhost:3000`

### Lancement (production)
```bash
# Backend
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
yarn build
# Puis servir le dossier build/ avec un serveur web
```

## 🎮 Mode démo

L'application inclut un **mode démo complet** qui fonctionne sans clés API :
- Route pré-calculée : **Le Havre → Versailles** (~260 km)
- Données d'élévation mockées réalistes
- 39 segments avec variations de terrain

Pour activer le mode démo :
1. Cocher "Use demo route (Le Havre → Versailles)"
2. Cliquer sur "Calculate Eco-Speed Profile"

## 🔧 Intégration API externe (optionnel)

Pour activer les routes en direct :

### OpenRouteService
1. Créer un compte sur [openrouteservice.org](https://openrouteservice.org/)
2. Obtenir une clé API (7000 requêtes/jour gratuit)
3. Ajouter au backend `.env` : `ORS_API_KEY=votre_cle`

### Mapbox (optionnel)
1. Créer un compte sur [mapbox.com](https://www.mapbox.com/)
2. Obtenir un token
3. Ajouter au frontend `.env` : `MAPBOX_TOKEN=votre_token`

**Note** : L'application utilise OpenStreetMap par défaut (pas de token requis)

## 📊 Formules physiques

### Énergie consommée
```
E = (F_total × distance) / efficacité_moteur

Où F_total = F_gravité + F_roulement + F_aéro
```

### Forces calculées

**Force gravitationnelle (pente) :**
```
F_gravité = m × g × sin(θ)
```

**Résistance au roulement :**
```
F_roulement = Crr × m × g × cos(θ)
```

**Traînée aérodynamique :**
```
F_aéro = 0.5 × ρ_air × Cd × A × v²
```

### Freinage régénératif
Sur les descentes et décélérations, l'énergie négative est récupérée avec un rendement de 65-70%.

## 🎨 Design et UX

- **Thème vert éco** : dégradé de verts pour évoquer la nature et l'écologie
- **Typography** : Space Grotesk (titres) + Work Sans (corps)
- **Couleur primaire** : `#4ade80` (vert éco)
- **Glassmorphisme** : cartes avec effet de flou et transparence
- **Responsive** : optimisé pour desktop et mobile

## 🧪 Tests

### Tester l'API
```bash
# Test endpoint racine
curl http://localhost:8001/api/

# Test profils véhicules
curl http://localhost:8001/api/vehicle-profiles

# Test calcul route (démo)
curl -X POST http://localhost:8001/api/route \
  -H "Content-Type: application/json" \
  -d '{
    "start": "Le Havre, France",
    "end": "Versailles, France",
    "use_demo": true,
    "vehicle_profile": {
      "name": "Tesla Model 3",
      "empty_mass": 1611,
      "extra_load": 150,
      "drag_coefficient": 0.23,
      "frontal_area": 2.22,
      "rolling_resistance": 0.007,
      "motor_efficiency": 0.90,
      "regen_efficiency": 0.70
    }
  }'
```

## 📝 Documentation du code

Le code est abondamment commenté pour expliquer :
- Les formules physiques et leurs simplifications
- La logique d'optimisation eco-speed
- La structure des données LIMIT/REAL/ECO
- L'architecture de l'API et des composants

## 🤝 Contribution

Projet réalisé pour un cours d'école d'ingénieurs. Les contributions sont les bienvenues pour :
- Améliorer les algorithmes d'optimisation
- Ajouter de nouveaux profils de véhicules
- Intégrer d'autres fournisseurs de routage
- Améliorer la précision des calculs physiques

## 📄 Licence

Ce projet est destiné à un usage éducatif et de démonstration.

## 🙏 Remerciements

- OpenStreetMap pour les tuiles de carte gratuites
- OpenRouteService pour l'API de routage
- La communauté React et FastAPI

## 📞 Support

Pour toute question sur le projet, veuillez consulter le code source ou la documentation intégrée.

---

**Développé avec ❤️ pour un projet d'école d'ingénieurs**
