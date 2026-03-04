const mysql2 = require('mysql2/promise');
require('dotenv').config();

const pool = mysql2.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'event_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const initDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected');

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    // Insert demo data if events table is empty
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM events');
    if (rows[0].count === 0) {
      await conn.query(`
        INSERT INTO events (title, description, location, date, total_seats, available_seats, price, img) VALUES
        ('TechFest 2025 – Innovation Summit', 'Join the most exciting tech summit of the year. Network with industry leaders, attend keynotes, and explore cutting-edge demos from top companies worldwide.', 'Bangalore, India', '2025-08-15 10:00:00', 500, 423, 2999.00, 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
        ('Electro Nights – Music Festival', 'A three-day electronic music extravaganza featuring world-class DJs, stunning visuals, and an unforgettable night-life experience under the stars.', 'Goa, India', '2025-09-20 18:00:00', 2000, 1567, 1499.00, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'),
        ('Creative India – Design Conference', 'The premier design conference in South Asia. Explore talks on UX, branding, typography, and the future of digital creativity.', 'Mumbai, India', '2025-07-28 09:00:00', 300, 89, 3499.00, 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800'),
        ('Startup Launchpad – Pitch Day', 'Watch the boldest startups pitch to top-tier investors. Network, discover ideas, and maybe find your next co-founder or investment.', 'Delhi, India', '2025-10-05 11:00:00', 400, 312, 999.00, 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800'),
        ('Wellness Fest – Mind & Body Summit', 'A curated wellness experience featuring yoga masters, mindfulness coaches, nutrition experts, and holistic health workshops.', 'Rishikesh, India', '2025-11-12 07:00:00', 250, 198, 1999.00, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800'),
        ('Foodie Carnival – Culinary Arts Expo', 'Taste your way through 200+ food stalls, live cooking demonstrations, and master chef battles across an entire weekend of flavor.', 'Hyderabad, India', '2025-08-30 12:00:00', 5000, 4231, 499.00, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800')
      `);
      console.log('✅ Demo data inserted');
    }

    conn.release();
  } catch (err) {
    console.error('❌ DB Error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, initDB };
