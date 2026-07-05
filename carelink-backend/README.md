# CareLink Backend API

Health & Community Wellbeing Platform — REST API built with Node.js, Express, Sequelize, and PostgreSQL.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env and configure
cp .env.example .env
# Set DB credentials and GEMINI_API_KEY

# 3. Create PostgreSQL database
createdb carelink

# 4. Start dev server (creates tables + admin account from .env)
npm run dev
```

API runs at `http://localhost:5000`

## Admin Access

The admin account is **not** created through registration. On first startup, the server auto-creates one admin from your `.env`:

```env
ADMIN_EMAIL=admin@carelink.local
ADMIN_PASSWORD=change-this-admin-password
```

Log in with `POST /api/v1/auth/login` using those credentials.

All other users (patients, health workers) must **register** via `POST /api/v1/auth/register`.

## Architecture

```
src/
├── config/          # App & DB config
├── controllers/     # Request/response only (no business logic)
├── middleware/      # Auth, validation, errors, rate limiting
├── models/          # Sequelize models & associations
├── routes/          # Route definitions by resource
├── services/        # Business logic + Gemini API
├── scripts/         # DB migrate/reset
└── utils/           # Helpers
```

## API Endpoints (`/api/v1`)

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Login, get JWT |
| GET | `/auth/me` | ✓ | Get profile |
| PATCH | `/auth/me` | ✓ | Update profile |
| POST | `/auth/apply-health-worker` | ✓ | Apply for health worker role |
| PATCH | `/auth/users/:id/verify` | Admin | Verify health worker |

### AI Triage
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/triage/analyze` | ✓ | Submit symptoms → AI urgency + facility type |
| GET | `/triage/history` | ✓ | Past triage sessions |

### Facilities
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/facilities` | — | List all facilities |
| GET | `/facilities/nearby?lat=&lon=&radiusKm=` | — | Nearby facilities with distance |
| GET | `/facilities/:id` | — | Facility details |
| POST | `/facilities` | Admin | Create facility |
| PATCH | `/facilities/:id` | Admin/Worker | Update facility |
| DELETE | `/facilities/:id` | Admin | Delete facility |

### Community Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/reports/:facilityId` | ✓ | Submit status report (earns credits) |
| GET | `/reports` | ✓ | List reports |
| PATCH | `/reports/:id/verify` | Admin/Worker | Verify report |
| PATCH | `/reports/:id/reject` | Admin | Reject report |

### Health Credits
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/credits/balance` | ✓ | Current balance |
| GET | `/credits/history` | ✓ | Transaction history |
| POST | `/credits/actions` | ✓ | Record checkup/blood donation |
| POST | `/credits/redeem` | ✓ | Redeem free screening (100 credits) |

### Notifications
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✓ | User notifications |
| PATCH | `/notifications/:id/read` | ✓ | Mark as read |
| POST | `/notifications/campaigns` | Admin | Broadcast campaign |

### Analytics
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/analytics/dashboard` | Admin | Platform stats |

## Demo Flow

1. **Register** → `POST /auth/register` (regular users & health worker applicants)
2. **Admin login** → `POST /auth/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`
3. **AI Triage** → `POST /triage/analyze` with `{ "symptoms": "headache and fever for 2 days" }`
4. **Find nearby** → `GET /facilities/nearby?latitude=-1.29&longitude=36.82&type=clinic`
5. **Report status** → `POST /reports/:facilityId` with `{ "isOpen": true, "waitTimeMinutes": 20, "crowdLevel": "moderate" }`
6. **Check credits** → `GET /credits/balance`

## Gemini AI Triage

Set `GEMINI_API_KEY` in `.env`. Without it, the API uses a keyword-based fallback so the demo still works.

The AI returns structured JSON only:
```json
{
  "urgency": "low|medium|high",
  "recommended_facility": "pharmacy|clinic|hospital|emergency",
  "reason": "brief routing explanation"
}
```

## Tech Stack

- Node.js + Express.js
- Sequelize ORM + PostgreSQL
- Google Gemini API (`@google/generative-ai`)
- JWT auth + bcrypt
- express-validator + rate limiting
