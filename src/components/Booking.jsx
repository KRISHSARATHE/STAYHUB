import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import stayhubLogo from "../assets/stayhub-logo.png";
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
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 2,
    name: "Radisson Blu Hotel Indore",
    location: "Indore, Madhya Pradesh",
    price: 3999,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 3,
    name: "Lemon Tree Hotel",
    location: "Indore, Madhya Pradesh",
    price: 2899,
    rating: 4.5,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 4,
    name: "Sayaji Hotel",
    location: "Indore, Madhya Pradesh",
    price: 3499,
    rating: 4.6,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 5,
    name: "Royal Heritage Hotel",
    location: "Jaipur, Rajasthan",
    price: 3199,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 6,
    name: "Rambagh Palace",
    location: "Jaipur, Rajasthan",
    price: 7999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 7,
    name: "Taj Devi Ratn Resort",
    location: "Jaipur, Rajasthan",
    price: 6499,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 8,
    name: "The Oberoi Rajvilas",
    location: "Jaipur, Rajasthan",
    price: 8999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 9,
    name: "Lake View Resort",
    location: "Udaipur, Rajasthan",
    price: 3899,
    rating: 4.9,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 10,
    name: "The Leela Palace Udaipur",
    location: "Udaipur, Rajasthan",
    price: 8499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 11,
    name: "Trident Udaipur",
    location: "Udaipur, Rajasthan",
    price: 5299,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 12,
    name: "Grand Hyatt Goa",
    location: "Goa, India",
    price: 6999,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 13,
    name: "Ocean Breeze Resort",
    location: "Goa, India",
    price: 4299,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 14,
    name: "Golden Tulip Goa",
    location: "Goa, India",
    price: 3699,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 15,
    name: "Mountain Retreat",
    location: "Manali, Himachal Pradesh",
    price: 2799,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 16,
    name: "Baragarh Resort & Spa",
    location: "Manali, Himachal Pradesh",
    price: 4599,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 17,
    name: "Green Valley Hotel",
    location: "Lonavala, Maharashtra",
    price: 2199,
    rating: 4.5,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 18,
    name: "Taj Mahal Palace",
    location: "Mumbai, Maharashtra",
    price: 7499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 19,
    name: "The Imperial Hotel",
    location: "New Delhi, India",
    price: 6799,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85",
  },
  {
    id: 20,
    name: "Budget Stay Inn",
    location: "Bhopal, Madhya Pradesh",
    price: 1599,
    rating: 4.3,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=85",
  },
];

// ======================================================
// BOOKING COMPONENT
// ======================================================

