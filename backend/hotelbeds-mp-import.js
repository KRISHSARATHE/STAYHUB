import fs from "node:fs";
import crypto from "node:crypto";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env", quiet: true });

const cities = [
  ["Indore", "IDR"],
  ["Bhopal", "BHO"],
  ["Jabalpur", "LJA"],
  ["Gwalior", "GWL"],
  ["Khajuraho", "HJR"],
  ["Kanha", "KT1"],
  ["Pachmarhi", "HAP"],
  ["Satna", "1NS"],
  ["Rewa", "4BQ"],
  ["Sagar", "4BR"],
  ["Ratlam", "4BP"],
  ["Dewas", "4BB"],
  ["Chhindwara", "4B9"],
  ["Seoni", "NOE"]
];

const key = process.env.HOTELBEDS_API_KEY;
const secret = process.env.HOTELBEDS_API_SECRET;
if (!key || !secret) throw Error("Hotelbeds credentials missing");

const stateFile = ".hotelbeds-mp-import-state.json";
const state = fs.existsSync(stateFile)
  ? JSON.parse(fs.readFileSync(stateFile, "utf8"))
  : { cityIndex: 0, from: 1 };

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/stayhub"
});

const text = v =>
  typeof v === "string" ? v.trim() :
  String(v?.content ?? v?.name ?? v?.description ?? "").trim();

await db.connect();

try {
  for (let request = 0;
       request < 2 && state.cityIndex < cities.length;
       request++) {

    const [city, code] = cities[state.cityIndex];
    const from = state.from;
    const to = from + 99;

    const signature = crypto.createHash("sha256")
      .update(key + secret + Math.floor(Date.now() / 1000))
      .digest("hex");

    const url = new URL(
      "https://api.test.hotelbeds.com/hotel-content-api/1.0/hotels"
    );

    url.searchParams.set("fields", "all");
    url.searchParams.set("language", "ENG");
    url.searchParams.set("destinationCode", code);
    url.searchParams.set("from", String(from));
    url.searchParams.set("to", String(to));

    console.log(`Fetching ${city}: ${from}-${to}`);

    const response = await fetch(url, {
      headers: {
        "Api-key": key,
        "X-Signature": signature,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(30000)
    });

    if (response.status === 429) {
      console.log("Rate limit reached. Retry later.");
      break;
    }

    if (!response.ok) {
      console.log("HTTP error:", response.status);
      break;
    }

    const data = await response.json();
    if (!Array.isArray(data.hotels)) {
      throw Error("Unexpected Hotelbeds response");
    }

    let added = 0;
    let photos = 0;
    let skipped = 0;

    for (const h of data.hotels) {
      const name = text(h.name);
      const hotelCity = text(h.city) || city;
      const hotelCode = Number(h.code);

      if (
        !name ||
        !Number.isSafeInteger(hotelCode) ||
        text(h.countryCode) !== "IN" ||
        text(h.destinationCode) !== code
      ) continue;

      const duplicate = await db.query(`
        SELECT id FROM hotels
        WHERE hotelbeds_code = $1
           OR (
             regexp_replace(lower(name), '[^a-z0-9]', '', 'g')
             = regexp_replace(lower($2::text), '[^a-z0-9]', '', 'g')
             AND lower(trim(location)) IN (
               lower(trim($3::text)),
               lower(trim($4::text))
             )
           )
        LIMIT 1
      `, [hotelCode, name, hotelCity, city]);

      if (duplicate.rowCount) {
        skipped++;
        continue;
      }

      const images = Array.isArray(h.images) ? h.images : [];
      const firstImage = images.find(i => text(i?.path || i?.url));
      const path = text(firstImage?.path || firstImage?.url);

      const image = !path ? "" :
        /^https?:\/\//i.test(path) ? path :
        "https://photos.hotelbeds.com/giata/" +
        path.replace(/^\//, "");

      const result = await db.query(`
        INSERT INTO hotels (
          name, location, category, price, rating,
          image, description, hotelbeds_code,
          hotelbeds_destination_code, hotelbeds_country_code,
          hotelbeds_city, price_source, is_active
        )
        VALUES (
          $1,$2,$3,0,0,$4,$5,$6,$7,'IN',$8,'unavailable',TRUE
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        name,
        hotelCity,
        "Hotel",
        image,
        text(h.description),
        hotelCode,
        code,
        hotelCity
      ]);

      if (result.rowCount) {
        added++;
        if (image) photos++;
      } else {
        skipped++;
      }
    }

    console.log(
      `Added: ${added}, With photos: ${photos}, Skipped: ${skipped}`
    );

    if (data.hotels.length < 100 || to >= Number(data.total)) {
      state.cityIndex++;
      state.from = 1;
    } else {
      state.from = to + 1;
    }

    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  }
} finally {
  await db.end();
}
