import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import hotels from "../src/assets/hotels.js";
import { searchAvailability, mapAvailabilityResponse, checkRate, createBooking } from "./hotelbeds.js";
import { discoverOsmHotels } from "./osm.js";

dotenv.config({ path: new URL("./.env", import.meta.url), override: true });

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 5000);
const jwtSecret = process.env.JWT_SECRET || "stayhub-dev-secret-change-me";
const adminEmail = (process.env.ADMIN_EMAIL || "admin@stayhub.com").trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
const googleOAuthClient = new OAuth2Client();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((v) => v.trim()) : true,
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/stayhub",
  max: 10,
});

const query = (text, params = []) => pool.query(text, params);

const sanitizeUser = (row) => row && ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone || "",
  provider: row.provider || "email",
  verified: Boolean(row.verified),
  createdAt: row.created_at,
});

const mapHotel = (row) => ({
  id: Number(row.id),
  name: row.name,
  location: row.location,
  category: row.category,
  price: Number(row.price),
  ratingSource: row.rating_source || 'unknown',
  priceSource: row.price_source || (Number(row.price) > 0 ? 'catalogue' : 'estimate'),
  rating: Number(row.rating),
  image: row.image,
  description: row.description || "",
  amenities: Array.isArray(row.amenities) ? row.amenities : [],
  totalRooms: Number(row.total_rooms || 20),
  isActive: row.is_active !== false,
  source: row.source || "stayhub",
  sourceId: row.source_id || null,
  hotelbeds_code: row.hotelbeds_code == null
    ? null
    : Number(row.hotelbeds_code),
});

const mapBooking = (row) => ({
  couponCode: row.coupon_code || "",
  discount: Number(row.discount || 0),
  paymentMethod: row.payment_method || "Demo Payment",
  paymentStatus: row.payment_status || "Pending",
  paidAt: row.paid_at || null,

  id: row.id,
  userId: row.user_id,
  userEmail: row.user_email,
  hotelId: Number(row.hotel_id),
  hotelName: row.hotel_name,
  location: row.location,
  image: row.image,
  name: row.guest_name,
  email: row.user_email,
  phone: row.phone || "",
  checkIn: row.check_in,
  checkOut: row.check_out,
  rooms: Number(row.rooms),
  adults: Number(row.adults),
  children: Number(row.children),
  childAges: Array.isArray(row.child_ages) ? row.child_ages : [],
  guests: Number(row.adults) + Number(row.children),
  nights: Number(row.nights),
  roomAmount: Number(row.room_amount),
  serviceFee: Number(row.service_fee),
  tax: Number(row.tax),
  total: Number(row.total),
  price: Number(row.total),
  room: row.room,
  status: row.status,
  bookedAt: row.booked_at,
  cancelledAt: row.cancelled_at,
});

const makeToken = (payload) => jwt.sign(payload, jwtSecret, { expiresIn: "8h" });

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Admin authorization required." });
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (decoded.role !== "admin") throw new Error("Invalid role");
    req.admin = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired admin token." });
  }
}

