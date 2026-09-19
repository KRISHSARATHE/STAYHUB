
import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";

const hotels = [
  { id: 1, name: "The Grand Palace", location: "Indore, Madhya Pradesh", price: 2499 },
  { id: 2, name: "Radisson Blu Hotel Indore", location: "Indore, Madhya Pradesh", price: 3999 },
  { id: 3, name: "Lemon Tree Hotel", location: "Indore, Madhya Pradesh", price: 2899 },
  { id: 4, name: "Sayaji Hotel", location: "Indore, Madhya Pradesh", price: 3499 },
  { id: 5, name: "Royal Heritage Hotel", location: "Jaipur, Rajasthan", price: 3199 },
  { id: 6, name: "Rambagh Palace", location: "Jaipur, Rajasthan", price: 7999 },
  { id: 7, name: "Taj Devi Ratn Resort", location: "Jaipur, Rajasthan", price: 6499 },
  { id: 8, name: "The Oberoi Rajvilas", location: "Jaipur, Rajasthan", price: 8999 },
  { id: 9, name: "Lake View Resort", location: "Udaipur, Rajasthan", price: 3899 },
  { id: 10, name: "The Leela Palace Udaipur", location: "Udaipur, Rajasthan", price: 8499 },
  { id: 11, name: "Trident Udaipur", location: "Udaipur, Rajasthan", price: 5299 },
  { id: 12, name: "Grand Hyatt Goa", location: "Goa", price: 6999 },
  { id: 13, name: "Ocean Breeze Resort", location: "Goa", price: 4299 },
  { id: 14, name: "Golden Tulip Goa", location: "Goa", price: 3699 },
  { id: 15, name: "Mountain Retreat", location: "Manali, Himachal Pradesh", price: 2799 },
  { id: 16, name: "Baragarh Resort & Spa", location: "Manali, Himachal Pradesh", price: 4599 },
  { id: 17, name: "Green Valley Hotel", location: "Lonavala, Maharashtra", price: 2199 },
  { id: 18, name: "Taj Mahal Palace", location: "Mumbai, Maharashtra", price: 7499 },
  { id: 19, name: "The Imperial Hotel", location: "New Delhi", price: 6799 },
  { id: 20, name: "Budget Stay Inn", location: "Bhopal, Madhya Pradesh", price: 1599 },
];