function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hotelId = Number(searchParams.get("hotel"));

  const selectedCheckIn = searchParams.get("checkIn") || "";
  const selectedCheckOut = searchParams.get("checkOut") || "";
  const selectedGuests = searchParams.get("guests") || "2";

  const hotel = hotels.find((item) => item.id === hotelId);

  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: selectedCheckIn,
    checkOut: selectedCheckOut,
    guests: selectedGuests,
  });

  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // ====================================================
  // LOAD CURRENT USER
  // ====================================================

  useEffect(() => {
    const savedUser = localStorage.getItem(
      "stayhubCurrentUser"
    );

    if (!savedUser) {
      alert("Please login before booking.");
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(savedUser);

      setCurrentUser(user);

      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.mobile || "",
      }));
    } catch (error) {
      console.error("User data error:", error);

      localStorage.removeItem(
        "stayhubCurrentUser"
      );

      navigate("/login");
    }
  }, [navigate]);

  // ====================================================
  // HOTEL NOT FOUND
  // ====================================================

  if (!hotel) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "30px",
          background: "#f8fafc",
        }}
      >
        <div>
          <div style={{ fontSize: "70px" }}>
            
          </div>

          <h1>Hotel Not Found</h1>

          <p
            style={{
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            Please select a valid hotel.
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
            ← Browse Hotels
          </Link>
        </div>
      </div>
    );
  }

  // ====================================================
  // INPUT HANDLER
  // ====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ====================================================
  // CALCULATE NIGHTS
  // ====================================================

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) {
      return 0;
    }

    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);

    const difference =
      end.getTime() - start.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  const nights = calculateNights();

  const totalAmount =
    nights > 0
      ? nights * hotel.price
      : 0;

  // ====================================================
  // SUBMIT BOOKING
  // ====================================================

  const handleSubmit = (e) => {
    e.preventDefault();

    const savedUser = localStorage.getItem(
      "stayhubCurrentUser"
    );

    if (!savedUser) {
      alert("Please login before booking.");
      navigate("/login");
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      alert("Please login again.");
      navigate("/login");
      return;
    }

    // ----------------------------------------------
    // NAME
    // ----------------------------------------------

    if (!formData.name.trim()) {
      alert("Please enter your name.");
      return;
    }

    // ----------------------------------------------
    // EMAIL
    // ----------------------------------------------

    if (!formData.email.trim()) {
      alert("Please enter your email.");
      return;
    }

    // ----------------------------------------------
    // PHONE
    // ----------------------------------------------

    const phone = formData.phone.trim();

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    // ----------------------------------------------
    // DATES
    // ----------------------------------------------

    if (!formData.checkIn) {
      alert("Please select check-in date.");
      return;
    }

    if (!formData.checkOut) {
      alert("Please select check-out date.");
      return;
    }

    const startDate = new Date(
      formData.checkIn
    );

    const endDate = new Date(
      formData.checkOut
    );

    if (endDate <= startDate) {
      alert(
        "Check-out date must be after check-in date."
      );
      return;
    }

    if (nights <= 0) {
      alert("Please select valid booking dates.");
      return;
    }

    // ----------------------------------------------
    // BOOKING ID
    // ----------------------------------------------

    const bookingId =
      "STH-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(
        100000 +
          Math.random() * 900000
      );

    // ----------------------------------------------
    // BOOKING OBJECT
    // ----------------------------------------------

    const booking = {
      id: bookingId,

      userId:
        user.id ||
        user.loginId ||
        user.email,

      userEmail:
        user.email ||
        formData.email,

      hotelId: hotel.id,

      hotelName: hotel.name,

      location: hotel.location,

      image: hotel.image,

      name: formData.name.trim(),

      email: formData.email.trim(),

      phone: phone,

      checkIn: formData.checkIn,

      checkOut: formData.checkOut,

      guests: Number(formData.guests),

      nights: nights,

      price: totalAmount,

      room: "Deluxe Room",

      status: "Confirmed",

      bookedAt:
        new Date().toISOString(),
    };

    // ----------------------------------------------
    // GET OLD BOOKINGS
    // ----------------------------------------------

    const existingBookings =
      JSON.parse(
        localStorage.getItem(
          "stayhubBookings"
        )
      ) || [];

    // ----------------------------------------------
    // SAVE BOOKING
    // ----------------------------------------------

    const updatedBookings = [
      ...existingBookings,
      booking,
    ];

    localStorage.setItem(
      "stayhubBookings",
      JSON.stringify(
        updatedBookings
      )
    );

    // ----------------------------------------------
    // SHOW CONFIRMATION
    // ----------------------------------------------

    setConfirmedBooking(booking);
  };

  // ====================================================
  // CONFIRMATION PAGE
  // ====================================================

  if (confirmedBooking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, #eef2ff, #f8fafc)",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "20px",
            padding: "40px",
            boxShadow:
              "0 20px 50px rgba(0,0,0,0.08)",
          }}
        >
          {/* SUCCESS */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                width: "75px",
                height: "75px",
                borderRadius: "50%",
                background: "#dcfce7",
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "38px",
                margin: "0 auto 20px",
              }}
            >
              ✓
            </div>

            <h1
              style={{
                marginBottom: "8px",
              }}
            >
              Booking Confirmed!
            </h1>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Your hotel reservation has been
              successfully created.
            </p>
          </div>

          {/* HOTEL */}

          <div
            style={{
              display: "flex",
              gap: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "15px",
              marginBottom: "25px",
            }}
          >
            <img
              src={confirmedBooking.image}
              alt={confirmedBooking.hotelName}
              style={{
                width: "150px",
                height: "110px",
                objectFit: "cover",
                borderRadius: "12px",
              }}
            />

            <div>
              <h2
                style={{
                  marginBottom: "8px",
                }}
              >
                {confirmedBooking.hotelName}
              </h2>

              <p
                style={{
                  color: "#64748b",
                }}
              >
                📍 {confirmedBooking.location}
              </p>

              <p>
                ⭐ Hotel Booking
              </p>
            </div>
          </div>

          {/* BOOKING DETAILS */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <div>
              <small>BOOKING ID</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.id}
              </strong>
            </div>

            <div>
              <small>CHECK-IN</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.checkIn}
              </strong>
            </div>

            <div>
              <small>CHECK-OUT</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.checkOut}
              </strong>
            </div>

            <div>
              <small>GUESTS</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.guests}
              </strong>
            </div>

            <div>
              <small>ROOM</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.room}
              </strong>
            </div>

            <div>
              <small>NIGHTS</small>
              <strong
                style={{
                  display: "block",
                  marginTop: "5px",
                }}
              >
                {confirmedBooking.nights}
              </strong>
            </div>
          </div>

          {/* TOTAL */}

          <div
            style={{
              padding: "20px",
              background: "#eef2ff",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <strong>
              Total Amount
            </strong>

            <strong
              style={{
                fontSize: "24px",
                color: "#4f46e5",
              }}
            >
              ₹
              {confirmedBooking.price.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

          {/* ACTIONS */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/my-bookings"
              style={{
                flex: "1",
                minWidth: "180px",
                textAlign: "center",
                padding: "14px",
                background: "#4f46e5",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              View My Bookings
            </Link>

            <Link
              to="/hotels"
              style={{
                flex: "1",
                minWidth: "180px",
                textAlign: "center",
                padding: "14px",
                background: "#f1f5f9",
                color: "#334155",
                textDecoration: "none",
                borderRadius: "10px",
                fontWeight: "600",
              }}
            >
              Book Another Hotel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN BOOKING PAGE
  // ====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <header
        style={{
          background: "#fff",
          borderBottom:
            "1px solid #e5e7eb",
          padding: "16px 5%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "15px",
          flexWrap: "wrap",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            fontWeight: "800",
            fontSize: "22px",
            color: "#4f46e5",
          }}
        >
          STAYHUB
        </Link>

        <button
          onClick={() => navigate(-1)}
          style={{
            border: "none",
            background: "#f1f5f9",
            padding: "10px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          ← Back
        </button>
      </header>

      {/* ==================================================
          MAIN
      ================================================== */}

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <p
            style={{
              color: "#4f46e5",
              fontWeight: "700",
              marginBottom: "5px",
            }}
          >
            STAYHUB RESERVATION
          </p>

          <h1>
            Complete Your Booking
          </h1>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Enter your details to confirm your
            hotel reservation.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1.4fr) minmax(300px, 0.8fr)",
            gap: "25px",
          }}
        >
          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "18px",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h2>
              Guest Details
            </h2>

            {/* NAME */}

            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Full Name
              </label>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* EMAIL */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* PHONE */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Mobile Number
              </label>

              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength="10"
                required
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* DATES */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "1fr 1fr",
                gap: "15px",
                marginTop: "18px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: "600",
                  }}
                >
                  Check-in
                </label>

                <input
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "13px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: "600",
                  }}
                >
                  Check-out
                </label>

                <input
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "13px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* GUESTS */}

            <div
              style={{
                marginTop: "18px",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontWeight: "600",
                }}
              >
                Number of Guests
              </label>

              <select
                name="guests"
                value={formData.guests}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "13px",
                  border:
                    "1px solid #d1d5db",
                  borderRadius: "9px",
                  boxSizing: "border-box",
                }}
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

            {/* SUBMIT */}

            <button
              type="submit"
              style={{
                width: "100%",
                marginTop: "25px",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: "#4f46e5",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Confirm Booking →
            </button>

            <p
              style={{
                textAlign: "center",
                marginTop: "12px",
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              🔒 No payment required at this stage
            </p>
          </form>

          {/* =================================================
              BOOKING SUMMARY
          ================================================= */}

          <aside
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "18px",
              height: "fit-content",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h2>
              Booking Summary
            </h2>

            <img
              src={hotel.image}
              alt={hotel.name}
              style={{
                width: "100%",
                height: "190px",
                objectFit: "cover",
                borderRadius: "12px",
                marginTop: "18px",
              }}
            />

            <h3
              style={{
                marginTop: "18px",
                marginBottom: "6px",
              }}
            >
              {hotel.name}
            </h3>

            <p
              style={{
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              📍 {hotel.location}
            </p>

            {/* PRICE */}

            <div
              style={{
                borderTop:
                  "1px solid #e5e7eb",
                paddingTop: "18px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  Price / night
                </span>

                <strong>
                  ₹
                  {hotel.price.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  Nights
                </span>

                <strong>
                  {nights || 0}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "10px",
                }}
              >
                <span>
                  Guests
                </span>

                <strong>
                  {formData.guests}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginTop: "18px",
                  paddingTop: "18px",
                  borderTop:
                    "1px solid #e5e7eb",
                }}
              >
                <strong>
                  Total
                </strong>

                <strong
                  style={{
                    fontSize: "22px",
                    color: "#4f46e5",
                  }}
                >
                  ₹
                  {totalAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Booking;