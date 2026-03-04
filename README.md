# 🎫 EventSphere – Smart Event Booking System

A full-stack premium event booking platform inspired by modern Webflow/SaaS design aesthetics.

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Backend | Node.js + Express.js (MVC Architecture) |
| Database | MySQL |
| Realtime | Socket.IO |
| HTTP Client | Axios |
| State | Zustand |
| Notifications | React Hot Toast |

---

##  Project Structure

```
smart-event-booking/
├── server/                     # Backend
│   ├── config/
│   │   └── db.js               # MySQL connection pool + auto-init
│   ├── controllers/
│   │   ├── eventController.js
│   │   └── bookingController.js
│   ├── routes/
│   │   ├── eventRoutes.js
│   │   └── bookingRoutes.js
│   ├── models/
│   │   ├── eventModel.js
│   │   └── bookingModel.js
│   ├── sockets/
│   │   └── socketHandler.js    # Socket.IO events
│   ├── middleware/
│   │   └── validation.js       # Input validation + error handler
│   ├── .env.example
│   ├── package.json
│   └── index.js
│
├── client/                     # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx  # Glassmorphism scroll navbar
│   │   │   │   └── Footer.jsx
│   │   │   └── ui/
│   │   │       └── index.jsx   # EventCard, Skeletons, Badges, etc.
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Webflow-style hero + sections
│   │   │   ├── EventsPage.jsx       # Search + filter + grid
│   │   │   ├── EventDetailsPage.jsx # Details + booking flow
│   │   │   ├── MyBookingsPage.jsx   # Ticket management
│   │   │   └── AdminPage.jsx        # CRUD dashboard
│   │   ├── store/
│   │   │   └── index.js        # Zustand global state
│   │   ├── utils/
│   │   │   ├── api.js          # Axios instance + API methods
│   │   │   └── socket.js       # Socket.IO client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── database.sql                # Full schema + demo data
└── README.md
```

---

##  Quick Setup

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Run the SQL file
mysql -u root -p < database.sql

# Or manually:
mysql> CREATE DATABASE event_booking;
mysql> USE event_booking;
mysql> source database.sql;
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your MySQL credentials:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=your_mysql_password
# DB_NAME=event_booking
# PORT=5000
# CLIENT_URL=http://localhost:5173

# Start dev server
npm run dev
```

Backend will run at: `http://localhost:5000`

> **Note:** The server auto-creates tables and inserts demo data on first run.

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🌐 API Reference

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List all events (supports `search`, `location`, `sortBy`) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/events` | Create event (admin) |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | All bookings (supports `?email=`) |
| GET | `/api/bookings/stats` | Revenue & booking stats |
| POST | `/api/bookings` | Create booking (decreases seats) |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking (restores seats) |

### Health Check
```
GET /api/health
```

---

## Real-Time Socket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `seats:updated` | Server → Clients | `{ event_id, available_seats }` |
| `booking:created` | Server → Clients | Booking object |
| `event:created` | Server → Clients | Event object |
| `event:updated` | Server → Clients | Event object |
| `event:deleted` | Server → Clients | `{ id }` |
| `seats:lock` | Client → Server | `{ event_id, quantity }` |
| `seats:unlock` | Client → Server | `{ event_id }` |
| `seats:locked` | Server → Clients | `{ event_id, total_locked }` |

---

##  Pages Overview

| Page | Route | Features |
|------|-------|---------|
| Landing | `/` | Webflow-style hero, floating cards, stats counter, CTA sections |
| Events | `/events` | Search, city filter, sort, real-time seat updates |
| Details | `/events/:id` | Full details, Google Maps, seat bar, booking flow, QR ticket |
| My Bookings | `/my-bookings` | Email search, booking list, cancellation |
| Admin | `/admin` | Stats cards, event CRUD, booking management table |

---

## Business Logic

- **Overbooking Prevention**: MySQL transaction with `FOR UPDATE` lock on seat row
- **Validation**: Server-side middleware validates all inputs before processing
- **Seat Restoration**: Cancelling a booking automatically restores seat count
- **Real-time**: All booking/seat changes broadcast to all connected clients via Socket.IO

---

##  Production Deployment

```bash
# Frontend build
cd client && npm run build

# Serve with nginx or your preferred static host
# Point /api/* proxy to your Node server

# Backend with PM2
npm install -g pm2
cd server && pm2 start index.js --name event-booking-api
```

---

##  Responsive Design

- Mobile-first Tailwind CSS
- Glassmorphism navbar (transparent → blur on scroll)
- Touch-friendly tap targets
- Responsive grid layouts (1 → 2 → 3 columns)

---

