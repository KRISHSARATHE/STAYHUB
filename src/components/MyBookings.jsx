import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import stayhubLogo from "../assets/logo.svg";
import { openInvoice } from "../utils/stayhub";
import { apiRequest } from "../utils/api";
function MyBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("stayhubCurrentUser");

    if (!savedUser) {
      alert("Please login to view your bookings.");
      navigate("/login");
      return;
    }

    const user = JSON.parse(savedUser);
    setCurrentUser(user);

    async function loadBookings() {
      try {
        const email = encodeURIComponent(user.email || "");
        const result = await apiRequest(`/bookings?email=${email}`);
        const userBookings = result.data || [];

        setBookings(userBookings);

        // Keep local copy for backward compatibility
        localStorage.setItem(
          "stayhubBookings",
          JSON.stringify(userBookings)
        );
      } catch (error) {
        console.error("Failed to load bookings:", error);

        // Fallback to local bookings if API is unavailable
        const savedBookings =
          JSON.parse(localStorage.getItem("stayhubBookings")) || [];

        setBookings(
          savedBookings
            .filter(
              (booking) =>
                booking.userId === user.id ||
                booking.userId === user.loginId ||
                booking.userEmail?.toLowerCase() === user.email?.toLowerCase()
            )
            .reverse()
        );
      }
    }

    loadBookings();
  }, [navigate]);

  // Cancel booking
  const handleCancel = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return;

    try {
      const result = await apiRequest(
        `/bookings/${encodeURIComponent(bookingId)}/cancel`,
        { method: "PATCH" }
      );

      const updatedBooking = result.data;

      setBookings((prev) => {
        const updated = prev.map((booking) =>
          booking.id === bookingId
            ? updatedBooking || {
                ...booking,
                status: "Cancelled",
                cancelledAt: new Date().toISOString(),
              }
            : booking
        );

        localStorage.setItem("stayhubBookings", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Cancellation failed:", error);
      alert(error.message || "Booking cancellation failed.");
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);

    if (isNaN(d.getTime())) return date;

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Loading / no user
  if (!currentUser) {
    return null;
  }

  return (
    <div className="my-bookings-page">

      {/* ================= HEADER ================= */}

      <header className="bookings-header">

        <Link to="/" className="bookings-logo">
          STAYHUB
        </Link>

        <Link to="/" className="bookings-home">
          ← Back to Home
        </Link>

      </header>

      {/* ================= MAIN ================= */}

      <main className="bookings-main">

        <div className="bookings-title">

          <div>
            <p className="bookings-label">YOUR TRIPS</p>

            <h1>My Bookings</h1>

            <p>
              Manage and view your hotel reservations.
            </p>
          </div>

          <Link to="/hotels" className="book-more-btn">
            + Book Another Stay
          </Link>

        </div>

        {/* ================= WELCOME ================= */}

        <div
          style={{
            marginBottom: "25px",
            padding: "15px 20px",
            borderRadius: "12px",
            background: "#f5f7ff",
            border: "1px solid #e5e7eb",
          }}
        >
          <strong>
            Welcome, {currentUser.name} 👋
          </strong>

          <div
            style={{
              marginTop: "5px",
              color: "#666",
              fontSize: "14px",
            }}
          >
            {bookings.length} booking
            {bookings.length !== 1 ? "s" : ""} found
          </div>
        </div>

        {/* ================= NO BOOKINGS ================= */}

        {bookings.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: "70px 20px",
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
            }}
          >

            <div style={{ fontSize: "55px", marginBottom: "15px" }}>
              
            </div>

            <h2>No bookings yet</h2>

            <p
              style={{
                color: "#666",
                marginTop: "8px",
                marginBottom: "25px",
              }}
            >
              You haven't made any hotel reservations yet.
            </p>

            <Link to="/hotels" className="book-more-btn">
              Find a Hotel
            </Link>

          </div>

        ) : (

          /* ================= BOOKING LIST ================= */

          <div className="booking-list">

            {bookings.map((booking) => (

              <div
                className="my-booking-card"
                key={booking.id}
              >

                {/* HOTEL IMAGE */}

                <img
                  src={
                    booking.image ||
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80"
                  }
                  alt={booking.hotelName || booking.hotel}
                  className="my-booking-image"
                />

                {/* CONTENT */}

                <div className="my-booking-content">

                  {/* TOP ROW */}

                  <div className="booking-top-row">

                    <div>

                      <span
                        className="booking-status"
                        style={{
                          color:
                            booking.status === "Cancelled"
                              ? "#dc2626"
                              : "#16a34a",
                        }}
                      >
                        {booking.status === "Cancelled"
                          ? "✕ Cancelled"
                          : "✓ Confirmed"}
                      </span>

                      <h2>
                        {booking.hotelName || booking.hotel}
                      </h2>

                      <p className="booking-location">
                        📍 {booking.location}
                      </p>

                    </div>

                    <div className="booking-price">

                      <span>Total Amount</span>

                      <strong>
                        ₹
                        {Number(
                          booking.price ?? booking.total ?? 0
                        ).toLocaleString("en-IN")}
                      </strong>

                    </div>

                  </div>

                  {/* DETAILS */}

                  <div className="booking-details-grid">

                    <div>
                      <span>CHECK-IN</span>

                      <strong>
                        {formatDate(booking.checkIn)}
                      </strong>
                    </div>

                    <div>
                      <span>CHECK-OUT</span>

                      <strong>
                        {formatDate(booking.checkOut)}
                      </strong>
                    </div>

                    <div>
                      <span>ROOM</span>

                      <strong>
                        {booking.room || "Deluxe Room"}
                      </strong>
                    </div>

                    <div>
                      <span>GUESTS</span>

                      <strong>
                        {booking.adults != null ? `${booking.adults} Adults${booking.children ? `, ${booking.children} Children` : ""}` : `${booking.guests || 1} Guests`}
                      </strong>
                    </div>

                  </div>

                  {/* EXTRA DETAILS */}

                  <div
                    style={{
                      marginTop: "15px",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "20px",
                      color: "#666",
                      fontSize: "14px",
                    }}
                  >

                    <span>
                      🌙{" "}
                      <strong>
                        {booking.nights || 1}
                      </strong>{" "}
                      Night
                      {(booking.nights || 1) !== 1
                        ? "s"
                        : ""}
                    </span>

                    <span>
                      👤 {booking.name}
                    </span>

                    <span>
                      📞 {booking.phone}
                    </span>

                  </div>

                  {/* BOTTOM */}

                  <div className="booking-bottom">

                    <span className="booking-id">
                      Booking ID:{" "}
                      <strong>{booking.id}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={() => openInvoice(booking)}
                      style={{ border: "1px solid #4f46e5", background: "#fff", color: "#4f46e5", borderRadius: "8px", padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}
                    >
                      Download Bill
                    </button>

                    {booking.status !== "Cancelled" && (
                      <button
                        className="cancel-booking"
                        onClick={() =>
                          handleCancel(booking.id)
                        }
                      >
                        Cancel Booking
                      </button>
                    )}

                    {booking.status === "Cancelled" && (
                      <span
                        style={{
                          color: "#dc2626",
                          fontWeight: "600",
                        }}
                      >
                        Booking Cancelled
                      </span>
                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

      {/* ================= FOOTER ================= */}

      <footer className="bookings-footer">
        © 2026 STAYHUB. All rights reserved.
      </footer>

    </div>
  );
}

export default MyBookings;