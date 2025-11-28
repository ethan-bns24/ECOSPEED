# 🚀 Déploiement Option 1 : Vercel + Railway + MongoDB Atlas

Guide pas à pas pour déployer ECOSPEED avec l'option recommandée.

---

## 📋 Prérequis

- ✅ Compte GitHub avec le code ECOSPEED
- ✅ Compte Vercel (gratuit)
- ✅ Compte Railway (gratuit)
- ✅ Compte MongoDB Atlas (gratuit)
- ✅ Clé API OpenRouteService

---

## Étape 1 : MongoDB Atlas (Base de données)

### 1.1 Créer un compte MongoDB Atlas

1. Aller sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Cliquer sur "Try Free"
3. Créer un compte (email + mot de passe)

### 1.2 Créer un cluster

1. Choisir **"Build a Database"**
2. Sélectionner **"M0 FREE"** (gratuit)
3. Choisir un **Cloud Provider** (AWS recommandé)
4. Choisir une **Region** (proche de vous, ex: Europe)
5. Cliquer sur **"Create"**
6. Attendre 3-5 minutes que le cluster soit créé

### 1.3 Configurer la sécurité

1. **Créer un utilisateur de base de données**:
   - Aller dans "Database Access"
   - Cliquer sur "Add New Database User"
   - **Username**: `ecospeed_user`
   - **Password**: Générer un mot de passe fort (le sauvegarder !)
   - **Database User Privileges**: "Read and write to any database"
   - Cliquer sur "Add User"

2. **Whitelist votre IP**:
   - Aller dans "Network Access"
   - Cliquer sur "Add IP Address"
   - Cliquer sur "Allow Access from Anywhere" (0.0.0.0/0)
   - Ou ajouter votre IP spécifique
   - Cliquer sur "Confirm"

### 1.4 Récupérer la connection string

1. Aller dans "Database" → "Connect"
2. Choisir "Connect your application"
3. **Driver**: Python
4. **Version**: 3.6 or later
5. Copier la connection string, elle ressemble à :
   ```
   mongodb+srv://ecospeed_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Remplacer `<password>`** par le mot de passe que vous avez créé
7. **Ajouter le nom de la base** à la fin :
   ```
   mongodb+srv://ecospeed_user:VOTRE_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/ecospeed_db?retryWrites=true&w=majority
   ```
8. **Sauvegarder cette URL** - vous en aurez besoin pour Railway

---

## Étape 2 : Railway (Backend)

### 2.1 Créer un compte Railway

1. Aller sur [railway.app](https://railway.app)
2. Cliquer sur "Start a New Project"
3. Se connecter avec GitHub

### 2.2 Créer un nouveau projet

1. Cliquer sur "New Project"
2. Sélectionner "Deploy from GitHub repo"
3. Autoriser Railway à accéder à votre GitHub si demandé
4. Sélectionner le repository **ECOSPEED**
5. Cliquer sur "Deploy Now"

### 2.3 Configurer le service Backend

1. Railway détecte automatiquement le projet
2. Cliquer sur le service créé
3. Aller dans l'onglet **"Settings"**

4. **Configurer le Root Directory**:
   - Dans "Source", mettre : `backend`

5. **Configurer les Variables d'Environnement**:
   - Aller dans l'onglet **"Variables"**
   - Ajouter les variables suivantes :

   ```
   MONGO_URL=mongodb+srv://ecospeed_user:VOTRE_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/ecospeed_db?retryWrites=true&w=majority
   ```

   ```
   DB_NAME=ecospeed_db
   ```

   ```
   CORS_ORIGINS=https://votre-app.vercel.app
   ```
   (Vous mettrez l'URL Vercel après, pour l'instant mettez `http://localhost:3000`)

   ```
   ORS_API_KEY=votre_cle_openrouteservice
   ```

   ```
   PORT=8001
   ```

### 2.4 Configurer le Build et Start

