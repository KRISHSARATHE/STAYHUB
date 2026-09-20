import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

const hotels = [
  {
    id: 1,
    name: "The Oberoi Udaivilas",
    location: "Udaipur, Rajasthan",
    category: "Luxury",
    price: 18500,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=85",
    description:
      "A luxurious lakeside stay with beautiful architecture, premium rooms and world-class hospitality.",
  },
  {
    id: 2,
    name: "Taj Lake Palace",
    location: "Udaipur, Rajasthan",
    category: "Luxury",
    price: 22000,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=85",
    description:
      "Iconic luxury accommodation surrounded by the beautiful waters of Lake Pichola.",
  },
  {
    id: 3,
    name: "Taj Palace",
    location: "New Delhi, Delhi",
    category: "Luxury",
    price: 14500,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85",
    description:
      "Premium hotel offering elegant rooms, fine dining and excellent hospitality.",
  },
  {
    id: 4,
    name: "ITC Grand Chola",
    location: "Chennai, Tamil Nadu",
    category: "Luxury",
    price: 12000,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=85",
    description:
      "Grand luxury hotel with spacious rooms, restaurants, pools and premium facilities.",
  },
  {
    id: 5,
    name: "The Leela Palace",
    location: "Bengaluru, Karnataka",
    category: "Luxury",
    price: 13500,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=85",
    description:
      "Elegant palace-inspired hotel with luxury rooms and premium guest services.",
  },
  {
    id: 6,
    name: "Radisson Blu",
    location: "Indore, Madhya Pradesh",
    category: "Premium",
    price: 6500,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1400&q=85",
    description:
      "Comfortable premium stay in Indore with modern rooms and convenient facilities.",
  },
  {
    id: 7,
    name: "Sayaji Hotel",
    location: "Indore, Madhya Pradesh",
    category: "Premium",
    price: 5500,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=85",
    description:
      "Popular premium hotel offering comfortable rooms, dining and modern amenities.",
  },
  {
    id: 8,
    name: "Marriott Hotel",
    location: "Mumbai, Maharashtra",
    category: "Premium",
    price: 9000,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1400&q=85",
    description:
      "Modern premium hotel with stylish rooms, restaurants and business facilities.",
  },
  {
    id: 9,
    name: "Hyatt Regency",
    location: "Mumbai, Maharashtra",
    category: "Premium",
    price: 8500,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1400&q=85",
    description:
      "Premium city accommodation with comfortable rooms and modern amenities.",
  },
  {
    id: 10,
    name: "Novotel",
    location: "Pune, Maharashtra",
    category: "Premium",
    price: 6000,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=85",
    description:
      "Modern hotel offering comfortable rooms and convenient facilities for travellers.",
  },
  {
    id: 11,
    name: "Lemon Tree Hotel",
    location: "Indore, Madhya Pradesh",
    category: "Budget",
    price: 3500,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1560200353-ce0a0e4b2d6e?w=1400&q=85",
    description:
      "Affordable and comfortable accommodation suitable for students and business travellers.",
  },
  {
    id: 12,
    name: "Treebo Trend",
    location: "Bhopal, Madhya Pradesh",
    category: "Budget",
    price: 2200,
    rating: 4.1,
    image:
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1400&q=85",
    description:
      "Budget-friendly stay with clean rooms and essential facilities.",
  },
  {
    id: 13,
    name: "FabHotel Prime",
    location: "Indore, Madhya Pradesh",
    category: "Budget",
    price: 2500,
    rating: 4.0,
    image:
      "https://images.unsplash.com/photo-1594560913095-0dcb7f3f1a9e?w=1400&q=85",
    description:
      "Affordable hotel with modern rooms and essential amenities.",
  },
  {
    id: 14,
    name: "Hotel Lake View",
    location: "Bhopal, Madhya Pradesh",
    category: "Budget",
    price: 2800,
    rating: 4.1,
    image:
      "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1400&q=85",
    description:
      "Comfortable budget stay with convenient location and pleasant surroundings.",
  },
  {
    id: 15,
    name: "Holiday Inn",
    location: "Goa, India",
    category: "Resort",
    price: 7500,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&q=85",
    description:
      "Relaxing resort-style accommodation perfect for a Goa vacation.",
  },
  {
    id: 16,
    name: "Taj Exotica Resort",
    location: "Goa, India",
    category: "Resort",
    price: 11000,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1400&q=85",
    description:
      "Beautiful resort with premium rooms, pools and relaxing surroundings.",
  },
  {
    id: 17,
    name: "The Lalit Resort",
    location: "Goa, India",
    category: "Resort",
    price: 8500,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=1400&q=85",
    description:
      "Peaceful resort accommodation with premium facilities and beautiful views.",
  },
  {
    id: 18,
    name: "Hotel Hill View",
    location: "Manali, Himachal Pradesh",
    category: "Resort",
    price: 4500,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1544986581-efac024faf62?w=1400&q=85",
    description:
      "Scenic mountain stay offering comfortable rooms and beautiful views.",
  },
  {
    id: 19,
    name: "The Himalayan Resort",
    location: "Shimla, Himachal Pradesh",
    category: "Resort",
    price: 6500,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1400&q=85",
    description:
      "Mountain resort with peaceful surroundings and comfortable accommodation.",
  },
  {
    id: 20,
    name: "Hotel Snow Valley",
    location: "Manali, Himachal Pradesh",
    category: "Budget",
    price: 3200,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1400&q=85",
    description:
      "Affordable mountain accommodation ideal for travellers and families.",
  },
];

