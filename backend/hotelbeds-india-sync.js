import fs from "node:fs";
import https from "node:https";
import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Client } = pg;

const MAX_REQUESTS = Math.min(
  45,
  Math.max(1, Number(process.env.HOTELBEDS_CONTENT_MAX_REQUESTS || 45))
);
const PAGE_SIZE = 1000;
const LANGUAGE = "ENG";

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

function requestHotels(from, to) {
  const apiKey = required("HOTELBEDS_API_KEY");

  const url = new URL(
    "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels"
  );

  url.searchParams.set("fields", "all");
  url.searchParams.set("language", LANGUAGE);
  url.searchParams.set("countryCode", "IN");
  url.searchParams.set("from", String(from));
  url.searchParams.set("to", String(to));
  url.searchParams.set("useSecondaryLanguage", "false");

  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "Api-key": apiKey,
          "X-Signature": signature(),
          Accept: "application/json",
          "Accept-Encoding": "gzip",
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
    return (
      value.content ||
      value.description ||
      value.name ||
      value.text ||
      fallback
    ).toString().trim();
  }
  return fallback;
}

function firstImage(hotel) {
  const images = asArray(hotel.images || hotel.image);

  const item = images.find((x) => {
    const path = text(x?.path || x?.url || x?.imagePath);
    return path;
  });

  if (!item) return "";

  const path = text(item.path || item.url || item.imagePath);

  if (/^https?:\/\//i.test(path)) return path;

  const base =
    process.env.HOTELBEDS_IMAGE_BASE_URL ||
    "https://photos.hotelbeds.com/giata/";

  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function firstDescription(hotel) {
  const direct = text(hotel.description || hotel.descriptions);
  if (direct) return direct;

  const descriptions = asArray(hotel.descriptions);

  for (const item of descriptions) {
    const value = text(item?.description || item?.content || item);
    if (value) return value;
  }

  return "";
}

function getCoordinate(hotel, key) {
  const c = hotel.coordinates || hotel.coordinate || {};
  const value =
    c[key] ??
    c[key === "latitude" ? "lat" : "lon"] ??
    hotel[key];

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHotel(hotel) {
  const code = Number(hotel.code ?? hotel.hotelCode);

  if (!Number.isInteger(code) || code <= 0) return null;

  const destinationCode = text(
    hotel.destinationCode ??
      hotel.destination?.code ??
      hotel.location?.destinationCode
  );

  const destinationName = text(
    hotel.destinationName ??
      hotel.destination?.name ??
      hotel.location?.destinationName,
    "India"
  );

  const countryCode = text(
    hotel.countryCode ??
      hotel.country?.code ??
      hotel.location?.countryCode,
    "IN"
  );

  const categoryName = text(
    hotel.categoryName ??
      hotel.category?.description ??
      hotel.category,
    "Hotel"
  );

  const address = text(
    hotel.address?.content ??
      hotel.address?.street ??
      hotel.address ??
      hotel.contact?.address
  );

  const city = destinationName || "India";

  const ratingMatch = categoryName.match(/\d+/);
  const rating = ratingMatch ? Number(ratingMatch[0]) : 0;

  return {
    code,
    name: text(hotel.name, `Hotel ${code}`),
    destinationCode,
    countryCode,
    city,
    categoryName,
    rating,
    address,
    description: firstDescription(hotel),
    image: firstImage(hotel),
    latitude: getCoordinate(hotel, "latitude"),
    longitude: getCoordinate(hotel, "longitude"),
  };
}

async function main() {
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
      CREATE INDEX IF NOT EXISTS idx_hotels_hotelbeds_code
      ON hotels(hotelbeds_code)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hotels_hotelbeds_destination
      ON hotels(hotelbeds_destination_code)
    `);

    console.log("DB schema ready.");

    let from = 1;
    let total = 0;
    let requests = 0;
    let page = 0;

    while (requests < MAX_REQUESTS) {
      const to = from + PAGE_SIZE - 1;

      console.log(
        `Fetching India hotels: ${from}-${to} (request ${requests + 1}/${MAX_REQUESTS})`
      );

      let response;

      try {
        response = await requestHotels(from, to);
      } catch (error) {
        console.error(
          `Content API request failed at ${from}-${to}: ${error.message}`
        );

        if (error.statusCode === 403) {
          console.error(
            "Hotelbeds evaluation quota/authorization limit reached. Existing DB data was not deleted."
          );
        }

        throw error;
      }

      const rawHotels =
        response?.hotels?.hotel ||
        response?.hotels?.hotels ||
        response?.hotel ||
        [];

      const hotels = asArray(rawHotels)
        .map(normalizeHotel)
        .filter(Boolean);

      console.log(`Received ${hotels.length} India hotels.`);

      if (!hotels.length) break;

      for (const hotel of hotels) {
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
            $1,
            $2,
            $3,
            0,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            NOW(),
            $10,
            $11,
            $12,
            $13,
            $14,
            TRUE
          )
          ON CONFLICT (hotelbeds_code)
          DO UPDATE SET
            name = EXCLUDED.name,
            location = EXCLUDED.location,
            category = EXCLUDED.category,
            rating = EXCLUDED.rating,
            image = CASE
              WHEN EXCLUDED.image <> '' THEN EXCLUDED.image
              ELSE hotels.image
            END,
            description = CASE
              WHEN EXCLUDED.description <> '' THEN EXCLUDED.description
              ELSE hotels.description
            END,
            hotelbeds_destination_code =
              EXCLUDED.hotelbeds_destination_code,
            hotelbeds_country_code =
              EXCLUDED.hotelbeds_country_code,
            hotelbeds_last_synced_at =
              EXCLUDED.hotelbeds_last_synced_at,
            hotelbeds_city =
              EXCLUDED.hotelbeds_city,
            hotelbeds_latitude =
              EXCLUDED.hotelbeds_latitude,
            hotelbeds_longitude =
              EXCLUDED.hotelbeds_longitude,
            hotelbeds_address =
              EXCLUDED.hotelbeds_address,
            hotelbeds_description =
              EXCLUDED.hotelbeds_description
          `,
          [
            hotel.name,
            hotel.city,
            hotel.categoryName,
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

        total += 1;
      }

      requests += 1;
      page += 1;

      if (hotels.length < PAGE_SIZE) break;

      from += PAGE_SIZE;
    }

    const result = await client.query(`
      SELECT
        COUNT(*)::int AS total_hotels,
        COUNT(*) FILTER (
          WHERE hotelbeds_code IS NOT NULL
        )::int AS hotelbeds_mapped
      FROM hotels
      WHERE is_active = TRUE
    `);

    console.log("");
    console.log("=== INDIA CONTENT SYNC COMPLETE ===");
    console.log(`API requests used: ${requests}`);
    console.log(`Hotel rows processed: ${total}`);
    console.log(`Total active STAYHUB hotels: ${result.rows[0].total_hotels}`);
    console.log(`Hotelbeds mapped hotels: ${result.rows[0].hotelbeds_mapped}`);
    console.log("");
    console.log(
      "Existing STAYHUB rows without Hotelbeds codes were preserved."
    );
    console.log(
      "Hotelbeds static content is now stored locally; live rates should come from Booking API."
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("SYNC FAILED:", error.message);
  process.exit(1);
});