async function ensureSchema() {
  // Automatic booking schema migration.
  // Keeps demo/production databases compatible with the current booking API.
  await pool.query(`
    ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50) DEFAULT '',
      ADD COLUMN IF NOT EXISTS discount NUMERIC(12,2) NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) NOT NULL DEFAULT 'Demo Payment',
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ
  `);

  await query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);


  // Verification migration for existing STAYHUB databases.
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) DEFAULT '',
      password_hash TEXT,
      provider VARCHAR(30) NOT NULL DEFAULT 'email',
      verified BOOLEAN NOT NULL DEFAULT FALSE,
      verification_token TEXT,
      verification_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      location VARCHAR(180) NOT NULL,
      category VARCHAR(60) NOT NULL DEFAULT 'Budget',
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      rating NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
      image TEXT DEFAULT '',
      description TEXT DEFAULT '',
      total_rooms INTEGER NOT NULL DEFAULT 20 CHECK (total_rooms > 0),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(32) PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
      guest_name VARCHAR(120) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      rooms INTEGER NOT NULL CHECK (rooms > 0),
      adults INTEGER NOT NULL CHECK (adults > 0),
      children INTEGER NOT NULL DEFAULT 0 CHECK (children >= 0),
      child_ages JSONB NOT NULL DEFAULT '[]'::jsonb,
      nights INTEGER NOT NULL CHECK (nights > 0),
      room VARCHAR(120) NOT NULL DEFAULT 'Deluxe Room',
      room_amount NUMERIC(12,2) NOT NULL,
      service_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
      tax NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'Confirmed',
      booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      cancelled_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, hotel_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_hotel_dates ON bookings(hotel_id, check_in, check_out);
    CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
  `);

  await query(`
    ALTER TABLE hotels
      ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'stayhub',
      ADD COLUMN IF NOT EXISTS source_id TEXT,
      ADD COLUMN IF NOT EXISTS price_source VARCHAR(40) NOT NULL DEFAULT 'catalogue'
  `);

  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hotels_source_source_id
    ON hotels (source, source_id)
    WHERE source_id IS NOT NULL
  `);

  const countResult = await query("SELECT COUNT(*)::int AS count FROM hotels");
  if (countResult.rows[0].count === 0) {
    for (const hotel of hotels) {
      await query(
        `INSERT INTO hotels (id, name, location, category, price, rating, image, description, total_rooms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (id) DO NOTHING`,
        [hotel.id, hotel.name, hotel.location, hotel.category || "Budget", hotel.price, hotel.rating, hotel.image || "", hotel.description || "", 20],
      );
    }
    await query(`SELECT setval(pg_get_serial_sequence('hotels','id'), GREATEST((SELECT MAX(id) FROM hotels),1))`);
  }

  await query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, token_hash TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL)`);
}

function validateDates(checkIn, checkOut) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (!checkIn || !checkOut || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const nights = Math.round((end - start) / 86400000);
  return nights > 0 ? nights : 0;
}

async function getOrCreateUser({ name, email, phone = "", provider = "email", verified = false }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("User email is required.");
  const result = await query(
    `INSERT INTO users (name,email,phone,provider,verified)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT(email) DO UPDATE SET
       name = COALESCE(NULLIF(EXCLUDED.name,''), users.name),
       phone = COALESCE(NULLIF(EXCLUDED.phone,''), users.phone),
       provider = CASE WHEN EXCLUDED.provider = 'google' THEN 'google' ELSE users.provider END,
       verified = users.verified OR EXCLUDED.verified
     RETURNING *`,
    [String(name || "Guest").trim() || "Guest", normalizedEmail, String(phone || "").trim(), provider || "email", Boolean(verified)],
  );
  return result.rows[0];
}

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({ ok: true, service: "stayhub-api", database: "connected", time: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ ok: false, service: "stayhub-api", database: "unavailable", message: error.message });
  }
});


// StayingAPI live Google Hotels search.
// The API key stays on the backend and is never sent to the browser.
app.get("/api/stayingapi/search", async (req, res) => {
  const apiKey = process.env.STAYINGAPI_KEY;

  if (!apiKey) {
    return res.status(503).json({
      success: false,
      message: "StayingAPI is not configured on the backend."
    });
  }

  const destination = String(req.query.destination || "").trim();
  const checkIn = String(req.query.checkIn || "");
  const checkOut = String(req.query.checkOut || "");
  const adults = Number(req.query.adults || 2);
  const children = Number(req.query.children || 0);

  const validDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

  if (
    !destination ||
    destination.length > 150 ||
    !validDate(checkIn) ||
    !validDate(checkOut) ||
    checkOut <= checkIn ||
    !Number.isInteger(adults) ||
    adults < 1 ||
    adults > 20 ||
    !Number.isInteger(children) ||
    children < 0 ||
    children > 10
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a destination, valid check-in/check-out dates, and valid guest counts."
    });
  }

  const apiHeaders = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json"
  };

  const searchUrl = new URL("https://api.stayingapi.com/v1/search");
  searchUrl.searchParams.set("location", destination);
  searchUrl.searchParams.set("checkIn", checkIn);
  searchUrl.searchParams.set("checkOut", checkOut);
  searchUrl.searchParams.set("adults", String(adults));
  searchUrl.searchParams.set("children", String(children));
  searchUrl.searchParams.set("platforms", "google");
  searchUrl.searchParams.set("limit", "5");

  try {
    let response = await fetch(searchUrl, {
      headers: apiHeaders,
      signal: AbortSignal.timeout(30000)
    });

    let body = await response.json().catch(() => ({}));

    if (!response.ok && response.status !== 202) {
      console.error("StayingAPI search failed:", response.status);
      return res.status(502).json({
        success: false,
        message: "StayingAPI could not complete the hotel search.",
        providerStatus: response.status
      });
    }

    // Some searches return a job ID and complete asynchronously.
    if (response.status === 202) {
      const jobId = body?.data?.jobId;

      if (!jobId) {
        return res.status(502).json({
          success: false,
          message: "StayingAPI accepted the search but did not return a job ID."
        });
      }

      let completed = false;

      for (let attempt = 0; attempt < 60; attempt++) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter, 15)
          : 5;

        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));

        response = await fetch(
          `https://api.stayingapi.com/v1/jobs/${encodeURIComponent(jobId)}`,
          {
            headers: apiHeaders,
            signal: AbortSignal.timeout(30000)
          }
        );

        body = await response.json().catch(() => ({}));

        if (!response.ok) {
          return res.status(502).json({
            success: false,
            message: "Unable to retrieve the StayingAPI search results."
          });
        }

        const job = body?.data;

        if (job?.status === "completed") {
          body = {
            data: job.result,
            meta: body.meta
          };
          completed = true;
          break;
        }

        if (job?.status === "failed") {
          return res.status(502).json({
            success: false,
            message: "StayingAPI search failed.",
            creditsCharged: body?.meta?.creditsCharged ?? 0
          });
        }
      }

      if (!completed) {
        return res.status(504).json({
          success: false,
          message: "The hotel search is taking longer than expected. Please try again later.",
          jobId
        });
      }
    }

    const rawResults = Array.isArray(body?.data)
      ? body.data
      : Array.isArray(body?.data?.results)
        ? body.data.results
        : Array.isArray(body?.data?.data)
          ? body.data.data
          : [];

    const results = rawResults.map((hotel) => ({
      id: hotel.id || hotel.platformListingId || null,
      name: hotel.name || "",
      location: hotel.location || {},
      platform: hotel.platform || hotel.price?.platform || "google",
      url: hotel.url || hotel.price?.url || "",
      image: (() => {
        const firstImage = Array.isArray(hotel.images) ? hotel.images[0] : "";
        if (typeof firstImage === "string") return firstImage;
        if (firstImage && typeof firstImage === "object") {
          const candidate =
            firstImage.url ||
            firstImage.imageUrl ||
            firstImage.image_url ||
            firstImage.thumbnail ||
            "";
          return typeof candidate === "string" ? candidate : "";
        }
        return "";
      })(),
      starRating: hotel.starRating ?? null,
      rating: hotel.guestRating ?? null,
      reviewCount: hotel.reviewCount ?? 0,
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
      currency: hotel.price?.currency || "",
      nightlyPrice: Number(hotel.price?.nightlyPrice) || 0,
      totalPrice: Number(hotel.price?.totalPrice) || 0,
      nights: Number(hotel.price?.nights) || 0,
      priceBasis: hotel.price?.priceBasis || "",
      source: "stayingapi"
    }));

    return res.json({
      success: true,
      source: "stayingapi",
      destination,
      checkIn,
      checkOut,
      data: results,
      creditsCharged: body?.meta?.creditsCharged ?? null
    });
  } catch (error) {
    console.error("StayingAPI request error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Could not reach StayingAPI. Please try again later."
    });
  }
});

app.get("/api/hotels", async (req, res) => {
  try {
    const { city, category, minPrice, maxPrice, minRating, sort, checkIn, checkOut } = req.query;
    const values = [];
    const conditions = ["h.is_active = TRUE"];
    if (city) { values.push(String(city).trim().toLowerCase()); conditions.push(`LOWER(TRIM(SPLIT_PART(h.location, ',', 1))) = $${values.length}`); }
    if (category && category !== "All") { values.push(category); conditions.push(`h.category = $${values.length}`); }
    if (minPrice) { values.push(Number(minPrice)); conditions.push(`h.price >= $${values.length}`); }
    if (maxPrice) { values.push(Number(maxPrice)); conditions.push(`h.price <= $${values.length}`); }
    if (minRating) { values.push(Number(minRating)); conditions.push(`h.rating >= $${values.length}`); }
    let order = "h.id ASC";
    if (sort === "price_low") order = "h.price ASC, h.rating DESC";
    if (sort === "price_high") order = "h.price DESC, h.rating DESC";
    if (sort === "rating") order = "h.rating DESC, h.price ASC";

    const sql = `SELECT h.*,
      CASE WHEN $${values.length + 1}::date IS NULL OR $${values.length + 2}::date IS NULL THEN h.total_rooms
           ELSE GREATEST(h.total_rooms - COALESCE((SELECT SUM(b.rooms) FROM bookings b WHERE b.hotel_id=h.id AND b.status='Confirmed' AND b.check_in < $${values.length + 2}::date AND b.check_out > $${values.length + 1}::date),0),0)
      END AS available_rooms
      FROM hotels h WHERE ${conditions.join(" AND ")} ORDER BY ${order}`;
    values.push(checkIn || null, checkOut || null);
    const result = await query(sql, values);
    res.json({ data: result.rows.map((row) => ({ ...mapHotel(row), availableRooms: Number(row.available_rooms || 0) })) });
  } catch (error) {
    res.status(500).json({ message: "Failed to load hotels.", error: error.message });
  }
});


