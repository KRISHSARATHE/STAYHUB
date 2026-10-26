import pg from "pg";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";

dotenv.config({ path: new URL("../.env", import.meta.url) });
const rows = JSON.parse(await readFile(new URL("../data/additional-hotels.json", import.meta.url), "utf8"));
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/stayhub" });
let inserted = 0, existing = 0;
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("ALTER TABLE hotels ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'stayhub'");
  await client.query("ALTER TABLE hotels ADD COLUMN IF NOT EXISTS source_id TEXT");
  await client.query("ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_source VARCHAR(40) NOT NULL DEFAULT 'catalogue'");
  await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_source_source_id ON hotels (source, source_id) WHERE source_id IS NOT NULL");
  for (const h of rows) {
    const result = await client.query(`INSERT INTO hotels (name,location,category,price,rating,image,description,total_rooms,source,source_id,price_source,is_active)
      SELECT
          $1::varchar,
          $2::varchar,
          $3::varchar,
          $4::numeric,
          0,
          '',
          $5::text,
          20,
          $6::varchar,
          $7::text,
          'demo-estimate',
          TRUE
      WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE LOWER(TRIM(name))=LOWER(TRIM($1::text)) AND LOWER(TRIM(location))=LOWER(TRIM($2::text)))
      ON CONFLICT (source,source_id) WHERE source_id IS NOT NULL DO NOTHING RETURNING id`,
      [h.name,h.location,h.category,h.price,h.description,h.source,h.source_id]);
    if (result.rowCount) inserted++; else existing++;
  }
  await client.query("COMMIT");
  console.log(`Added ${inserted} hotels, skipped ${existing} existing matches. Prices are estimates; ratings are not verified.`);
} catch (e) { await client.query("ROLLBACK"); console.error(e); process.exitCode=1; }
finally { client.release(); await pool.end(); }
