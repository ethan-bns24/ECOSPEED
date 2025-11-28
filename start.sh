#!/bin/bash

# Script principal pour démarrer ECOSPEED (Backend + Frontend)

echo "🚀 Démarrage d'ECOSPEED - Green Driving Optimizer"
echo "=================================================="
echo ""

# Vérifier si MongoDB est en cours d'exécution
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB n'est pas démarré. Démarrage en cours..."
    brew services start mongodb/brew/mongodb-community
    sleep 3
    echo "✅ MongoDB démarré"
    echo ""
fi

# Fonction pour nettoyer les processus à la sortie
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Démarrer le backend
echo "📡 Démarrage du backend (port 8001)..."
cd backend
source venv/bin/activate
uvicorn server:app --reload --host 0.0.0.0 --port 8001 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
echo "🎨 Démarrage du frontend (port 3000)..."
cd frontend
yarn start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Serveurs démarrés !"
echo ""
echo "📍 Backend API:  http://localhost:8001"
echo "📍 Frontend:     http://localhost:3000"
echo "📍 API Docs:     http://localhost:8001/docs"
echo ""
echo "📋 Logs:"
echo "   - Backend:  tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter tous les serveurs"
echo ""

# Attendre que les processus se terminent
wait

