
import { Link, useNavigate, useParams } from "react-router-dom";

const hotels = [
  {
    id: 1,
    name: "The Grand Palace",
    location: "Indore, Madhya Pradesh",
    price: 2499,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    description:
      "A comfortable and elegant stay in the heart of Indore with modern rooms, excellent service and premium facilities.",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Parking", "Restaurant", "Room Service", "AC Rooms"],
  },
  {
    id: 2,
    name: "Radisson Blu Hotel Indore",
    location: "Indore, Madhya Pradesh",
    price: 3999,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    description:
      "Premium rooms, modern facilities and a relaxing atmosphere for business and leisure travellers.",
    amenities: ["Free Wi-Fi", "Pool", "Gym", "Restaurant", "Parking", "Room Service"],
  },
  {
    id: 3,
    name: "Lemon Tree Hotel",
    location: "Indore, Madhya Pradesh",
    price: 2899,
    rating: 4.5,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    description:
      "A stylish hotel offering comfortable accommodation and convenient facilities for your stay.",
    amenities: ["Free Wi-Fi", "Restaurant", "Parking", "AC Rooms", "Breakfast", "Room Service"],
  },
  {
    id: 4,
    name: "Sayaji Hotel",
    location: "Indore, Madhya Pradesh",
    price: 3499,
    rating: 4.6,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    description:
      "Experience premium hospitality with spacious rooms, dining options and modern amenities.",
    amenities: ["Free Wi-Fi", "Swimming Pool", "Gym", "Restaurant", "Parking", "Spa"],
  },
  {
    id: 5,
    name: "Royal Heritage Hotel",
    location: "Jaipur, Rajasthan",
    price: 3199,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=80",
    description:
      "Enjoy a royal-inspired stay with beautiful interiors and comfortable modern facilities.",
    amenities: ["Free Wi-Fi", "Restaurant", "Parking", "AC Rooms", "Breakfast", "Room Service"],
  },
  {
    id: 6,
    name: "Rambagh Palace",
    location: "Jaipur, Rajasthan",
    price: 7999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    description:
      "A luxurious palace-style stay offering an unforgettable hospitality experience.",
    amenities: ["Free Wi-Fi", "Pool", "Spa", "Restaurant", "Gym", "Room Service"],
  },
  {
    id: 7,
    name: "Taj Devi Ratn Resort",
    location: "Jaipur, Rajasthan",
    price: 6499,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
    description:
      "A peaceful resort surrounded by beautiful views and premium hospitality.",
    amenities: ["Pool", "Free Wi-Fi", "Restaurant", "Parking", "Spa", "Breakfast"],
  },
  {
    id: 8,
    name: "The Oberoi Rajvilas",
    location: "Jaipur, Rajasthan",
    price: 8999,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1544986581-efac024faf62?auto=format&fit=crop&w=1200&q=80",
    description:
      "A premium luxury retreat combining traditional architecture with modern comfort.",
    amenities: ["Pool", "Spa", "Restaurant", "Gym", "Free Wi-Fi", "Room Service"],
  },
  {
    id: 9,
    name: "Lake View Resort",
    location: "Udaipur, Rajasthan",
    price: 3899,
    rating: 4.9,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    description:
      "Relax at a beautiful resort with scenic surroundings and comfortable accommodation.",
    amenities: ["Lake View", "Pool", "Restaurant", "Free Wi-Fi", "Parking", "Breakfast"],
  },
  {
    id: 10,
    name: "The Leela Palace Udaipur",
    location: "Udaipur, Rajasthan",
    price: 8499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
    description:
      "A luxurious lakeside experience with elegant rooms and premium services.",
    amenities: ["Lake View", "Pool", "Spa", "Restaurant", "Gym", "Free Wi-Fi"],
  },
  {
    id: 11,
    name: "Trident Udaipur",
    location: "Udaipur, Rajasthan",
    price: 5299,
    rating: 4.7,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Comfortable rooms, beautiful surroundings and excellent hospitality in Udaipur.",
    amenities: ["Pool", "Restaurant", "Free Wi-Fi", "Parking", "Breakfast", "AC Rooms"],
  },
  {
    id: 12,
    name: "Grand Hyatt Goa",
    location: "Goa, India",
    price: 6999,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80",
    description:
      "Enjoy a premium Goan holiday with resort-style facilities and relaxing surroundings.",
    amenities: ["Beach Access", "Pool", "Spa", "Restaurant", "Gym", "Free Wi-Fi"],
  },
  {
    id: 13,
    name: "Ocean Breeze Resort",
    location: "Goa, India",
    price: 4299,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80",
    description:
      "A relaxing coastal resort perfect for a memorable beach holiday in Goa.",
    amenities: ["Beach Access", "Pool", "Restaurant", "Free Wi-Fi", "Parking", "Breakfast"],
  },
  {
    id: 14,
    name: "Golden Tulip Goa",
    location: "Goa, India",
    price: 3699,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    description:
      "A comfortable resort with modern facilities and easy access to popular attractions.",
    amenities: ["Pool", "Restaurant", "Free Wi-Fi", "Parking", "AC Rooms", "Breakfast"],
  },
  {
    id: 15,
    name: "Mountain Retreat",
    location: "Manali, Himachal Pradesh",
    price: 2799,
    rating: 4.6,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&w=1200&q=80",
    description:
      "A peaceful mountain stay surrounded by nature and beautiful Himalayan views.",
    amenities: ["Mountain View", "Free Wi-Fi", "Restaurant", "Parking", "Bonfire", "Breakfast"],
  },
  {
    id: 16,
    name: "Baragarh Resort & Spa",
    location: "Manali, Himachal Pradesh",
    price: 4599,
    rating: 4.8,
    category: "Resort",
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    description:
      "A scenic resort offering a peaceful escape with premium rooms and spa facilities.",
    amenities: ["Mountain View", "Spa", "Restaurant", "Free Wi-Fi", "Parking", "Bonfire"],
  },
  {
    id: 17,
    name: "Green Valley Hotel",
    location: "Lonavala, Maharashtra",
    price: 2199,
    rating: 4.5,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
    description:
      "An affordable and comfortable stay for travellers exploring Lonavala.",
    amenities: ["Free Wi-Fi", "Parking", "Restaurant", "AC Rooms", "Breakfast", "Room Service"],
  },
  {
    id: 18,
    name: "Taj Mahal Palace",
    location: "Mumbai, Maharashtra",
    price: 7499,
    rating: 4.9,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    description:
      "A premium city stay with elegant accommodation and world-class hospitality.",
    amenities: ["Sea View", "Pool", "Spa", "Restaurant", "Gym", "Free Wi-Fi"],
  },
  {
    id: 19,
    name: "The Imperial Hotel",
    location: "New Delhi, India",
    price: 6799,
    rating: 4.8,
    category: "Luxury",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    description:
      "An elegant hotel offering premium rooms, dining and modern guest facilities.",
    amenities: ["Free Wi-Fi", "Pool", "Restaurant", "Gym", "Spa", "Parking"],
  },
  {
    id: 20,
    name: "Budget Stay Inn",
    location: "Bhopal, Madhya Pradesh",
    price: 1599,
    rating: 4.3,
    category: "Budget",
    image:
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80",
    description:
      "A simple, clean and affordable hotel for budget-conscious travellers.",
    amenities: ["Free Wi-Fi", "Parking", "AC Rooms", "Restaurant", "Breakfast", "Room Service"],
  },
];

