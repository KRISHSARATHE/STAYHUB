CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) DEFAULT '',
  password_hash TEXT,
  provider VARCHAR(30) NOT NULL DEFAULT 'email',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
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
