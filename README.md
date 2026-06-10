# Bishop Martin — Academic Document Request Portal

> A full-stack, mobile-first web portal for Bishop Martin High School in Belize, enabling parents to request official academic documents, staff to process requests, and administrators to manage the entire system.

---

## ✨ Features

| Category | Details |
|---|---|
| **Multi-Role Auth** | Parents, Staff (Viewer/Admin), Super Admin with JWT sessions |
| **Document Requests** | Full multi-step request flow with delivery options and payment tracking |
| **Digital Signature** | In-browser signature capture on request forms |
| **PDF Generation** | Auto-generates official request documents using `pdfkit` |
| **ID Verification** | SSN/ID photo upload and admin verification queue |
| **Payment Tracking** | Upload receipt workflow with staff payment review queue |
| **Dark Mode** | Full dark/light mode toggle across all portals |
| **Bilingual** | English ↔ Spanish translation across every page |
| **Mobile-First** | Designed and optimized exclusively for mobile use |
| **Super Admin Portal** | User management, staff provisioning, password overrides |

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   React + Vite  │────▶│  Node.js + Expr │────▶│  PostgreSQL 15   │
│   (Nginx :80)   │     │  ess API (:3000) │     │  (Docker volume) │
└─────────────────┘     └─────────────────┘     └──────────────────┘
        │                       │
        └── Nginx proxies ──────┘
             /api → api:3000
```

**Portals:**
- `/login` — Shared login page
- `/dashboard/parents` — Parent portal
- `/staff` — Staff portal (Registrar / Admin)
- `/superadmin` — Super Admin console

---

## 🚀 Quick Start with Docker (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/nn18leiva-hub/estadia_bishop.git
cd estadia_bishop

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database password and JWT secret

# 3. Build and run everything
docker-compose up -d --build

# 4. Open the portal
#    Frontend:  http://localhost
#    API:       http://localhost:3000
```

The database schema and seed data are automatically applied on first run.

---

## 💻 Local Development (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Steps

```bash
# 1. Clone and install backend dependencies
git clone https://github.com/nn18leiva-hub/estadia_bishop.git
cd estadia_bishop
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 3. Initialize the database
psql -U postgres -c "CREATE DATABASE parentportal;"
psql -U postgres -d parentportal -f database/schema.sql
psql -U postgres -d parentportal -f database/seed.sql

# 4. Start the backend API
npm run dev          # Development (with nodemon)
# or
npm start            # Production

# 5. In a separate terminal — start the frontend
cd frontend
npm install
npm run dev          # Vite dev server at http://localhost:5173
```

---

## 📁 Project Structure

```
estadia_bishop/
├── frontend/                 # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # Auth, Theme, Language providers
│   │   ├── layouts/          # AdminLayout, DashboardLayout
│   │   ├── pages/            # All portal pages
│   │   └── services/         # API client (apiFetch)
│   ├── Dockerfile            # Multi-stage: Vite build → Nginx
│   └── nginx.conf            # Nginx reverse proxy config
│
├── src/                      # Node.js backend
│   ├── controllers/          # Route handlers
│   ├── routes/               # Express route definitions
│   ├── middleware/            # Auth middleware (JWT)
│   └── server.js             # Express app entry point
│
├── database/
│   ├── schema.sql            # Full database schema
│   └── seed.sql              # Initial data (admin accounts etc.)
│
├── scripts/                  # Utility scripts
├── uploads/                  # Runtime: uploaded files (gitignored)
├── Dockerfile                # Backend API image
├── docker-compose.yml        # Full stack orchestration
├── .env.example              # Environment variable template
└── README.md
```

---

## 🔐 Default Credentials (Seeded)

> ⚠️ **Change these immediately in production.**

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@bishopmartin.edu` | `admin123` |
| Staff (Admin) | `registrar@bishopmartin.edu` | `staff123` |

---

## 🌐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | *(your password)* |
| `DB_NAME` | Database name | `parentportal` |
| `PORT` | API server port | `3000` |
| `JWT_SECRET` | JWT signing secret | *(long random string)* |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router |
| UI Design | Material Symbols, Libre Caslon Text, Work Sans |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 15 |
| Auth | JWT (jsonwebtoken) + bcrypt |
| PDF Generation | pdfkit |
| File Uploads | multer |
| Containerization | Docker, Docker Compose, Nginx |

---

## 🐳 Docker Commands Reference

```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Rebuild a single service
docker-compose up -d --build api
```

---

*For detailed architecture and design decisions, see `COMPREHENSIVE_GUIDE.md`.*
