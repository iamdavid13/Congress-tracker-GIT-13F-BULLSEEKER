# Congress Tracker

Sleek, Spotify-inspired Congress dashboard with a functional API backend. Pulls live data from GovTrack and surfaces members, bills, committees, and votes.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Data: GovTrack API

## Quickstart

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Then open the app at http://localhost:5173

## API Endpoints

- `GET /api/health`
- `GET /api/members?limit=40`
- `GET /api/members/:id`
- `GET /api/bills?limit=20`
- `GET /api/committees?limit=20`
- `GET /api/votes?limit=20`

## Notes

- GovTrack does not require an API key for basic usage, but be mindful of rate limits.
- Update the `GOVTRACK_BASE` in `server/.env` if GovTrack changes their API base.