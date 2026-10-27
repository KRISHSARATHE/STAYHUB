import { safeHotelImage, handleHotelImageError } from "../utils/hotelImage.js";
import { apiRequest, checkHotelbedsRate, fetchHotelbedsSearch } from "../utils/api";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const stayhubLogo = "/stayhub-logo.svg";
import GuestSelector from "./GuestSelector";
import { getMinDate, tomorrowInput, calculateNights as getNights, validateGuestSelection, openInvoice } from "../utils/stayhub";

// ======================================================
// HOTEL DATA
// ======================================================

;

// ======================================================
// BOOKING COMPONENT
// ======================================================

function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hotelId = Number(searchParams.get("hotel"));

  const selectedCheckIn = searchParams.get("checkIn") || "";
  const selectedCheckOut = searchParams.get("checkOut") || "";
  const selectedRooms = Number(searchParams.get("rooms") || 1);
  const selectedAdults = Number(searchParams.get("adults") || searchParams.get("guests") || 2);
  const selectedChildren = Number(searchParams.get("children") || 0);
  const selectedAges = (searchParams.get("childAges") || "").split(",").filter(Boolean).map(Number);
  const hotelbedsRateKey = ""; // Local catalogue/demo bookings only

  const [hotels, setHotels] = useState([]);
  const [hotelLoading, setHotelLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);

  // ====================================================
  // LOAD HOTEL FROM POSTGRESQL API
  // ====================================================

  useEffect(() => {
    let active = true;

    async function loadHotel() {
      try {
        const result = await apiRequest("/hotels");
        const data = result.data || [];

        if (active) {
          setHotels(data);
        }
      } catch (error) {
        console.error("Failed to load hotel:", error);

        if (active) {
          setHotels([]);
        }
      } finally {
        if (active) {
          setHotelLoading(false);
        }
      }
    }

    loadHotel();

    return () => {
      active = false;
    };
  }, []);

  const hotel = hotels.find((item) => item.id === hotelId);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    checkIn: selectedCheckIn,
    checkOut: selectedCheckOut,
    rooms: selectedRooms,
    adults: selectedAdults,
    children: selectedChildren,
    childAges: Array.from({ length: selectedChildren }, (_, index) => selectedAges[index] ?? 8),
    extraBeds: 0,
  });
  const [verified, setVerified] = useState(false);
  const [liveBookingRate, setLiveBookingRate] = useState({
    loading: false,
    available: false,
    total: 0,
    rateKey: "",
  });

  useEffect(() => {
    let active = true;

    async function loadBookingRate() {
      if (!hotelbedsRateKey || !hotel || !selectedCheckIn ||
          !selectedCheckOut || selectedCheckOut <= selectedCheckIn) {
        setLiveBookingRate({
          loading: false, available: false, total: 0, rateKey: "",
        });
        return;
      }

      setLiveBookingRate({
        loading: true, available: false, total: 0, rateKey: "",
      });

      try {
        const destination = String(hotel.location || "").split(",")[0].trim();
        const rows = await fetchHotelbedsSearch({
          destination,
          checkIn: selectedCheckIn,
          checkOut: selectedCheckOut,
          rooms: formData.rooms,
          adults: formData.adults,
          children: formData.children,
          childAges: formData.childAges.join(","),
        });

        const list = Array.isArray(rows) ? rows : [];
        // Match live rates only through the explicit Hotelbeds code.
        // Local database IDs and hotel names are not provider identifiers.
        const mappedHotelbedsCode = Number(hotel.hotelbeds_code);
        const matched = Number.isInteger(mappedHotelbedsCode) &&
          mappedHotelbedsCode > 0
          ? list.find(
              (row) =>
                Number(row.hotelbedsCode) === mappedHotelbedsCode
            )
          : undefined;

        const rates = Array.isArray(matched?.rates)
          ? matched.rates
              .filter((rate) => Number(rate.net) > 0 && rate.rateKey)
              .sort((a, b) => Number(a.net) - Number(b.net))
          : [];

        const chosen =
          rates.find((rate) => String(rate.rateKey) === hotelbedsRateKey) ||
          rates[0];

        if (!matched || !chosen) {
          if (active) setLiveBookingRate({
            loading: false, available: false, total: 0, rateKey: "",
          });
          return;
        }

        let total = Number(chosen.sellingRate || chosen.net);
        const currency = String(matched.currency || "EUR").toUpperCase();

        if (!Number.isFinite(total) || total <= 0) {
          if (active) setLiveBookingRate({
            loading: false, available: false, total: 0, rateKey: "",
          });
          return;
        }

        if (currency !== "INR") {
          const response = await fetch(
            "https://open.er-api.com/v6/latest/" + encodeURIComponent(currency)
          );
          if (!response.ok) throw new Error("Currency conversion unavailable.");

          const conversion = await response.json();
          const inrRate = Number(conversion?.rates?.INR);
          if (!Number.isFinite(inrRate) || inrRate <= 0) {
            throw new Error("Invalid INR conversion rate.");
          }
          total *= inrRate;
        }

        if (active) setLiveBookingRate({
          loading: false,
          available: true,
          total,
          rateKey: chosen.rateKey || "",
        });
      } catch (error) {
        console.error("Booking live-rate lookup failed:", error);
        if (active) setLiveBookingRate({
          loading: false, available: false, total: 0, rateKey: "",
        });
      }
    }

    loadBookingRate();
    return () => { active = false; };
  }, [
    hotelbedsRateKey,
    hotel?.id,
    hotel?.name,
    hotel?.location,
    selectedCheckIn,
    selectedCheckOut,
    formData.rooms,
    formData.adults,
    formData.children,
    formData.childAges.join(","),
  ]);

  // Coupon + demo payment
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [couponMessage, setCouponMessage] = useState("");

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
  // HOTEL LOADING
  // ====================================================

  if (hotelLoading) {
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
          <h2>Loading hotel...</h2>
          <p style={{ color: "#64748b" }}>
            Please wait while we load the hotel details.
          </p>
        </div>
      </div>
    );
  }

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

  const calculateNights = () => getNights(formData.checkIn, formData.checkOut);

  const nights = calculateNights();

  const roomSubtotal = hotelbedsRateKey
    ? (liveBookingRate.available ? liveBookingRate.total : 0)
    : (
        nights > 0 && Number(hotel.price) > 0
          ? nights * Number(hotel.price) * Number(formData.rooms || 1)
          : 0
      );

  const maxExtraBeds = Math.min(Number(formData.rooms || 1), formData.childAges.filter(age => age !== "" && Number(age) < 12).length);
  const extraBeds = Math.min(Number(formData.extraBeds || 0), maxExtraBeds);
  const extraBedAmount = extraBeds * 800 * Math.max(0, nights);

  const priceIsAvailable = hotelbedsRateKey
    ? liveBookingRate.available && liveBookingRate.total > 0
    : Number(hotel.price) > 0 && nights > 0;

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "percent"
      ? Math.min(
          roomSubtotal,
          roomSubtotal * appliedCoupon.value / 100
        )
      : Math.min(roomSubtotal, appliedCoupon.value)
    : 0;

  const totalAmount = Math.max(
    0,
    roomSubtotal + extraBedAmount - discountAmount
  );

  const applyCoupon = () => {
    const code = couponCode.trim().toUpperCase();

    const coupons = {
      STAY10: {
        code: "STAY10",
        type: "percent",
        value: 10,
        label: "10% OFF",
      },
      STAY500: {
        code: "STAY500",
        type: "flat",
        value: 500,
        label: "₹500 OFF",
      },
      WELCOME15: {
        code: "WELCOME15",
        type: "percent",
        value: 15,
        label: "15% OFF",
      },
    };

    if (!code) {
      setAppliedCoupon(null);
      setCouponMessage("Enter a coupon code.");
      return;
    }

    if (!coupons[code]) {
      setAppliedCoupon(null);
      setCouponMessage("Invalid coupon code.");
      return;
    }

    setAppliedCoupon(coupons[code]);
    setCouponMessage(`✓ ${coupons[code].label} applied successfully.`);
  };

  // ====================================================
  // SUBMIT BOOKING
  // ====================================================

  const handleSubmit = async (e) => {
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

    const guestError = validateGuestSelection(formData);
    if (guestError) {
      alert(guestError);
      return;
    }

    if (!verified) {
      alert("Please confirm that your booking details are correct.");
      return;
    }

    // ----------------------------------------------
    // HOTELBEDS SAFETY GUARD
    // Supplier booking is not connected end-to-end yet.
    if (hotelbedsRateKey) {
      alert(
        "This live Hotelbeds rate cannot be booked through STAYHUB yet. " +
        "No supplier reservation or payment has been made. " +
        "Please go back and choose a locally bookable catalogue option."
      );
      return;
    }

    // Prevent zero-price or unavailable-price bookings.
    if (
      !priceIsAvailable ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      alert("Booking unavailable: a valid hotel price is required.");
      return;
    }

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

      provider: hotelbedsRateKey ? "hotelbeds" : "local",
      hotelbedsRateKey: hotelbedsRateKey || "",

      image: hotel.image,

      name: formData.name.trim(),

      email: formData.email.trim(),

      phone: phone,

      checkIn: formData.checkIn,

      checkOut: formData.checkOut,

      rooms: Number(formData.rooms),
      adults: Number(formData.adults),
      children: Number(formData.children),
      childAges: formData.childAges,
      guestType: formData.guestType || "Family",
      guests: Number(formData.adults) + Number(formData.children),
      nights,
      roomAmount: roomSubtotal,
      extraBeds,
      extraBedRate: 800,
      extraBedAmount,
      serviceFee: 0,
      tax: 0,
      discount: discountAmount,
      couponCode: appliedCoupon?.code || couponCode.trim().toUpperCase() || "",
      total: totalAmount,
      price: totalAmount,
      paymentMethod,
      room: "Deluxe Room",
      status: "Confirmed",

      bookedAt:
        new Date().toISOString(),
    };
    // ----------------------------------------------
    // SAVE BOOKING TO POSTGRESQL API
    // ----------------------------------------------

    try {
      const result = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...booking,
          userEmail: user.email || formData.email,
          provider: user.provider || "email",
          verified: true,
          couponCode: appliedCoupon?.code || couponCode.trim().toUpperCase() || "",
          paymentMethod,
        }),
      });

      const savedBooking = result.data || booking;

      // Keep local copy for backward compatibility
      const existingBookings =
        JSON.parse(localStorage.getItem("stayhubBookings") || "[]");

      const mergedBookings = [
        ...existingBookings.filter((item) => item.id !== savedBooking.id),
        savedBooking,
      ];

      localStorage.setItem(
        "stayhubBookings",
        JSON.stringify(mergedBookings)
      );

      setConfirmedBooking(savedBooking);
    } catch (error) {
      console.error("Booking API error:", error);
      alert(error.message || "Booking could not be saved.");
      return;
    }

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
              Demo Booking Confirmed!
            </h1>

            <p
              style={{
                color: "#64748b",
              }}
            >
              Your demo hotel reservation has been
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
              src={safeHotelImage(confirmedBooking.image)} onError={handleHotelImageError}
              alt={confirmedBooking.hotelName}
              loading="lazy"
              decoding="async"
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
              <small>ROOMS</small>
              <strong style={{ display: "block", marginTop: "5px" }}>
                {confirmedBooking.rooms}
              </strong>
            </div>

            <div>
              <small>ADULTS / CHILDREN</small>
              <strong style={{ display: "block", marginTop: "5px" }}>
                {confirmedBooking.adults} / {confirmedBooking.children}
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
            <button
              type="button"
              onClick={() => openInvoice(confirmedBooking)}
              style={{
                flex: "1",
                minWidth: "180px",
                textAlign: "center",
                padding: "14px",
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Download Bill (PDF)
            </button>

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
                  min={getMinDate()}
                  value={formData.checkIn}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({ ...prev, checkIn: value, checkOut: prev.checkOut && prev.checkOut > value ? prev.checkOut : "" }));
                  }}
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
                  min={formData.checkIn ? tomorrowInput(formData.checkIn) : tomorrowInput()}
                  disabled={!formData.checkIn}
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

            <div style={{ marginTop: "18px", position: "relative" }}>
              <label style={{ display: "block", marginBottom: "7px", fontWeight: "600" }}>
                Number of Guests
              </label>
              <div style={{ border: "1px solid #d1d5db", borderRadius: "9px", padding: "0 13px" }}>
                <GuestSelector
                  value={{ rooms: formData.rooms, adults: formData.adults, children: formData.children, childAges: formData.childAges, guestType: formData.guestType }}
                  onChange={(value) => setFormData((prev) => ({ ...prev, ...value }))}
                />
              </div>
            </div>

            
            {/* COUPON */}

            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                background: "#fafafa",
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Coupon Code
              </label>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponMessage("");
                  }}
                  placeholder="Enter coupon"
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "9px",
                    boxSizing: "border-box",
                  }}
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  style={{
                    border: "none",
                    borderRadius: "9px",
                    padding: "0 16px",
                    background: "#111827",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Apply
                </button>
              </div>

              {couponMessage && (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "13px",
                    color: appliedCoupon ? "#16a34a" : "#dc2626",
                    fontWeight: "600",
                  }}
                >
                  {couponMessage}
                </p>
              )}

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                Try: STAY10, STAY500 or WELCOME15
              </p>
            </div>

            {/* PAYMENT */}

            <div style={{ marginTop: "18px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                }}
              >
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px",
                  border: "1px solid #d1d5db",
                  borderRadius: "9px",
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              >
                <option value="UPI">UPI</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Cash at Hotel">Cash at Hotel</option>
                <option value="Demo Payment">STAYHUB Demo Payment</option>
              </select>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#64748b",
                  fontSize: "12px",
                }}
              >
                🔒 Demo payment mode — no real money is charged.
              </p>
            </div>

