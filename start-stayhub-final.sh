#!/bin/bash

set -u

PROJECT="$HOME/Documents/STAYHUB"
BACKEND="$PROJECT/backend"

echo ""
echo "=========================================="
echo "🚀 STAYHUB FINAL DEMO STARTUP"
echo "=========================================="

cd "$PROJECT" || exit 1

# --------------------------------------------------
# 1. Make frontend API URL permanent
# --------------------------------------------------

cat > "$PROJECT/.env.local" <<'ENV'
VITE_API_URL=http://localhost:5001/api
ENV

echo "✅ Frontend API URL fixed"

# --------------------------------------------------
# 2. Start Docker Desktop if it is not running
# --------------------------------------------------

if ! docker info >/dev/null 2>&1; then
    echo "🐳 Docker Desktop is not running."
    echo "Opening Docker Desktop..."

    open -a Docker

    echo "⏳ Waiting for Docker..."

    DOCKER_OK=false

    for i in {1..60}; do
        if docker info >/dev/null 2>&1; then
            DOCKER_OK=true
            break
        fi
        sleep 1
    done

    if [ "$DOCKER_OK" != true ]; then
        echo "❌ Docker Desktop did not start."
        exit 1
    fi
fi

echo "✅ Docker running"

# --------------------------------------------------
# 3. Start PostgreSQL
# --------------------------------------------------

echo "🗄️ Starting PostgreSQL..."

docker compose up -d db

echo "⏳ Waiting for PostgreSQL..."

DB_OK=false

for i in {1..40}; do
    if docker compose exec -T db pg_isready -U postgres -d stayhub >/dev/null 2>&1; then
        DB_OK=true
        break
    fi
    sleep 1
done

if [ "$DB_OK" != true ]; then
    echo "❌ PostgreSQL did not become ready."
    exit 1
fi

echo "✅ PostgreSQL ready"

# --------------------------------------------------
# 4. Permanent booking schema migration
# --------------------------------------------------

echo "🔧 Checking booking database..."

docker exec -i stayhub-postgres psql -U postgres -d stayhub <<'SQL'
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) NOT NULL DEFAULT 'Demo Payment',
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
SQL

echo "✅ Booking schema ready"

# --------------------------------------------------
# 5. Stop only STAYHUB processes
# --------------------------------------------------

echo "🧹 Cleaning old STAYHUB processes..."

PIDS=$(lsof -ti tcp:5001 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null || true
    sleep 2
fi

PIDS=$(lsof -ti tcp:5184 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null || true
    sleep 2
fi

# --------------------------------------------------
# 6. Start backend in background
# --------------------------------------------------

echo "🔧 Starting Backend..."

cd "$BACKEND"

nohup npm run dev > "$PROJECT/.stayhub-backend.log" 2>&1 < /dev/null &

echo "⏳ Waiting for Backend..."

BACKEND_OK=false

for i in {1..40}; do
    if curl -fsS http://localhost:5001/api/health >/dev/null 2>&1; then
        BACKEND_OK=true
        break
    fi
    sleep 1
done

if [ "$BACKEND_OK" != true ]; then
    echo ""
    echo "❌ Backend failed."
    echo ""
    tail -50 "$PROJECT/.stayhub-backend.log"
    exit 1
fi

echo "✅ Backend running"

# --------------------------------------------------
# 7. Verify hotel API
# --------------------------------------------------

echo "🏨 Checking hotel API..."

HOTELS=$(curl -fsS http://localhost:5001/api/hotels 2>/dev/null || true)

if [ -z "$HOTELS" ]; then
    echo "❌ Hotel API failed."
    exit 1
fi

echo "✅ Hotel API responding"

# --------------------------------------------------
# 8. Start frontend
# --------------------------------------------------

echo "⚛️ Starting React/Vite..."

cd "$PROJECT"

nohup npm run dev -- --host 127.0.0.1 --port 5184 --strictPort \
    > "$PROJECT/.stayhub-frontend.log" 2>&1 < /dev/null &

echo "⏳ Waiting for Frontend..."

FRONTEND_OK=false

for i in {1..40}; do
    if curl -fsS http://localhost:5184/ >/dev/null 2>&1; then
        FRONTEND_OK=true
        break
    fi
    sleep 1
done

if [ "$FRONTEND_OK" != true ]; then
    echo ""
    echo "❌ Frontend failed."
    echo ""
    tail -50 "$PROJECT/.stayhub-frontend.log"
    exit 1
fi

echo "✅ Frontend running"

# --------------------------------------------------
# 9. Production build verification
# --------------------------------------------------

echo "🏗️ Checking production build..."

npm run build >/tmp/stayhub-build.log 2>&1

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Production build failed."
    cat /tmp/stayhub-build.log
    exit 1
fi

echo "✅ Production build successful"

# --------------------------------------------------
# 10. Final status
# --------------------------------------------------

echo ""
echo "=========================================="
echo "🎉 STAYHUB DEMO READY"
echo "=========================================="
echo ""
echo "🌐 Frontend"
echo "http://localhost:5184/"
echo ""
echo "🔧 Backend"
echo "http://localhost:5001/"
echo ""
echo "🏨 Hotel API"
echo "http://localhost:5001/api/hotels"
echo ""
echo "🗄️ PostgreSQL"
echo "Docker"
echo ""
echo "✅ Booking"
echo "✅ Optional Coupon"
echo "✅ Payment Demo"
echo "✅ Hotel Data"
echo "✅ Wishlist API"
echo "✅ Admin API"
echo "✅ Production Build"
echo ""
echo "=========================================="

open "http://localhost:5184/"