function Hotels() {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [rating, setRating] = useState("All");

  const locations = [...new Set(hotels.map((hotel) => hotel.location))];

  const filteredHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        hotel.name.toLowerCase().includes(searchText) ||
        hotel.location.toLowerCase().includes(searchText) ||
        hotel.category.toLowerCase().includes(searchText);

      const matchesLocation =
        location === "All" || hotel.location === location;

      const matchesCategory =
        category === "All" || hotel.category === category;

      let matchesPrice = true;

      if (priceRange === "Under ₹3000") {
        matchesPrice = hotel.price < 3000;
      } else if (priceRange === "₹3000 - ₹6000") {
        matchesPrice = hotel.price >= 3000 && hotel.price <= 6000;
      } else if (priceRange === "₹6000 - ₹10000") {
        matchesPrice = hotel.price > 6000 && hotel.price <= 10000;
      } else if (priceRange === "Above ₹10000") {
        matchesPrice = hotel.price > 10000;
      }

      const matchesRating =
        rating === "All" || hotel.rating >= Number(rating);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCategory &&
        matchesPrice &&
        matchesRating
      );
    });
  }, [search, location, category, priceRange, rating]);

  const clearFilters = () => {
    setSearch("");
    setLocation("All");
    setCategory("All");
    setPriceRange("All");
    setRating("All");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
      }}
    >
      {/* ================= HEADER ================= */}
      <header
        style={{
          background:
            "linear-gradient(135deg, #312e81 0%, #4f46e5 55%, #6366f1 100%)",
          color: "white",
          padding: "28px 20px 42px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <Link
            to="/"
            style={{
              color: "white",
              textDecoration: "none",
              fontSize: "14px",
              opacity: 0.9,
            }}
          >
            ← Back to Home
          </Link>

          <h1
            style={{
              margin: "25px 0 8px",
              fontSize: "38px",
              fontWeight: "800",
            }}
          >
            Find Your Perfect Stay
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              opacity: 0.9,
            }}
          >
            Search hotels, resorts and comfortable stays with STAYHUB.
          </p>
        </div>
      </header>

      {/* ================= FILTER SECTION ================= */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "-22px auto 0",
          padding: "0 20px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "20px",
            boxShadow: "0 12px 35px rgba(15, 23, 42, 0.12)",
            border: "1px solid #e2e8f0",
          }}
        >
          {/* SEARCH */}
          <div style={{ marginBottom: "18px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "700",
                marginBottom: "7px",
                fontSize: "14px",
              }}
            >
              Search
            </label>

            <input
              type="text"
              placeholder="Search hotel, city or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 15px",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                outline: "none",
                fontSize: "15px",
              }}
            />
          </div>

          {/* FILTERS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: "14px",
            }}
          >
            {/* LOCATION */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "7px",
                  fontSize: "14px",
                }}
              >
                Location
              </label>

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Locations</option>

                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* CATEGORY */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "7px",
                  fontSize: "14px",
                }}
              >
                Category
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Categories</option>
                <option value="Luxury">Luxury</option>
                <option value="Premium">Premium</option>
                <option value="Budget">Budget</option>
                <option value="Resort">Resort</option>
              </select>
            </div>

            {/* PRICE */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "7px",
                  fontSize: "14px",
                }}
              >
                Price
              </label>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Prices</option>
                <option value="Under ₹3000">Under ₹3,000</option>
                <option value="₹3000 - ₹6000">₹3,000 - ₹6,000</option>
                <option value="₹6000 - ₹10000">₹6,000 - ₹10,000</option>
                <option value="Above ₹10000">Above ₹10,000</option>
              </select>
            </div>

            {/* RATING */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "700",
                  marginBottom: "7px",
                  fontSize: "14px",
                }}
              >
                Rating
              </label>

              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={selectStyle}
              >
                <option value="All">All Ratings</option>
                <option value="4.5">4.5+ Rating</option>
                <option value="4.0">4.0+ Rating</option>
                <option value="3.5">3.5+ Rating</option>
              </select>
            </div>
          </div>

          {/* CLEAR */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            <span
              style={{
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {filteredHotels.length} stays found
            </span>

            <button
              onClick={clearFilters}
              style={{
                border: "1px solid #cbd5e1",
                background: "white",
                color: "#334155",
                padding: "9px 16px",
                borderRadius: "9px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </section>

      {/* ================= HOTEL LIST ================= */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "35px 20px 60px",
        }}
      >
        {filteredHotels.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: "18px",
              padding: "60px 20px",
              textAlign: "center",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "50px", marginBottom: "15px" }}>
              🔍
            </div>

            <h2 style={{ margin: "0 0 8px" }}>No stays found</h2>

            <p style={{ color: "#64748b", marginBottom: "20px" }}>
              Try changing your search or filters.
            </p>

            <button
              onClick={clearFilters}
              style={{
                background: "#4f46e5",
                color: "white",
                border: "none",
                padding: "12px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredHotels.map((hotel) => (
              <div
                key={hotel.id}
                style={{
                  background: "white",
                  borderRadius: "18px",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 25px rgba(15, 23, 42, 0.07)",
                  transition: "transform 0.2s ease",
                }}
              >
                {/* IMAGE */}
                <div
                  style={{
                    position: "relative",
                    height: "210px",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />

                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: "rgba(15, 23, 42, 0.82)",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {hotel.category}
                  </span>

                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "white",
                      color: "#0f172a",
                      padding: "6px 9px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  >
                    ⭐ {hotel.rating}
                  </span>
                </div>

                {/* CONTENT */}
                <div style={{ padding: "18px" }}>
                  <h2
                    style={{
                      margin: "0 0 7px",
                      fontSize: "20px",
                      lineHeight: 1.25,
                    }}
                  >
                    {hotel.name}
                  </h2>

                  <div
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      marginBottom: "12px",
                    }}
                  >
                    📍 {hotel.location}
                  </div>

                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      lineHeight: 1.55,
                      margin: "0 0 17px",
                    }}
                  >
                    {hotel.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "end",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        Starting from
                      </div>

                      <div
                        style={{
                          fontSize: "21px",
                          fontWeight: "800",
                          color: "#111827",
                        }}
                      >
                        ₹{hotel.price.toLocaleString("en-IN")}
                      </div>

                      <div
                        style={{
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        per night
                      </div>
                    </div>

                    <Link
                      to={`/hotels/${hotel.id}`}
                      style={{
                        background: "#4f46e5",
                        color: "white",
                        textDecoration: "none",
                        padding: "11px 16px",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "14px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= FOOTER ================= */}
      <footer
        style={{
          background: "#0f172a",
          color: "white",
          textAlign: "center",
          padding: "25px 20px",
        }}
      >
        <div style={{ fontWeight: "800", fontSize: "20px" }}>
          STAYHUB
        </div>

        <p
          style={{
            margin: "7px 0 0",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Find. Book. Stay.
        </p>
      </footer>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "white",
  color: "#0f172a",
  fontSize: "14px",
  outline: "none",
};

export default Hotels;