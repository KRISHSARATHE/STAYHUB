
import { Link, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";

const hotels = [
  {
    id: 1,
    name: "The Grand Palace",
    location: "Indore, Madhya Pradesh",
    price: 2499,
    rating: 4.8,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    name: "Radisson Blu Hotel Indore",
    location: "Indore, Madhya Pradesh",
    price: 3999,
    rating: 4.7,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 3,
    name: "Lemon Tree Hotel",
    location: "Indore, Madhya Pradesh",
    price: 2899,
    rating: 4.5,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    name: "Sayaji Hotel",
    location: "Indore, Madhya Pradesh",
    price: 3499,
    rating: 4.6,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 5,
    name: "Royal Heritage Hotel",
    location: "Jaipur, Rajasthan",
    price: 3199,
    rating: 4.7,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 6,
    name: "Rambagh Palace",
    location: "Jaipur, Rajasthan",
    price: 7999,
    rating: 4.9,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 7,
    name: "Taj Devi Ratn Resort",
    location: "Jaipur, Rajasthan",
    price: 6499,
    rating: 4.8,
    category: "Resort",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 8,
    name: "The Oberoi Rajvilas",
    location: "Jaipur, Rajasthan",
    price: 8999,
    rating: 4.9,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 9,
    name: "Lake View Resort",
    location: "Udaipur, Rajasthan",
    price: 3899,
    rating: 4.9,
    category: "Resort",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 10,
    name: "The Leela Palace Udaipur",
    location: "Udaipur, Rajasthan",
    price: 8499,
    rating: 4.9,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 11,
    name: "Trident Udaipur",
    location: "Udaipur, Rajasthan",
    price: 5299,
    rating: 4.7,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 12,
    name: "Grand Hyatt Goa",
    location: "Goa, India",
    price: 6999,
    rating: 4.8,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 13,
    name: "Ocean Breeze Resort",
    location: "Goa, India",
    price: 4299,
    rating: 4.9,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 14,
    name: "Golden Tulip Goa",
    location: "Goa, India",
    price: 3699,
    rating: 4.6,
    category: "Resort",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 15,
    name: "Mountain Retreat",
    location: "Manali, Himachal Pradesh",
    price: 2799,
    rating: 4.6,
    category: "Resort",
    image: "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 16,
    name: "Baragarh Resort & Spa",
    location: "Manali, Himachal Pradesh",
    price: 4599,
    rating: 4.8,
    category: "Resort",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 17,
    name: "Green Valley Hotel",
    location: "Lonavala, Maharashtra",
    price: 2199,
    rating: 4.5,
    category: "Budget",
    image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 18,
    name: "Taj Mahal Palace",
    location: "Mumbai, Maharashtra",
    price: 7499,
    rating: 4.9,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 19,
    name: "The Imperial Hotel",
    location: "New Delhi, India",
    price: 6799,
    rating: 4.8,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 20,
    name: "Budget Stay Inn",
    location: "Bhopal, Madhya Pradesh",
    price: 1599,
    rating: 4.3,
    category: "Budget",
    image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=900&q=80",
  },
];

function Hotels() {
  const [searchParams] = useSearchParams();

  const destinationFromURL = searchParams.get("destination") || "";

  const [search, setSearch] = useState(destinationFromURL);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const filteredHotels = useMemo(() => {
    let result = hotels.filter((hotel) => {
      const matchesSearch =
        hotel.name.toLowerCase().includes(search.toLowerCase()) ||
        hotel.location.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || hotel.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [search, category, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
  };

  return (
    <div className="hotels-page">
      <header className="hotels-header">
        <Link to="/" className="logo">
          <span className="logo-icon">S</span>
          STAYHUB
        </Link>

        <Link to="/" className="back-button">
          ← Home
        </Link>
      </header>

      <main>
        <section className="hotels-header-content">
          <p className="section-label">EXPLORE STAYS</p>
          <h1>Find Your Perfect Hotel</h1>
          <p>
            Discover comfortable stays at the best prices across India.
          </p>
        </section>

        <section className="hotel-filters">
          <input
            className="filter-search"
            type="text"
            placeholder="Search city or hotel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Hotels</option>
            <option value="Luxury">Luxury</option>
            <option value="Resort">Resort</option>
            <option value="Budget">Budget</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Sort By</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rating</option>
          </select>

          <button className="clear-filter" onClick={clearFilters}>
            Clear
          </button>
        </section>

        <div className="results-info">
          <strong>{filteredHotels.length}</strong> hotels found
        </div>

        {filteredHotels.length > 0 ? (
          <section className="hotel-list">
            {filteredHotels.map((hotel) => (
              <article className="hotel-card" key={hotel.id}>
                <div className="hotel-image">
                  <img src={hotel.image} alt={hotel.name} />

                  <span className="rating-badge">
                    ⭐ {hotel.rating}
                  </span>

                  <span className="tag">{hotel.category}</span>
                </div>

                <div className="hotel-info">
                  <h3>{hotel.name}</h3>

                  <p className="hotel-location">
                    📍 {hotel.location}
                  </p>

                  <p className="hotel-stars">★★★★★</p>

                  <div className="hotel-bottom">
                    <div>
                      <small>Starting from</small>
                      <strong>₹{hotel.price.toLocaleString()}</strong>
                      <small> / night</small>
                    </div>

                    <Link
                      to={`/hotels/${hotel.id}`}
                      className="view-hotel"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="no-results">
            <div>🏨</div>
            <h2>No hotels found</h2>
            <p>Try another city, hotel name, or category.</p>
            <button onClick={clearFilters}>Show All Hotels</button>
          </section>
        )}
      </main>
    </div>
  );
}

export default Hotels;

