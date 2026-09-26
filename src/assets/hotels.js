// Central hotel data used by Hotels, HotelDetails and Booking.

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

export default hotels;
