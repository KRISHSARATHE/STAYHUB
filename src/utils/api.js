const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5050/api";

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

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

export async function fetchHotels() {
  const result = await apiRequest("/hotels");
  return result.data || [];
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
