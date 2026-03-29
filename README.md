# BidFlow - Real-Time Charity Auction Platform

Refactored stack with:
- New modular React + Vite + TypeScript web frontend (`web/`)
- Existing Node + Socket.IO backend contracts preserved
- Mobile client retained in Flutter (`mobile/`)
- MongoDB-backed persistence (snapshot persistence) via `MONGODB_URI`

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO + Mongoose
- **Web Frontend**: React + Vite + TypeScript + React Router + Socket.IO client
- **Mobile**: Flutter (single codebase for Android + iOS)
- **Data**: MongoDB (`MONGODB_URI`) with in-memory fallback
- **Payments**: simulated checkout/payment status flow

## Quick Start (Local)

### 1) Backend + Web (Production-like)

```bash
cp .env.example .env
# edit .env and set MONGODB_URI
npm install
npm run build
npm start
```

Then open:
- `http://localhost:3000/`
- `http://localhost:3000/admin`
- `http://localhost:3000/display`

Demo passcode: `123456`

### Optional: Run backend + Mongo with Docker

```bash
docker compose up --build
```

This brings up:
- app on `http://localhost:3000`
- MongoDB on `mongodb://localhost:27017`

### 2) Flutter App (Android + iOS)

```bash
cd mobile
flutter create . --platforms=android,ios --project-name bidflow_mobile
flutter pub get
flutter run
```

See `mobile/README.md` for full mobile instructions.

## Web Routes

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/` | bidder join flow |
| `http://localhost:3000/register` | bidder registration |
| `http://localhost:3000/items` | item browsing |
| `http://localhost:3000/item/:itemId` | item detail + bids |
| `http://localhost:3000/groups` | group list |
| `http://localhost:3000/group/:groupId` | group detail |
| `http://localhost:3000/mybids` | personal bid history |
| `http://localhost:3000/profile` | bidder profile |
| `http://localhost:3000/admin` | admin dashboard |
| `http://localhost:3000/display` | live display/projection |

## API + Real-time

- REST APIs under `/api/events/...`
- Socket.IO events for live auction state (`bid:new`, `group:updated`, `item:opened`, `item:closed`, etc.)
- Health check endpoint: `/health`

## Deployment

For local-first and simple server deployment path, see `DEPLOY.md` and `QUICK_START.md` plus mobile build details in `mobile/README.md`.