1. Dans "Settings" → "Deploy"
2. **Build Command**: (laisser vide, Railway détecte automatiquement)
3. **Start Command**: 
   ```
   uvicorn server:app --host 0.0.0.0 --port $PORT
   ```

### 2.5 Déployer

1. Railway va automatiquement :
   - Détecter que c'est un projet Python
   - Installer les dépendances depuis `backend/requirements.txt`
   - Démarrer le serveur

2. Attendre que le déploiement soit terminé (2-3 minutes)

3. **Récupérer l'URL du backend**:
   - Dans l'onglet "Settings" → "Networking"
   - Cliquer sur "Generate Domain"
   - Copier l'URL (ex: `ecospeed-backend-production.up.railway.app`)
   - **Sauvegarder cette URL** - vous en aurez besoin pour Vercel

### 2.6 Vérifier que le backend fonctionne

1. Ouvrir l'URL du backend dans un navigateur
2. Vous devriez voir : `{"message":"ECOSPEED API"}`
3. Tester l'endpoint : `https://votre-backend.railway.app/api/`
4. Vous devriez voir : `{"message":"ECOSPEED API"}`

---

## Étape 3 : Vercel (Frontend)

### 3.1 Créer un compte Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur "Sign Up"
3. Se connecter avec GitHub

### 3.2 Importer le projet

1. Cliquer sur "Add New..." → "Project"
2. Sélectionner le repository **ECOSPEED**
3. Cliquer sur "Import"

### 3.3 Configurer le projet

1. **Project Name**: `ecospeed` (ou votre choix)

2. **Root Directory**: 
   - Cliquer sur "Edit"
   - Mettre : `frontend`

3. **Framework Preset**: 
   - Détecté automatiquement : "Create React App"

4. **Build Command**: 
   ```
   yarn build
   ```

5. **Output Directory**: 
   ```
   build
   ```

6. **Install Command**: 
   ```
   yarn install
   ```

### 3.4 Configurer les Variables d'Environnement

1. Dans la section "Environment Variables"
2. Ajouter :

   ```
   REACT_APP_BACKEND_URL=https://votre-backend.railway.app
   ```
   (Utiliser l'URL Railway que vous avez récupérée à l'étape 2.5)

### 3.5 Déployer

1. Cliquer sur "Deploy"
2. Attendre 2-3 minutes que le build se termine
3. Vercel va automatiquement :
   - Installer les dépendances
   - Builder l'application React
   - Déployer sur un CDN global

### 3.6 Récupérer l'URL du frontend

1. Une fois le déploiement terminé, Vercel vous donne une URL
2. Exemple : `ecospeed.vercel.app` ou `ecospeed-ethan-bns24.vercel.app`
3. **Sauvegarder cette URL**

### 3.7 Mettre à jour CORS dans Railway

1. Retourner sur Railway
2. Aller dans les Variables d'Environnement
3. Mettre à jour `CORS_ORIGINS` avec l'URL Vercel :
   ```
   CORS_ORIGINS=https://ecospeed.vercel.app
   ```
4. Railway va redéployer automatiquement

---

## Étape 4 : Vérification finale

### 4.1 Tester le frontend

1. Ouvrir l'URL Vercel dans un navigateur
2. L'application devrait se charger
3. Tester un calcul de route :
   - Entrer "Paris, France" comme départ
   - Entrer "Lyon, France" comme arrivée
   - Cliquer sur "Calculate Eco-Speed Profile"
4. Vérifier que :
   - La carte s'affiche
   - Le calcul fonctionne
   - Les résultats s'affichent

### 4.2 Vérifier les logs

**Railway (Backend)**:
1. Aller sur Railway → Votre projet → Logs
2. Vérifier qu'il n'y a pas d'erreurs
3. Vous devriez voir : `Application startup complete`

**Vercel (Frontend)**:
1. Aller sur Vercel → Votre projet → Deployments → Logs
2. Vérifier que le build s'est bien passé

---

## 🔧 Configuration avancée (optionnel)

### Domaine personnalisé Vercel