app.get("/api/hotelbeds/availability", async (req, res) => {
  try {
    const {
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      childAges = "",
      rooms = 1,
      hotelCodes = "",
      destination = "",
    } = req.query;

    const parsedChildAges = String(childAges)
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));

    const parsedHotelCodes = String(hotelCodes)
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    const result = await searchAvailability({
      checkIn: String(checkIn || ""),
      checkOut: String(checkOut || ""),
      adults: Number(adults),
      children: Number(children),
      childAges: parsedChildAges,
      rooms: Number(rooms),
      hotelCodes: parsedHotelCodes,
      destination: String(destination || ""),
    });

    res.json({
      success: true,
      source: "hotelbeds",
      data: mapAvailabilityResponse(result),
    });
  } catch (error) {
    console.error("Hotelbeds availability error:", error.message);

    res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});


// Live Google Places rating lookup. Google content is not stored in PostgreSQL.
app.get("/api/hotels/:id/google-rating", async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        message: "Google Places rating service is not configured."
      });
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid hotel ID." });
    }

    const result = await query(
      "SELECT id, name, location FROM hotels WHERE id=$1 AND is_active=TRUE",
      [id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    const hotel = result.rows[0];
    const locationText = String(hotel.location || "").trim();
    const city = locationText.split(",")[0].split("-")[0].trim();

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.priceRange"
        },
        body: JSON.stringify({
          textQuery: `${hotel.name}, ${hotel.location}, India`,
          maxResultCount: 5
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    const payload = await response.json();

    if (!response.ok) {
      console.error(
        "Google Places rating request failed:",
        JSON.stringify({
          httpStatus: response.status,
          errorStatus: payload.error?.status || "Unknown error",
          errorMessage: payload.error?.message || "No error message returned"
        })
      );
      return res.status(502).json({
        message: "Google Places rating lookup failed. Please try again later."
      });
    }

    const normalize = (value) =>
      String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

    const ignored = new Set([
      "the", "hotel", "resort", "spa", "and", "by", "at", "a", "an"
    ]);

    const tokens = normalize(hotel.name)
      .split(" ")
      .filter((token) => token.length > 2 && !ignored.has(token));

    const normalizedLocation = normalize(locationText);
    const cityAliasGroups = [
      ["bangalore", "bengaluru"],
      ["bombay", "mumbai"],
      ["calcutta", "kolkata"],
      ["madras", "chennai"],
      ["cochin", "kochi"],
      ["trivandrum", "thiruvananthapuram"],
      ["gurgaon", "gurugram"]
    ];
    const cityTerms = new Set();
    const locationWords = normalizedLocation.split(" ").filter(Boolean);
    for (const group of cityAliasGroups) {
      if (group.some((term) => locationWords.includes(term))) {
        group.forEach((term) => cityTerms.add(term));
      }
    }
    // Locations in the catalogue are inconsistently formatted (e.g.
    // "BANGALORE-KARNATAKA" or "RAJASTHAN-1. JAIPUR"). Match meaningful
    // location words while excluding generic country/state labels.
    const ignoredLocationWords = new Set([
      "india", "karnataka", "maharashtra", "rajasthan", "kerala", "goa",
      "gujarat", "punjab", "haryana", "tamil", "nadu", "madhya", "pradesh",
      "uttar", "west", "bengal", "andhra", "telangana", "assam", "himachal",
      "uttarakhand", "odisha", "bihar", "jharkhand", "chandigarh", "zone",
      "north", "south", "east", "west", "in", "the"
    ]);
    locationWords.forEach((word) => {
      if (word.length > 2 && !/^\d+$/.test(word) && !ignoredLocationWords.has(word)) {
        cityTerms.add(word);
      }
    });

    const candidates = (payload.places || []).map((place) => {
      const name = normalize(place.displayName?.text);
      const address = normalize(place.formattedAddress);
      const matchedTokens = tokens.filter((token) => name.includes(token));
      const nameCoverage = tokens.length
        ? matchedTokens.length / tokens.length
        : 0;

      return {
        place,
        nameCoverage,
        cityMatches: [...cityTerms].some((term) => address.includes(term))
      };
    });

    const best = candidates
      .filter((candidate) =>
        candidate.cityMatches && candidate.nameCoverage >= 0.6
      )
      .sort((a, b) => b.nameCoverage - a.nameCoverage)[0];

    if (!best) {
      return res.json({
        data: { matched: false, rating: null, reviewCount: null }
      });
    }

    const place = best.place;

    return res.json({
      data: {
        matched: true,
        name: place.displayName?.text || "",
        address: place.formattedAddress || "",
        rating: Number.isFinite(place.rating) ? place.rating : null,
        reviewCount: Number.isFinite(place.userRatingCount)
          ? place.userRatingCount
          : null,
        placeId: place.id || "",
        googleMapsUrl: place.googleMapsUri || "",
        priceRange: place.priceRange ? {
          currencyCode:
            place.priceRange.startPrice?.currencyCode ||
            place.priceRange.endPrice?.currencyCode || "",
          startPrice: place.priceRange.startPrice
            ? Number(place.priceRange.startPrice.units || 0) +
              Number(place.priceRange.startPrice.nanos || 0) / 1e9
            : null,
          endPrice: place.priceRange.endPrice
            ? Number(place.priceRange.endPrice.units || 0) +
              Number(place.priceRange.endPrice.nanos || 0) / 1e9
            : null
        } : null
      }
    });
  } catch (error) {
    console.error("Google Places rating lookup error:", error.message);
    return res.status(502).json({
      message: "Could not retrieve the Google rating right now."
    });
  }
});

