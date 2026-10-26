const discoveryCache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000;
let lastGeocodeAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function discoverOsmHotels(inputCity) {
  const requestedCity = String(inputCity || "").trim().replace(/\s+/g, " ");

  if (!requestedCity || requestedCity.length > 80 ||
      /^(india|bharat|all india)$/i.test(requestedCity)) {
    throw new Error("Enter a specific Indian city to discover hotels.");
  }

  const cacheKey = requestedCity.toLowerCase();
  const cached = discoveryCache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.value;
  }

  const email = process.env.OSM_CONTACT_EMAIL;
  if (!email || !email.includes("@")) {
    throw new Error(
      "Set OSM_CONTACT_EMAIL to your contact email in backend/.env before using OpenStreetMap discovery."
    );
  }

  const geocodeWait = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
  if (geocodeWait) await sleep(geocodeWait);
  lastGeocodeAt = Date.now();

  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("city", requestedCity);
  geocodeUrl.searchParams.set("country", "India");
  geocodeUrl.searchParams.set("format", "jsonv2");
  geocodeUrl.searchParams.set("addressdetails", "1");
  geocodeUrl.searchParams.set("limit", "1");

  const geocodeResponse = await fetch(geocodeUrl, {
    headers: {
      "User-Agent": `STAYHUB student project (contact: ${email})`,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!geocodeResponse.ok) {
    throw new Error(`City lookup failed (${geocodeResponse.status}). Try again later.`);
  }

  const places = await geocodeResponse.json();
  const place = places[0];

  if (!place || !Array.isArray(place.boundingbox)) {
    throw new Error("City not found. Try a more specific Indian city name.");
  }

  const [south, north, west, east] = place.boundingbox.map(Number);
  const centerLat = Number(place.lat);
  const centerLon = Number(place.lon);

  if (
    ![south, north, west, east, centerLat, centerLon].every(Number.isFinite) ||
    centerLat < 6 || centerLat > 38 ||
    centerLon < 68 || centerLon > 98 ||
    north - south > 2 ||
    east - west > 2
  ) {
    throw new Error("Please search for a city, not a country or a large region.");
  }

  const overpassQuery = `
[out:json][timeout:20];
(
  nwr["tourism"~"^(hotel|motel|resort)$"]
  (${south},${west},${north},${east});
);
out center tags 100;
`;

  const overpassResponse = await fetch(
    "https://overpass-api.de/api/interpreter",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": `STAYHUB student project (contact: ${email})`,
        "Accept": "application/json",
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!overpassResponse.ok) {
    throw new Error(
      `OpenStreetMap search is temporarily unavailable (${overpassResponse.status}). Try again later.`
    );
  }

  const osmData = await overpassResponse.json();
  const address = place.address || {};
  const city =
    address.city || address.town || address.municipality ||
    address.village || requestedCity;
  const state = address.state || "India";

  const candidates = (osmData.elements || [])
    .filter((element) => {
      const tags = element.tags || {};
      const name = String(tags.name || "").trim();

      // Exclude obvious non-accommodation listings mis-tagged in OSM.
      const nonHotelName =
        /\\b(sweets?|sweet shop|bakery|restaurant|cafe|coffee shop|dhaba|confectionery|grocery|supermarket|showroom|hospital|clinic|school|college)\\b/i;

      return Boolean(name) &&
        ["hotel", "resort", "motel"].includes(tags.tourism) &&
        !tags.shop &&
        !tags.amenity?.match?.(/^(restaurant|cafe|fast_food|hospital|school)$/) &&
        !nonHotelName.test(name);
    })
    .map((element) => {
      const tags = element.tags || {};
      const tourism = tags.tourism;
      return {
        sourceId: `${element.type}/${element.id}`,
        name: String(tags.name).trim().slice(0, 180),
        location: `${tags["addr:city"] || city}, ${state}`.slice(0, 180),
        category: tourism === "resort" ? "Resort" : "Hotel",
        image: "",
        rating: 0,
        price: 1500,
        totalRooms: 20,
        description:
          "Listed on OpenStreetMap. ₹1,500 is a demo estimate only; actual prices, room inventory and availability have not been verified.",
      };
    });

  // Deduplicate display names without changing source IDs or deleting DB records.
  const uniqueHotels = new Map();
  for (const hotel of candidates) {
    const key = hotel.name
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .replace(/^(the )?/, "")
      .replace(/\b(hotel|resort|motel)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (key && !uniqueHotels.has(key)) {
      uniqueHotels.set(key, hotel);
    }
  }

  const hotels = [...uniqueHotels.values()];

  const result = { city, state, hotels };
  discoveryCache.set(cacheKey, { time: Date.now(), value: result });
  return result;
}
