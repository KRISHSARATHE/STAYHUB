#!/bin/bash

PROJECT="$HOME/Documents/STAYHUB"
BACKEND="$PROJECT/backend"
FRONTEND_LOG="$PROJECT/.stayhub-frontend.log"
BACKEND_LOG="$PROJECT/.stayhub-backend.log"

echo ""
echo "======================================"
echo "🚀 STAYHUB ONE-CLICK START"
echo "======================================"

cd "$PROJECT" || exit 1

# --------------------------------------
# 1. Fix frontend API URL
# --------------------------------------
if [ ! -f "$PROJECT/.env.local" ]; then
  echo "VITE_API_URL=http://localhost:5001/api" > "$PROJECT/.env.local"
else
  if grep -q "^VITE_API_URL=" "$PROJECT/.env.local"; then
    sed -i '' 's#^VITE_API_URL=.*#VITE_API_URL=http://localhost:5001/api#' "$PROJECT/.env.local"
  else
    echo "VITE_API_URL=http://localhost:5001/api" >> "$PROJECT/.env.local"
  fi
fi

# --------------------------------------
# 2. Start PostgreSQL
# --------------------------------------
echo "🗄️ Starting PostgreSQL..."
docker compose up -d db

echo "⏳ Waiting for PostgreSQL..."

for i in {1..30}; do
  if docker compose exec -T db pg_isready -U stayhub -d stayhub >/dev/null 2>&1; then
    echo "✅ PostgreSQL ready"
    break
  fi
  sleep 1
done

# --------------------------------------
# 3. Stop old STAYHUB ports only
# --------------------------------------
echo "🧹 Cleaning old STAYHUB processes..."

for PORT in 5001 5184; do
  PIDS=$(lsof -ti tcp:$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Stopping process on port $PORT..."
    kill $PIDS 2>/dev/null
    sleep 1
  fi
done

# --------------------------------------
# 4. Start Backend
# --------------------------------------
echo "🔧 Starting Backend API..."

cd "$BACKEND" || exit 1

nohup npm run dev > "$BACKEND_LOG" 2>&1 < /dev/null &

BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"

# --------------------------------------
# 5. Wait for Backend
# --------------------------------------
echo "⏳ Waiting for Backend API..."

BACKEND_OK=false

for i in {1..30}; do
  if curl -fsS http://localhost:5001/api/health >/dev/null 2>&1; then
    BACKEND_OK=true
    break
  fi
  sleep 1
done

if [ "$BACKEND_OK" != true ]; then
  echo ""
  echo "❌ Backend failed to start."
  echo ""
  echo "Last backend log:"
  tail -30 "$BACKEND_LOG"
  exit 1
fi

echo "✅ Backend API running on 5001"

# --------------------------------------
# 6. Verify hotel data
# --------------------------------------
echo "🏨 Checking hotel data..."

HOTELS_RESPONSE=$(curl -fsS "http://localhost:5001/api/hotels" 2>/dev/null)

if [ -z "$HOTELS_RESPONSE" ]; then
  echo "❌ Hotel API returned no response."
  tail -30 "$BACKEND_LOG"
  exit 1
fi

echo "✅ Hotel API responding"

# --------------------------------------
# 7. Start Frontend
# --------------------------------------
echo "⚛️ Starting React/Vite..."

cd "$PROJECT" || exit 1

nohup npm run dev -- --host 127.0.0.1 --port 5184 --strictPort > "$FRONTEND_LOG" 2>&1 < /dev/null &

FRONTEND_PID=$!

echo "Frontend PID: $FRONTEND_PID"

# --------------------------------------
# 8. Wait for Frontend
# --------------------------------------
echo "⏳ Waiting for React..."

FRONTEND_OK=false

for i in {1..30}; do
  if curl -fsS http://localhost:5184/ >/dev/null 2>&1; then
    FRONTEND_OK=true
    break
  fi
  sleep 1
done

if [ "$FRONTEND_OK" != true ]; then
  echo ""
  echo "❌ Frontend failed to start."
  echo ""
  echo "Last frontend log:"
  tail -40 "$FRONTEND_LOG"
  exit 1
fi

echo "✅ Frontend running on 5184"

# --------------------------------------
# 9. Final verification
# --------------------------------------
echo ""
echo "======================================"
echo "✅ STAYHUB IS READY"
echo "======================================"
echo ""
echo "🌐 Website:"
echo "http://localhost:5184/"
echo ""
echo "🔧 Backend:"
echo "http://localhost:5001/"
echo ""
echo "🏨 Hotel API:"
echo "http://localhost:5001/api/hotels"
echo ""
echo "🗄️ Database:"
echo "PostgreSQL Docker"
echo ""
echo "======================================"

open "http://localhost:5184/"
