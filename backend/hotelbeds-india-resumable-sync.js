import fs from "node:fs";
import https from "node:https";
import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const PAGE_SIZE = 1000;
const MAX_REQUESTS = Math.min(
  45,
  Math.max(1, Number(process.env.HOTELBEDS_CONTENT_MAX_REQUESTS || 45))
);

const stateFile =
  process.env.HOTELBEDS_SYNC_STATE_FILE ||
  new URL("./.hotelbeds-india-sync-state.json", import.meta.url).pathname;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function signature() {
  const apiKey = required("HOTELBEDS_API_KEY");
  const secret = required("HOTELBEDS_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  return crypto
    .createHash("sha256")
    .update(apiKey + secret + timestamp)
    .digest("hex");
}

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return {
      nextFrom: 1,
      requestsUsedTotal: 0,
      indiaHotelsSavedTotal: 0,
      completed: false,
      startedAt: new Date().toISOString(),
    };
  }

  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf8"));
  } catch {
    throw new Error(`Cannot read sync state: ${stateFile}`);
  }
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function requestHotels(from, to) {
  const apiKey = required("HOTELBEDS_API_KEY");

  const url = new URL(
    "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels"
  );

  // IMPORTANT:
  // Hotel Content API Hotels operation is paginated. We intentionally
  // do NOT send countryCode=IN here because that previously produced
  // an empty result on the user's test credentials.
  url.searchParams.set("fields", "all");
  url.searchParams.set("language", "ENG");
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "Api-key": apiKey,
          "X-Signature": signature(),
          Accept: "application/json",
        },
      },
      (res) => {
        const chunks = [];

        res.on("data", (chunk) => chunks.push(chunk));

        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");

          let data;
          try {
            data = JSON.parse(raw);
          } catch {
            data = { raw };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }

          const error = new Error(
            data?.error?.message ||
              data?.message ||
              `Hotelbeds Content API HTTP ${res.statusCode}`
          );
          error.statusCode = res.statusCode;
          error.response = data;
          reject(error);
        });
      }
    );

    req.on("error", reject);
  });
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

function text(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    return String(
      value.content ||
        value.description ||
        value.name ||
        value.text ||
        fallback
    ).trim();
  }
  return fallback;
}

