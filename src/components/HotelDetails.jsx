import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import stayhubLogo from "../assets/logo.svg";
// ======================================================
// HOTEL DATA
// ======================================================

const hotels = [
  {
    id: 1,
    name: "The Grand Palace",
    location: "Indore, Madhya Pradesh",
    price: 2499,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85",
    description:
      "A comfortable and elegant stay in the heart of Indore with modern rooms, excellent service and premium facilities.",
    amenities: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Parking",
      "Restaurant",
      "Room Service",
      "AC Rooms",
    ],
  },

  {
    id: 2,
    name: "Radisson Blu Hotel Indore",
    location: "Indore, Madhya Pradesh",
    price: 3999,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=85",
    description:
      "Premium rooms, modern facilities and a relaxing atmosphere for business and leisure travellers.",
    amenities: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Gym",
      "Restaurant",
      "Parking",
      "Room Service",
    ],
  },

  {
    id: 3,
    name: "Lemon Tree Hotel",
    location: "Indore, Madhya Pradesh",
    price: 2899,
    rating: 4.5,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
    description:
      "A stylish hotel offering comfortable accommodation and convenient facilities for your stay.",
    amenities: [
      "Free Wi-Fi",
      "Restaurant",
      "Parking",
      "AC Rooms",
      "Breakfast",
      "Room Service",
    ],
  },

  {
    id: 4,
    name: "Sayaji Hotel",
    location: "Indore, Madhya Pradesh",
    price: 3499,
    rating: 4.6,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=85",
    description:
      "Experience premium hospitality with spacious rooms, dining options and modern amenities.",
    amenities: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Gym",
      "Restaurant",
      "Parking",
      "Spa",
    ],
  },

  {
    id: 5,
    name: "Royal Heritage Hotel",
    location: "Jaipur, Rajasthan",
    price: 3199,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1400&q=85",
    description:
      "Enjoy a royal-inspired stay with beautiful interiors and comfortable modern facilities.",
    amenities: [
      "Free Wi-Fi",
      "Restaurant",
      "Parking",
      "AC Rooms",
      "Breakfast",
      "Room Service",
    ],
  },

  {
    id: 6,
    name: "Rambagh Palace",
    location: "Jaipur, Rajasthan",
    price: 7999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=85",
    description:
      "A luxurious palace-style stay offering an unforgettable hospitality experience.",
    amenities: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Gym",
      "Room Service",
    ],
  },

  {
    id: 7,
    name: "Taj Devi Ratn Resort",
    location: "Jaipur, Rajasthan",
    price: 6499,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85",
    description:
      "A peaceful resort surrounded by beautiful views and premium hospitality.",
    amenities: [
      "Swimming Pool",
      "Free Wi-Fi",
      "Restaurant",
      "Parking",
      "Spa",
      "Breakfast",
    ],
  },

  {
    id: 8,
    name: "The Oberoi Rajvilas",
    location: "Jaipur, Rajasthan",
    price: 8999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1400&q=85",
    description:
      "A premium luxury retreat combining traditional architecture with modern comfort.",
    amenities: [
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Gym",
      "Free Wi-Fi",
      "Room Service",
    ],
  },

  {
    id: 9,
    name: "Lake View Resort",
    location: "Udaipur, Rajasthan",
    price: 3899,
    rating: 4.9,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85",
    description:
      "Relax at a beautiful resort with scenic surroundings and comfortable accommodation.",
    amenities: [
      "Lake View",
      "Swimming Pool",
      "Restaurant",
      "Free Wi-Fi",
      "Parking",
      "Breakfast",
    ],
  },

  {
    id: 10,
    name: "The Leela Palace Udaipur",
    location: "Udaipur, Rajasthan",
    price: 8499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=85",
    description:
      "A luxurious lakeside experience with elegant rooms and premium services.",
    amenities: [
      "Lake View",
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Gym",
      "Free Wi-Fi",
    ],
  },

  {
    id: 11,
    name: "Trident Udaipur",
    location: "Udaipur, Rajasthan",
    price: 5299,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1400&q=85",
    description:
      "Comfortable rooms, beautiful surroundings and excellent hospitality in Udaipur.",
    amenities: [
      "Swimming Pool",
      "Restaurant",
      "Free Wi-Fi",
      "Parking",
      "Breakfast",
      "AC Rooms",
    ],
  },

  {
    id: 12,
    name: "Grand Hyatt Goa",
    location: "Goa, India",
    price: 6999,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1400&q=85",
    description:
      "Enjoy a premium Goan holiday with resort-style facilities and relaxing surroundings.",
    amenities: [
      "Beach Access",
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Gym",
      "Free Wi-Fi",
    ],
  },

  {
    id: 13,
    name: "Ocean Breeze Resort",
    location: "Goa, India",
    price: 4299,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1400&q=85",
    description:
      "A relaxing coastal resort perfect for a memorable beach holiday in Goa.",
    amenities: [
      "Beach Access",
      "Swimming Pool",
      "Restaurant",
      "Free Wi-Fi",
      "Parking",
      "Breakfast",
    ],
  },

  {
    id: 14,
    name: "Golden Tulip Goa",
    location: "Goa, India",
    price: 3699,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
    description:
      "A comfortable resort with modern facilities and easy access to popular attractions.",
    amenities: [
      "Swimming Pool",
      "Restaurant",
      "Free Wi-Fi",
      "Parking",
      "AC Rooms",
      "Breakfast",
    ],
  },

  {
    id: 15,
    name: "Mountain Retreat",
    location: "Manali, Himachal Pradesh",
    price: 2799,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1400&q=85",
    description:
      "A peaceful mountain stay surrounded by nature and beautiful Himalayan views.",
    amenities: [
      "Mountain View",
      "Free Wi-Fi",
      "Restaurant",
      "Parking",
      "Bonfire",
      "Breakfast",
    ],
  },

  {
    id: 16,
    name: "Baragarh Resort & Spa",
    location: "Manali, Himachal Pradesh",
    price: 4599,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    description:
      "A scenic resort offering a peaceful escape with premium rooms and spa facilities.",
    amenities: [
      "Mountain View",
      "Spa",
      "Restaurant",
      "Free Wi-Fi",
      "Parking",
      "Bonfire",
    ],
  },

  {
    id: 17,
    name: "Green Valley Hotel",
    location: "Lonavala, Maharashtra",
    price: 2199,
    rating: 4.5,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=85",
    description:
      "An affordable and comfortable stay for travellers exploring Lonavala.",
    amenities: [
      "Free Wi-Fi",
      "Parking",
      "Restaurant",
      "AC Rooms",
      "Breakfast",
      "Room Service",
    ],
  },

  {
    id: 18,
    name: "Taj Mahal Palace",
    location: "Mumbai, Maharashtra",
    price: 7499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=85",
    description:
      "A premium city stay with elegant accommodation and world-class hospitality.",
    amenities: [
      "Sea View",
      "Swimming Pool",
      "Spa",
      "Restaurant",
      "Gym",
      "Free Wi-Fi",
    ],
  },

  {
    id: 19,
    name: "The Imperial Hotel",
    location: "New Delhi, India",
    price: 6799,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=85",
    description:
      "An elegant hotel offering premium rooms, dining and modern guest facilities.",
    amenities: [
      "Free Wi-Fi",
      "Swimming Pool",
      "Restaurant",
      "Gym",
      "Spa",
      "Parking",
    ],
  },

  {
    id: 20,
    name: "Budget Stay Inn",
    location: "Bhopal, Madhya Pradesh",
    price: 1599,
    rating: 4.3,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=85",
    description:
      "A simple, clean and affordable hotel for budget-conscious travellers.",
    amenities: [
      "Free Wi-Fi",
      "Parking",
      "AC Rooms",
      "Restaurant",
      "Breakfast",
      "Room Service",
    ],
  },
];

