import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

const stayhubLogo = "/stayhub-logo.svg";

import { useEffect, useState } from "react";
import { fetchHotels } from "./utils/api";

import Hotels from "./components/Hotels";
import HotelDetails from "./components/HotelDetails";
import Booking from "./components/Booking";
import Login from "./components/Login";
import PasswordRecovery from "./components/PasswordRecovery";
import Signup from "./components/Signup";
import MyBookings from "./components/MyBookings";
import Wishlist from "./components/Wishlist";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import GuestSelector from "./components/GuestSelector";
import { getMinDate, tomorrowInput, validateGuestSelection, clearCurrentUser } from "./utils/stayhub";

import "./index.css";

// =====================================================
// HOME PAGE
// =====================================================

function Home() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState(getMinDate());
  const [checkOut, setCheckOut] = useState(tomorrowInput());
  const [guestData, setGuestData] = useState({ rooms: 1, adults: 2, children: 0, childAges: [] });
  const [searchError, setSearchError] = useState("");

  const [hotels, setHotels] = useState([]);

  // ===================================================
  // LOAD POPULAR HOTELS FROM POSTGRESQL API
  // ===================================================

  useEffect(() => {
    let active = true;

    async function loadHotels() {
      try {
        const data = await fetchHotels();

        if (active) {
          setHotels(data);
        }
      } catch (error) {
        console.error("Failed to load popular hotels:", error);

        if (active) {
          setHotels([]);
        }
      }
    }

    loadHotels();

    return () => {
      active = false;
    };
  }, []);

  // ===================================================
  // LOGIN USER
  // ===================================================

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser =
        localStorage.getItem("stayhubCurrentUser");

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Invalid user data:", error);
          localStorage.removeItem("stayhubCurrentUser");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    // Update if login/logout happens
    window.addEventListener("storage", loadUser);
    window.addEventListener("stayhub-auth-change", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("stayhub-auth-change", loadUser);
    };
  }, []);

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    clearCurrentUser();
    setUser(null);
    navigate("/");
  };

  // ===================================================
  // HOTELS
  // ===================================================



  // ===================================================
  // SEARCH
  // ===================================================

  const handleSearch = () => {
    setSearchError("");
    const today = getMinDate();

    if (checkIn && checkIn < today) {
      setSearchError("Check-in date cannot be in the past.");
      return;
    }

    if (!checkIn || !checkOut) {
      setSearchError("Please select both check-in and check-out dates.");
      return;
    }

    if (checkOut <= checkIn) {
      setSearchError("Check-out date must be after check-in date.");
      return;
    }

    const guestError = validateGuestSelection(guestData);
    if (guestError) {
      setSearchError(guestError);
      return;
    }

    const params = new URLSearchParams();
    if (destination.trim()) params.set("destination", destination.trim());
    params.set("checkIn", checkIn);
    params.set("checkOut", checkOut);
    params.set("rooms", String(guestData.rooms));
    params.set("adults", String(guestData.adults));
    params.set("children", String(guestData.children));
    if (guestData.childAges.length) params.set("childAges", guestData.childAges.join(","));
    navigate(`/hotels?${params.toString()}`);
  };

  // ===================================================
  // HOME UI
  // ===================================================

  return (
    <div className="home-page">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">

        <div className="nav-container">

          {/* LOGO */}

          <Link to="/" className="logo">

            <img
              src={stayhubLogo}
              alt="STAYHUB"
              style={{
                width: "150px",
                height: "auto",
                display: "block",
              }}
            />

          </Link>

          {/* NAV LINKS */}

          <div className="nav-links">

            <Link to="/">
              Home
            </Link>

            <Link to="/hotels">
              Hotels
            </Link>

            <Link to="/wishlist">
              Wishlist
            </Link>

            <a href="#features">
              Features
            </a>

            <a href="#about">
              About
            </a>

          </div>

          {/* NAV ACTIONS */}

          <div className="nav-actions">

            {user ? (
              <>
                {/* ACCOUNT */}

                <button
                  className="login-btn"
                  onClick={() => navigate("/my-account")}
                >
                  👤 {user.name}
                </button>

                {/* LOGOUT */}

                <button
                  className="signup-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* LOGIN */}

                <button
                  className="login-btn"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>

                {/* SIGN UP */}

                <button
                  className="signup-btn"
                  onClick={() => navigate("/signup")}
                >
                  Sign Up
                </button>
              </>
            )}

          </div>

        </div>

      </nav>

      {/* =================================================
          HERO
      ================================================= */}

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
            Discover comfortable hotels, beautiful destinations
            and unforgettable stays — all in one place.
          </p>

          {/* SEARCH */}

          <div className="search-box">

            {/* DESTINATION */}

            <div className="search-item">

              <label>
                📍 Destination
              </label>

              <input
                type="text"
                placeholder="Where are you going?"
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value)
                }
              />

            </div>

            <div className="search-divider"></div>

            {/* CHECK IN */}

            <div className="search-item">

              <label>
                📅 Check-in
              </label>

              <input
                type="date"
                min={getMinDate()}
                value={checkIn}
                onChange={(e) => {
                  const value = e.target.value;
                  setCheckIn(value);
                  if (checkOut && value >= checkOut) setCheckOut("");
                }}
              />

            </div>

            <div className="search-divider"></div>

            {/* CHECK OUT */}

            <div className="search-item">

              <label>
                📅 Check-out
              </label>

              <input
                type="date"
                min={checkIn ? tomorrowInput(checkIn) : tomorrowInput()}
                disabled={!checkIn}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />

            </div>

            <div className="search-divider"></div>

            {/* GUESTS */}

            <div className="search-item guest-item" style={{ position: "relative" }}>

              <label>
                👥 Guests
              </label>

              <GuestSelector value={guestData} onChange={setGuestData} compact />

            </div>

            {/* SEARCH BUTTON */}

            <button
              className="search-btn"
              onClick={handleSearch}
            >
              Search
            </button>

          </div>

          {searchError && (
            <div style={{ color: "#b91c1c", marginTop: "10px", fontSize: "13px", fontWeight: 600, background: "rgba(255,255,255,.92)", padding: "8px 12px", borderRadius: "8px" }}>
              {searchError}
            </div>
          )}

        </div>

      </section>

      {/* =================================================
          STATS
      ================================================= */}

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

      {/* =================================================
          POPULAR HOTELS
      ================================================= */}

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

          {hotels.slice(0, 3).map((hotel) => (

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

      {/* =================================================
          FEATURES
      ================================================= */}

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

      {/* =================================================
          CTA
      ================================================= */}

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

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">

        <div className="footer-container">

          <div className="footer-brand">

            <Link
              to="/"
              className="logo"
              style={{
                display: "flex",
                alignItems: "center",
              }}
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

            <Link to="/wishlist">
              Wishlist
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

// =====================================================
// MY ACCOUNT PAGE
// =====================================================

function MyAccount() {

  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {

    const savedUser =
      localStorage.getItem("stayhubCurrentUser");

    if (savedUser) {

      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {

        console.error("Invalid user data:", error);

        localStorage.removeItem(
          "stayhubCurrentUser"
        );

      }

    }

  }, []);

  // ===================================================
  // NOT LOGGED IN
  // ===================================================

  if (!user) {

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >

        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "20px",
            textAlign: "center",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
            maxWidth: "420px",
            width: "100%",
          }}
        >

          <div
            style={{
              fontSize: "50px",
              marginBottom: "15px",
            }}
          >
            🔐
          </div>

          <h1>
            Login Required
          </h1>

          <p
            style={{
              color: "#64748b",
              marginBottom: "25px",
            }}
          >
            Please login to view your account details.
          </p>

          <button
            onClick={() => navigate("/login")}
            style={{
              background: "#4f46e5",
              color: "white",
              border: "none",
              padding: "12px 25px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Login
          </button>

        </div>

      </div>
    );
  }

  // ===================================================
  // ACCOUNT LOGOUT
  // ===================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "stayhubCurrentUser"
    );

    localStorage.removeItem(
      "stayhubRememberMe"
    );

    setUser(null);

    navigate("/");

  };

  // ===================================================
  // ACCOUNT PAGE
  // ===================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "50px",
      }}
    >

      {/* ACCOUNT HEADER */}

      <header
        style={{
          background: "#4f46e5",
          padding: "18px 30px",
          color: "white",
        }}
      >

        <div
          style={{
            maxWidth: "1100px",
            margin: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >

          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "24px",
              fontWeight: "700",
            }}
          >
            STAYHUB
          </Link>

          <button
            onClick={() => navigate("/")}
            style={{
              background: "white",
              color: "#4f46e5",
              border: "none",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Home
          </button>

        </div>

      </header>

      {/* ACCOUNT CONTENT */}

      <main
        style={{
          maxWidth: "700px",
          margin: "50px auto",
          padding: "0 20px",
        }}
      >

        <div
          style={{
            background: "white",
            borderRadius: "20px",
            padding: "35px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >

          {/* PROFILE */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "35px",
            }}
          >

            <div
              style={{
                width: "80px",
                height: "80px",
                margin: "0 auto 15px",
                borderRadius: "50%",
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "38px",
              }}
            >
              👤
            </div>

            <h1
              style={{
                margin: "0 0 8px",
                color: "#0f172a",
              }}
            >
              Welcome, {user.name}
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b",
              }}
            >
              Your STAYHUB account
            </p>

          </div>

          {/* USER DETAILS */}

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >

            {/* NAME */}

            <div
              style={{
                padding: "18px 20px",
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >

              <small
                style={{
                  color: "#64748b",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                NAME
              </small>

              <strong>
                {user.name}
              </strong>

            </div>

            {/* LOGIN ID */}

            <div
              style={{
                padding: "18px 20px",
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >

              <small
                style={{
                  color: "#64748b",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                LOGIN ID
              </small>

              <strong>
                {user.loginId || user.id || "N/A"}
              </strong>

            </div>

            {/* EMAIL */}

            <div
              style={{
                padding: "18px 20px",
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >

              <small
                style={{
                  color: "#64748b",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                EMAIL
              </small>

              <strong>
                {user.email}
              </strong>

            </div>

            {/* MOBILE */}

            <div
              style={{
                padding: "18px 20px",
                borderBottom:
                  "1px solid #e2e8f0",
              }}
            >

              <small
                style={{
                  color: "#64748b",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                MOBILE
              </small>

              <strong>
                {user.mobile || "N/A"}
              </strong>

            </div>

            {/* STATUS */}

            <div
              style={{
                padding: "18px 20px",
              }}
            >

              <small
                style={{
                  color: "#64748b",
                  display: "block",
                  marginBottom: "5px",
                }}
              >
                ACCOUNT STATUS
              </small>

              <strong
                style={{
                  color: "#16a34a",
                }}
              >
                ● Logged In
              </strong>

            </div>

          </div>

          {/* BUTTONS */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "25px",
              flexWrap: "wrap",
            }}
          >

            <button
              onClick={() =>
                navigate("/my-bookings")
              }
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "13px",
                border: "none",
                borderRadius: "10px",
                background: "#4f46e5",
                color: "white",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              📋 My Bookings
            </button>

            <button
              onClick={handleLogout}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "13px",
                border:
                  "1px solid #ef4444",
                borderRadius: "10px",
                background: "white",
                color: "#ef4444",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

// =====================================================
// APP
// =====================================================

function App() {

  return (

    <BrowserRouter>

      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* HOTELS */}

        <Route
          path="/hotels"
          element={<Hotels />}
        />

        {/* HOTEL DETAILS */}

        <Route
          path="/hotels/:id"
          element={<HotelDetails />}
        />

        {/* BOOKING */}

        <Route
          path="/booking"
          element={<Booking />}
        />

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route path="/forgot-password" element={<PasswordRecovery />} />
        <Route path="/resend-verification" element={<PasswordRecovery />} />
        <Route path="/reset-password" element={<PasswordRecovery />} />

        {/* SIGNUP */}

        <Route
          path="/signup"
          element={<Signup />}
        />

        {/* MY BOOKINGS */}

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/wishlist"
          element={<Wishlist />}
        />

        {/* MY ACCOUNT */}

        <Route
          path="/my-account"
          element={<MyAccount />}
        />

        {/* ADMIN MODULE - customer UI remains unchanged */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;