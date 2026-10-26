import pg from "pg";
import dotenv from "dotenv";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

dotenv.config({ path: ".env", quiet: true });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/stayhub";

const db = new pg.Client({ connectionString });

const apply = process.argv.includes("--apply");

function demoRating(id) {
  // Stable, illustrative scores: 3.5–4.5
  const seed = (Math.imul(Number(id), 2654435761) >>> 0);
  return Number((3.5 + (seed % 11) / 10).toFixed(1));
}

try {
  await db.connect();

  const { rows } = await db.query(`
    SELECT id, name, location, rating
    FROM hotels
    WHERE is_active = TRUE
      AND (rating IS NULL OR rating <= 0)
    ORDER BY id
  `);

  console.log("Missing ratings:", rows.length);
  console.table(rows.slice(0, 12).map(h => ({
    id: h.id,
    hotel: h.name,
    demoRating: demoRating(h.id)
  })));

  if (!apply) {
    console.log("\nPREVIEW ONLY. No database changes.");
    console.log("To apply: node stayhub-demo-ratings.mjs --apply");
  } else {
    mkdirSync("backups", { recursive: true });

    const backup = join(
      "backups",
      `stayhub-before-demo-ratings-${Date.now()}.dump`
    );

    const url = new URL(connectionString);
    const env = {
      ...process.env,
      PGPASSWORD: decodeURIComponent(url.password)
    };

    const args = [
      "-h", url.hostname,
      "-p", url.port || "5432",
      "-U", decodeURIComponent(url.username),
      "-d", decodeURIComponent(url.pathname.slice(1)),
      "-Fc",
      "-f", backup
    ];

    execFileSync("pg_dump", args, { env, stdio: "inherit" });
    console.log("Backup created:", backup);

    await db.query("BEGIN");

    try {
      await db.query(`
        ALTER TABLE hotels
        ADD COLUMN IF NOT EXISTS rating_source VARCHAR(40)
      `);

      await db.query(`
        UPDATE hotels
        SET rating_source = 'existing'
        WHERE rating > 0
          AND rating_source IS NULL
      `);

      let updated = 0;

      for (const hotel of rows) {
        const result = await db.query(`
          UPDATE hotels
          SET rating = $1,
              rating_source = 'demo-estimate'
          WHERE id = $2
            AND is_active = TRUE
            AND rating <= 0
        `, [demoRating(hotel.id), hotel.id]);

        updated += result.rowCount;
      }

      await db.query("COMMIT");

      console.log("\nSUCCESS — Demo ratings updated:", updated);
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error("STOP:", error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
