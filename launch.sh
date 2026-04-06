#!/bin/bash

# Pounce Ecosystem Launcher (Server, Client, Simulator)

# Kill background processes on exit
cleanup() {
    echo ""
    echo "🐾 Alab is shutting down the pride..."
    kill 0
    fuser -k 5050/tcp 5173/tcp > /dev/null 2>&1
    exit
}

# Trap exit signals
trap cleanup SIGINT SIGTERM

echo "🚀 Launching the Pounce Ecosystem..."

# Ensure MongoDB is running
if ! (ss -tuln | grep -q :27017 || lsof -i :27017 -sTCP:LISTEN >/dev/null 2>&1); then
    echo "❌ CRITICAL ERROR: Database is missing!"
    echo "You forgot to turn on the database bro. 😿"
    exit 1
fi

# Clear existing port listeners
fuser -k 5050/tcp 5173/tcp > /dev/null 2>&1

# Start Server
echo "📡 Starting Server on :5050..."
(cd server && npm run dev) &

sleep 3

# Start Client
echo "💻 Starting Client on :5173..."
(cd client && npm run dev) &

# Start Bot Swarm
echo "🤖 Spawning the Bot Swarm..."
(cd server && node simulator.js) &

echo ""
echo "✅ All systems are live!"
echo "Press Ctrl+C to stop everything."

# Wait for background processes
wait