app.get("/api/hotels/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM hotels WHERE id=$1 AND is_active=TRUE", [Number(req.params.id)]);
    if (!result.rowCount) return res.status(404).json({ message: "Hotel not found." });
    res.json({ data: mapHotel(result.rows[0]) });
  } catch (error) { res.status(500).json({ message: "Failed to load hotel.", error: error.message }); }
});



// STAYHUB_FINAL_ADMIN_LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (email !== adminEmail || password !== adminPassword) {
      return res.status(401).json({
        message: "Invalid admin email or password"
      });
    }

    const token = jwt.sign(
      {
        id: "admin",
        userId: "admin",
        email: adminEmail,
        role: "admin",
        isAdmin: true
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      accessToken: token,
      data: {
        token,
        accessToken: token,
        user: {
          id: "admin",
          email: adminEmail,
          name: "STAYHUB Admin",
          role: "admin",
          isAdmin: true
        }
      },
      user: {
        id: "admin",
        email: adminEmail,
        name: "STAYHUB Admin",
        role: "admin",
        isAdmin: true
      }
    });
  } catch (err) {
    console.error("Admin login:", err);
    res.status(500).json({ message: "Admin login failed" });
  }
});

// Production auth email helper. Never return verification secrets to browsers.
const authFrontendUrl = () => (process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://stayhub-flax-two.vercel.app" : "http://localhost:5173")).replace(/\/$/, "");
const authBackendUrl = (req) => (process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
let smtpTransport;
async function sendAuthEmail(to, subject, body) {
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.replace(/\s/g, "");
  if (!smtpUser || !smtpPass) throw new Error("SMTP credentials are not configured");
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: { user: smtpUser, pass: smtpPass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  await smtpTransport.sendMail({
    from: { name: "STAYHUB", address: smtpUser },
    to,
    subject,
    text: body,
  });
}

const verificationAttempts = new Map();
function verificationRateLimited(req, email) {
  const key = `${req.ip || "unknown"}:${email}`;
  const now = Date.now();
  const attempts = (verificationAttempts.get(key) || []).filter(t => now - t < 3600000);
  if (attempts.length >= 5) return true;
  verificationAttempts.set(key, [...attempts, now]);
  return false;
}

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await query(
      "SELECT id, verified FROM users WHERE email=$1",
      [normalizedEmail],
    );

    if (existing.rowCount) {
      if (!existing.rows[0].verified) {
        return res.status(409).json({
          message: "An account with this email exists but is not verified.",
          verificationRequired: true,
        });
      }

      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    if (!emailPattern.test(normalizedEmail)) return res.status(400).json({ message: "Enter a valid email address." });
    if (verificationRateLimited(req, normalizedEmail)) return res.status(429).json({ message: "Too many requests. Try again later." });
    const passwordHash = await bcrypt.hash(String(password), 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const user = await query(
      `INSERT INTO users
        (name,email,phone,password_hash,provider,verified,verification_token,verification_expires_at)
       VALUES ($1,$2,$3,$4,'email',FALSE,$5,NOW() + INTERVAL '30 minutes')
       RETURNING *`,
      [
        String(name).trim(),
        normalizedEmail,
        String(phone || "").trim(),
        passwordHash,
        verificationToken,
      ],
    );

    const row = user.rows[0];

    const verificationUrl = `${authBackendUrl(req)}/api/auth/verify/${encodeURIComponent(verificationToken)}`;
    try {
      await sendAuthEmail(normalizedEmail, "Verify your STAYHUB email", `Welcome to STAYHUB!\n\nVerify your email within 30 minutes:\n${verificationUrl}\n\nIf you did not sign up, ignore this message.`);
    } catch (emailError) {
      console.error("Signup verification email failed:", emailError.code || emailError.message);
      return res.status(503).json({ message: "Account created, but verification email could not be sent. Use Resend Verification to try again.", verificationRequired: true });
    }
    return res.status(201).json({
      data: sanitizeUser(row),
      verificationRequired: true,
      message: "Account created. Check your email for a verification link (valid for 30 minutes).",
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    res.status(500).json({
      message: "Registration failed.",
      error: error.message,
    });
  }
});
app.post("/api/auth/resend-verification", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!emailPattern.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  if (verificationRateLimited(req, email)) return res.status(429).json({ message: "Too many requests. Try again later." });
  const generic = { message: "If this email has an unverified STAYHUB account, a verification link will be sent." };
  try {
    const found = await query("SELECT id FROM users WHERE email=$1 AND verified=FALSE AND password_hash IS NOT NULL LIMIT 1", [email]);
    if (!found.rowCount) return res.json(generic);
    const token = crypto.randomBytes(32).toString("hex");
    const url = `${authBackendUrl(req)}/api/auth/verify/${token}`;
    await sendAuthEmail(email, "Verify your STAYHUB email", `Verify your STAYHUB account within 30 minutes:\n${url}\n\nIf you did not request this, ignore this email.`);
    await query("UPDATE users SET verification_token=$1, verification_expires_at=NOW()+INTERVAL '30 minutes' WHERE id=$2 AND verified=FALSE", [token, found.rows[0].id]);
    return res.json(generic);
  } catch (error) {
    console.error("Resend verification failed:", error.message);
    return res.status(502).json({ message: "Verification email could not be sent. Check email service configuration and try again." });
  }
});

app.get("/api/auth/verify/:token", async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required.",
      });
    }

    const result = await query(
      `SELECT *
       FROM users
       WHERE verification_token=$1
         AND verification_expires_at > NOW()
       LIMIT 1`,
      [token],
    );

    if (!result.rowCount) {
      return res.status(400).json({
        message: "Verification link is invalid or expired.",
      });
    }

    const row = result.rows[0];

    const updated = await query(
      `UPDATE users
       SET verified=TRUE,
           verification_token=NULL,
           verification_expires_at=NULL
       WHERE id=$1
       RETURNING *`,
      [row.id],
    );

    res.json({
      message: "Email verification successful. Your STAYHUB account is now verified.",
      data: sanitizeUser(updated.rows[0]),
    });
  } catch (error) {
    res.status(500).json({
      message: "Verification failed.",
      error: error.message,
    });
  }
});


