#!/bin/bash
set -e
ROOT="$HOME/Documents/STAYHUB"
CERTDIR="$HOME/Documents/hotelbeds-certs"
BACKEND="$ROOT/backend"
SERVICE="$BACKEND/services/hotelbeds.js"

echo "== STAYHUB live Hotelbeds fix =="
cd "$ROOT"
mkdir -p "$BACKEND/services"

# Backups
[ -f "$SERVICE" ] && cp "$SERVICE" "$SERVICE.backup-before-mtls-$(date +%Y%m%d-%H%M%S)"
[ -f "$BACKEND/server.js" ] && cp "$BACKEND/server.js" "$BACKEND/server.js.backup-before-mtls-$(date +%Y%m%d-%H%M%S)"

cat > "$SERVICE" <<'JS'
import crypto from "node:crypto";
import https from "node:https";
import fs from "node:fs";

function config() {
  return {
    apiKey: String(process.env.HOTELBEDS_API_KEY || "").trim(),
    secret: String(process.env.HOTELBEDS_SECRET || "").trim(),
    baseUrl: (process.env.HOTELBEDS_BASE_URL || "https://api-mtls.test.hotelbeds.com").replace(/\/$/, ""),
    sourceMarket: String(process.env.HOTELBEDS_SOURCE_MARKET || "IN").trim().toUpperCase(),
    currency: String(process.env.HOTELBEDS_CURRENCY || "INR").trim().toUpperCase(),
    certPath: String(process.env.HOTELBEDS_CERT_PATH || "").trim(),
    keyPath: String(process.env.HOTELBEDS_KEY_PATH || "").trim(),
    destinationMap: parseJsonMap(process.env.HOTELBEDS_DESTINATION_MAP || "{}"),
  };
}