function imageFromHotel(hotel) {
  const images = asArray(hotel.images || hotel.image);

  for (const item of images) {
    const path = text(item?.path || item?.url || item?.imagePath);
    if (!path) continue;

    if (/^https?:\/\//i.test(path)) return path;

    return `https://photos.hotelbeds.com/giata/${path.replace(/^\//, "")}`;
  }

  return "";
}

function descriptionFromHotel(hotel) {
  if (typeof hotel.description === "string") {
    return hotel.description.trim();
  }

  const descriptions = asArray(hotel.descriptions);

  for (const item of descriptions) {
    const value = text(item?.description || item?.content || item);
    if (value) return value;
  }

  return "";
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeHotel(hotel) {
  const code = Number(hotel.code ?? hotel.hotelCode);

  if (!Number.isInteger(code) || code <= 0) return null;

  const countryCode = text(
    hotel.countryCode ??
      hotel.country?.code ??
      hotel.location?.countryCode
  ).toUpperCase();

  if (countryCode !== "IN") return null;

  const destinationCode = text(
    hotel.destinationCode ??
      hotel.destination?.code ??
      hotel.location?.destinationCode
  );

  const city = text(
    hotel.city ??
      hotel.destinationName ??
      hotel.destination?.name ??
      hotel.location?.city ??
      hotel.location?.destinationName,
    "India"
  );

  const category = text(
    hotel.categoryName ??
      hotel.category?.description ??
      hotel.category,
    "Hotel"
  );

  const ratingMatch = category.match(/\d+/);

  const coordinates = hotel.coordinates || hotel.coordinate || {};

  return {
    code,
    name: text(hotel.name, `Hotel ${code}`),
    countryCode,
    destinationCode,
    city,
    category,
    rating: ratingMatch ? Number(ratingMatch[0]) : 0,
    description: descriptionFromHotel(hotel),
    image: imageFromHotel(hotel),
    address: text(
      hotel.address?.content ??
        hotel.address?.street ??
        hotel.address
    ),
    latitude: numberOrNull(
      coordinates.latitude ?? coordinates.lat ?? hotel.latitude
    ),
    longitude: numberOrNull(
      coordinates.longitude ?? coordinates.lon ?? hotel.longitude
    ),
  };
}

function extractHotels(response) {
  // Hotelbeds versions can expose the list through slightly different
  // wrappers. Handle all known shapes without guessing city filters.
  const candidates = [
    response?.hotels?.hotels,
    response?.hotels?.hotel,
    response?.hotel,
    response?.hotels,
  ];

  for (const candidate of candidates) {
    const arr = asArray(candidate);
    if (arr.length) return arr;
  }

  return [];
}

async function main() {
  const state = loadState();

  if (state.completed) {
    console.log("Sync already completed.");
    console.log(JSON.stringify(state, null, 2));
    return;
  }

  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/stayhub",
  });

  await client.connect();

  try {
    await client.query(`
      ALTER TABLE hotels
      ADD COLUMN IF NOT EXISTS hotelbeds_code INTEGER,
      ADD COLUMN IF NOT EXISTS hotelbeds_destination_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS hotelbeds_country_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS hotelbeds_last_synced_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS hotelbeds_city VARCHAR(150),
      ADD COLUMN IF NOT EXISTS hotelbeds_latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS hotelbeds_longitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS hotelbeds_address TEXT,
      ADD COLUMN IF NOT EXISTS hotelbeds_description TEXT
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_hotels_hotelbeds_code
      ON hotels(hotelbeds_code)
      WHERE hotelbeds_code IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hotels_hotelbeds_destination
      ON hotels(hotelbeds_destination_code)
    `);

    console.log(`Starting from portfolio record ${state.nextFrom}.`);
    console.log(`Maximum requests this run: ${MAX_REQUESTS}.`);
    console.log("");

    let requestsThisRun = 0;

    while (requestsThisRun < MAX_REQUESTS) {
      const from = state.nextFrom;
      const to = from + PAGE_SIZE - 1;

      console.log(
        `Fetching portfolio ${from}-${to} ` +
        `(request ${requestsThisRun + 1}/${MAX_REQUESTS})`
      );

      const response = await requestHotels(from, to);
      const rawHotels = extractHotels(response);

      console.log(`  Received records: ${rawHotels.length}`);

      if (!rawHotels.length) {
        console.log("  Empty page reached. Marking sync complete.");
        state.completed = true;
        saveState(state);
        break;
      }

      let indiaCount = 0;

      for (const rawHotel of rawHotels) {
        const hotel = normalizeHotel(rawHotel);
        if (!hotel) continue;

        indiaCount += 1;

        const duplicate = await client.query(
          `SELECT id FROM hotels
           WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
             AND LOWER(TRIM(location)) = LOWER(TRIM($2))
           LIMIT 1`,
          [hotel.name, hotel.city]
        );

        if (duplicate.rowCount > 0) continue;

        await client.query(
          `
          INSERT INTO hotels (
            name,
            location,
            category,
            price,
            rating,
            image,
            description,
            hotelbeds_code,
            hotelbeds_destination_code,
            hotelbeds_country_code,
            hotelbeds_last_synced_at,
            hotelbeds_city,
            hotelbeds_latitude,
            hotelbeds_longitude,
            hotelbeds_address,
            hotelbeds_description,
            is_active
          )
          VALUES (
            $1,$2,$3,0,$4,$5,$6,$7,$8,$9,NOW(),
            $10,$11,$12,$13,$14,TRUE
          )
          ON CONFLICT (hotelbeds_code)
          DO NOTHING
          `,
          [
            hotel.name,
            hotel.city,
            hotel.category,
            hotel.rating,
            hotel.image,
            hotel.description,
            hotel.code,
            hotel.destinationCode,
            hotel.countryCode,
            hotel.city,
            hotel.latitude,
            hotel.longitude,
            hotel.address,
            hotel.description,
          ]
        );
      }

      console.log(`  India records saved/updated: ${indiaCount}`);

      state.nextFrom = to + 1;
      state.requestsUsedTotal =
        Number(state.requestsUsedTotal || 0) + 1;
      state.indiaHotelsSavedTotal =
        Number(state.indiaHotelsSavedTotal || 0) + indiaCount;

      requestsThisRun += 1;

      saveState(state);

      if (rawHotels.length < PAGE_SIZE) {
        console.log("  Final partial page reached.");
        state.completed = true;
        saveState(state);
        break;
      }
    }

    const counts = await client.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE hotelbeds_code IS NOT NULL
        )::int AS hotelbeds,
        COUNT(*) FILTER (
          WHERE hotelbeds_country_code = 'IN'
        )::int AS india
      FROM hotels
      WHERE is_active = TRUE
    `);

    console.log("");
    console.log("=== SYNC STATUS ===");
    console.log(`Requests this run: ${requestsThisRun}`);
    console.log(`Requests total: ${state.requestsUsedTotal}`);
    console.log(`Next portfolio record: ${state.nextFrom}`);
    console.log(`India rows saved total: ${state.indiaHotelsSavedTotal}`);
    console.log(`Active STAYHUB rows: ${counts.rows[0].total}`);
    console.log(`Hotelbeds mapped rows: ${counts.rows[0].hotelbeds}`);
    console.log(`India mapped rows: ${counts.rows[0].india}`);
    console.log(`Completed: ${state.completed}`);
    console.log(`State file: ${stateFile}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("");
  console.error("SYNC FAILED:", error.message);

  if (error.statusCode) {
    console.error(`HTTP status: ${error.statusCode}`);
  }

  process.exit(1);
});