// Password reset: one-time, SHA-256 hashed tokens, 30-minute expiry.
const resetAttempts = new Map();
app.post("/api/auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Enter a valid email address." });
  const ip = req.ip || "unknown";
  const key = `${ip}:${email}`;
  const now = Date.now();
  const previous = resetAttempts.get(key) || [];
  const recent = previous.filter(t => now - t < 60 * 60 * 1000);
  if (recent.length >= 5) return res.status(429).json({ message: "Too many attempts. Try again later." });
  resetAttempts.set(key, [...recent, now]);
  const generic = { message: "If this email has a STAYHUB account, a password reset link will be sent." };
  try {
    const found = await query("SELECT id FROM users WHERE email=$1 AND password_hash IS NOT NULL", [email]);
    if (!found.rowCount) return res.json(generic);
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetUrl = `${authFrontendUrl()}/reset-password?token=${token}`;
    try {
      await sendAuthEmail(email, "Reset your STAYHUB password", `Open this link to reset your password (expires in 30 minutes): ${resetUrl}\nIf you did not request this, ignore this email.`);
    } catch (mailError) {
      console.error("Password reset SMTP failure:", mailError.code || mailError.message);
      return res.status(502).json({ message: "Could not send reset email. Try again later." });
    }
    await query(`INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,NOW()+INTERVAL '30 minutes') ON CONFLICT (user_id) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at`, [found.rows[0].id, tokenHash]);
    return res.json(generic);
  } catch (error) { console.error("Forgot password:", error); return res.status(500).json({ message: "Unable to process reset request." }); }
});

app.post("/api/auth/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const password = String(req.body?.password || "");
  if (!/^[a-f0-9]{64}$/.test(token) || password.length < 8 || password.length > 128) return res.status(400).json({ message: "Invalid link or password (8–128 characters required)." });
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query("SELECT user_id FROM password_reset_tokens WHERE token_hash=$1 AND expires_at>NOW() FOR UPDATE", [hash]);
    if (!found.rowCount) { await client.query("ROLLBACK"); return res.status(400).json({ message: "Reset link is invalid or expired." }); }
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query("UPDATE users SET password_hash=$1 WHERE id=$2", [passwordHash, found.rows[0].user_id]);
    await client.query("DELETE FROM password_reset_tokens WHERE user_id=$1", [found.rows[0].user_id]);
    await client.query("COMMIT");
    return res.json({ message: "Password changed successfully. You can now log in." });
  } catch (error) { await client.query("ROLLBACK"); console.error("Reset password:", error); return res.status(500).json({ message: "Unable to reset password." }); }
  finally { client.release(); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await query("SELECT * FROM users WHERE email=$1", [String(email || "").trim().toLowerCase()]);
    if (!result.rowCount || !result.rows[0].password_hash) return res.status(401).json({ message: "Invalid email or password." });
    const ok = await bcrypt.compare(String(password || ""), result.rows[0].password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    if (!result.rows[0].verified) {
      return res.status(403).json({
        message: "Please verify your account before logging in.",
        verificationRequired: true,
      });
    }

    const row = result.rows[0];
    res.json({ data: sanitizeUser(row), token: makeToken({ sub: row.id, role: "user", email: row.email }) });
  } catch (error) { res.status(500).json({ message: "Login failed.", error: error.message }); }
});


app.post("/api/auth/google", async (req, res) => {
  try {
    const credential = String(req.body?.credential || "");
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({ message: "Google sign-in is not configured on the backend." });
    }
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required." });
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ message: "Google account email could not be verified." });
    }

    const row = await getOrCreateUser({
      name: payload.name || payload.email.split("@")[0],
      email: payload.email,
      phone: "",
      provider: "google",
      verified: true,
    });

    res.json({
      data: sanitizeUser(row),
      token: makeToken({ sub: row.id, role: "user", email: row.email }),
    });
  } catch (error) {
    console.error("Google authentication failed:", error.message);
    res.status(401).json({ message: "Google sign-in failed. Please try again." });
  }
});

app.post("/api/users/sync", async (req, res) => {
  try {
    const row = await getOrCreateUser(req.body || {});
    res.json({ data: sanitizeUser(row) });
  } catch (error) { res.status(400).json({ message: error.message }); }
});

app.post("/api/bookings", async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};


