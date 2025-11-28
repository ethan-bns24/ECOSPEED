#!/bin/bash

# Script pour démarrer le backend ECOSPEED

echo "🚀 Démarrage du backend ECOSPEED..."
echo ""

# Activer l'environnement virtuel
if [ ! -d "venv" ]; then
    echo "❌ Environnement virtuel non trouvé. Création en cours..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "✅ Environnement virtuel activé"
echo ""

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé. Création d'un fichier .env par défaut..."
    cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=ecospeed_db
CORS_ORIGINS=*
ORS_API_KEY=
EOF
    echo "✅ Fichier .env créé avec les valeurs par défaut"
    echo ""
fi

echo "🌐 Démarrage du serveur FastAPI sur http://localhost:8001"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur
uvicorn server:app --reload --host 0.0.0.0 --port 8001

