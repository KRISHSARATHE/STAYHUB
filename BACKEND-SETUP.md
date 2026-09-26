# STAYHUB Backend + Database Setup (Mac)

## 1. Start PostgreSQL

Recommended: start a PostgreSQL server locally and create a database named `stayhub`.

If PostgreSQL is already installed as a Homebrew service:

```bash
brew services start postgresql@16
createdb stayhub
```

If your installed PostgreSQL version is different, use that service name.

## 2. Backend environment

```bash
cd ~/Documents/STAYHUB/backend
cp .env.example .env
```

Edit `.env` only when your PostgreSQL username/password/port are different.

## 3. Install backend dependencies

```bash
cd ~/Documents/STAYHUB/backend
npm install
```

## 4. Start the API

```bash
npm run dev
```

Keep this Terminal running.

## 5. Start the React app

Open a second Terminal:

```bash
cd ~/Documents/STAYHUB
npm install
npm run dev
```

Open `http://localhost:5173`.

## 6. Test the API

Open:

`http://localhost:5001/api/health`

Expected response contains:

```json
{"ok":true,"database":"connected"}
```

## What is now stored in PostgreSQL

- Users
- Hotels
- Bookings
- Wishlists
- Admin hotel changes

The existing 20 STAYHUB hotels are seeded automatically when the `hotels` table is empty.

## Frontend fallback

The current UI keeps localStorage fallback behavior when the API is unavailable. When the API is running, hotel listing, account sync, bookings, wishlist and admin data use the database APIs.
