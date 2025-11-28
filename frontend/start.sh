#!/bin/bash

# Script pour démarrer le frontend ECOSPEED

echo "🚀 Démarrage du frontend ECOSPEED..."
echo ""

# Vérifier si yarn est installé
if ! command -v yarn &> /dev/null; then
    echo "❌ Yarn n'est pas installé. Installation en cours..."
    npm install -g yarn
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    yarn install
fi

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Fichier .env non trouvé. Création d'un fichier .env par défaut..."
    echo "REACT_APP_BACKEND_URL=http://localhost:8001" > .env
    echo "✅ Fichier .env créé"
    echo ""
fi

echo "🌐 Démarrage du serveur de développement React sur http://localhost:3000"
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Démarrer le serveur de développement
yarn start

