# STAYHUB Backend API

REST API for the STAYHUB React frontend using Express and PostgreSQL.

## Features
- PostgreSQL persistence for users, hotels, bookings and wishlists
- Hotel search and filters from the database
- Date-aware room availability checks
- Booking creation and cancellation
- User registration/login endpoints
- Admin hotel CRUD and dashboard statistics
- CORS for the Vite frontend
- Automatic schema creation and hotel seeding on startup

## Run locally

1. Create a PostgreSQL database named `stayhub`.
2. Copy `.env.example` to `.env` and edit the database connection if needed.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Start the API:

```bash
npm run dev
```

API will run at `http://localhost:5000`.

### Docker PostgreSQL
From the project root:

```bash
docker compose up -d db
```

The included `docker-compose.yml` starts PostgreSQL on port `5432` with:
- database: `stayhub`
- user: `postgres`
- password: `postgres`

## Health check

`GET http://localhost:5000/api/health`

## Main endpoints

- `GET /api/hotels`
- `GET /api/hotels/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/users/sync`
- `POST /api/bookings`
- `GET /api/bookings?email=user@example.com`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/wishlist?email=user@example.com`
- `POST /api/wishlist`
- `DELETE /api/wishlist/:hotelId?email=user@example.com`
- `POST /api/auth/admin/login`
- `GET /api/admin/stats`
- `GET /api/admin/bookings`
- `GET /api/admin/users`
- `GET /api/admin/hotels`
- `POST /api/admin/hotels`
- `PUT /api/admin/hotels/:id`
- `DELETE /api/admin/hotels/:id`

This is a college-project backend. For production, use HTTPS, a proper secret manager, stricter CORS and server-side user authorization for every protected resource.
