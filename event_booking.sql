-- Smart Event Booking System - Database Setup
-- Run this file once to initialize the database

CREATE DATABASE IF NOT EXISTS event_booking;
USE event_booking;

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date DATETIME,
  total_seats INT,
  available_seats INT,
  price DECIMAL(10,2),
  img VARCHAR(255)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT,
  name VARCHAR(100),
  email VARCHAR(100),
  mobile VARCHAR(15),
  quantity INT,
  total_amount DECIMAL(10,2),
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmed','cancelled') DEFAULT 'confirmed',
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Demo Data
INSERT INTO events (title, description, location, date, total_seats, available_seats, price, img) VALUES
('TechFest 2025 – Innovation Summit', 
 'Join the most exciting tech summit of the year. Network with industry leaders, attend keynotes, and explore cutting-edge demos from top companies worldwide. This is the definitive technology conference for the next generation of innovators.',
 'Bangalore, India', 
 '2025-08-15 10:00:00', 500, 423, 2999.00,
 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),

('Electro Nights – Music Festival', 
 'A three-day electronic music extravaganza featuring world-class DJs, stunning visuals, and an unforgettable night-life experience under the stars. Artists from across the globe converge for the biggest festival of the year.',
 'Goa, India', 
 '2025-09-20 18:00:00', 2000, 1567, 1499.00,
 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'),

('Creative India – Design Conference', 
 'The premier design conference in South Asia. Explore talks on UX, branding, typography, and the future of digital creativity from 50+ world-renowned designers and creative directors.',
 'Mumbai, India', 
 '2025-07-28 09:00:00', 300, 89, 3499.00,
 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800'),

('Startup Launchpad – Pitch Day', 
 'Watch the boldest startups pitch to top-tier investors. Network, discover disruptive ideas, and maybe find your next co-founder. 30+ startups competing for ₹50 lakh in funding.',
 'Delhi, India', 
 '2025-10-05 11:00:00', 400, 312, 999.00,
 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800'),

('Wellness Fest – Mind & Body Summit', 
 'A curated wellness experience featuring yoga masters, mindfulness coaches, nutrition experts, and holistic health workshops. Reconnect with yourself over two transformative days.',
 'Rishikesh, India', 
 '2025-11-12 07:00:00', 250, 198, 1999.00,
 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'),

('Foodie Carnival – Culinary Arts Expo', 
 'Taste your way through 200+ food stalls, live cooking demonstrations, and master chef battles across an entire weekend of flavor, culture, and culinary innovation.',
 'Hyderabad, India', 
 '2025-08-30 12:00:00', 5000, 4231, 499.00,
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800');

-- Demo bookings
INSERT INTO bookings (event_id, name, email, mobile, quantity, total_amount, status) VALUES
(1, 'Arjun Sharma', 'arjun@example.com', '9876543210', 2, 5998.00, 'confirmed'),
(1, 'Priya Verma', 'priya@example.com', '8765432109', 1, 2999.00, 'confirmed'),
(2, 'Rahul Gupta', 'rahul@example.com', '7654321098', 3, 4497.00, 'confirmed'),
(3, 'Sunita Patel', 'sunita@example.com', '6543210987', 2, 6998.00, 'confirmed'),
(4, 'Vikram Singh', 'vikram@example.com', '9988776655', 1, 999.00, 'cancelled'),
(5, 'Ananya Roy', 'ananya@example.com', '8877665544', 4, 7996.00, 'confirmed');

SELECT 'Database setup complete!' as message;
