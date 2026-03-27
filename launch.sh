#!/bin/bash

# Pounce Ecosystem Launcher
# This script starts the Server, Client, and Bot Simulator concurrently.

# Function to kill all background processes on exit
cleanup() {
    echo ""
    echo "🐾 Alab is shutting down the pride..."
    # Kill the process group
    kill 0
    # Force kill the specific ports just in case
    fuser -k 5050/tcp 5173/tcp > /dev/null 2>&1
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM to run cleanup
trap cleanup SIGINT SIGTERM

echo "🚀 Launching the Pounce Ecosystem..."

# Pre-launch database check: Crash if MongoDB isn't running
if ! (ss -tuln | grep -q :27017 || lsof -i :27017 -sTCP:LISTEN >/dev/null 2>&1); then
    echo "❌ CRITICAL ERROR: Database is missing!"
    echo "You forgot to turn on the database bro. 😿"
    exit 1
fi

# Pre-launch cleanup: kill anything already on our ports
fuser -k 5050/tcp 5173/tcp > /dev/null 2>&1

# 1. Start the Server in a subshell
echo "📡 Starting Server on :5050..."
(cd server && npm run dev) &

# Wait for server to initialize
sleep 3

# 2. Start the Client in a subshell
echo "💻 Starting Client on :5173..."
(cd client && npm run dev) &

# 3. Start the Swarm (Simulator) in a subshell
echo "🤖 Spawning the Bot Swarm..."
(cd server && node simulator.js) &

echo ""
echo "✅ All systems are live!"
echo "Press Ctrl+C to stop everything."

# Keep the script running
wait
