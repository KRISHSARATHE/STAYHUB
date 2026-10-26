import fs from 'node:fs';
import path from 'node:path';

const csvPath = process.argv[2] || 'backend/reports/hotel-image-review.csv';
const outputDir = process.argv[3] || 'backend/reports/photo-research';
const limit = Math.max(1, Math.min(155, Number(process.argv[4] || 155)));
const text = fs.readFileSync(csvPath, 'utf8');
function parseCSV(input) {
  const rows=[]; let row=[], field='', quote=false;
  for(let i=0;i<input.length;i++) { const c=input[i];
    if(c==='"') { if(quote && input[i+1]==='"'){field+='"';i++;}else quote=!quote; }
    else if(c===','&&!quote){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&input[i+1]==='\n')i++;row.push(field);field='';if(row.some(Boolean))rows.push(row);row=[];}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);}
  const [headers,...data]=rows;return data.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));
}
const targets=parseCSV(text).slice(0,limit);
fs.mkdirSync(outputDir,{recursive:true});
const candidates=[];
const htmlEscape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stripHtml=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function lookup(h){
  const city=h.location.split(',')[0].trim();
  const search=h.name+' '+city;
  const url=new URL('https://commons.wikimedia.org/w/api.php');
  for(const [k,v] of Object.entries({action:'query',format:'json',generator:'search',gsrsearch:search,gsrnamespace:'6',gsrlimit:'6',prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'600'}))url.searchParams.set(k,v);
  const response=await fetch(url,{headers:{'User-Agent':'STAYHUBCollegeImageResearch/1.0 (manual photo research; MediaWiki API)'},signal:AbortSignal.timeout(18000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();
  return Object.values(data.query?.pages||{}).map(p=>{
    const ii=p.imageinfo?.[0]||{},m=ii.extmetadata||{};
    return {id:Number(h.id),hotel:h.name,location:h.location,file:p.title,photo_url:ii.thumburl||ii.url||'',original_url:ii.url||'',source_page:ii.descriptionurl||'',license:stripHtml(m.LicenseShortName?.value),license_url:stripHtml(m.LicenseUrl?.value),artist:stripHtml(m.Artist?.value),credit:stripHtml(m.Credit?.value),description:stripHtml(m.ImageDescription?.value).slice(0,350),mime:ii.mime||'',review_status:'UNVERIFIED — DO NOT IMPORT'};
  }).filter(x=>x.photo_url&&x.mime.startsWith('image/'));
}
for(let i=0;i<targets.length;i++){
  const h=targets[i];
  try {const found=await lookup(h);candidates.push(...found);console.log(`${i+1}/${targets.length} ${h.name}: ${found.length} candidate(s)`);}catch(e){console.log(`${i+1}/${targets.length} ${h.name}: lookup failed (${e.message})`);}
  await sleep(350);
}
const out=path.join(outputDir,'candidates.json');
fs.writeFileSync(out,JSON.stringify(candidates,null,2));
const groups=targets.map(h=>({h,found:candidates.filter(x=>x.id===Number(h.id))}));
const gallery=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>STAYHUB photo research</title><style>body{font:15px system-ui;margin:25px auto;max-width:1100px;padding:0 15px;color:#222}section{border-top:1px solid #ddd;padding:22px 0}.photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}.photo{border:1px solid #ddd;border-radius:9px;padding:10px;overflow-wrap:anywhere}.photo img{width:100%;height:155px;object-fit:cover;background:#eee}.small{font-size:12px;color:#555}strong{display:block;margin:7px 0}</style><h1>STAYHUB — hotel photo candidates</h1><p><b>Research only.</b> Photos are search results, not verified hotel matches. Check the source page, depicted hotel, copyright, attribution and usage rights before using. Do not import automatically.</p>${groups.map(({h,found})=>`<section><h2>#${htmlEscape(h.id)} ${htmlEscape(h.name)}</h2><p>${htmlEscape(h.location)}</p><div class="photos">${found.length?found.map(x=>`<div class="photo"><img loading="lazy" src="${htmlEscape(x.photo_url)}" alt="Candidate for ${htmlEscape(h.name)}"><strong>${htmlEscape(x.file)}</strong><p class="small">License: ${htmlEscape(x.license||'Unknown')}<br>Artist: ${htmlEscape(x.artist||'Unknown')}</p><a target="_blank" rel="noopener" href="${htmlEscape(x.source_page)}">Review file and license</a></div>`).join(''):'<p>No candidates found — manual sourcing required.</p>'}</div></section>`).join('')}</html>`;
fs.writeFileSync(path.join(outputDir,'review-gallery.html'),gallery);
console.log(`Saved ${candidates.length} UNVERIFIED candidates to ${out}`);
console.log(`Open ${path.join(outputDir,'review-gallery.html')} to manually review photos.`);
