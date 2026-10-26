const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
  <rect width="1200" height="700" fill="#eaf0f8"/>
  <rect x="390" y="170" width="420" height="300" rx="18" fill="#cbd5e1"/>
  <path d="M350 470V290L600 140L850 290V470Z" fill="#94a3b8"/>
  <rect x="520" y="330" width="160" height="140" rx="8" fill="#f8fafc"/>
  <text x="600" y="535" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="#334155">STAYHUB</text>
  <text x="600" y="580" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" fill="#64748b">Hotel image unavailable</text>
</svg>`;

export const HOTEL_IMAGE_FALLBACK =
  "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(fallbackSvg);

// These exact Hotelbeds URLs returned HTTP 403 in the user's image scan.
// Avoid requesting them in the browser; the existing STAYHUB placeholder is used.
const blockedHotelbedsImages = new Set([
  "089737a_hb_ro_003.jpg",
  "108623a_hb_ro_010.jpeg",
  "132971a_hb_ro_024_20250719_121007.jpeg",
  "140606a_hb_a_010.jpg",
  "142590a_hb_r_001.jpg",
]);

export function safeHotelImage(value) {
  if (typeof value !== "string" || !value.trim()) {
    return HOTEL_IMAGE_FALLBACK;
  }

  const url = value.trim();
  if (/^https:\/\/photos\.hotelbeds\.com\//i.test(url)) {
    const filename = url.split("?")[0].split("/").pop();
    if (blockedHotelbedsImages.has(filename)) return HOTEL_IMAGE_FALLBACK;
  }
  if (/^(https?:\/\/|\/|data:image\/)/i.test(url)) {
    return url;
  }

  return HOTEL_IMAGE_FALLBACK;
}

export function handleHotelImageError(event) {
  const img = event.currentTarget;
  if (!img || img.dataset.fallbackApplied === "true") return;

  img.dataset.fallbackApplied = "true";
  img.onerror = null;
  img.src = HOTEL_IMAGE_FALLBACK;
}