// ======================================================
// HOTEL DETAILS
// ======================================================

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const hotel = hotels.find((item) => item.id === Number(id));

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  // Today's date
  const today = new Date().toISOString().split("T")[0];

  // ====================================================
  // HOTEL NOT FOUND
  // ====================================================

  if (!hotel) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "30px",
          background: "#f8fafc",
        }}
      >
        <div>
          <div style={{ fontSize: "70px" }}></div>

          <h1>Hotel Not Found</h1>

          <p
            style={{
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            The hotel you are looking for does not exist.
          </p>

          <Link
            to="/hotels"
            style={{
              display: "inline-block",
              padding: "12px 22px",
              background: "#4f46e5",
              color: "#fff",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            ← Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  // ====================================================
  // BOOKING
  // ====================================================

  const handleBooking = () => {
    // Check login
    const currentUser = localStorage.getItem(
      "stayhubCurrentUser"
    );

    if (!currentUser) {
      alert("Please login before booking a hotel.");
      navigate("/login");
      return;
    }

    // Check-in validation
    if (!checkIn) {
      alert("Please select your check-in date.");
      return;
    }

    // Check-out validation
    if (!checkOut) {
      alert("Please select your check-out date.");
      return;
    }

    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    // Check-out must be after check-in
    if (endDate <= startDate) {
      alert(
        "Check-out date must be after check-in date."
      );
      return;
    }

    // Send details to Booking page
    navigate(
      `/booking?hotel=${hotel.id}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="hotel-details-page">

      {/* ==================================================
          TOP BAR
      ================================================== */}

      <header className="details-topbar">

        <Link
          to="/"
          className="details-logo"
        >
          <img
            src={stayhubLogo}
            alt="STAYHUB"
            style={{
              height: "42px",
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Link>

        <button
          className="back-button"
          onClick={() => navigate("/hotels")}
        >
          ← Back to Hotels
        </button>

      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="details-container">

        {/* =================================================
            HOTEL IMAGE
        ================================================= */}

        <div className="details-image">

          <img
            src={hotel.image}
            alt={hotel.name}
            loading="eager"
          />

          <span className="details-category">
            {hotel.category}
          </span>

          <div
            style={{
              position: "absolute",
              bottom: "18px",
              left: "18px",
              background: "rgba(0,0,0,0.65)",
              color: "#fff",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "13px",
              backdropFilter: "blur(5px)",
            }}
          >
            📷 Hotel View
          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="details-main">

          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="details-content">

            {/* LOCATION */}

            <p className="details-location">
              📍 {hotel.location}
            </p>

            {/* HOTEL NAME */}

            <h1 className="details-heading">
              {hotel.name}
            </h1>

            {/* RATING */}

            <div className="details-rating">

              <span
                style={{
                  background: "#fef3c7",
                  color: "#92400e",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  fontWeight: "700",
                }}
              >
                ⭐ {hotel.rating}
              </span>

              <span>
                ★★★★★
              </span>

              <span>
                Excellent
              </span>

            </div>

            {/* DESCRIPTION */}

            <p className="details-description">
              {hotel.description}
            </p>

            {/* =================================================
                AMENITIES
            ================================================= */}

            <section className="details-section">

              <h2>
                Hotel Amenities
              </h2>

              <div className="amenities-grid">

                {hotel.amenities.map(
                  (amenity) => (
                    <div
                      className="amenity"
                      key={amenity}
                    >
                      <span
                        style={{
                          color: "#16a34a",
                          fontWeight: "800",
                          marginRight: "6px",
                        }}
                      >
                        ✓
                      </span>

                      {amenity}
                    </div>
                  )
                )}

              </div>

            </section>

            {/* =================================================
                STAY HIGHLIGHTS
            ================================================= */}

            <section className="details-section">

              <h2>
                Why stay here?
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: "15px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >

                  <span
                    style={{
                      fontSize: "25px",
                    }}
                  >
                    🛏️
                  </span>

                  <div>
                    <strong>
                      Comfortable Rooms
                    </strong>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          "14px",
                      }}
                    >
                      Comfortable rooms
                      designed for a
                      relaxing stay.
                    </p>
                  </div>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >

                  <span
                    style={{
                      fontSize: "25px",
                    }}
                  >
                    🧹
                  </span>

                  <div>
                    <strong>
                      Clean & Comfortable
                    </strong>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          "14px",
                      }}
                    >
                      A clean and
                      comfortable
                      environment for
                      guests.
                    </p>
                  </div>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "15px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                  }}
                >

                  <span
                    style={{
                      fontSize: "25px",
                    }}
                  >
                    🔒
                  </span>

                  <div>
                    <strong>
                      Secure Booking
                    </strong>

                    <p
                      style={{
                        margin:
                          "5px 0 0",
                        color:
                          "#64748b",
                        fontSize:
                          "14px",
                      }}
                    >
                      Your booking
                      details are
                      securely stored
                      in STAYHUB.
                    </p>
                  </div>

                </div>

              </div>

            </section>

          </div>

          {/* =================================================
              BOOKING CARD
          ================================================= */}

          <aside className="booking-card">

            <p
              style={{
                marginBottom: "5px",
                color: "#64748b",
              }}
            >
              Starting from
            </p>

            {/* PRICE */}

            <div className="details-price">

              ₹
              {hotel.price.toLocaleString(
                "en-IN"
              )}

              <span>
                / night
              </span>

            </div>

            {/* =================================================
                CHECK-IN
            ================================================= */}

            <div className="booking-field">

              <label htmlFor="checkIn">
                Check-in
              </label>

              <input
                id="checkIn"
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => {
                  const value =
                    e.target.value;

                  setCheckIn(value);

                  // Reset checkout if invalid
                  if (
                    checkOut &&
                    new Date(value) >=
                      new Date(checkOut)
                  ) {
                    setCheckOut("");
                  }
                }}
              />

            </div>

            {/* =================================================
                CHECK-OUT
            ================================================= */}

            <div className="booking-field">

              <label htmlFor="checkOut">
                Check-out
              </label>

              <input
                id="checkOut"
                type="date"
                min={
                  checkIn ||
                  today
                }
                value={checkOut}
                onChange={(e) =>
                  setCheckOut(
                    e.target.value
                  )
                }
              />

            </div>

            {/* =================================================
                GUESTS
            ================================================= */}

            <div className="booking-field">

              <label htmlFor="guests">
                Guests
              </label>

              <select
                id="guests"
                value={guests}
                onChange={(e) =>
                  setGuests(
                    e.target.value
                  )
                }
              >

                <option value="1">
                  1 Guest
                </option>

                <option value="2">
                  2 Guests
                </option>

                <option value="3">
                  3 Guests
                </option>

                <option value="4">
                  4 Guests
                </option>

                <option value="5">
                  5 Guests
                </option>

                <option value="6">
                  6 Guests
                </option>

              </select>

            </div>

            {/* =================================================
                PRICE INFORMATION
            ================================================= */}

            <div
              style={{
                marginTop: "18px",
                paddingTop: "15px",
                borderTop:
                  "1px solid #e5e7eb",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "8px",
                  fontSize: "14px",
                }}
              >

                <span>
                  Room price
                </span>

                <strong>
                  ₹
                  {hotel.price.toLocaleString(
                    "en-IN"
                  )}
                  /night
                </strong>

              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  fontSize: "14px",
                }}
              >

                <span>
                  Guests
                </span>

                <strong>
                  {guests}
                </strong>

              </div>

            </div>

            {/* =================================================
                BOOK BUTTON
            ================================================= */}

            <button
              className="book-now-button"
              onClick={handleBooking}
            >
              Book Now →
            </button>

            {/* SECURITY */}

            <p className="secure-text">
              🔒 Secure booking • No payment
              required now
            </p>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default HotelDetails;