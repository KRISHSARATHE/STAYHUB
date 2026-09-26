import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";
import { apiRequest } from "../utils/api";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview");
  const [statsData, setStatsData] = useState({
    hotels: 0,
    bookings: 0,
    users: 0,
    revenue: 0,
  });

  const [hotels, setHotels] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showHotelForm, setShowHotelForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);

  const [hotelForm, setHotelForm] = useState({
    name: "",
    location: "",
    category: "Budget",
    price: "",
    rating: "",
    image: "",
    description: "",
  });

  const getSession = () => {
    try {
      return JSON.parse(localStorage.getItem("stayhubAdminSession")) || null;
    } catch {
      return null;
    }
  };

  const adminRequest = async (endpoint, options = {}) => {
    const session = getSession();

    if (!session?.token) {
      navigate("/admin/login", { replace: true });
      throw new Error("Admin session expired.");
    }

    return apiRequest(endpoint, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${session.token}`,
      },
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [stats, hotelResult, bookingResult, userResult] =
        await Promise.all([
          adminRequest("/admin/stats"),
          adminRequest("/admin/hotels"),
          adminRequest("/admin/bookings"),
          adminRequest("/admin/users"),
        ]);

      setStatsData(stats.data || {});
      setHotels(hotelResult.data || []);
      setBookings(bookingResult.data || []);
      setUsers(userResult.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const session = getSession();

    if (!session?.email || !session?.token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    loadData();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("stayhubAdminSession");
    navigate("/admin/login", { replace: true });
  };

  const openAdd = () => {
    setEditingHotel(null);
    setHotelForm({
      name: "",
      location: "",
      category: "Budget",
      price: "",
      rating: "",
      image: "",
      description: "",
    });
    setShowHotelForm(true);
  };

  const openEdit = (hotel) => {
    setEditingHotel(hotel.id);
    setHotelForm({
      name: hotel.name || "",
      location: hotel.location || "",
      category: hotel.category || "Budget",
      price: hotel.price || "",
      rating: hotel.rating || "",
      image: hotel.image || "",
      description: hotel.description || "",
    });
    setShowHotelForm(true);
  };

  const saveHotel = async (e) => {
    e.preventDefault();

    const payload = {
      name: hotelForm.name.trim(),
      location: hotelForm.location.trim(),
      category: hotelForm.category,
      price: Number(hotelForm.price),
      rating: Number(hotelForm.rating),
      image:
        hotelForm.image.trim() ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
      description:
        hotelForm.description.trim() ||
        "Comfortable stay with modern facilities.",
      totalRooms: 20,
      isActive: true,
    };

    if (
      !payload.name ||
      !payload.location ||
      payload.price <= 0 ||
      payload.rating <= 0
    ) {
      alert("Please enter valid hotel details.");
      return;
    }

    try {
      if (editingHotel) {
        const result = await adminRequest(`/admin/hotels/${editingHotel}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });

        const updatedHotel = result.data;

        setHotels((prev) =>
          prev.map((hotel) =>
            Number(hotel.id) === Number(editingHotel)
              ? updatedHotel
              : hotel
          )
        );
      } else {
        const result = await adminRequest("/admin/hotels", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const newHotel = result.data;
        setHotels((prev) => [...prev, newHotel]);
      }

      setShowHotelForm(false);
    } catch (err) {
      console.error("Hotel save error:", err);
      alert(`Failed to save hotel: ${err.message || "Unknown error"}`);
    }
  };

  const toggleHotel = async (hotel) => {
    try {
      if (hotel.isActive !== false) {
        await adminRequest(`/admin/hotels/${hotel.id}`, {
          method: "DELETE",
        });
      } else {
        await adminRequest(`/admin/hotels/${hotel.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: hotel.name,
            location: hotel.location,
            category: hotel.category,
            price: Number(hotel.price),
            rating: Number(hotel.rating),
            image: hotel.image,
            description: hotel.description,
            totalRooms: Number(hotel.totalRooms || 20),
            isActive: true,
          }),
        });
      }

      await loadData();
    } catch (err) {
      alert(err.message || "Failed to update hotel.");
    }
  };

  const cancelBooking = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      await adminRequest(`/bookings/${encodeURIComponent(id)}/cancel`, {
        method: "PATCH",
      });

      await loadData();
    } catch (err) {
      alert(err.message || "Failed to cancel booking.");
    }
  };

  const stats = [
    {
      label: "Total Hotels",
      value: hotels.length,
      icon: "��",
    },
    {
      label: "Active Hotels",
      value: statsData.hotels ?? 0,
      icon: "✅",
    },
    {
      label: "Bookings",
      value: statsData.bookings ?? 0,
      icon: "📋",
    },
    {
      label: "Users",
      value: statsData.users ?? 0,
      icon: "👥",
    },
    {
      label: "Revenue",
      value: `₹${Number(statsData.revenue || 0).toLocaleString("en-IN")}`,
      icon: "₹",
    },
  ];

  const session = getSession();

  return (
    <div className="admin-page">
      <header className="navbar admin-navbar">
        <div className="nav-container">
          <Link to="/" className="logo admin-logo-link">
            <img src={logo} alt="STAYHUB" />
          </Link>

          <div className="nav-links admin-main-links">
            <button
              className={`admin-nav-link ${
                tab === "overview" ? "active" : ""
              }`}
              onClick={() => setTab("overview")}
            >
              Dashboard
            </button>

            <button
              className={`admin-nav-link ${
                tab === "hotels" ? "active" : ""
              }`}
              onClick={() => setTab("hotels")}
            >
              Hotels
            </button>

            <button
              className={`admin-nav-link ${
                tab === "bookings" ? "active" : ""
              }`}
              onClick={() => setTab("bookings")}
            >
              Bookings
            </button>

            <button
              className={`admin-nav-link ${
                tab === "users" ? "active" : ""
              }`}
              onClick={() => setTab("users")}
            >
              Users
            </button>
          </div>

          <div className="nav-actions">
            <Link to="/" className="login-btn">
              View Website
            </Link>

            <button onClick={logout} className="signup-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-layout admin-layout-no-sidebar">
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <div className="admin-kicker">STAYHUB ADMIN</div>

              <h1>
                {tab === "overview"
                  ? "Dashboard Overview"
                  : tab[0].toUpperCase() + tab.slice(1)}
              </h1>

              <p className="admin-muted">
                Manage your booking platform from one place.
              </p>
            </div>

            <button
              onClick={loadData}
              className="admin-outline-btn"
            >
              ↻ Refresh
            </button>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "12px 15px",
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <section className="admin-panel">
              <div
                className="admin-empty"
                style={{ padding: "70px 20px" }}
              >
                Loading admin data...
              </div>
            </section>
          ) : (
            <>
              {tab === "overview" && (
                <>
                  <div className="admin-stats-grid">
                    {stats.map((item) => (
                      <div
                        className="admin-stat-card"
                        key={item.label}
                      >
                        <div className="admin-stat-icon">
                          {item.icon}
                        </div>

                        <div>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>

                  <section className="admin-panel">
                    <div className="admin-panel-head">
                      <div>
                        <h2>Recent Bookings</h2>
                        <p>
                          Latest reservations recorded by STAYHUB.
                        </p>
                      </div>

                      <button
                        className="admin-text-btn"
                        onClick={() => setTab("bookings")}
                      >
                        View all →
                      </button>
                    </div>

                    <div className="admin-table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Booking ID</th>
                            <th>Guest</th>
                            <th>Hotel</th>
                            <th>Stay</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                        </thead>

                        <tbody>
                          {bookings.slice(0, 6).map((booking) => (
                            <tr key={booking.id}>
                              <td>{booking.id}</td>
                              <td>
                                {booking.name ||
                                  booking.guestName ||
                                  "-"}
                              </td>

                              <td>
                                {booking.hotelName ||
                                  booking.hotel ||
                                  "-"}
                              </td>

                              <td>
                                {booking.checkIn || "-"} →{" "}
                                {booking.checkOut || "-"}
                              </td>

                              <td>
                                ₹
                                {Number(
                                  booking.total ??
                                    booking.price ??
                                    0
                                ).toLocaleString("en-IN")}
                              </td>

                              <td>
                                <span
                                  className={`admin-status ${
                                    booking.status === "Cancelled"
                                      ? "cancelled"
                                      : "confirmed"
                                  }`}
                                >
                                  {booking.status || "Confirmed"}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {!bookings.length && (
                            <tr>
                              <td
                                colSpan="6"
                                className="admin-empty"
                              >
                                No bookings found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {tab === "hotels" && (
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <h2>Hotel Management</h2>
                      <p>
                        Manage hotels directly from PostgreSQL.
                      </p>
                    </div>

                    <button
                      className="admin-primary-btn"
                      onClick={openAdd}
                    >
                      + Add Hotel
                    </button>
                  </div>

                  <div className="admin-hotel-list">
                    {hotels.map((hotel) => {
                      const active = hotel.isActive !== false;

                      return (
                        <div
                          className="admin-hotel-row"
                          key={hotel.id}
                        >
                          <img
                            src={hotel.image}
                            alt=""
                          />

                          <div className="admin-hotel-info">
                            <strong>{hotel.name}</strong>

                            <span>
                              {hotel.location} ·{" "}
                              {hotel.category} · ₹
                              {Number(
                                hotel.price
                              ).toLocaleString(
                                "en-IN"
                              )}
                              /night
                            </span>
                          </div>

                          <span
                            className={`admin-status ${
                              active
                                ? "confirmed"
                                : "cancelled"
                            }`}
                          >
                            {active ? "Active" : "Hidden"}
                          </span>

                          <button
                            className="admin-outline-btn"
                            onClick={() =>
                              openEdit(hotel)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="admin-danger-btn"
                            onClick={() =>
                              toggleHotel(hotel)
                            }
                          >
                            {active ? "Hide" : "Show"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {tab === "bookings" && (
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <h2>Booking Management</h2>
                      <p>
                        Review and manage customer reservations.
                      </p>
                    </div>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>Guest</th>
                          <th>Hotel</th>
                          <th>Dates</th>
                          <th>Guests</th>
                          <th>Total</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td>{booking.id}</td>

                            <td>
                              {booking.name ||
                                booking.guestName ||
                                "-"}
                            </td>

                            <td>
                              {booking.hotelName ||
                                booking.hotel ||
                                "-"}
                            </td>

                            <td>
                              {booking.checkIn || "-"} →{" "}
                              {booking.checkOut || "-"}
                            </td>

                            <td>
                              {booking.rooms || 1} room ·{" "}
                              {booking.adults ??
                                booking.guests ??
                                1}{" "}
                              adults
                              {booking.children
                                ? ` · ${booking.children} children`
                                : ""}
                            </td>

                            <td>
                              ₹
                              {Number(
                                booking.total ??
                                  booking.price ??
                                  0
                              ).toLocaleString("en-IN")}
                            </td>

                            <td>
                              <span
                                className={`admin-status ${
                                  booking.status ===
                                  "Cancelled"
                                    ? "cancelled"
                                    : "confirmed"
                                }`}
                              >
                                {booking.status ||
                                  "Confirmed"}
                              </span>
                            </td>

                            <td>
                              {booking.status !==
                              "Cancelled" ? (
                                <button
                                  className="admin-danger-btn"
                                  onClick={() =>
                                    cancelBooking(
                                      booking.id
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              ) : (
                                <span className="admin-muted">
                                  Closed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {!bookings.length && (
                          <tr>
                            <td
                              colSpan="8"
                              className="admin-empty"
                            >
                              No bookings found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {tab === "users" && (
                <section className="admin-panel">
                  <div className="admin-panel-head">
                    <div>
                      <h2>User Management</h2>
                      <p>
                        Registered STAYHUB users from PostgreSQL.
                      </p>
                    </div>
                  </div>

                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Mobile</th>
                          <th>Provider</th>
                          <th>Verification</th>
                        </tr>
                      </thead>

                      <tbody>
                        {users.map((user, index) => (
                          <tr
                            key={
                              user.id ||
                              user.email ||
                              index
                            }
                          >
                            <td>{user.name || "-"}</td>

                            <td>{user.email || "-"}</td>

                            <td>
                              {user.phone ||
                                user.mobile ||
                                "-"}
                            </td>

                            <td>
                              {user.provider || "email"}
                            </td>

                            <td>
                              <span
                                className={`admin-status ${
                                  user.verified ||
                                  user.emailVerified
                                    ? "confirmed"
                                    : "pending"
                                }`}
                              >
                                {user.verified ||
                                user.emailVerified
                                  ? "Verified"
                                  : "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {!users.length && (
                          <tr>
                            <td
                              colSpan="5"
                              className="admin-empty"
                            >
                              No users found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {showHotelForm && (
        <div
          className="admin-modal-backdrop"
          onMouseDown={() => setShowHotelForm(false)}
        >
          <div
            className="admin-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="admin-panel-head">
              <div>
                <h2>
                  {editingHotel
                    ? "Edit Hotel"
                    : "Add Hotel"}
                </h2>

                <p>
                  Changes are saved directly to PostgreSQL.
                </p>
              </div>

              <button
                className="admin-icon-btn"
                onClick={() =>
                  setShowHotelForm(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={saveHotel}
              className="admin-grid-form"
            >
              <label>
                Hotel Name
                <input
                  value={hotelForm.name}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Location
                <input
                  value={hotelForm.location}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      location: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={hotelForm.category}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      category: e.target.value,
                    })
                  }
                >
                  <option>Budget</option>
                  <option>Premium</option>
                  <option>Luxury</option>
                  <option>Resort</option>
                </select>
              </label>

              <label>
                Price / night
                <input
                  type="number"
                  min="1"
                  value={hotelForm.price}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      price: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Rating
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={hotelForm.rating}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      rating: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Image URL
                <input
                  value={hotelForm.image}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      image: e.target.value,
                    })
                  }
                />
              </label>

              <label className="full">
                Description
                <textarea
                  rows="4"
                  value={hotelForm.description}
                  onChange={(e) =>
                    setHotelForm({
                      ...hotelForm,
                      description: e.target.value,
                    })
                  }
                />
              </label>

              <div className="admin-modal-actions full">
                <button
                  type="button"
                  className="admin-outline-btn"
                  onClick={() =>
                    setShowHotelForm(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-primary-btn"
                >
                  Save Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
