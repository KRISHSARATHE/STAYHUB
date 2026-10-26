import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '..');
dotenv.config({ path: path.join(backend, '.env') });
const command = process.argv[2] || 'export';
const csvFile = path.join(backend, 'reports', 'hotel-image-review.csv');
const approvedFile = path.join(backend, 'reports', 'hotel-image-approved.json');
const blockedIds = [122, 283, 444, 601, 704];
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/stayhub'});
const quote = x => '"' + String(x ?? '').replaceAll('"','""') + '"';
const isValidUrl = u => { try { const p = new URL(u); return p.protocol === 'https:' && !p.username && !p.password; } catch { return false; } };
const isImage = b => b.subarray(0,3).equals(Buffer.from('ffd8ff','hex')) || b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) || (b.subarray(0,4).toString() === 'RIFF' && b.subarray(8,12).toString() === 'WEBP') || ['GIF87a','GIF89a'].includes(b.subarray(0,6).toString());
async function validate(u) {
  if (!isValidUrl(u)) throw Error('Only HTTPS image URLs accepted');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(u, { signal: controller.signal, redirect:'follow', headers: { 'Accept':'image/avif,image/webp,image/png,image/jpeg,image/gif' } });
    if (!res.ok) throw Error(`Image HTTP ${res.status}`);
    const len = Number(res.headers.get('content-length') || 0);
    if (len > 10_000_000) throw Error('Image exceeds 10 MB');
    const chunks=[]; let size=0;
    for await (const c of res.body) { size += c.length; if(size > 10_000_000) throw Error('Image exceeds 10 MB'); chunks.push(c); }
    if (!isImage(Buffer.concat(chunks))) throw Error('Response is not a supported image');
  } finally { clearTimeout(timer); }
}
try {
  const rows = (await pool.query('SELECT id, name, location, image FROM hotels WHERE is_active=TRUE ORDER BY id')).rows;
  const targets = rows.filter(h => !String(h.image||'').trim() || blockedIds.includes(Number(h.id)));
  if (command === 'export') {
    fs.mkdirSync(path.dirname(csvFile), {recursive:true});
    fs.writeFileSync(csvFile, ['id,name,location,current_image,verified_new_image_url,source_page,license_or_permission'].join(',') + '\n' + targets.map(h => [h.id,h.name,h.location,h.image,'','',''].map(quote).join(',')).join('\n') + '\n');
    if (!fs.existsSync(approvedFile)) fs.writeFileSync(approvedFile, JSON.stringify([{id:1014,image:'https://example.org/REPLACE-WITH-VERIFIED-HOTEL-PHOTO.jpg',source_page:'https://example.org/source',license_or_permission:'REPLACE WITH ACTUAL LICENSE OR PERMISSION'}],null,2)+'\n');
    console.log(`Exported ${targets.length} targets: ${csvFile}`);
    console.log(`Approved-photo template: ${approvedFile}`);
    console.log('Review real hotel photo, its source and usage rights before approval. Nothing changed in database.');
  } else if (command === 'preview' || command === 'apply') {
    if (!fs.existsSync(approvedFile)) throw Error('Run export first');
    const items=JSON.parse(fs.readFileSync(approvedFile,'utf8'));
    if (!Array.isArray(items)) throw Error('Approved JSON must be an array');
    const targetMap = new Map(targets.map(h=>[Number(h.id),h]));
    const seen=new Set(); let done=0;
    for (const item of items) {
      const id=Number(item.id);
      if (!Number.isSafeInteger(id) || seen.has(id)) throw Error(`Duplicate/invalid id: ${item.id}`);
      seen.add(id);
      const hotel=targetMap.get(id);
      if (!hotel) { console.log(`SKIP ${id}: not currently missing/blocked`); continue; }
      if (!item.source_page || !item.license_or_permission || /REPLACE|example\.org/i.test(JSON.stringify(item))) { console.log(`SKIP ${id}: photo source/license not approved`); continue; }
      try {
        await validate(item.image);
        if (command === 'apply') {
          const result=await pool.query('UPDATE hotels SET image=$1 WHERE id=$2 AND is_active=TRUE AND (COALESCE(TRIM(image),\'\')=\'\' OR id=ANY($3::int[]))', [item.image,id,blockedIds]);
          if (!result.rowCount) { console.log(`SKIP ${id}: changed concurrently`); continue; }
        }
        console.log(`${command === 'apply' ? 'UPDATED' : 'READY'} ${id} ${hotel.name}`); done++;
      } catch (e) { console.log(`SKIP ${id}: ${e.message}`); }
    }
    console.log(`${command}: ${done} verified ${command === 'apply' ? 'database updates' : 'candidates'}; other hotels unchanged.`);
  } else throw Error('Usage: node backend/scripts/hotel-image-repair.mjs export|preview|apply');
} catch(e) { console.error(e.message); process.exitCode=1; }
finally { await pool.end(); }
