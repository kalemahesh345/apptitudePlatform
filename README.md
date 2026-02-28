# AptitudeAI — Online Aptitude Platform

A full-stack, production-ready Online Aptitude Platform with AI-powered analysis and recommendations, built for college students and job aspirants.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Chart.js |
| Backend | Node.js + Express.js |
| Database | MySQL |
| Auth | JWT (Access + Refresh tokens) |
| AI | Google Gemini API (with mock fallback) |

## 📁 Project Structure

```
├── server/                  # Backend API
│   ├── config/              # DB, JWT, AI configuration
│   ├── controllers/         # Route handlers
│   ├── db/                  # Schema & seed scripts
│   ├── middleware/           # Auth, error, validation
│   ├── models/              # Database query layer
│   ├── routes/              # Express routes
│   └── server.js            # Entry point
├── client/                  # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth & Theme providers
│   │   ├── pages/           # All page components
│   │   ├── services/        # Axios API service
│   │   └── App.jsx          # Main app with routing
│   └── index.html
└── README.md
```

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Setup Database

```sql
-- Create the database and tables
mysql -u root -p < server/db/schema.sql
```

### 2. Configure Environment

Edit `server/.env` with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=aptitude_platform
GEMINI_API_KEY=your_key  # Optional (works without it)
```

### 3. Install & Seed

```bash
# Install backend dependencies
cd server && npm install

# Seed database with sample data
npm run seed

# Install frontend dependencies
cd ../client && npm install
```

### 4. Run

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Start frontend
cd client && npm run dev
```

Open **http://localhost:5173** in your browser.

### 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@aptitude.com | admin123 |
| User | rahul@test.com | user123 |
| Premium | priya@test.com | user123 |

## ✨ Features

### 👤 User Dashboard
- Test history, scores, accuracy tracking
- Score trend & topic performance charts
- AI-identified strong/weak subjects
- Progress tracking with skill levels

### 📝 Test Module
- 4 categories: Quantitative, Logical, Verbal, Technical
- 3 difficulty levels per category
- Countdown timer with auto-submit
- Question navigation panel
- Real-time answer saving
- Anti-cheat tab-switch detection

### 🧠 AI Features
- **Result Analysis** — Strengths, weaknesses, personalized feedback
- **Study Recommendations** — 14-day personalized study plans
- **Question Explanations** — Step-by-step AI solutions
- **AI Mentor Chatbot** — Ask questions, get tips, practice

### 👑 Premium
- Unlimited tests (free users: 5/day)
- Advanced AI analytics
- Unlimited AI mentor messages
- PDF reports

### 🛠 Admin Panel
- Platform statistics dashboard
- Question CRUD + CSV bulk upload
- User management with role control
- Leaderboard management
- Question difficulty analytics

### 🎨 Design
- Dark / Light mode toggle
- Modern glassmorphism UI
- Responsive (mobile + desktop)
- Smooth animations & micro-interactions
- Chart.js visualizations

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/tests` | List all tests |
| POST | `/api/tests/:id/start` | Start a test |
| POST | `/api/tests/answer` | Save an answer |
| POST | `/api/tests/:id/submit` | Submit test |
| GET | `/api/results/dashboard` | Dashboard stats |
| GET | `/api/results/:id` | Detailed result |
| GET | `/api/progress` | User progress |
| GET | `/api/study` | Study materials |
| POST | `/api/ai/analyze` | AI analysis |
| POST | `/api/ai/recommend` | Study plan |
| POST | `/api/ai/explain` | Question explanation |
| POST | `/api/ai/chat` | AI mentor chat |
| GET | `/api/admin/dashboard` | Admin stats |
| POST | `/api/admin/questions` | Create question |
| POST | `/api/premium/subscribe` | Subscribe to premium |