function parseJsonMap(value) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeCity(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function signature(apiKey, secret) {
  return crypto.createHash("sha256").update(`${apiKey}${secret}${Math.floor(Date.now() / 1000)}`).digest("hex");
}

function request(path, options = {}) {
  const cfg = config();
  if (!cfg.apiKey || !cfg.secret) throw new Error("Hotelbeds provider is not configured. Add HOTELBEDS_API_KEY and HOTELBEDS_SECRET to backend/.env.");
  if (!cfg.certPath || !cfg.keyPath) throw new Error("Hotelbeds mTLS certificate/key paths are not configured in backend/.env.");
  if (!fs.existsSync(cfg.certPath)) throw new Error(`Hotelbeds certificate not found: ${cfg.certPath}`);
  if (!fs.existsSync(cfg.keyPath)) throw new Error(`Hotelbeds private key not found: ${cfg.keyPath}`);

  const url = new URL(`${cfg.baseUrl}${path}`);
  const body = options.body || "";
  const headers = {
    "Api-key": cfg.apiKey,
    "X-Signature": signature(cfg.apiKey, cfg.secret),
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = https.request({
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: options.method || "GET",
      headers,
      cert: fs.readFileSync(cfg.certPath),
      key: fs.readFileSync(cfg.keyPath),
      rejectUnauthorized: true,
      timeout: 30000,
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(data?.error?.message || data?.message || `Hotelbeds request failed (${response.statusCode})`);
          error.status = response.statusCode;
          error.providerResponse = data;
          reject(error);
          return;
        }
        resolve(data);
      });
    });
    req.on("timeout", () => req.destroy(new Error("Hotelbeds request timed out.")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function getDestinationCode(city) {
  const map = config().destinationMap;
  const key = normalizeCity(city);
  const mapped = map[key] || map[key.replace(/\s+/g, "_")];
  return mapped ? String(mapped).trim() : "";
}

function buildOccupancies({ rooms = 1, adults = 2, children = 0, childAges = [] }) {
  const roomCount = Math.max(1, Number(rooms) || 1);
  const adultCount = Math.max(1, Number(adults) || 1);
  const childCount = Math.max(0, Number(children) || 0);
  const ages = Array.isArray(childAges) ? childAges.map(Number) : [];
  return [{
    rooms: roomCount,
    adults: adultCount,
    children: childCount,
    ...(childCount ? { paxes: ages.slice(0, childCount).map((age) => ({ type: "CH", age: Math.min(Math.max(age || 8, 0), 17) })) } : {}),
  }];
}

function firstImage(hotel) {
  const image = Array.isArray(hotel.images) ? hotel.images[0] : null;
  if (!image) return "";
  if (typeof image === "string") return image;
  const path = image.path || image.url || "";
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `https://photos.hotelbeds.com/giata/medium/${String(path).replace(/^\//, "")}`;
}

function normalizeCategory(value) {
  const text = String(value || "Hotel").toUpperCase();
  if (text.includes("5")) return "Luxury";
  if (text.includes("4")) return "Premium";
  if (text.includes("3")) return "Standard";
  return "Budget";
}

function flattenRates(data) {
  const hotels = data?.hotels?.hotels || data?.hotels || [];
  const output = [];
  for (const hotel of Array.isArray(hotels) ? hotels : []) {
    const rooms = Array.isArray(hotel.rooms) ? hotel.rooms : [];
    const candidates = rooms.flatMap((room) => (Array.isArray(room.rates) ? room.rates : []).map((rate) => ({ room, rate })))
      .filter(({ rate }) => rate?.rateKey && Number(rate?.net ?? rate?.sellingRate ?? rate?.sellingRateWithoutCommission) > 0)
      .sort((a, b) => Number(a.rate.net ?? a.rate.sellingRate ?? Infinity) - Number(b.rate.net ?? b.rate.sellingRate ?? Infinity));
    const selected = candidates[0];
    if (!selected) continue;
    const total = Number(selected.rate.net ?? selected.rate.sellingRate ?? selected.rate.sellingRateWithoutCommission ?? 0);
    output.push({
      provider: "hotelbeds",
      providerHotelId: String(hotel.code),
      name: hotel.name || `Hotel ${hotel.code}`,
      location: [hotel.destinationName || hotel.destination || hotel.zoneName, hotel.address].filter(Boolean).join(", ") || "India",
      city: hotel.destinationName || hotel.destination || "",
      category: normalizeCategory(hotel.categoryName || hotel.category || "Hotel"),
      rating: Number(hotel.rating ?? hotel.review?.rating ?? 0) || 0,
      image: firstImage(hotel),
      description: hotel.description?.content || hotel.description || "",
      totalRooms: Number(hotel.rooms?.length || 20) || 20,
      providerRateKey: String(selected.rate.rateKey),
      providerRateType: String(selected.rate.rateType || "BOOKABLE"),
      providerRoomName: selected.room?.name || selected.room?.code || "Room",
      providerBoard: selected.rate.boardName || selected.rate.boardCode || "",
      providerTotal: total,
      providerCurrency: String(data?.currency || config().currency),
    });
  }
  return output;
}

export function hotelbedsConfigured() {
  const cfg = config();
  return Boolean(cfg.apiKey && cfg.secret && cfg.certPath && cfg.keyPath);
}

export async function checkStatus() {
  return request("/hotel-api/1.0/status");
}

export async function searchHotels({ city, checkIn, checkOut, rooms, adults, children, childAges }) {
  const destinationCode = getDestinationCode(city);
  if (!destinationCode) {
    const error = new Error(`No Hotelbeds destination code configured for "${city}". Add it to HOTELBEDS_DESTINATION_MAP.`);
    error.code = "DESTINATION_NOT_CONFIGURED";
    throw error;
  }
  const cfg = config();
  const body = {
    stay: { checkIn, checkOut },
    occupancies: buildOccupancies({ rooms, adults, children, childAges }),
    destination: { code: destinationCode },
    sourceMarket: cfg.sourceMarket,
    currency: cfg.currency,
    dailyRate: true,
  };
  const data = await request("/hotel-api/1.0/hotels", { method: "POST", body: JSON.stringify(body) });
  return { raw: data, hotels: flattenRates(data), destinationCode };
}

export async function checkRates(rateKeys) {
  const keys = (Array.isArray(rateKeys) ? rateKeys : [rateKeys]).filter(Boolean).slice(0, 10);
  if (!keys.length) throw new Error("At least one Hotelbeds rateKey is required.");
  return request("/hotel-api/1.0/checkrates", { method: "POST", body: JSON.stringify({ rooms: keys.map((rateKey) => ({ rateKey })) }) });
}

export async function createBooking({ rateKey, holderName, holderSurname, roomCount = 1, adults = 2, children = 0, childAges = [], clientReference, remark = "STAYHUB booking" }) {
  const rooms = [];
  const ages = Array.isArray(childAges) ? childAges.map(Number) : [];
  const firstName = String(holderName || "Guest").trim() || "Guest";
  const surname = String(holderSurname || "STAYHUB").trim() || "STAYHUB";
  for (let roomId = 1; roomId <= Math.max(1, Number(roomCount) || 1); roomId += 1) {
    const paxes = [];
    for (let i = 0; i < Math.max(1, Number(adults) || 1); i += 1) paxes.push({ roomId, type: "AD", name: firstName, surname });
    for (let i = 0; i < Math.max(0, Number(children) || 0); i += 1) paxes.push({ roomId, type: "CH", name: "Child", surname, age: Math.min(Math.max(ages[i] || 8, 0), 17) });
    rooms.push({ rateKey, paxes });
  }
  return request("/hotel-api/1.0/bookings", { method: "POST", body: JSON.stringify({ holder: { name: firstName, surname }, rooms, clientReference: clientReference || `STAYHUB-${Date.now()}`, remark }) });
}

export async function cancelBooking(providerReference) {
  if (!providerReference) throw new Error("Provider booking reference is required.");
  return request(`/hotel-api/1.0/bookings/${encodeURIComponent(providerReference)}`, { method: "DELETE" });
}
JS

# Create or update backend/.env without touching any existing secrets.
ENV="$BACKEND/.env"
touch "$ENV"
add_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV"; then
    sed -i '' "s#^${key}=.*#${key}=${value}#" "$ENV"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$ENV"
  fi
}
add_env PORT 5001
add_env DATABASE_URL 'postgresql://postgres:postgres@localhost:5432/stayhub'
add_env CORS_ORIGIN 'http://localhost:5184'
add_env HOTELBEDS_BASE_URL 'https://api-mtls.test.hotelbeds.com'
add_env HOTELBEDS_SOURCE_MARKET IN
add_env HOTELBEDS_CURRENCY INR
add_env HOTELBEDS_CERT_PATH "$CERTDIR/certificate-be839f60539671c4c150849c62d59c2247a7e319edd22d172641b58724a58105.pem"
add_env HOTELBEDS_KEY_PATH "$CERTDIR/stayhub-client.key"

# Keep credentials blank if not already present; never overwrite them.
if ! grep -q '^HOTELBEDS_API_KEY=' "$ENV"; then echo 'HOTELBEDS_API_KEY=' >> "$ENV"; fi
if ! grep -q '^HOTELBEDS_SECRET=' "$ENV"; then echo 'HOTELBEDS_SECRET=' >> "$ENV"; fi
if ! grep -q '^HOTELBEDS_DESTINATION_MAP=' "$ENV"; then echo 'HOTELBEDS_DESTINATION_MAP={}' >> "$ENV"; fi

# Ensure backend ignores .env
if ! grep -qxF '.env' "$BACKEND/.gitignore" 2>/dev/null; then echo '.env' >> "$BACKEND/.gitignore"; fi

# Check syntax
node --check "$SERVICE"
node --check "$BACKEND/server.js"

echo
echo "FIX COMPLETE"
echo "Certificate: $CERTDIR/certificate-be839f60539671c4c150849c62d59c2247a7e319edd22d172641b58724a58105.pem"
echo "Private key: $CERTDIR/stayhub-client.key"
echo "Hotelbeds endpoint: https://api-mtls.test.hotelbeds.com"
echo
echo "NEXT: open backend/.env and enter HOTELBEDS_API_KEY and HOTELBEDS_SECRET locally."
echo "Do NOT paste either secret into chat."