if (body.hotelbedsRateKey) {
  return res.status(409).json({
    message: "Hotelbeds booking is not yet connected. No supplier booking was created."
  });
}


    const nights = validateDates(body.checkIn, body.checkOut);
    const rooms = Number(body.rooms || 1);
    const adults = Number(body.adults || 1);
    const children = Number(body.children || 0);
    const childAges = Array.isArray(body.childAges) ? body.childAges.map(Number) : [];
    const hotelId = Number(body.hotelId);
    if (!hotelId || !nights || rooms < 1 || adults < 1 || children < 0 || childAges.length !== children) {
      return res.status(400).json({ message: "Invalid booking details." });
    }

    await client.query("BEGIN");
    const hotelResult = await client.query("SELECT * FROM hotels WHERE id=$1 AND is_active=TRUE FOR UPDATE", [hotelId]);
    if (!hotelResult.rowCount) throw new Error("Hotel not found.");
    const hotel = hotelResult.rows[0];

    const overlap = await client.query(
      `SELECT COALESCE(SUM(rooms),0)::int AS booked_rooms FROM bookings WHERE hotel_id=$1 AND status='Confirmed' AND check_in < $3::date AND check_out > $2::date`,
      [hotelId, body.checkIn, body.checkOut],
    );
    const bookedRooms = Number(overlap.rows[0].booked_rooms || 0);
    const totalRooms = Number(hotel.total_rooms || 20);
    if (bookedRooms + rooms > totalRooms) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: `Only ${Math.max(totalRooms - bookedRooms, 0)} room(s) are available for these dates.` });
    }

    const user = await getOrCreateUser({
      name: body.name,
      email: body.userEmail || body.email,
      phone: body.phone,
      provider: body.provider || "email",
      verified: Boolean(body.verified || body.emailVerified),
    });
    const id = body.id || `STH-${new Date().getFullYear()}-${crypto.randomInt(100000, 999999)}`;
    const unitPrice = Number(hotel.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error("Price unavailable for this hotel. Please choose another hotel or try again later.");
    }
    const roomAmount = nights * unitPrice * rooms;
    const serviceFee = Number(body.serviceFee || 0);
    const tax = Number(body.tax || 0);

    // -------------------------------------------------------
    // COUPON / DISCOUNT
    // -------------------------------------------------------
    const couponCode = String(body.couponCode || "").trim().toUpperCase();

    const coupons = {
      STAY10: {
        type: "percent",
        value: 10,
        label: "10% OFF",
      },
      STAY500: {
        type: "flat",
        value: 500,
        label: "₹500 OFF",
      },
      WELCOME15: {
        type: "percent",
        value: 15,
        label: "15% OFF",
      },
    };

    let discount = 0;

    if (couponCode && coupons[couponCode]) {
      const coupon = coupons[couponCode];

      if (coupon.type === "percent") {
        discount = roomAmount * coupon.value / 100;
      } else {
        discount = coupon.value;
      }
    }

    discount = Math.min(Math.max(Number(discount.toFixed(2)), 0), roomAmount);

    // -------------------------------------------------------
    // PAYMENT
    // -------------------------------------------------------
    const allowedPaymentMethods = [
      "UPI",
      "Card",
      "Cash at Hotel",
      "Demo Payment",
    ];

    const paymentMethod = allowedPaymentMethods.includes(
      String(body.paymentMethod || "")
    )
      ? String(body.paymentMethod)
      : "Demo Payment";

    // College/demo payment flow.
    // Real gateway can be connected later.
    // Demo payments are simulated; other methods need gateway confirmation.
    const paymentStatus = paymentMethod === "Demo Payment" ? "Paid" : "Pending";
    const paidAt = paymentStatus === "Paid" ? new Date() : null;

    const total = Math.max(
      0,
      roomAmount + serviceFee + tax - discount
    );

    const result = await client.query(
      `INSERT INTO bookings (
        id,user_id,hotel_id,guest_name,phone,check_in,check_out,
        rooms,adults,children,child_ages,nights,room,
        room_amount,service_fee,tax,total,status,
        coupon_code,discount,payment_method,payment_status,paid_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,'Confirmed',
        $18,$19,$20,$21,$22
      ) RETURNING *`,
      [
        id,
        user.id,
        hotelId,
        String(body.name).trim(),
        String(body.phone).trim(),
        body.checkIn,
        body.checkOut,
        rooms,
        adults,
        children,
        JSON.stringify(childAges),
        nights,
        body.room || "Deluxe Room",
        roomAmount,
        serviceFee,
        tax,
        total,
        couponCode,
        discount,
        paymentMethod,
        paymentStatus,
        paidAt,
      ],
    );
    await client.query("COMMIT");

    const joined = await query(
      `SELECT b.*, u.email AS user_email, h.name AS hotel_name, h.location, h.image
       FROM bookings b JOIN users u ON u.id=b.user_id JOIN hotels h ON h.id=b.hotel_id WHERE b.id=$1`, [id],
    );
    res.status(201).json({ data: mapBooking(joined.rows[0]) });
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    res.status(400).json({ message: error.message || "Booking failed." });
  } finally { client.release(); }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const result = email
      ? await query(`SELECT b.*, u.email AS user_email, h.name AS hotel_name, h.location, h.image FROM bookings b JOIN users u ON u.id=b.user_id JOIN hotels h ON h.id=b.hotel_id WHERE u.email=$1 ORDER BY b.booked_at DESC`, [email])
      : await query(`SELECT b.*, u.email AS user_email, h.name AS hotel_name, h.location, h.image FROM bookings b JOIN users u ON u.id=b.user_id JOIN hotels h ON h.id=b.hotel_id ORDER BY b.booked_at DESC`);
    res.json({ data: result.rows.map(mapBooking) });
  } catch (error) { res.status(500).json({ message: "Failed to load bookings.", error: error.message }); }
});

app.patch("/api/bookings/:id/cancel", async (req, res) => {
  try {
    const result = await query(`UPDATE bookings SET status='Cancelled', cancelled_at=NOW() WHERE id=$1 AND status <> 'Cancelled' RETURNING *`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Booking not found or already cancelled." });
    const joined = await query(`SELECT b.*, u.email AS user_email, h.name AS hotel_name, h.location, h.image FROM bookings b JOIN users u ON u.id=b.user_id JOIN hotels h ON h.id=b.hotel_id WHERE b.id=$1`, [req.params.id]);
    res.json({ data: mapBooking(joined.rows[0]) });
  } catch (error) { res.status(500).json({ message: "Cancellation failed.", error: error.message }); }
});

app.get("/api/wishlist", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.json({ data: [] });
    const result = await query(`SELECT h.* FROM wishlists w JOIN users u ON u.id=w.user_id JOIN hotels h ON h.id=w.hotel_id WHERE u.email=$1 AND h.is_active=TRUE ORDER BY w.created_at DESC`, [email]);
    res.json({ data: result.rows.map(mapHotel) });
  } catch (error) { res.status(500).json({ message: "Failed to load wishlist.", error: error.message }); }
});

app.post("/api/wishlist", async (req, res) => {
  try {
    const { email, name, phone, hotelId } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const numericHotelId = Number(hotelId);

    if (!normalizedEmail) {
      return res.status(400).json({ message: "User email is required." });
    }

    if (!Number.isInteger(numericHotelId) || numericHotelId <= 0) {
      return res.status(400).json({ message: "Valid hotel ID is required." });
    }

    const hotelResult = await query(
      "SELECT id, name FROM hotels WHERE id=$1 AND is_active=TRUE",
      [numericHotelId]
    );

    if (!hotelResult.rowCount) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    const user = await getOrCreateUser({
      email: normalizedEmail,
      name: name || "Guest",
      phone: phone || "",
    });

    const result = await query(
      `INSERT INTO wishlists(user_id, hotel_id)
       VALUES($1,$2)
       ON CONFLICT(user_id, hotel_id)
       DO UPDATE SET created_at = wishlists.created_at
       RETURNING user_id, hotel_id, created_at`,
      [user.id, numericHotelId]
    );

    res.status(201).json({
      message: "Hotel saved to wishlist.",
      data: {
        hotelId: numericHotelId,
        userId: user.id,
        alreadySaved: result.rowCount === 0,
      },
    });
  } catch (error) {
    console.error("WISHLIST ADD ERROR:", error);
    res.status(400).json({
      message: error.message || "Wishlist update failed.",
    });
  }
});

app.delete("/api/wishlist/:hotelId", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    await query(`DELETE FROM wishlists w USING users u WHERE w.user_id=u.id AND u.email=$1 AND w.hotel_id=$2`, [email, Number(req.params.hotelId)]);
    res.json({ message: "Hotel removed from wishlist." });
  } catch (error) { res.status(500).json({ message: "Wishlist update failed.", error: error.message }); }
});

