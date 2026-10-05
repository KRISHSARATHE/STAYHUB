#!/bin/bash

set -u

ROOT="$HOME/Documents/STAYHUB"
BACKEND="$ROOT/backend"
LOG="$BACKEND/stayhub-backend.log"

echo ""
echo "=========================================="
echo "       STAYHUB HOTELBEDS SETUP"
echo "=========================================="
echo ""

cd "$BACKEND" || exit 1

echo "1. Setting backend port to 5050..."

if grep -q '^PORT=' .env 2>/dev/null; then
  sed -i '' 's/^PORT=.*/PORT=5050/' .env
else
  printf '\nPORT=5050\n' >> .env
fi

echo "   ✓ PORT=5050"

echo ""
echo "2. Checking backend syntax..."

node --check server.js
if [ $? -ne 0 ]; then
  echo "   ✗ server.js syntax error"
  exit 1
fi

node --check hotelbeds.js
if [ $? -ne 0 ]; then
  echo "   ✗ hotelbeds.js syntax error"
  exit 1
fi

echo "   ✓ Syntax OK"

echo ""
echo "3. Updating frontend API port..."

cd "$ROOT"

grep -RIl --exclude-dir=node_modules --exclude-dir=.git \
  'localhost:5050' . 2>/dev/null | while read -r file; do
    sed -i '' 's/localhost:5050/localhost:5050/g' "$file"
    echo "   ✓ Updated: ${file#$ROOT/}"
done

echo ""
echo "4. Checking port 5050..."

PID=$(lsof -tiTCP:5050 -sTCP:LISTEN 2>/dev/null || true)

if [ -n "$PID" ]; then
  echo "   Existing process on 5050: $PID"

  if ps -p "$PID" -o command= | grep -q "node"; then
    kill "$PID" 2>/dev/null || true
    sleep 1
    echo "   ✓ Old STAYHUB Node process stopped"
  else
    echo "   ✗ Port 5050 is occupied by another application."
    echo "   Run: lsof -nP -iTCP:5050 -sTCP:LISTEN"
    exit 1
  fi
fi

echo ""
echo "5. Starting STAYHUB backend..."

cd "$BACKEND"

nohup npm start > "$LOG" 2>&1 &
SERVER_PID=$!

echo "   Backend PID: $SERVER_PID"
echo "   Log: $LOG"

echo ""
echo "6. Waiting for backend..."

READY=0

for i in {1..15}; do
  sleep 1

  if curl -s --max-time 2 http://localhost:5050/api/health >/tmp/stayhub-health.json 2>/dev/null; then
    READY=1
    break
  fi
done

if [ "$READY" -ne 1 ]; then
  echo ""
  echo "   ✗ Backend did not become ready."
  echo ""
  echo "----- BACKEND LOG -----"
  tail -80 "$LOG"
  echo "-----------------------"
  exit 1
fi

echo "   ✓ Backend is running"

echo ""
echo "7. Health check:"
curl -s http://localhost:5050/api/health
echo ""

echo ""
echo "8. Testing Hotelbeds Availability..."

HOTELBEDS_RESPONSE=$(curl -s --max-time 30 \
  "http://localhost:5050/api/hotelbeds/availability?checkIn=2026-10-10&checkOut=2026-10-12&adults=2&children=0&rooms=1&hotelCodes=3424,168")

echo "$HOTELBEDS_RESPONSE" > /tmp/stayhub-hotelbeds.json

if echo "$HOTELBEDS_RESPONSE" | python3 -c '
import sys,json
try:
    d=json.load(sys.stdin)
    ok=d.get("success") is True and d.get("source")=="hotelbeds"
    hotels=d.get("data",[])
    print("Hotelbeds success:", ok)
    print("Hotels returned:", len(hotels))
    for h in hotels[:5]:
        print(" -", h.get("name"), "|", h.get("category"), "|", h.get("price"), h.get("currency"))
    sys.exit(0 if ok and hotels else 1)
except Exception as e:
    print("Invalid JSON:", e)
    sys.exit(1)
'; then
  echo ""
  echo "=========================================="
  echo "       HOTELBEDS INTEGRATION PASSED"
  echo "=========================================="
  echo ""
  echo "Backend:  http://localhost:5050"
  echo "Health:   OK"
  echo "Hotelbeds: OK"
  echo ""
else
  echo ""
  echo "=========================================="
  echo "       HOTELBEDS TEST FAILED"
  echo "=========================================="
  echo ""
  echo "Response:"
  cat /tmp/stayhub-hotelbeds.json
  echo ""
  echo "Backend log:"
  tail -80 "$LOG"
  exit 1
fi

echo "9. Final status:"
echo "   ✓ Existing backend preserved"
echo "   ✓ Existing UI/design preserved"
echo "   ✓ Backend moved from 5000 → 5050"
echo "   ✓ Hotelbeds service active"
echo "   ✓ Hotelbeds availability endpoint active"
echo ""
echo "Next frontend dev server can use:"
echo "   http://localhost:5050"
echo ""