1. Dans Vercel → Settings → Domains
2. Ajouter votre domaine
3. Suivre les instructions DNS

### Variables d'environnement supplémentaires

Si vous voulez ajouter d'autres variables :

**Railway**:
- `LOG_LEVEL=INFO` (pour plus de logs)
- `ENVIRONMENT=production`

**Vercel**:
- `REACT_APP_ENV=production`

---

## 🐛 Dépannage

### Le backend ne démarre pas

1. **Vérifier les logs Railway**:
   - Aller dans Railway → Logs
   - Chercher les erreurs

2. **Vérifier les variables d'environnement**:
   - `MONGO_URL` est correcte (avec le mot de passe)
   - `ORS_API_KEY` est valide
   - `CORS_ORIGINS` inclut l'URL Vercel

3. **Vérifier le Start Command**:
   - Doit être : `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Le frontend ne charge pas

1. **Vérifier `REACT_APP_BACKEND_URL`**:
   - Doit être l'URL Railway (avec https://)
   - Pas de slash final

2. **Vérifier la build**:
   - Aller dans Vercel → Deployments → Logs
   - Vérifier qu'il n'y a pas d'erreurs de build

3. **Vider le cache du navigateur**:
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

### Erreurs CORS

1. **Vérifier `CORS_ORIGINS` dans Railway**:
   - Doit inclure l'URL exacte de Vercel
   - Format : `https://ecospeed.vercel.app`
   - Pas de slash final

2. **Redéployer Railway** après modification

### MongoDB connection failed

1. **Vérifier la connection string**:
   - Le mot de passe est correct
   - L'URL est complète avec `/ecospeed_db`

2. **Vérifier Network Access dans MongoDB Atlas**:
   - Votre IP est whitelistée (ou 0.0.0.0/0)

3. **Vérifier l'utilisateur MongoDB**:
   - L'utilisateur existe
   - Les permissions sont correctes

---

## 📊 Monitoring

### Railway

- **Logs en temps réel**: Railway → Logs
- **Métriques**: Railway → Metrics
- **Usage**: Railway → Usage (pour voir la consommation)

### Vercel

- **Analytics**: Vercel → Analytics (nécessite upgrade)
- **Logs**: Vercel → Deployments → Logs
- **Performance**: Vercel → Speed Insights

### MongoDB Atlas

- **Monitoring**: MongoDB Atlas → Metrics
- **Alerts**: MongoDB Atlas → Alerts

---

## 💰 Coûts

### Gratuit (avec limites)

- **Vercel**: 
  - 100 GB bandwidth/mois
  - Builds illimités
  - Domaine `.vercel.app` gratuit

- **Railway**:
  - $5 de crédit gratuit/mois
  - Suffisant pour un petit projet
  - Après, ~$5-10/mois selon usage

- **MongoDB Atlas**:
  - Cluster M0 gratuit (512 MB)
  - Suffisant pour développement/test
  - Pour production, ~$9/mois (M10)

### Estimation totale

- **Développement/Test**: **GRATUIT** ✅
- **Production légère**: **~$15-20/mois**
- **Production moyenne**: **~$30-50/mois**

---

## ✅ Checklist finale

- [ ] MongoDB Atlas configuré et accessible
- [ ] Railway backend déployé et accessible
- [ ] Vercel frontend déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] CORS configuré correctement
- [ ] Test de calcul de route réussi
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] URLs sauvegardées

---

## 🎉 Félicitations !

Votre application ECOSPEED est maintenant déployée en production !

**URLs**:
- Frontend: `https://votre-app.vercel.app`
- Backend: `https://votre-backend.railway.app`
- API Docs: `https://votre-backend.railway.app/docs`

**Prochaines étapes**:
- Partager l'URL avec vos utilisateurs
- Configurer un domaine personnalisé (optionnel)
- Mettre en place le monitoring
- Configurer les backups MongoDB (optionnel)

---

**Besoin d'aide ?** Consultez les logs ou ouvrez une issue sur GitHub.