app.post("/api/auth/admin/login", (req, res) => {
  const { email, password } = req.body || {};
  if (String(email || "").trim().toLowerCase() !== adminEmail || String(password || "") !== adminPassword) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }
  res.json({ token: makeToken({ sub: "stayhub-admin", role: "admin", email: adminEmail }), data: { role: "admin", email: adminEmail, name: "STAYHUB Admin", verified: true } });
});

app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [hotelsResult, bookingsResult, usersResult, revenueResult] = await Promise.all([
      query("SELECT COUNT(*)::int AS count FROM hotels WHERE is_active=TRUE"),
      query("SELECT COUNT(*)::int AS count FROM bookings"),
      query("SELECT COUNT(*)::int AS count FROM users"),
      query("SELECT COALESCE(SUM(total),0)::numeric AS total FROM bookings WHERE status <> 'Cancelled'"),
    ]);
    res.json({ data: { hotels: hotelsResult.rows[0].count, bookings: bookingsResult.rows[0].count, users: usersResult.rows[0].count, revenue: Number(revenueResult.rows[0].total) } });
  } catch (error) { res.status(500).json({ message: "Failed to load stats.", error: error.message }); }
});

app.get("/api/admin/hotels", requireAdmin, async (_req, res) => {
  try { const result = await query("SELECT * FROM hotels ORDER BY id ASC"); res.json({ data: result.rows.map(mapHotel) }); }
  catch (error) { res.status(500).json({ message: "Failed to load hotels.", error: error.message }); }
});

