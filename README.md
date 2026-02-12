# Boston/Cambridge Reservation Finder

Full-stack application for discovering reservation availability in **Boston, MA** and **Cambridge, MA**, personalized by user cuisine preferences, ratings, price range, dining time, and party size.

## Features

- Reservation scanner service that runs every 15-30 minutes (configurable) and collects OpenTable/Resy availability.
- API adapter pattern for OpenTable/Resy with mock provider fallback for local development.
- Rate limiting and provider error isolation during scans.
- Preference onboarding:
  - Cuisine multi-select
  - Optional price range
  - Optional preferred dining windows
  - Optional default party size
- Restaurant rating flow over 20 local restaurants.
- Recommendation engine with weighted scoring:
  - Cuisine preferences (highest weight)
  - Direct rating of restaurant
  - Ratings of similar cuisine restaurants
  - Price and time fit
- Match percentage and recommendation explanation.
- Filters after recommendations: date, time range, party size, neighborhood.
- Manual refresh button for newly opened tables.
- Responsive UI for mobile/tablet/desktop.
- Friendly empty-state/error messaging when no reservation matches are found.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- DB: PostgreSQL via Prisma
- Cache: Redis (optional, with in-memory fallback)
- Scheduler: node-cron

## Project Structure

```text
.
├── package.json
├── .gitignore
├── README.md
├── backend
│   ├── .env.example
│   ├── package.json
│   ├── prisma
│   │   └── schema.prisma
│   └── src
│       ├── app.js
│       ├── server.js
│       ├── config
│       │   ├── constants.js
│       │   └── env.js
│       ├── controllers
│       │   ├── profileController.js
│       │   ├── recommendationController.js
│       │   ├── reservationController.js
│       │   └── restaurantController.js
│       ├── data
│       │   ├── popularRestaurants.js
│       │   └── seed.js
│       ├── jobs
│       │   └── scannerJob.js
│       ├── middleware
│       │   └── errorHandler.js
│       ├── routes
│       │   └── index.js
│       ├── services
│       │   ├── cache.js
│       │   ├── db.js
│       │   ├── recommendationService.js
│       │   ├── scannerService.js
│       │   └── providers
│       │       ├── baseProvider.js
│       │       ├── mockProvider.js
│       │       ├── openTableProvider.js
│       │       └── resyProvider.js
│       └── utils
│           └── time.js
└── frontend
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src
        ├── App.jsx
        ├── main.jsx
        ├── api
        │   └── client.js
        ├── components
        │   ├── PreferencesForm.jsx
        │   ├── RecommendationsView.jsx
        │   ├── RestaurantRater.jsx
        │   └── StarRating.jsx
        ├── hooks
        │   └── useLocalStorage.js
        ├── styles
        │   └── global.css
        └── utils
            └── session.js
```

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

Variables:

- `NODE_ENV=development`
- `PORT=4000`
- `FRONTEND_URL=http://localhost:5173`
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reservation_finder?schema=public`
- `REDIS_URL=redis://localhost:6379`
- `USE_MOCK_PROVIDERS=true`
- `SCAN_INTERVAL_MINUTES=20`
- `MAX_PROVIDER_CONCURRENCY=2`
- `OPENTABLE_API_BASE=https://www.opentable.com`
- `OPENTABLE_API_KEY=`
- `RESY_API_BASE=https://api.resy.com`
- `RESY_API_KEY=`

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

Variables:

- `VITE_API_BASE=http://localhost:4000/api`

## Local Setup

1. Install dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

2. Start PostgreSQL (and Redis optionally).

3. Generate Prisma client and apply migrations:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate
```

4. Seed Boston/Cambridge restaurants:

```bash
npm --prefix backend run seed
```

5. Run backend and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

6. Open `http://localhost:5173`.

## API Endpoints

- `GET /api/health`
- `GET /api/restaurants/popular`
- `GET /api/restaurants/neighborhoods`
- `PUT /api/profiles/:sessionId`
- `GET /api/profiles/:sessionId`
- `PUT /api/profiles/:sessionId/ratings`
- `GET /api/recommendations`
- `GET /api/reservations/available`
- `POST /api/reservations/refresh` (rate-limited)

## Deployment Guide

### Frontend (Vercel or Netlify)

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE=https://<your-backend-domain>/api`

### Backend (Render or Railway)

- Root directory: `backend`
- Build command: `npm install && npm run prisma:generate && npm run prisma:deploy`
- Start command: `npm run start`
- Provision PostgreSQL and set `DATABASE_URL`
- Optional Redis service and set `REDIS_URL`
- Set `USE_MOCK_PROVIDERS=false` when real provider integration is enabled

## Legal and Ethical Notes

- Respect OpenTable/Resy terms and API licensing before using production scraping or undocumented endpoints.
- Add provider-specific request throttling and retry backoff to avoid abuse.
- Follow `robots.txt` and local laws for any scraping implementation.
- Display availability disclaimer: reservation inventory can change rapidly and booking is finalized only on provider sites.

## Optional Account Extension

Current implementation stores onboarding/rating state in localStorage with backend profile persistence via session id.
To add full user accounts, extend schema with `User` and auth (e.g., Clerk/Auth0/NextAuth) and link `UserProfile` to user id.
# restaurant-club
