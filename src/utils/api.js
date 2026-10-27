const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5050/api";

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = String(options.method || "GET").toUpperCase();
  const canRetry = method === "GET" && !options.signal;
  const maxAttempts = canRetry ? 3 : 1;

  let response;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        signal: options.signal || AbortSignal.timeout(90000),
      });

      if (
        canRetry &&
        [502, 503, 504].includes(response.status) &&
        attempt < maxAttempts
      ) {
        await new Promise(resolve =>
          setTimeout(resolve, attempt * 2000)
        );
        continue;
      }

      break;
    } catch (error) {
      if (!canRetry || attempt === maxAttempts) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, attempt * 2000)
      );
    }
  }

  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data.message || `API request failed (${response.status})`);
  }

  return data;
}

let hotelsCache = null;
let hotelsCacheTime = 0;
let hotelsPendingRequest = null;

export async function fetchHotels() {
  const now = Date.now();
  const cacheDuration = 30000;

  if (hotelsCache && now - hotelsCacheTime < cacheDuration) {
    return hotelsCache;
  }

  if (hotelsPendingRequest) {
    return hotelsPendingRequest;
  }

  hotelsPendingRequest = (async () => {
    const result = await apiRequest("/hotels");
    const data = result.data || [];

    hotelsCache = data;
    hotelsCacheTime = Date.now();

    return data;
  })();

  try {
    return await hotelsPendingRequest;
  } finally {
    hotelsPendingRequest = null;
  }
}

export async function fetchOsmHotels(city) {
  const query = new URLSearchParams({ city: String(city || "").trim() });
  const result = await apiRequest(`/osm/hotels?${query.toString()}`);
  return result.data || [];
}

export async function fetchStayingApiSearch(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      query.set(key, String(value));
    }
  });

  return apiRequest(`/stayingapi/search?${query.toString()}`);
}

export async function fetchHotelbedsSearch(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      query.set(key, String(value));
    }
  });

  const result = await apiRequest(
    `/hotelbeds/search?${query.toString()}`
  );

  return result.data || [];
}

export async function checkHotelbedsRate(rateKey) {
  return apiRequest("/hotelbeds/checkrate", {
    method: "POST",
    body: JSON.stringify({ rateKey }),
  });
}

export async function bookHotelbeds(payload) {
  return apiRequest("/hotelbeds/book", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