app.post("/api/admin/hotels", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const result = await query(`INSERT INTO hotels(name,location,category,price,rating,image,description,total_rooms) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [b.name,b.location,b.category||"Budget",Number(b.price),Number(b.rating||0),b.image||"",b.description||"",Number(b.totalRooms||20)]);
    res.status(201).json({ data: mapHotel(result.rows[0]) });
  } catch (error) { res.status(400).json({ message: "Failed to add hotel.", error: error.message }); }
});

app.put("/api/admin/hotels/:id", requireAdmin, async (req, res) => {
  try {
    const b = req.body || {};
    const result = await query(`UPDATE hotels SET name=$1,location=$2,category=$3,price=$4,rating=$5,image=$6,description=$7,total_rooms=$8,is_active=$9 WHERE id=$10 RETURNING *`, [b.name,b.location,b.category||"Budget",Number(b.price),Number(b.rating||0),b.image||"",b.description||"",Number(b.totalRooms||20),b.isActive !== false,Number(req.params.id)]);
    if (!result.rowCount) return res.status(404).json({ message: "Hotel not found." });
    res.json({ data: mapHotel(result.rows[0]) });
  } catch (error) { res.status(400).json({ message: "Failed to update hotel.", error: error.message }); }
});

app.delete("/api/admin/hotels/:id", requireAdmin, async (req, res) => {
  try {
    const result = await query("UPDATE hotels SET is_active=FALSE WHERE id=$1 RETURNING id", [Number(req.params.id)]);
    if (!result.rowCount) return res.status(404).json({ message: "Hotel not found." });
    res.json({ message: "Hotel hidden from customer listings." });
  } catch (error) { res.status(400).json({ message: "Failed to hide hotel.", error: error.message }); }
});

app.get("/api/admin/bookings", requireAdmin, async (_req, res) => {
  try {
    const result = await query(`SELECT b.*, u.email AS user_email, h.name AS hotel_name, h.location, h.image FROM bookings b JOIN users u ON u.id=b.user_id JOIN hotels h ON h.id=b.hotel_id ORDER BY b.booked_at DESC`);
    res.json({ data: result.rows.map(mapBooking) });
  } catch (error) { res.status(500).json({ message: "Failed to load bookings.", error: error.message }); }
});

app.get("/api/admin/users", requireAdmin, async (_req, res) => {
  try { const result = await query("SELECT * FROM users ORDER BY created_at DESC"); res.json({ data: result.rows.map(sanitizeUser) }); }
  catch (error) { res.status(500).json({ message: "Failed to load users.", error: error.message }); }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error." });
});

ensureSchema().then(() => {
  
app.get("/api/osm/hotels", async (req, res) => {
  try {
    const result = await discoverOsmHotels(req.query.city);
    const savedRows = [];

    for (const hotel of result.hotels) {
      const saved = await query(
        `INSERT INTO hotels
          (name, location, category, price, rating, image, description,
           total_rooms, source, source_id, price_source, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'osm',$9,'demo-estimate',TRUE)
         ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL
         DO UPDATE SET
           name = EXCLUDED.name,
           location = EXCLUDED.location,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           price_source = 'demo-estimate',
           is_active = TRUE
         RETURNING *`,
        [
          hotel.name, hotel.location, hotel.category, hotel.price,
          hotel.rating, hotel.image, hotel.description,
          hotel.totalRooms, hotel.sourceId
        ]
      );
      savedRows.push(saved.rows[0]);
    }

    res.json({
      source: "OpenStreetMap",
      city: result.city,
      discovered: result.hotels.length,
      data: savedRows.map(mapHotel),
      attribution: "Map data © OpenStreetMap contributors",
      priceNotice: "Prices and room inventory are demo estimates, not live offers."
    });
  } catch (error) {
    console.error("OSM hotel discovery error:", error.message);
    res.status(502).json({
      message: error.message || "Hotel discovery failed."
    });
  }
});

/*
 * STAYHUB Hotelbeds live-search bridge.
 * Local hotel records remain the source for UI/content.
 * Hotelbeds supplies live availability/rates only for mapped hotelbeds_code rows.
 */

app.get("/api/hotelbeds/search", async (req, res) => {
  try {
    const {
      city = "",
      destination = "",
      checkIn,
      checkOut,
      adults = 2,
      children = 0,
      childAges = "",
      rooms = 1,
    } = req.query;

    /*
      IMPORTANT:
      If a city/destination is supplied, NEVER fall back to
      broad India inventory. Search only Hotelbeds codes mapped
      to that city in the STAYHUB database.
    */
    const requestedCity = String(city || destination || "").trim();

    let hotelCodes = [];
    let destinationCode = "";

    if (requestedCity) {
      const cityKey = requestedCity.toLowerCase();

      const cityResult = await query(
        `
        SELECT hotelbeds_code, hotelbeds_destination_code
        FROM hotels
        WHERE is_active = TRUE
          AND hotelbeds_code IS NOT NULL
          AND (
            LOWER(TRIM(COALESCE(hotelbeds_city, ''))) = $1
            OR LOWER(TRIM(COALESCE(location, ''))) = $1
            OR LOWER(TRIM(SPLIT_PART(COALESCE(location, ''), ',', 1))) = $1
          )
        ORDER BY id
        `,
        [cityKey]
      );

      destinationCode = String(
        cityResult.rows.find((r) => r.hotelbeds_destination_code)
          ?.hotelbeds_destination_code || ""
      ).trim();

      hotelCodes = cityResult.rows
        .map((r) => Number(r.hotelbeds_code))
        .filter(Number.isInteger);

      console.log(
        `[Hotelbeds city search] ${requestedCity} -> ${hotelCodes.length} mapped hotel(s)`
      );

      if (!hotelCodes.length) {
        return res.json({
          success: true,
          source: "hotelbeds",
          city: requestedCity,
          hotelbedsMapped: 0,
          data: [],
        });
      }
    } else {
      /*
        Hotelbeds requires at least one Availability filter.
        For a broad STAYHUB search we therefore use the Hotelbeds
        codes already mapped in our PostgreSQL database.

        This avoids sending an empty `hotels` filter and avoids
        the invalid "unique filter" error.
      */
      const allHotelsResult = await query(
        `
        SELECT DISTINCT hotelbeds_code
        FROM hotels
        WHERE is_active = TRUE
          AND hotelbeds_code IS NOT NULL
        ORDER BY hotelbeds_code
        `
      );

      hotelCodes = allHotelsResult.rows
        .map((r) => Number(r.hotelbeds_code))
        .filter(Number.isInteger);

      console.log(
        `[Hotelbeds broad search] using ${hotelCodes.length} mapped hotel(s)`
      );

      if (!hotelCodes.length) {
        return res.json({
          success: true,
          source: "hotelbeds",
          city: "",
          hotelbedsMapped: 0,
          data: [],
        });
      }
    }

    if (!checkIn || !checkOut) {
      return res.json({
        success: true,
        source: "hotelbeds",
        city: requestedCity,
        hotelbedsMapped: hotelCodes.length,
        data: [],
      });
    }

    const parsedChildAges = String(childAges)
      .split(",")
      .map((v) => Number(v.trim()))
      .filter(Number.isFinite);

    const result = await searchAvailability({
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      adults: Number(adults),
      children: Number(children),
      childAges: parsedChildAges,
      rooms: Number(rooms),

      // If city is specified, this is ALWAYS a restricted list.
      hotelCodes,
    });

    const mapped = mapAvailabilityResponse(result);
    const liveRows = Array.isArray(mapped)
      ? mapped
      : Array.isArray(mapped?.data)
        ? mapped.data
        : [];

    // Also search the specific destination to discover additional live hotels.
    // Destination code comes from the city's existing database mapping.
    let combinedRows = liveRows;

    if (process.env.HOTELBEDS_DESTINATION_DISCOVERY === "true" && requestedCity && destinationCode) {
      try {
        const destinationResponse = await searchAvailability({
          checkIn: String(checkIn),
          checkOut: String(checkOut),
          adults: Number(adults),
          children: Number(children),
          childAges: parsedChildAges,
          rooms: Number(rooms),
          hotelCodes: [],
          destination: destinationCode,
        });

        const destinationMapped = mapAvailabilityResponse(destinationResponse);
        const destinationRows = Array.isArray(destinationMapped)
          ? destinationMapped
          : Array.isArray(destinationMapped?.data)
            ? destinationMapped.data
            : [];

        const uniqueByCode = new Map();

        for (const hotel of [...liveRows, ...destinationRows]) {
          const code = Number(hotel.hotelbedsCode);
          if (Number.isInteger(code) && code > 0) {
            uniqueByCode.set(code, hotel);
          }
        }

        combinedRows = [...uniqueByCode.values()];

        console.log(
          `[Hotelbeds destination search] ${destinationCode} -> ${destinationRows.length} hotel(s)`
        );
      } catch (destinationError) {
        console.warn(
          "[Hotelbeds destination search failed; retaining mapped results]",
          destinationError.message
        );
      }
    }

    const filteredRows = combinedRows;

    const returnedCodes = filteredRows
      .map((h) => Number(h.hotelbedsCode))
      .filter(Number.isInteger);

    let dbRows = { rows: [] };

    if (returnedCodes.length) {
      dbRows = await query(
        `
        SELECT
          id,
          hotelbeds_code,
          name,
          location,
          category,
          image,
          description,
          rating
        FROM hotels
        WHERE hotelbeds_code = ANY($1::int[])
        `,
        [returnedCodes]
      );
    }

    const byCode = new Map(
      dbRows.rows.map((r) => [Number(r.hotelbeds_code), r])
    );

    const merged = filteredRows.map((h) => {
      const local = byCode.get(Number(h.hotelbedsCode));

      return {
        ...h,
        id: local?.id ?? `hb-${h.hotelbedsCode}`,
        name: local?.name || h.name,
        location: local?.location || h.location,
        category: local?.category || h.category,
        image: local?.image || h.image || "",
        description: local?.description || h.description || "",
        rating: Number(local?.rating || h.rating || 0),
        price: Number(h.minRate || h.price || 0),
      };
    });

    return res.json({
      success: true,
      source: "hotelbeds",
      city: requestedCity,
      hotelbedsMapped: hotelCodes.length,
      data: merged,
    });
  } catch (error) {
    console.error("Hotelbeds search error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

app.post("/api/hotelbeds/checkrate", async (req, res) => {
  try {
    const { rateKey } = req.body || {};
    if (!rateKey) {
      return res.status(400).json({
        success: false,
        message: "rateKey is required.",
      });
    }

    const result = await checkRate(rateKey);
    return res.json({ success: true, source: "hotelbeds", data: result });
  } catch (error) {
    console.error("Hotelbeds CheckRate error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

app.post("/api/hotelbeds/book", async (req, res) => {
  try {
    const result = await createBooking(req.body || {});
    return res.json({ success: true, source: "hotelbeds", data: result });
  } catch (error) {
    console.error("Hotelbeds booking error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      source: "hotelbeds",
      message: error.message,
    });
  }
});

app.listen(port, "0.0.0.0", () => console.log(`STAYHUB API running on 0.0.0.0:${port}`));
}).catch((error) => {
  console.error("STAYHUB API could not start:", error.message);
  process.exit(1);
});
