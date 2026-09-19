import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useState } from "react";

import Hotels from "./components/Hotels";
import HotelDetails from "./components/HotelDetails";
import Booking from "./components/Booking";
import Login from "./components/Login";
import Signup from "./components/Signup";
import MyBookings from "./components/MyBookings";

import "./index.css";

// ================= HOME PAGE =================

function Home() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const hotels = [
    {
      id: 1,
      name: "The Grand Palace",
      location: "Indore, Madhya Pradesh",
      price: "₹2,499",
      rating: "4.8",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 2,
      name: "Royal Heritage Hotel",
      location: "Jaipur, Rajasthan",
      price: "₹3,199",
      rating: "4.7",
      image:
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
    },
    {
      id: 3,
      name: "Lake View Resort",
      location: "Udaipur, Rajasthan",
      price: "₹3,899",
      rating: "4.9",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    },
  ];

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (destination) params.set("destination", destination);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);

    navigate(`/hotels?${params.toString()}`);
  };

  return (
    <div className="home-page">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">
        <div className="nav-container">

        <Link to="/" className="logo">
  <img
    src="/src/assets/stayhub-logo.png"
    alt="STAYHUB"
    style={{
      width: "150px",
      height: "auto",
      display: "block"
    }}
  />
</Link>
       

          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/hotels">Hotels</Link>
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </div>

          <div className="nav-actions">

            <button
              className="login-btn"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              className="signup-btn"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>

          </div>

        </div>
      </nav>

      {/* ================= HERO ================= */}

      <section className="hero">

        <div className="hero-overlay"></div>

        <div className="hero-content">

          <div className="hero-badge">
            ✨ Find your perfect stay
          </div>

          <h1>
            Stay Somewhere
            <br />
            <span>Amazing.</span>
          </h1>

          <p>
            Discover comfortable hotels, beautiful destinations and
            unforgettable stays — all in one place.
          </p>

          {/* ================= SEARCH ================= */}

          <div className="search-box">

            <div className="search-item">

              <label>📍 Destination</label>

              <input
                type="text"
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />

            </div>

            <div className="search-divider"></div>

            <div className="search-item">

              <label>📅 Check-in</label>

              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
              />

            </div>

            <div className="search-divider"></div>

            <div className="search-item">

              <label>📅 Check-out</label>

              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />

            </div>

            <div className="search-divider"></div>

            <div className="search-item guest-item">

              <label>👥 Guests</label>

              <select
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5+ Guests</option>
              </select>

            </div>

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              Search
            </button>

          </div>

        </div>

      </section>

      {/* ================= STATS ================= */}

      <section className="stats-section">

        <div className="stats-container">

          <div className="stat">
            <strong>500+</strong>
            <span>Hotels</span>
          </div>

          <div className="stat">
            <strong>50+</strong>
            <span>Destinations</span>
          </div>

          <div className="stat">
            <strong>10K+</strong>
            <span>Happy Guests</span>
          </div>

          <div className="stat">
            <strong>4.8/5</strong>
            <span>Average Rating</span>
          </div>

        </div>

      </section>

      {/* ================= POPULAR HOTELS ================= */}

      <section
        className="hotels-section"
        id="hotels"
      >

        <div className="section-heading">

          <div>

            <span className="section-label">
              EXPLORE
            </span>

            <h2>
              Popular Hotels
            </h2>

            <p>
              Handpicked stays that travelers love.
            </p>

          </div>

          <Link
            to="/hotels"
            className="view-all"
          >
            View all hotels →
          </Link>

        </div>

        <div className="hotel-grid">

          {hotels.map((hotel) => (

            <div
              className="hotel-card"
              key={hotel.id}
            >

              <div className="hotel-image">

                <img
                  src={hotel.image}
                  alt={hotel.name}
                />

                <div className="rating-badge">
                  ⭐ {hotel.rating}
                </div>

              </div>

              <div className="hotel-info">

                <span className="hotel-location">
                  📍 {hotel.location}
                </span>

                <h3>
                  {hotel.name}
                </h3>

                <div className="hotel-bottom">

                  <div>
                    <strong>
                      {hotel.price}
                    </strong>

                    <span>
                      {" "}
                      / night
                    </span>
                  </div>

                  <button
                    className="details-btn"
                    onClick={() =>
                      navigate(`/hotels/${hotel.id}`)
                    }
                  >
                    View Details
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* ================= FEATURES ================= */}

      <section
        className="features-section"
        id="features"
      >

        <div className="section-heading centered">

          <span className="section-label">
            WHY STAYHUB
          </span>

          <h2>
            Everything you need for a perfect stay
          </h2>

          <p>
            We make finding and booking your next stay simple.
          </p>

        </div>

        <div className="features-grid">

          <div className="feature-card">

            <div className="feature-icon">
              🔍
            </div>

            <h3>
              Easy Search
            </h3>

            <p>
              Quickly search hotels by destination,
              dates and number of guests.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              💰
            </div>

            <h3>
              Best Prices
            </h3>

            <p>
              Compare comfortable stays and find
              options that fit your budget.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ⭐
            </div>

            <h3>
              Trusted Hotels
            </h3>

            <p>
              Discover highly rated hotels selected
              for a better travel experience.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              🔒
            </div>

            <h3>
              Secure Booking
            </h3>

            <p>
              Your booking information is handled
              with a secure and simple process.
            </p>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section
        className="cta-section"
        id="about"
      >

        <div className="cta-content">

          <span className="section-label">
            PLAN YOUR NEXT TRIP
          </span>

          <h2>
            Ready to find your next stay?
          </h2>

          <p>
            Explore our collection of hotels and
            discover a place you'll love.
          </p>

          <Link
            to="/hotels"
            className="cta-btn"
          >
            Explore Hotels →
          </Link>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-brand">

            <Link
              to="/"
              className="logo"
            >
              <span className="logo-icon">
                🏨
              </span>

              <span style={{ color: "#0F172A", fontWeight: 700 }}>
                STAY
                <span style={{ color: "#2563EB" }}>
                  HUB
                </span>
              </span>
            </Link>

            <p>
              Making hotel discovery and booking simple,
              comfortable and convenient.
            </p>

          </div>

          <div className="footer-column">

            <h4>
              Explore
            </h4>

            <Link to="/">
              Home
            </Link>

            <Link to="/hotels">
              Hotels
            </Link>

            <a href="#features">
              Features
            </a>

          </div>

          <div className="footer-column">

            <h4>
              Support
            </h4>

            <a href="#about">
              About Us
            </a>

            <a href="#about">
              Contact
            </a>

            <a href="#about">
              Help Center
            </a>

          </div>

          <div className="footer-column">

            <h4>
              STAYHUB
            </h4>

            <p>
              Hotel Booking Mini Project
            </p>

            <p>
              © 2026 STAYHUB
            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            © 2026 STAYHUB. All rights reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

// ================= APP =================

function App() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/hotels"
          element={<Hotels />}
        />

        <Route
          path="/hotels/:id"
          element={<HotelDetails />}
        />

        <Route
          path="/booking"
          element={<Booking />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;