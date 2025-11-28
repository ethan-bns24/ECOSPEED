# 🚀 Guide de Déploiement ECOSPEED

Ce guide présente plusieurs options pour déployer ECOSPEED en production.

## 📋 Prérequis

- Code source sur GitHub
- Compte sur la plateforme de déploiement choisie
- Clé API OpenRouteService configurée
- MongoDB (local ou cloud)

---

## Option 1: Vercel (Frontend) + Railway/Render (Backend) ⭐ Recommandé

### Frontend sur Vercel

**Avantages**: Gratuit, rapide, excellent pour React, déploiement automatique depuis GitHub

#### Étapes:

1. **Préparer le build**
```bash
cd frontend
yarn build
```

2. **Créer `vercel.json`** à la racine du projet:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "frontend/build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "dest": "/frontend/build/static/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ]
}
```

3. **Mettre à jour `package.json`** dans `frontend/`:
```json
{
  "scripts": {
    "build": "react-scripts build",
    "vercel-build": "react-scripts build"
  }
}
```

4. **Déployer sur Vercel**:
   - Aller sur [vercel.com](https://vercel.com)
   - Connecter votre compte GitHub
   - Importer le repository ECOSPEED
   - Configuration:
     - **Root Directory**: `frontend`
     - **Build Command**: `yarn build`
     - **Output Directory**: `build`
   - Variables d'environnement:
     ```
     REACT_APP_BACKEND_URL=https://votre-backend.railway.app
     ```
   - Déployer

### Backend sur Railway

**Avantages**: Gratuit (avec limites), MongoDB inclus, déploiement simple

#### Étapes:

1. **Créer `Procfile`** dans `backend/`:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

2. **Créer `runtime.txt`** dans `backend/`:
```
python-3.11
```

3. **Déployer sur Railway**:
   - Aller sur [railway.app](https://railway.app)
   - Créer un nouveau projet
   - "Deploy from GitHub repo"
   - Sélectionner ECOSPEED
   - Configuration:
     - **Root Directory**: `backend`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Variables d'environnement:
     ```
     MONGO_URL=mongodb://localhost:27017
     DB_NAME=ecospeed_db
     CORS_ORIGINS=https://votre-frontend.vercel.app
     ORS_API_KEY=votre_cle_openrouteservice
     PORT=8001
     ```
   - Ajouter MongoDB (Add Service → MongoDB)
   - Déployer

### Alternative: Backend sur Render

**Avantages**: Gratuit, similaire à Railway

#### Étapes:

1. **Créer `render.yaml`** à la racine:
```yaml
services:
  - type: web
    name: ecospeed-backend
    env: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGO_URL
        value: mongodb://localhost:27017
      - key: DB_NAME
        value: ecospeed_db
      - key: CORS_ORIGINS
        value: https://votre-frontend.vercel.app
      - key: ORS_API_KEY
        sync: false
    plan: free
