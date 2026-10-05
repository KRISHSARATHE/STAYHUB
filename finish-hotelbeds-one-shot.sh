#!/bin/bash
set -euo pipefail

ROOT="$HOME/Documents/STAYHUB"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/src"

cd "$ROOT"

echo "== STAYHUB Hotelbeds one-shot patch =="

for f in "$BACKEND/server.js" "$BACKEND/hotelbeds.js" "$FRONTEND/utils/api.js" "$FRONTEND/components/Hotels.jsx"; do
  [ -f "$f" ] || { echo "Missing: $f"; exit 1; }
done

STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="$ROOT/.hotelbeds-backup-$STAMP"
mkdir -p "$BACKUP"
cp "$BACKEND/server.js" "$BACKEND/hotelbeds.js" "$FRONTEND/utils/api.js" "$FRONTEND/components/Hotels.jsx" "$BACKUP/"
echo "Backup: $BACKUP"

node <<'NODE'
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const backend = path.join(root, "backend");
const frontend = path.join(root, "src");

function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s); }

let hb = read(path.join(backend,"hotelbeds.js"));

if (!hb.includes("export async function checkRate")) {
  hb += `

export async function checkRate(rateKey) {
  if (!rateKey) throw new Error("rateKey is required.");
  return hotelbedsRequest("/hotel-api/1.0/checkrates", {
    rooms: [{ rateKey: String(rateKey) }],
  });
}

export async function createBooking({
  holder,
  rooms,
  clientReference = "STAYHUB",
  remark = "",
  tolerance,
}) {
  if (!holder?.name || !holder?.surname) {
    throw new Error("Holder name and surname are required.");
  }
  if (!Array.isArray(rooms) || !rooms.length) {
    throw new Error("At least one booking room is required.");
  }

  const body = {
    holder: {
      name: String(holder.name),
      surname: String(holder.surname),
    },
    rooms: rooms.map((room) => ({
      rateKey: String(room.rateKey || ""),
      paxes: Array.isArray(room.paxes) ? room.paxes : [],
    })),
    clientReference: String(clientReference || "STAYHUB"),
    remark: String(remark || ""),
  };

  if (tolerance !== undefined && tolerance !== null && tolerance !== "") {
    body.tolerance = Number(tolerance);
  }

  return hotelbedsRequest("/hotel-api/1.0/bookings", body);
}
`;
  write(path.join(backend,"hotelbeds.js"), hb);
  console.log("Added Hotelbeds CheckRate + Booking helpers.");
}

let server = read(path.join(backend,"server.js"));

