# 🚀 Installation ECOSPEED - Terminée !

## ✅ Ce qui a été installé

### Backend
- ✅ Python 3.14.0
- ✅ Environnement virtuel créé (`backend/venv/`)
- ✅ 73 dépendances Python installées
- ✅ Fichier `.env` configuré
- ✅ Script de démarrage (`backend/start.sh`)

### Frontend
- ✅ Node.js 25.2.1
- ✅ Yarn 1.22.22
- ✅ Toutes les dépendances npm installées
- ✅ Fichier `.env` configuré avec `REACT_APP_BACKEND_URL=http://localhost:8001`
- ✅ Script de démarrage (`frontend/start.sh`)

### Base de données
- ✅ MongoDB 8.2.2 installé
- ✅ MongoDB démarré et en cours d'exécution
- ✅ Service configuré pour démarrer automatiquement

## 🎮 Comment démarrer le projet

### Option 1 : Script principal (recommandé)
```bash
./start.sh
```

Ce script démarre automatiquement :
- MongoDB (si nécessaire)
- Backend sur http://localhost:8001
- Frontend sur http://localhost:3000

### Option 2 : Démarrage manuel

**Terminal 1 - Backend :**
```bash
cd backend
./start.sh
```

**Terminal 2 - Frontend :**
```bash
cd frontend
./start.sh
```

## 📍 URLs importantes

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8001
- **Documentation API** : http://localhost:8001/docs
- **MongoDB** : mongodb://localhost:27017

## 🎯 Mode démo

L'application inclut un **mode démo complet** qui fonctionne sans clés API :
- Route pré-calculée : **Le Havre → Versailles** (~260 km)
- Données d'élévation mockées réalistes
- 39 segments avec variations de terrain

Pour l'utiliser :
1. Ouvrez http://localhost:3000
2. Cochez "Use demo route (Le Havre → Versailles)"
3. Cliquez sur "Calculate Eco-Speed Profile"

## 🔧 Configuration optionnelle

### OpenRouteService (pour routes en direct)
1. Créer un compte sur [openrouteservice.org](https://openrouteservice.org/)
2. Obtenir une clé API (7000 requêtes/jour gratuit)
3. Ajouter au `backend/.env` : `ORS_API_KEY=votre_cle`

### Mapbox (optionnel, pour meilleures cartes)
1. Créer un compte sur [mapbox.com](https://www.mapbox.com/)
2. Obtenir un token
3. Ajouter au `frontend/.env` : `MAPBOX_TOKEN=votre_token`

**Note** : L'application utilise OpenStreetMap par défaut (pas de token requis)

## 🛑 Arrêter les serveurs

Si vous utilisez `./start.sh`, appuyez sur **Ctrl+C**.

Pour arrêter manuellement :
```bash
# Arrêter MongoDB
brew services stop mongodb/brew/mongodb-community

# Arrêter les processus Node/Python
pkill -f "uvicorn server:app"
pkill -f "react-scripts"
```

## 📝 Logs

Les logs sont disponibles dans :
- `backend.log` - Logs du serveur FastAPI
- `frontend.log` - Logs du serveur React

Pour les voir en temps réel :
```bash
tail -f backend.log
tail -f frontend.log
```

## 🐛 Dépannage

### MongoDB ne démarre pas
```bash
brew services restart mongodb/brew/mongodb-community
```

### Port déjà utilisé
Si le port 8001 ou 3000 est déjà utilisé :
- Backend : Modifier le port dans `backend/start.sh`
- Frontend : Le serveur React vous demandera d'utiliser un autre port

### Erreurs de dépendances
```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
yarn install
```

---

**🎉 Tout est prêt ! Bon développement !**

