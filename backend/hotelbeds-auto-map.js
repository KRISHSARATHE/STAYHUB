import fs from "node:fs";
import https from "node:https";
import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/stayhub",
});

const API_KEY = process.env.HOTELBEDS_API_KEY;
const SECRET = process.env.HOTELBEDS_API_SECRET;
const CERT = process.env.HOTELBEDS_CERT_PATH;
const KEY = process.env.HOTELBEDS_KEY_PATH;

const HOST = "api-mtls.test.hotelbeds.com";

function signature() {
  const ts = Math.floor(Date.now() / 1000).toString();

  return crypto
    .createHash("sha256")
    .update(API_KEY + SECRET + ts)
    .digest("hex");
}

function request(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://${HOST}${path}`);

    const req = https.request(
      url,
      {
        method: "GET",
        cert: fs.readFileSync(CERT),
        key: fs.readFileSync(KEY),
        headers: {
          "Api-key": API_KEY,
          "X-Signature": signature(),
          Accept: "application/json",
        },
      },
      (res) => {
        let body = "";

        res.on("data", (c) => (body += c));

        res.on("end", () => {
          let data;

          try {
            data = JSON.parse(body);
          } catch {
            return reject(
              new Error(`HTTP ${res.statusCode}: ${body.slice(0, 300)}`)
            );
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(
              new Error(
                `Hotelbeds HTTP ${res.statusCode}: ${JSON.stringify(data).slice(
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

function norm(v) {
  return String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function score(localName, hbName) {
  const a = norm(localName);
  const b = norm(hbName);

  if (!a || !b) return 0;
  if (a === b) return 100;

  const aw = a.split(" ").filter((x) => x.length > 2);
  const bw = new Set(b.split(" ").filter((x) => x.length > 2));

  let common = 0;

  for (const word of aw) {
    if (bw.has(word)) common++;
  }

  let result = aw.length
    ? Math.round((common / aw.length) * 100)
    : 0;

  if (b.includes(a) || a.includes(b)) {
    result = Math.max(result, 80);
  }

  return result;
}

async function main() {
  await db.connect();

  const hotels = await db.query(`
    SELECT id, name, location
    FROM hotels
    WHERE hotelbeds_code IS NULL
      AND is_active = TRUE
      AND id <> 24
    ORDER BY id
  `);

  console.log(`\nProcessing ${hotels.rows.length} STAYHUB hotels...\n`);

  let mapped = 0;

  for (const local of hotels.rows) {
    const city = String(local.location || "")
      .split(",")[0]
      .trim();

    console.log(`\n#${local.id} ${local.name} — ${city}`);

    try {
      /*
       * Hotelbeds Booking API hotel-content operation supports
       * destinationCode filtering. First retrieve destination
       * candidates from the India hotel portfolio using the
       * city text.
       */

      const data = await request(
        `/hotel-api/1.0/hotels?fields=all&language=ENG&destinationCode=${encodeURIComponent(
          city
        )}&from=1&to=1000&useSecondaryLanguage=false`
      );

      const list =
        data?.hotels?.hotels ||
        data?.hotels ||
        [];

      if (!Array.isArray(list) || !list.length) {
        console.log("  No candidates.");
        continue;
      }

      const candidates = list
        .map((h) => ({
          code: Number(h.code),
          name: h.name || "",
          city: h.destinationName || h.city || city,
          destinationCode: h.destinationCode || "",
          countryCode: h.countryCode || "IN",
          category: h.categoryName || h.categoryCode || "",
          address: h.address || "",
          latitude: h.coordinates?.latitude ?? null,
          longitude: h.coordinates?.longitude ?? null,
          description: h.description || "",
          score: score(local.name, h.name),
        }))
        .filter((h) => Number.isInteger(h.code))
        .sort((a, b) => b.score - a.score);

      const best = candidates[0];

      if (!best) {
        console.log("  No valid Hotelbeds hotel.");
        continue;
      }

      console.log(
        `  Candidate: HB ${best.code} | ${best.name} | score ${best.score}%`
      );

      /*
       * Only automatically map strong exact/name-contained matches.
       * This prevents unrelated hotels from being assigned.
       */
      if (best.score < 80) {
        console.log("  SKIPPED — match confidence below 80%.");
        continue;
      }

      await db.query(
        `
        UPDATE hotels
        SET
          hotelbeds_code = $1,
          hotelbeds_destination_code = $2,
          hotelbeds_country_code = $3,
          hotelbeds_last_synced_at = NOW(),
          hotelbeds_city = $4,
          hotelbeds_latitude = $5,
          hotelbeds_longitude = $6,
          hotelbeds_address = $7,
          hotelbeds_description = $8
        WHERE id = $9
        `,
        [
          best.code,
          best.destinationCode || null,
          best.countryCode || "IN",
          best.city || city,
          best.latitude,
          best.longitude,
          best.address || null,
          best.description || null,
          local.id,
        ]
      );

      mapped++;

      console.log(`  ✓ MAPPED → ${best.code}`);
    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
    }
  }

  const count = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(hotelbeds_code)::int AS mapped
    FROM hotels
  `);

  console.log("\n========================================");
  console.log(`NEW MAPPINGS: ${mapped}`);
  console.log(`TOTAL: ${count.rows[0].total}`);
  console.log(`MAPPED: ${count.rows[0].mapped}`);
  console.log("========================================\n");

  await db.end();
}

main().catch(async (e) => {
  console.error("\nFAILED:", e.message);

  try {
    await db.end();
  } catch {}

  process.exit(1);
});