function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const hotel = hotels.find((item) => item.id === Number(id));

  if (!hotel) {
    return (
      <div className="hotel-not-found">
        <h1>Hotel Not Found</h1>
        <p>The hotel you are looking for does not exist.</p>
        <Link to="/hotels">← Back to Hotels</Link>
      </div>
    );
  }

  const handleBooking = () => {
    navigate(`/booking?hotel=${hotel.id}`);
  };

  return (
    <div className="hotel-details-page">
      <header className="details-topbar">
        <Link to="/" className="details-logo">
          <span className="logo-icon">S</span>
          STAYHUB
        </Link>

        <button
          className="back-button"
          onClick={() => navigate("/hotels")}
        >
          ← Back to Hotels
        </button>
      </header>

      <main className="details-container">
        <div className="details-image">
          <img src={hotel.image} alt={hotel.name} />
          <span className="details-category">{hotel.category}</span>
        </div>

        <div className="details-main">
          <div className="details-content">
            <p className="details-location">📍 {hotel.location}</p>

            <h1 className="details-heading">{hotel.name}</h1>

            <div className="details-rating">
              <span>⭐ {hotel.rating}</span>
              <span>★★★★★</span>
              <span>Excellent</span>
            </div>

            <p className="details-description">
              {hotel.description}
            </p>

            <section className="details-section">
              <h2>Hotel Amenities</h2>

              <div className="amenities-grid">
                {hotel.amenities.map((amenity) => (
                  <div className="amenity" key={amenity}>
                    ✓ {amenity}
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="booking-card">
            <p>Starting from</p>

            <div className="details-price">
              ₹{hotel.price.toLocaleString()}
              <span>/ night</span>
            </div>

            <div className="booking-field">
              <label>Check-in</label>
              <input type="date" />
            </div>

            <div className="booking-field">
              <label>Check-out</label>
              <input type="date" />
            </div>

            <div className="booking-field">
              <label>Guests</label>
              <select defaultValue="2">
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
              </select>
            </div>

            <button className="book-now-button" onClick={handleBooking}>
              Book Now
            </button>

            <p className="secure-text">
              🔒 Secure booking • No payment required now
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default HotelDetails;

