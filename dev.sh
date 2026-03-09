#!/bin/bash
# Local Development Server
# Starts both backend and frontend dev servers

echo "🚀 Starting Philosify Local Development Servers..."
echo ""

# Start backend in background
echo "📦 Starting Backend API (wrangler dev)..."
cd api && wrangler dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend in background
echo "🎨 Starting Frontend (vite dev)..."
cd ../site && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started!"
echo ""
echo "Backend:  http://localhost:8787"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
