#!/bin/bash
set -e

ROOT="$HOME/Documents/STAYHUB"
cd "$ROOT"

echo "===== STAYHUB FINAL AUTH + IMAGE FIX ====="

# Backup
cp backend/server.js "backend/server.js.backup-final-$(date +%Y%m%d-%H%M%S)"

# -------------------------------------------------
# 1. Fix remaining broken image URLs everywhere
# -------------------------------------------------
python3 <<'PY'
from pathlib import Path

root = Path.home() / "Documents/STAYHUB"

replacements = {
    "photo-1566073771259-6a8506099945": "photo-1566073771259-6a8506099945",
    "photo-1551882547-ff40c63fe5fa": "photo-1551882547-ff40c63fe5fa",
}

for p in root.rglob("*"):
    if not p.is_file() or any(x in p.parts for x in [".git","node_modules","dist"]):
        continue
    try:
        s = p.read_text()
    except:
        continue
    n = s
    for a,b in replacements.items():
        n = n.replace(a,b)
    if n != s:
        p.write_text(n)
        print("IMAGE FIX:", p)
PY

# -------------------------------------------------
# 2. Update database image URLs
# -------------------------------------------------
docker exec -i stayhub-postgres psql -U postgres -d stayhub <<'SQL'
UPDATE hotels
SET image = REPLACE(image,
'photo-1566073771259-6a8506099945',
'photo-1566073771259-6a8506099945');

UPDATE hotels
SET image = REPLACE(image,
'photo-1551882547-ff40c63fe5fa',
'photo-1551882547-ff40c63fe5fa');
SQL

# -------------------------------------------------
# 3. Ensure admin environment
# -------------------------------------------------
cat > backend/.env <<'ENV'
PORT=5001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stayhub
JWT_SECRET=stayhub-demo-secret-2026
ADMIN_EMAIL=admin@stayhub.com
ADMIN_PASSWORD=admin123
ENV

# -------------------------------------------------
# 4. Add robust admin login endpoint
# -------------------------------------------------
python3 <<'PY'
from pathlib import Path

p = Path.home() / "Documents/STAYHUB/backend/server.js"
s = p.read_text()

marker = "STAYHUB_FINAL_ADMIN_LOGIN"

if marker not in s:
    endpoint = r'''

// STAYHUB_FINAL_ADMIN_LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        message: "Invalid admin email or password"
      });
    }

    const token = jwt.sign(
      {
        id: "admin",
        userId: "admin",
        email: adminEmail,
        role: "admin",
        isAdmin: true
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      accessToken: token,
      data: {
        token,
        accessToken: token,
        user: {
          id: "admin",
          email: adminEmail,
          name: "STAYHUB Admin",
          role: "admin",
          isAdmin: true
        }
      },
      user: {
        id: "admin",
        email: adminEmail,
        name: "STAYHUB Admin",
        role: "admin",
        isAdmin: true
      }
    });
  } catch (err) {
    console.error("Admin login:", err);
    res.status(500).json({ message: "Admin login failed" });
  }
});

'''

    # Insert before first auth/register endpoint
    pos = s.find('app.post("/api/auth/register"')
    if pos == -1:
        pos = s.find("app.listen(")

    if pos == -1:
        raise SystemExit("Could not locate backend insertion point")

    s = s[:pos] + endpoint + s[pos:]
    p.write_text(s)

print("Admin endpoint checked.")
PY

# -------------------------------------------------
# 5. Restart everything
# -------------------------------------------------
echo "Stopping old processes..."

lsof -ti :5001 | xargs -r kill -9 2>/dev/null || true
lsof -ti :5184 | xargs -r kill -9 2>/dev/null || true

docker compose up -d db

echo "Waiting for database..."
for i in {1..30}; do
  docker exec stayhub-postgres pg_isready -U postgres -d stayhub >/dev/null 2>&1 && break
  sleep 1
done

# -------------------------------------------------
# 6. Ensure booking schema
# -------------------------------------------------
docker exec -i stayhub-postgres psql -U postgres -d stayhub <<'SQL'
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT '';

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) NOT NULL DEFAULT 'Demo Payment';

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending';

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
SQL

# -------------------------------------------------
# 7. Backend
# -------------------------------------------------
cd "$ROOT/backend"
nohup npm run dev > "$ROOT/.stayhub-backend.log" 2>&1 &

echo "Waiting for backend..."
for i in {1..40}; do
  curl -fsS http://localhost:5001/api/health >/dev/null 2>&1 && break
  sleep 1
done

echo
echo "===== HEALTH ====="
curl -s http://localhost:5001/api/health
echo

echo
echo "===== ADMIN LOGIN TEST ====="
curl -s -X POST http://localhost:5001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stayhub.com","password":"admin123"}'
echo

# -------------------------------------------------
# 8. Frontend
# -------------------------------------------------
cd "$ROOT"

echo "VITE_API_URL=http://localhost:5001/api" > .env.local

nohup npm run dev -- --host 127.0.0.1 --port 5184 --strictPort \
  > "$ROOT/.stayhub-frontend.log" 2>&1 &

echo "Waiting for frontend..."
for i in {1..40}; do
  curl -fsS http://localhost:5184/ >/dev/null 2>&1 && break
  sleep 1
done

# -------------------------------------------------
# 9. Build
# -------------------------------------------------
echo
echo "===== BUILD ====="
npm run build

echo
echo "=========================================="
echo "       STAYHUB FINAL FIX COMPLETE"
echo "=========================================="
echo
echo "Open: http://localhost:5184/"
echo
echo "ADMIN LOGIN"
echo "Email:    admin@stayhub.com"
echo "Password: admin123"
echo
echo "IMPORTANT:"
echo "Browser me Cmd + Shift + R karo."
echo "Agar old admin token saved hai to Admin logout/login karo."
echo "=========================================="

open "http://localhost:5184/"