function Booking() {
  const [searchParams] = useSearchParams();

  const hotelId = Number(searchParams.get("hotel"));
  const hotel = hotels.find((item) => item.id === hotelId);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    guests: "1",
  });

  const [confirmed, setConfirmed] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) {
      return 0;
    }

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);

    const difference =
      checkOutDate.getTime() - checkInDate.getTime();

    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();

  const totalAmount =
    nights > 0 ? hotel.price * nights : hotel?.price || 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (nights <= 0) {
      alert("Please select a valid check-in and check-out date.");
      return;
    }

    // Create booking ID
    const bookingId =
      "STH-" +
      new Date().getFullYear() +
      "-" +
      Math.floor(100000 + Math.random() * 900000);

    const data = {
      id: bookingId,
      hotelId: hotel.id,
      hotelName: hotel.name,
      location: hotel.location,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: Number(formData.guests),
      nights: nights,
      price: totalAmount,
      room: "Deluxe Room",
      status: "Confirmed",
    };

    // Get existing bookings
    const existingBookings =
      JSON.parse(localStorage.getItem("stayhubBookings")) || [];

    // Add new booking
    existingBookings.push(data);

    // Save bookings
    localStorage.setItem(
      "stayhubBookings",
      JSON.stringify(existingBookings)
    );

    setBookingData(data);
    setConfirmed(true);
  };

  if (!hotel) {
    return (
      <div className="booking-page">
        <div className="booking-empty">
          <h1>Hotel Not Found</h1>

          <p>
            We couldn't find the hotel you are trying to book.
          </p>

          <Link to="/hotels" className="home-button">
            ← Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  /* ---------------- CONFIRMATION PAGE ---------------- */

  if (confirmed && bookingData) {
    return (
      <div className="booking-page">

        <div className="booking-header">
          <Link to="/hotels" className="back-button">
            ← Back to Hotels
          </Link>

          <div className="booking-logo">
            STAYHUB
          </div>
        </div>

        <div className="booking-container">

          <div className="booking-success">
            <div className="success-icon">
              ✓
            </div>

            <h1>Booking Confirmed!</h1>

            <p>
              Your hotel booking has been successfully confirmed.
            </p>
          </div>

          <div className="booking-card-large">

            <div className="booking-card-title">
              <h2>Booking Details</h2>

              <span className="confirmed-badge">
                Confirmed
              </span>
            </div>

            <div className="booking-details-grid">

              <div className="booking-detail">
                <span>🏨 Hotel</span>
                <strong>{bookingData.hotelName}</strong>
              </div>

              <div className="booking-detail">
                <span>📍 Location</span>
                <strong>{bookingData.location}</strong>
              </div>

              <div className="booking-detail">
                <span>👤 Guest</span>
                <strong>{bookingData.name}</strong>
              </div>

              <div className="booking-detail">
                <span>📧 Email</span>
                <strong>{bookingData.email}</strong>
              </div>

              <div className="booking-detail">
                <span>📱 Mobile</span>
                <strong>{bookingData.phone}</strong>
              </div>

              <div className="booking-detail">
                <span>📅 Check-in</span>
                <strong>{bookingData.checkIn}</strong>
              </div>

              <div className="booking-detail">
                <span>📅 Check-out</span>
                <strong>{bookingData.checkOut}</strong>
              </div>

              <div className="booking-detail">
                <span>🌙 Stay Duration</span>
                <strong>
                  {bookingData.nights}{" "}
                  {bookingData.nights === 1
                    ? "Night"
                    : "Nights"}
                </strong>
              </div>

              <div className="booking-detail">
                <span>👥 Guests</span>
                <strong>{bookingData.guests}</strong>
              </div>

            </div>

            <div className="booking-total-large">

              <div>
                <span>Total Amount</span>

                <small>
                  ₹{hotel.price.toLocaleString("en-IN")} ×{" "}
                  {bookingData.nights}{" "}
                  {bookingData.nights === 1
                    ? "night"
                    : "nights"}
                </small>
              </div>

              <strong>
                ₹{bookingData.price.toLocaleString("en-IN")}
              </strong>

            </div>

            <div className="confirmation-actions">
              <Link to="/my-bookings" className="home-button">
                View My Bookings
              </Link>

              <Link to="/" className="home-button secondary-button">
                Back to Home
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  /* ---------------- BOOKING FORM ---------------- */

  return (
    <div className="booking-page">

      <div className="booking-header">
        <Link
          to={`/hotels/${hotel.id}`}
          className="back-button"
        >
          ← Back to Hotel
        </Link>

        <div className="booking-logo">
          STAYHUB
        </div>
      </div>

      <div className="booking-form-container">

        <div className="booking-form-header">
          <p className="section-label">
            COMPLETE YOUR BOOKING
          </p>

          <h1>Book Your Stay</h1>

          <p>
            Enter your details to confirm your hotel
            reservation.
          </p>
        </div>

        <div className="booking-layout">

          {/* LEFT FORM */}

          <form
            className="booking-form-card"
            onSubmit={handleSubmit}
          >

            <h2>Guest Information</h2>

            <div className="form-group">
              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">
                  Mobile Number
                </label>

                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  maxLength="10"
                  required
                />
              </div>

            </div>

            <h2 className="booking-section-title">
              Stay Details
            </h2>

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="checkIn">
                  Check-in
                </label>

                <input
                  id="checkIn"
                  type="date"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleChange}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkOut">
                  Check-out
                </label>

                <input
                  id="checkOut"
                  type="date"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleChange}
                  min={
                    formData.checkIn ||
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  required
                />
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="guests">
                Number of Guests
              </label>

              <select
                id="guests"
                name="guests"
                value={formData.guests}
                onChange={handleChange}
              >
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5 Guests</option>
                <option value="6">6 Guests</option>
              </select>

            </div>

            <button
              type="submit"
              className="confirm-booking-button"
            >
              Confirm Booking →
            </button>

          </form>

          {/* RIGHT SUMMARY */}

          <div className="booking-summary-card">

            <p className="summary-label">
              YOUR HOTEL
            </p>

            <h2>{hotel.name}</h2>

            <p className="summary-location">
              📍 {hotel.location}
            </p>

            <div className="summary-divider"></div>

            <div className="summary-row">
              <span>Price per night</span>

              <strong>
                ₹{hotel.price.toLocaleString("en-IN")}
              </strong>
            </div>

            <div className="summary-row">
              <span>Stay duration</span>

              <strong>
                {nights > 0
                  ? `${nights} ${
                      nights === 1
                        ? "Night"
                        : "Nights"
                    }`
                  : "Select dates"}
              </strong>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total">

              <span>Total Amount</span>

              <strong>
                ₹{totalAmount.toLocaleString("en-IN")}
              </strong>

            </div>

            <p className="booking-note">
              🔒 Your booking information is secure.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Booking;

