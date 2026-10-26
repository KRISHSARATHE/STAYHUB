import pg from "pg";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config({ path: ".env", quiet: true });

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/stayhub"
});

const apply = process.argv.includes("--apply");

function demoPrice(h) {
  const name = String(h.name || "").toLowerCase();
  const category = String(h.category || "").toLowerCase();
  const combined = name + " " + category;

  let base = 2300;

  if (/hostel|lodge|oyo|fabhotel|budget/.test(combined))
    base = 1300;
  else if (/luxury|resort|marriott|radisson|hyatt|taj\b/.test(combined))
    base = 6200;
  else if (/premium|premier|grand|business/.test(combined))
    base = 3600;

  let hash = 0;
  for (const char of name + String(h.location || "")) {
    hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  }

  return base + ((hash >>> 0) % 9) * 150;
}

function shortDescription(h) {
  const original = String(h.description || "")
    .replace(/\s+/g, " ")
    .trim();

  if (original && original.length <= 185) return original;

  const city = String(h.location || "the area")
    .split(",")[0].trim();

  const amenities = [
    [/wi-?fi|wireless internet/i, "Wi-Fi"],
    [/restaurant|dining/i, "dining"],
    [/parking/i, "parking"],
    [/swimming pool|outdoor pool/i, "a swimming pool"],
    [/fitness|gym/i, "a fitness centre"],
    [/24.hour (front desk|reception)/i, "24-hour reception"]
  ].filter(([pattern]) => pattern.test(original))
   .slice(0, 3)
   .map(([, label]) => label);

  return `${h.name} offers accommodation in ${city}. ` +
    (amenities.length
      ? `Listed facilities include ${amenities.join(", ")}.`
      : "Explore this property for a comfortable stay.");
}

await db.connect();

try {
  const cols = (await db.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'hotels'
  `)).rows.map(r => r.column_name);

  const required = [
    "id", "name", "location", "category",
    "price", "rating", "description", "is_active"
  ];

  for (const col of required) {
    if (!cols.includes(col))
      throw new Error(`Missing column: ${col}`);
  }

  const hasSource = cols.includes("price_source");

  const hotels = (await db.query(`
    SELECT id, name, location, category,
           price, rating, description
    FROM hotels
    WHERE is_active = TRUE
    ORDER BY id
  `)).rows;

  const changes = hotels.map(h => ({
    ...h,
    newPrice: Number(h.price) > 0
      ? Number(h.price)
      : demoPrice(h),
    newDescription: shortDescription(h),
    needsPrice: !(Number(h.price) > 0)
  }));

  const priceCount = changes.filter(h => h.needsPrice).length;
  const descriptionCount = changes.filter(
    h => String(h.description || "").trim() !== h.newDescription
  ).length;

  const report = {
    mode: apply ? "APPLY" : "PREVIEW",
    totalActiveHotels: hotels.length,
    missingPricesToFill: priceCount,
    descriptionsToUpdate: descriptionCount,
    guestRatingsChanged: 0,
    existingPositivePricesPreserved: true
  };

  fs.writeFileSync(
    "stayhub-hotel-audit-preview.json",
    JSON.stringify({ summary: report, hotels: changes }, null, 2)
  );

  console.log(JSON.stringify(report, null, 2));

  if (!apply) {
    console.log("DRY RUN COMPLETE: Database unchanged.");
  } else {
    if (process.env.STAYHUB_BACKUP_CONFIRMED !== "YES")
      throw new Error("Backup confirmation required.");

    await db.query("BEGIN");

    try {
      for (const h of changes) {
        if (!h.needsPrice &&
            String(h.description || "").trim() === h.newDescription)
          continue;

        const sql = hasSource
          ? `UPDATE hotels
             SET price = CASE WHEN COALESCE(price,0)<=0
                              THEN $2 ELSE price END,
                 description = $3,
                 price_source = CASE WHEN COALESCE(price,0)<=0
                              THEN 'demo-estimate' ELSE price_source END
             WHERE id=$1 AND is_active=TRUE`
          : `UPDATE hotels
             SET price = CASE WHEN COALESCE(price,0)<=0
                              THEN $2 ELSE price END,
                 description = $3
             WHERE id=$1 AND is_active=TRUE`;

        await db.query(sql, [h.id, h.newPrice, h.newDescription]);
      }

      await db.query("COMMIT");
      console.log("UPDATE COMPLETE");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await db.end();
}
