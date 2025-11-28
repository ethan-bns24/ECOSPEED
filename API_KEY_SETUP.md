# 🔑 Configuration de la clé API OpenRouteService

## Problème résolu ✅

Le code a été corrigé ! Maintenant :
- Si vous cochez **"Use demo route"** → utilise la route démo (Le Havre → Versailles)
- Si vous **ne cochez pas** la case et entrez d'autres villes → essaie d'utiliser l'API OpenRouteService

## Comment obtenir une clé API gratuite

### 1. Créer un compte sur OpenRouteService

1. Allez sur https://openrouteservice.org/
2. Cliquez sur **"Sign Up"** ou **"Get API Key"**
3. Créez un compte (gratuit)
4. Confirmez votre email

### 2. Obtenir votre clé API

1. Une fois connecté, allez dans votre **Dashboard**
2. Vous verrez votre **API Key** (gratuite : 2000 requêtes/jour)
3. Copiez la clé

### 3. Ajouter la clé au projet

Éditez le fichier `backend/.env` et ajoutez votre clé :

```bash
cd backend
nano .env
```

Ou avec un éditeur de texte, modifiez la ligne :
```env
ORS_API_KEY=votre_cle_api_ici
```

Remplacez `votre_cle_api_ici` par votre vraie clé API.

### 4. Redémarrer le backend

Après avoir ajouté la clé, redémarrez le serveur backend :

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
cd backend
./start.sh
```

## Test

1. Ouvrez http://localhost:3000
2. **Décochez** "Use demo route"
3. Entrez deux villes (ex: "Paris, France" et "Lyon, France")
4. Cliquez sur "Calculate Eco-Speed Profile"

Si la clé API est correctement configurée, vous devriez voir la vraie route entre les deux villes !

## Limites gratuites

- **2000 requêtes/jour** (gratuit)
- Suffisant pour tester et développer
- Pour plus de requêtes, des plans payants sont disponibles

## Dépannage

### Erreur "API key not configured"
→ Vérifiez que vous avez bien ajouté `ORS_API_KEY=votre_cle` dans `backend/.env`

### Erreur "Could not find location"
→ Vérifiez que les noms de villes sont corrects et incluent le pays (ex: "Paris, France")

### Erreur "Error calling OpenRouteService API"
→ Vérifiez que votre clé API est valide et que vous n'avez pas dépassé la limite quotidienne

---

**Note** : Le mode démo fonctionne toujours sans clé API pour tester l'application !