```

2. **Déployer sur Render**:
   - Aller sur [render.com](https://render.com)
   - "New Web Service"
   - Connecter GitHub
   - Sélectionner ECOSPEED
   - Configuration automatique depuis `render.yaml`
   - Ajouter MongoDB (New → MongoDB)
   - Mettre à jour `MONGO_URL` avec l'URL MongoDB de Render

---

## Option 2: Netlify (Frontend) + Fly.io (Backend)

### Frontend sur Netlify

#### Étapes:

1. **Créer `netlify.toml`** à la racine:
```toml
[build]
  base = "frontend"
  command = "yarn build"
  publish = "frontend/build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Déployer sur Netlify**:
   - Aller sur [netlify.com](https://netlify.com)
   - "Add new site" → "Import an existing project"
   - Connecter GitHub
   - Configuration:
     - **Base directory**: `frontend`
     - **Build command**: `yarn build`
     - **Publish directory**: `frontend/build`
   - Variables d'environnement:
     ```
     REACT_APP_BACKEND_URL=https://votre-backend.fly.dev
     ```

### Backend sur Fly.io

#### Étapes:

1. **Installer Fly CLI**:
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Créer `Dockerfile`** dans `backend/`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

3. **Créer `.dockerignore`** dans `backend/`:
```
venv/
__pycache__/
*.pyc
.env
```

4. **Déployer sur Fly.io**:
```bash
cd backend
fly launch
# Suivre les instructions
fly secrets set ORS_API_KEY=votre_cle
fly secrets set MONGO_URL=votre_url_mongodb
fly secrets set CORS_ORIGINS=https://votre-frontend.netlify.app
fly deploy
```

---

## Option 3: Déploiement Complet sur AWS

### Architecture AWS

- **Frontend**: AWS Amplify ou S3 + CloudFront
- **Backend**: AWS Elastic Beanstalk ou ECS
- **Database**: MongoDB Atlas (recommandé) ou DocumentDB

### Frontend sur AWS Amplify

1. **Aller sur AWS Amplify Console**
2. **Connecter GitHub**
3. **Configuration**:
   - Repository: ECOSPEED
   - Branch: main
   - Build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend
           - yarn install
       build:
         commands:
           - yarn build
     artifacts:
       baseDirectory: frontend/build
       files:
         - '**/*'
     cache:
       paths:
         - frontend/node_modules/**/*
   ```
4. **Variables d'environnement**:
   ```
   REACT_APP_BACKEND_URL=https://votre-backend.elasticbeanstalk.com
   ```

### Backend sur AWS Elastic Beanstalk

1. **Installer EB CLI**:
```bash
pip install awsebcli
```

2. **Initialiser**:
```bash
cd backend
eb init -p python-3.11 ecospeed-backend
eb create ecospeed-env
```

3. **Configurer les variables d'environnement**:
```bash
eb setenv ORS_API_KEY=votre_cle MONGO_URL=votre_url CORS_ORIGINS=https://votre-frontend.amplify.app
```

---

## Option 4: Docker Compose (VPS/Serveur Dédié)

### Créer les Dockerfiles

**`backend/Dockerfile`**:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

**`frontend/Dockerfile`**:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**`frontend/nginx.conf`**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**`docker-compose.yml`** à la racine:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: ecospeed-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: ecospeed_db

  backend:
    build: ./backend
    container_name: ecospeed-backend
    ports:
      - "8001:8001"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=ecospeed_db
      - CORS_ORIGINS=http://localhost:3000,https://votre-domaine.com
      - ORS_API_KEY=${ORS_API_KEY}
    depends_on:
      - mongodb
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: ecospeed-frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mongodb_data:
```

### Déployer

```bash
# Sur votre serveur VPS
git clone https://github.com/ethan-bns24/ECOSPEED.git
cd ECOSPEED
docker-compose up -d
```

---

## Option 5: MongoDB Atlas (Cloud Database)

Pour toutes les options ci-dessus, vous pouvez utiliser MongoDB Atlas au lieu d'un MongoDB local.

### Configuration MongoDB Atlas

1. **Créer un compte** sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Créer un cluster** (gratuit M0 disponible)
3. **Créer un utilisateur** avec mot de passe
4. **Whitelist votre IP** (ou 0.0.0.0/0 pour développement)
5. **Récupérer la connection string**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/ecospeed_db?retryWrites=true&w=majority
   ```
6. **Mettre à jour `MONGO_URL`** dans vos variables d'environnement

---

## Configuration CORS

Assurez-vous que `CORS_ORIGINS` dans le backend inclut l'URL de votre frontend déployé:

```python
# backend/server.py
CORS_ORIGINS = [
    "http://localhost:3000",  # Développement local
    "https://votre-frontend.vercel.app",  # Production
    "https://votre-domaine.com",  # Domaine personnalisé
]
```

---

## Variables d'Environnement à Configurer

### Backend
```env
MONGO_URL=mongodb://localhost:27017  # ou MongoDB Atlas
DB_NAME=ecospeed_db
CORS_ORIGINS=https://votre-frontend.vercel.app
ORS_API_KEY=votre_cle_openrouteservice
PORT=8001  # ou $PORT selon la plateforme
```

### Frontend
```env
REACT_APP_BACKEND_URL=https://votre-backend.railway.app
```

---

## Checklist de Déploiement

- [ ] Code source sur GitHub
- [ ] Clé API OpenRouteService obtenue
- [ ] MongoDB configuré (local ou Atlas)
- [ ] Variables d'environnement configurées
- [ ] CORS configuré avec l'URL du frontend
- [ ] Backend déployé et accessible
- [ ] Frontend déployé avec URL backend correcte
- [ ] Test de l'application complète
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] SSL/HTTPS activé (automatique sur Vercel/Netlify)

---

## Dépannage

### Backend ne démarre pas
- Vérifier les variables d'environnement
- Vérifier les logs de la plateforme
- Tester localement d'abord

### CORS errors
- Vérifier que `CORS_ORIGINS` inclut l'URL exacte du frontend
- Vérifier qu'il n'y a pas de slash final

### Frontend ne charge pas
- Vérifier `REACT_APP_BACKEND_URL`
- Vérifier la build (yarn build)
- Vérifier les routes (SPA routing)

### MongoDB connection failed
- Vérifier l'URL de connexion
- Vérifier les whitelist IPs (MongoDB Atlas)
- Vérifier les credentials

---

## Recommandation Finale

**Pour un déploiement rapide et gratuit**:
- ✅ **Frontend**: Vercel (gratuit, excellent pour React)
- ✅ **Backend**: Railway ou Render (gratuit avec limites)
- ✅ **Database**: MongoDB Atlas (gratuit M0)

**Pour un déploiement professionnel**:
- ✅ **Frontend**: Vercel Pro ou Netlify Pro
- ✅ **Backend**: AWS Elastic Beanstalk ou Google Cloud Run
- ✅ **Database**: MongoDB Atlas (cluster payant)

---

**Bon déploiement ! 🚀**

