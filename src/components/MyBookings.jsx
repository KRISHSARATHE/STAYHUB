
import { Link } from "react-router-dom";

function MyBookings() {
  const bookings = [
    {
      id: "STH-2026-001",
      hotel: "The Grand Palace",
      location: "Indore, Madhya Pradesh",
      checkIn: "15 Sep 2026",
      checkOut: "17 Sep 2026",
      guests: 2,
      room: "Deluxe Room",
      total: 4998,
      status: "Confirmed",
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="my-bookings-page">

      <header className="bookings-header">
        <Link to="/" className="bookings-logo">
          🏨 STAYHUB
        </Link>

        <Link to="/" className="bookings-home">
          ← Back to Home
        </Link>
      </header>

      <main className="bookings-main">

        <div className="bookings-title">
          <div>
            <p className="bookings-label">YOUR TRIPS</p>
            <h1>My Bookings</h1>
            <p>Manage and view your hotel reservations.</p>
          </div>

          <Link to="/hotels" className="book-more-btn">
            + Book Another Stay
          </Link>
        </div>

        <div className="booking-list">

          {bookings.map((booking) => (
            <div className="my-booking-card" key={booking.id}>

              <img
                src={booking.image}
                alt={booking.hotel}
                className="my-booking-image"
              />

              <div className="my-booking-content">

                <div className="booking-top-row">
                  <div>
                    <span className="booking-status">
                      ✓ {booking.status}
                    </span>

                    <h2>{booking.hotel}</h2>

                    <p className="booking-location">
                      📍 {booking.location}
                    </p>
                  </div>

                  <div className="booking-price">
                    <span>Total Amount</span>
                    <strong>₹{booking.total.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="booking-details-grid">

                  <div>
                    <span>CHECK-IN</span>
                    <strong>{booking.checkIn}</strong>
                  </div>

                  <div>
                    <span>CHECK-OUT</span>
                    <strong>{booking.checkOut}</strong>
                  </div>

                  <div>
                    <span>ROOM</span>
                    <strong>{booking.room}</strong>
                  </div>

                  <div>
                    <span>GUESTS</span>
                    <strong>{booking.guests} Guests</strong>
                  </div>

                </div>

                <div className="booking-bottom">

                  <span className="booking-id">
                    Booking ID: <strong>{booking.id}</strong>
                  </span>

                  <button
                    className="cancel-booking"
                    onClick={() =>
                      alert("Cancellation feature will be added soon.")
                    }
                  >
                    Cancel Booking
                  </button>

                </div>

              </div>
            </div>
          ))}

        </div>

      </main>

      <footer className="bookings-footer">
        © 2026 STAYHUB. All rights reserved.
      </footer>

    </div>
  );
}

export default MyBookings;