<label style={{ display: "flex", gap: "9px", alignItems: "flex-start", marginTop: "18px", color: "#475569", fontSize: "13px", lineHeight: 1.4 }}>
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} required style={{ marginTop: "3px" }} />
              <span>I confirm that my guest, contact and stay details are correct.</span>
            </label>

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
              🔒 Demo payment — no real money is charged
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
                  {hotelbedsRateKey
                    ? liveBookingRate.loading
                      ? "Checking live price..."
                      : priceIsAvailable
                        ? "₹" + (
                            liveBookingRate.total /
                            Math.max(1, nights * Number(formData.rooms || 1))
                          ).toLocaleString("en-IN", { maximumFractionDigits: 0 })
                        : "Price unavailable"
                    : priceIsAvailable
                      ? "₹" + Number(hotel.price).toLocaleString("en-IN")
                      : "Price unavailable"}
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

                <strong>{formData.adults + formData.children}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span>Rooms</span><strong>{formData.rooms}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span>Adults</span><strong>{formData.adults}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}><span>Children</span><strong>{formData.children}</strong></div>


              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:12}}>
                <label htmlFor="stayhub-extra-beds">Extra beds (₹800/night, max 1 per room)</label>
                <select id="stayhub-extra-beds" value={extraBeds} onChange={e=>setFormData(prev=>({...prev,extraBeds:Number(e.target.value)}))} style={{padding:7,border:"1px solid #cbd5e1",borderRadius:8}}>
                  {Array.from({length:maxExtraBeds+1},(_,i)=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              {extraBeds > 0 && <div role="status" aria-live="polite" style={{display:"flex",justifyContent:"space-between",marginBottom:10,color:"#1e40af"}}><span>Extra bed × {extraBeds} × {nights} night(s)</span><strong>₹{extraBedAmount.toLocaleString("en-IN")}</strong></div>}

              {discountAmount > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    color: "#16a34a",
                  }}
                >
                  <span>Coupon Discount</span>
                  <strong>
                    -₹{discountAmount.toLocaleString("en-IN")}
                  </strong>
                </div>
              )}

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
                  {priceIsAvailable
                    ? "₹" + totalAmount.toLocaleString("en-IN", {
                        maximumFractionDigits: 0,
                      })
                    : liveBookingRate.loading
                      ? "Checking..."
                      : "Price unavailable"}
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