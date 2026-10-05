import fs from "node:fs";
import https from "node:https";
import crypto from "node:crypto";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function signature() {
  const apiKey = requiredEnv("HOTELBEDS_API_KEY");
  const apiSecret = requiredEnv("HOTELBEDS_API_SECRET");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  return crypto
    .createHash("sha256")
    .update(apiKey + apiSecret + timestamp)
    .digest("hex");
}

function hotelbedsRequest(path, body) {
  const apiKey = requiredEnv("HOTELBEDS_API_KEY");
  const baseUrl = requiredEnv("HOTELBEDS_API_BASE_URL");
  const certPath = requiredEnv("HOTELBEDS_CERT_PATH");
  const keyPath = requiredEnv("HOTELBEDS_KEY_PATH");

  const payload = JSON.stringify(body);
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
        headers: {
          "Api-key": apiKey,
          "X-Signature": signature(),
          Accept: "application/json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          let json;

          try {
            json = JSON.parse(data);
          } catch {
            json = { raw: data };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
            return;
          }

          const error = new Error(
            json?.error?.message ||
              json?.message ||
              `Hotelbeds HTTP ${res.statusCode}`
          );

          error.statusCode = res.statusCode;
          error.response = json;

          reject(error);
        });
      }
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function searchAvailability({
  checkIn,
  checkOut,
  adults = 2,
  children = 0,
  childAges = [],
  rooms = 1,
  hotelCodes = [],
}) {
  if (!checkIn || !checkOut) {
    throw new Error("checkIn and checkOut are required.");
  }

  if (checkOut <= checkIn) {
    throw new Error("Check-out must be after check-in.");
  }

  const adultCount = Math.max(1, Number(adults) || 1);
  const childCount = Math.max(0, Number(children) || 0);
  const roomCount = Math.max(1, Number(rooms) || 1);

  const ages = Array.from(
    { length: childCount },
    (_, i) => Math.max(0, Number(childAges[i] ?? 8))
  );

  const occupancy = {
    rooms: roomCount,
    adults: adultCount,
    children: childCount,
  };

  if (childCount > 0) {
    occupancy.paxes = ages.map((age) => ({
      type: "CH",
      age,
    }));
  }

  const body = {
    stay: {
      checkIn,
      checkOut,
    },
    occupancies: [occupancy],
  };

  const codes = hotelCodes
    .map(Number)
    .filter((code) => Number.isInteger(code) && code > 0);

  if (codes.length) {
    body.hotels = {
      hotel: codes,
    };
  }

  return hotelbedsRequest("/hotel-api/1.0/hotels", body);
}

export function mapAvailabilityResponse(response) {
  const hotels = response?.hotels?.hotels || [];

  return hotels.map((hotel) => {
    const rooms = hotel.rooms || [];

    const rates = rooms.flatMap((room) =>
      (room.rates || []).map((rate) => ({
        roomCode: room.code || "",
        roomName: room.name || "Room",
        rateKey: rate.rateKey || "",
        rateType: rate.rateType || "",
        net: Number(rate.net || 0),
        sellingRate: Number(rate.sellingRate || rate.net || 0),
        boardCode: rate.boardCode || "",
        boardName: rate.boardName || "",
        paymentType: rate.paymentType || "",
      }))
    );

    const validRates = rates
      .filter((rate) => rate.net > 0)
      .sort((a, b) => a.net - b.net);

    const cheapest = validRates[0];

    return {
      id: Number(hotel.code),
      hotelbedsCode: Number(hotel.code),

      name: hotel.name || "Hotel",

      location: [
        hotel.destinationName,
        hotel.destinationCode,
      ]
        .filter(Boolean)
        .join(", "),

      category: hotel.categoryName || "",
      rating: Number(
        String(hotel.categoryName || "").match(/\d+/)?.[0] || 0
      ),

      price: cheapest?.net || Number(hotel.minRate || 0),
      currency: hotel.currency || "EUR",

      rateKey: cheapest?.rateKey || "",
      rateType: cheapest?.rateType || "",
      boardName: cheapest?.boardName || "",
      paymentType: cheapest?.paymentType || "",

      minRate: Number(hotel.minRate || 0),
      maxRate: Number(hotel.maxRate || 0),

      image: "",
      description: "",

      availableRooms: validRates.length > 0 ? 1 : 0,

      rates,
    };
  });
}


export async function checkRate(rateKey) {
  if (!rateKey) throw new Error("rateKey is required.");
  return hotelbedsRequest("/hotel-api/1.0/checkrates", {
    rooms: [{ rateKey: String(rateKey) }],
  });
}

export async function createBooking({
  holder,
  rooms,
  clientReference = "STAYHUB",
  remark = "",
  tolerance,
}) {
  if (!holder?.name || !holder?.surname) {
    throw new Error("Holder name and surname are required.");
  }
  if (!Array.isArray(rooms) || !rooms.length) {
    throw new Error("At least one booking room is required.");
  }

  const body = {
    holder: {
      name: String(holder.name),
      surname: String(holder.surname),
    },
    rooms: rooms.map((room) => ({
      rateKey: String(room.rateKey || ""),
      paxes: Array.isArray(room.paxes) ? room.paxes : [],
    })),
    clientReference: String(clientReference || "STAYHUB"),
    remark: String(remark || ""),
  };

  if (tolerance !== undefined && tolerance !== null && tolerance !== "") {
    body.tolerance = Number(tolerance);
  }

  return hotelbedsRequest("/hotel-api/1.0/bookings", body);
}