if (!server.includes('"/api/hotelbeds/search"')) {
  const marker = 'app.listen(';
  const pos = server.indexOf(marker);
  if (pos === -1) throw new Error("Could not find app.listen in server.js");

  const routes = `
/*
 * STAYHUB Hotelbeds live-search bridge.
 * Local hotel records remain the source for UI/content.
 * Hotelbeds supplies live availability/rates only for mapped hotelbeds_code rows.
 */
app.get("/api/hotelbeds/search", async (req, res) => {
  try {
    const {
      destination = "",
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      childAges = "",
      rooms = 1,
    } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: "checkIn and checkOut are required.",
      });
    }

    const city = String(destination || "").trim().toLowerCase();
    const parsedChildAges = String(childAges)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((v) => Number.isFinite(v));

    const mapped = await pool.query(
      \`
      SELECT id, name, location, category, rating, price,
             image, description, hotelbeds_code
      FROM hotels
      WHERE is_active = TRUE
        AND hotelbeds_code IS NOT NULL
        AND (
          $1 = ''
          OR LOWER(TRIM(location)) = $1
          OR LOWER(TRIM(SPLIT_PART(location, ',', 1))) = $1
          OR LOWER(TRIM(hotelbeds_city)) = $1
        )
      ORDER BY id
      \`,
      [city]
    );

    const codes = mapped.rows
      .map((row) => Number(row.hotelbeds_code))
      .filter((code) => Number.isInteger(code) && code > 0);

    if (!codes.length) {
      return res.json({
        success: true,
        source: "local",
        hotelbedsMapped: 0,
        data: [],
        message: "No Hotelbeds-mapped hotels for this destination yet.",
      });
    }

    const live = await searchAvailability({
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      adults: Number(adults),
      children: Number(children),
      childAges: parsedChildAges,
      rooms: Number(rooms),
      hotelCodes: codes,
    });

    const liveRows = mapAvailabilityResponse(live);
    const localByCode = new Map(
      mapped.rows.map((row) => [Number(row.hotelbeds_code), row])
    );

    const data = liveRows.map((hotel) => {
      const local = localByCode.get(Number(hotel.hotelbedsCode));
      return {
        ...hotel,
        id: local?.id ?? hotel.id,
        name: local?.name || hotel.name,
        location: local?.location || hotel.location,
        category: local?.category || hotel.category,
        rating: Number(local?.rating ?? hotel.rating ?? 0),
        image: local?.image || hotel.image || "",
        description: local?.description || hotel.description || "",
      };
    });

    return res.json({
      success: true,
      source: "hotelbeds",
      hotelbedsMapped: codes.length,
      data,
    });
  } catch (error) {
    console.error("Hotelbeds live-search error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

app.post("/api/hotelbeds/checkrate", async (req, res) => {
  try {
    const { rateKey } = req.body || {};
    if (!rateKey) {
      return res.status(400).json({
        success: false,
        message: "rateKey is required.",
      });
    }

    const result = await checkRate(rateKey);
    return res.json({ success: true, source: "hotelbeds", data: result });
  } catch (error) {
    console.error("Hotelbeds CheckRate error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

app.post("/api/hotelbeds/book", async (req, res) => {
  try {
    const result = await createBooking(req.body || {});
    return res.json({ success: true, source: "hotelbeds", data: result });
  } catch (error) {
    console.error("Hotelbeds booking error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

`;
  server = server.slice(0,pos) + routes + server.slice(pos);

  if (!server.includes('checkRate, createBooking')) {
    server = server.replace(
      /import\s+\{\s*searchAvailability\s*,\s*mapAvailabilityResponse\s*\}\s+from\s+["']\.\/hotelbeds\.js["'];/,
      'import { searchAvailability, mapAvailabilityResponse, checkRate, createBooking } from "./hotelbeds.js";'
    );
  }
  write(path.join(backend,"server.js"), server);
  console.log("Added Hotelbeds search + CheckRate + booking routes.");
}

let api = read(path.join(frontend,"utils/api.js"));

if (!api.includes("export async function fetchHotelbedsSearch")) {
  api += `

export async function fetchHotelbedsSearch(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      query.set(key, String(value));
    }
  });

  const result = await apiRequest(
    \`/hotelbeds/search?\${query.toString()}\`
  );

  return result.data || [];
}

export async function checkHotelbedsRate(rateKey) {
  return apiRequest("/hotelbeds/checkrate", {
    method: "POST",
    body: JSON.stringify({ rateKey }),
  });
}

export async function bookHotelbeds(payload) {
  return apiRequest("/hotelbeds/book", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
`;
  write(path.join(frontend,"utils/api.js"), api);
  console.log("Added frontend Hotelbeds API helpers.");
}

let hotels = read(path.join(frontend,"components/Hotels.jsx"));

if (!hotels.includes("fetchHotelbedsSearch")) {
  hotels = hotels.replace(
    'import { apiRequest, fetchHotels } from "../utils/api";',
    'import { apiRequest, fetchHotels, fetchHotelbedsSearch } from "../utils/api";'
  );

  const old = `        const data = await fetchHotels();

        if (active) {
          setHotels(data);
        }`;

  const replacement = `        const searchParams = new URLSearchParams(window.location.search);
        const checkIn = searchParams.get("checkIn") || "";
        const checkOut = searchParams.get("checkOut") || "";
        const adults = searchParams.get("adults") || "2";
        const children = searchParams.get("children") || "0";
        const childAges = searchParams.get("childAges") || "";
        const rooms = searchParams.get("rooms") || "1";
        const destination = searchParams.get("destination") || "";

        let data = await fetchHotels();

        if (checkIn && checkOut) {
          try {
            const liveData = await fetchHotelbedsSearch({
              destination,
              checkIn,
              checkOut,
              adults,
              children,
              childAges,
              rooms
            });

            if (liveData.length) {
              data = liveData;
            }
          } catch (liveError) {
            console.warn(
              "Hotelbeds live search unavailable; keeping local STAYHUB data.",
              liveError
            );
          }
        }

        if (active) {
          setHotels(data);
        }`;

  if (!hotels.includes(old)) {
    throw new Error("Expected Hotels.jsx loading block was not found; no frontend file changed.");
  }

  hotels = hotels.replace(old, replacement);
  write(path.join(frontend,"components/Hotels.jsx"), hotels);
  console.log("Connected Hotels.jsx to Hotelbeds live search without changing UI.");
}

console.log("Patch complete.");
NODE

echo
echo "== Syntax checks =="
node --check "$BACKEND/hotelbeds.js"
node --check "$BACKEND/server.js"

echo
echo "== Done =="
echo "Backup: $BACKUP"
echo
echo "Restart backend:"
echo "  cd ~/Documents/STAYHUB/backend"
echo "  npm run dev"
echo
echo "No Hotelbeds Content API sync was executed."
echo "No database hotel mappings were guessed or overwritten."
