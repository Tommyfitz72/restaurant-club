# The Restaurant Club

"We're bringing back spontaneous dining"

Full-stack app that finds reservation openings in **Boston** and **Cambridge** for the upcoming two nights, then ranks them to each user with:

- Cuisine preferences
- User restaurant ratings
- Cross-platform review signals (Resy, OpenTable, Google, and other sources)
- Price/time fit
- Newly opened slots detected in the 48h to 1h window (possible cancellations)

## Main flow

1. User sets cuisine + dining preferences.
2. User rates the top 50 Boston/Cambridge restaurants.
3. Scanner refreshes reservation slots from provider adapters.
4. Recommendations are ranked and explained with match reasons.
5. UI highlights potential cancellation openings.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- Cache: Redis optional (memory fallback)
- Scheduler: node-cron (default every 20 minutes)

## Setup

```bash
npm install --prefix backend
npm install --prefix frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with your real `DATABASE_URL`.

### Prisma (required after provider enum changes)

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate -- --name provider_expansion_and_restaurant_club
npm run seed
```

## Run locally

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

Open: [http://localhost:5173](http://localhost:5173)

## Env vars

Backend (`backend/.env`):

- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `DATABASE_URL`
- `REDIS_URL` (optional)
- `USE_MOCK_PROVIDERS`
- `SCAN_INTERVAL_MINUTES`
- `MAX_PROVIDER_CONCURRENCY`
- `OPENTABLE_API_BASE`
- `OPENTABLE_API_KEY`
- `RESY_API_BASE`
- `RESY_API_KEY`
- `GOOGLE_PLACES_API_BASE`
- `GOOGLE_PLACES_API_KEY`

Frontend (`frontend/.env`):

- `VITE_API_BASE`

## Important legal note

Production scraping/API integrations must follow each provider's terms of service, rate limits, and robots policies. Availability can change rapidly and booking is finalized on provider sites.
