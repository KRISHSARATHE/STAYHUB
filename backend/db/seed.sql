INSERT INTO hotels (id,name,location,category,price,rating,image,description,total_rooms) VALUES
(1,'The Oberoi Udaivilas','Udaipur, Rajasthan','Luxury',18500,4.9,'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=85','A luxurious lakeside stay with beautiful architecture, premium rooms and world-class hospitality.',20),
(2,'Taj Lake Palace','Udaipur, Rajasthan','Luxury',22000,4.9,'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1400&q=85','Iconic luxury accommodation surrounded by the beautiful waters of Lake Pichola.',20),
(3,'Taj Palace','New Delhi, Delhi','Luxury',14500,4.8,'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85','Premium hotel offering elegant rooms, fine dining and excellent hospitality.',20),
(4,'ITC Grand Chola','Chennai, Tamil Nadu','Luxury',12000,4.7,'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1400&q=85','Grand luxury hotel with spacious rooms, restaurants, pools and premium facilities.',20),
(5,'The Leela Palace','Bengaluru, Karnataka','Luxury',13500,4.8,'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=85','Elegant palace-inspired hotel with luxury rooms and premium guest services.',20),
(6,'Radisson Blu','Indore, Madhya Pradesh','Premium',6500,4.5,'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1400&q=85','Comfortable premium stay in Indore with modern rooms and convenient facilities.',20),
(7,'Sayaji Hotel','Indore, Madhya Pradesh','Premium',5500,4.4,'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=85','Popular premium hotel offering comfortable rooms, dining and modern amenities.',20),
(8,'Marriott Hotel','Mumbai, Maharashtra','Premium',9000,4.6,'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1400&q=85','Modern premium hotel with stylish rooms, restaurants and business facilities.',20),
(9,'Hyatt Regency','Mumbai, Maharashtra','Premium',8500,4.5,'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1400&q=85','Premium city accommodation with comfortable rooms and modern amenities.',20),
(10,'Novotel','Pune, Maharashtra','Premium',6000,4.4,'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1400&q=85','Modern hotel offering comfortable rooms and convenient facilities for travellers.',20),
(11,'Lemon Tree Hotel','Indore, Madhya Pradesh','Budget',3500,4.2,'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1400&q=85','Affordable and comfortable accommodation suitable for students and business travellers.',20),
(12,'Treebo Trend','Bhopal, Madhya Pradesh','Budget',2200,4.1,'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1400&q=85','Budget-friendly stay with clean rooms and essential facilities.',20),
(13,'FabHotel Prime','Indore, Madhya Pradesh','Budget',2500,4,'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1400&q=85','Affordable hotel with modern rooms and essential amenities.',20),
(14,'Hotel Lake View','Bhopal, Madhya Pradesh','Budget',2800,4.1,'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=1400&q=85','Comfortable budget stay with convenient location and pleasant surroundings.',20),
(15,'Holiday Inn','Goa, India','Resort',7500,4.6,'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1400&q=85','Relaxing resort-style accommodation perfect for a Goa vacation.',20),
(16,'Taj Exotica Resort','Goa, India','Resort',11000,4.8,'https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1400&q=85','Beautiful resort with premium rooms, pools and relaxing surroundings.',20),
(17,'The Lalit Resort','Goa, India','Resort',8500,4.6,'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=1400&q=85','Peaceful resort accommodation with premium facilities and beautiful views.',20),
(18,'Hotel Hill View','Manali, Himachal Pradesh','Resort',4500,4.3,'https://images.unsplash.com/photo-1544986581-efac024faf62?w=1400&q=85','Scenic mountain stay offering comfortable rooms and beautiful views.',20),
(19,'The Himalayan Resort','Shimla, Himachal Pradesh','Resort',6500,4.5,'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1400&q=85','Mountain resort with peaceful surroundings and comfortable accommodation.',20),
(20,'Hotel Snow Valley','Manali, Himachal Pradesh','Budget',3200,4.2,'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1400&q=85','Affordable mountain accommodation ideal for travellers and families.',20)
ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('hotels','id'), GREATEST((SELECT MAX(id) FROM hotels),1));
