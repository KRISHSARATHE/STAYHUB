import fs from "node:fs";
import https from "node:https";
import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const {
  HOTELBEDS_API_KEY,
  HOTELBEDS_API_SECRET,
  HOTELBEDS_API_BASE_URL,
  HOTELBEDS_CERT_PATH,
  HOTELBEDS_KEY_PATH,
  DATABASE_URL,
} = process.env;

const db = new pg.Client({
  connectionString:
    DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/stayhub",
});

const cities = [
  "Udaipur",
  "New Delhi",
  "Chennai",
  "Bengaluru",
  "Indore",
  "Mumbai",
  "Pune",
  "Bhopal",
  "Goa",
  "Manali",
  "Shimla",
];

function signature() {
  const timestamp = Math.floor(Date.now() / 1000).toString();

  return crypto
    .createHash("sha256")
    .update(HOTELBEDS_API_KEY + HOTELBEDS_API_SECRET + timestamp)
    .digest("hex");
}

function getJson(path) {
  const base = "https://api.test.hotelbeds.com";
  const url = new URL(path, base);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "GET",
        cert: fs.readFileSync(HOTELBEDS_CERT_PATH),
        key: fs.readFileSync(HOTELBEDS_KEY_PATH),
        headers: {
          "Api-key": HOTELBEDS_API_KEY,
          "X-Signature": signature(),
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          let json;

          try {
            json = JSON.parse(body);
          } catch {
            return reject(
              new Error(`Invalid JSON from Hotelbeds: ${body.slice(0, 300)}`)
            );
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(
              new Error(
                `Hotelbeds HTTP ${res.statusCode}: ${JSON.stringify(json).slice(
                  0,
                  500
                )}`
              )
            );
          }
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function similarity(a, b) {
  const x = normalize(a);
  const y = normalize(b);

  if (!x || !y) return 0;
  if (x === y) return 100;

  const wordsA = new Set(x.split(" "));
  const wordsB = new Set(y.split(" "));

  let common = 0;
  for (const word of wordsA) {
    if (word.length >= 3 && wordsB.has(word)) common++;
  }

  const score = (2 * common) / (wordsA.size + wordsB.size);

  if (x.includes(y) || y.includes(x)) {
    return Math.max(75, Math.round(score * 100));
  }

  return Math.round(score * 100);
}

async function main() {
  await db.connect();

  const result = await db.query(`
    SELECT id, name, location
    FROM hotels
    WHERE hotelbeds_code IS NULL
      AND is_active = TRUE
      AND id <> 24
    ORDER BY id
  `);

  console.log(`\nExisting unmapped STAYHUB hotels: ${result.rows.length}\n`);

  const grouped = {};

  for (const hotel of result.rows) {
    const city = String(hotel.location || "")
      .split(",")[0]
      .trim();

    if (!grouped[city]) grouped[city] = [];
    grouped[city].push(hotel);
  }

  for (const city of cities) {
    const localHotels = grouped[city];

    if (!localHotels?.length) continue;

    console.log(`\n========================================`);
    console.log(`CITY: ${city}`);
    console.log(`========================================`);

    try {
      /*
       * Hotel Content API supports paged hotel retrieval.
       * We request a controlled city/destination slice rather than
       * scanning the complete India portfolio.
       */
      const path =
        `/hotel-content-api/1.0/hotels` +
        `?fields=all` +
        `&language=ENG` +
        `&from=1` +
        `&to=1000` +
        `&countryCode=IN`;

      const data = await getJson(path);

      const hotels =
        Array.isArray(data.hotels)
          ? data.hotels
          : Array.isArray(data.hotel)
          ? data.hotel
          : [];

      const cityHotels = hotels.filter((h) => {
        const hbCity = normalize(h.city || h.destinationName);
        return hbCity === normalize(city);
      });

      console.log(`Hotelbeds city candidates found: ${cityHotels.length}`);

      for (const local of localHotels) {
        const candidates = cityHotels
          .map((hb) => ({
            id: Number(hb.code),
            name: hb.name || "",
            city: hb.city || hb.destinationName || "",
            destinationCode: hb.destinationCode || "",
            category: hb.categoryCode || hb.categoryName || "",
            address: hb.address || "",
            score: similarity(local.name, hb.name),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        console.log(`\nSTAYHUB #${local.id}: ${local.name}`);

        if (!candidates.length) {
          console.log("  No Hotelbeds candidate found.");
          continue;
        }

        for (const c of candidates) {
          console.log(
            `  ${c.score}% | HB ${c.id} | ${c.name} | ${c.city} | ${c.address}`
          );
        }
      }
    } catch (error) {
      console.error(`  ERROR for ${city}: ${error.message}`);
    }
  }

  console.log("\n========================================");
  console.log("MATCHING COMPLETE");
  console.log("NO DATABASE MAPPING WAS CHANGED.");
  console.log("========================================\n");

  await db.end();
}

main().catch(async (error) => {
  console.error("\nMATCH FAILED:", error.message);
  try {
    await db.end();
  } catch {}
  process.exit(1);
});
