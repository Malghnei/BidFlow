# BidFlow - Real-Time Charity Auction Platform

Refactored stack with:
- Existing web experience retained (`public/*.html`)
- Mobile client migrated to Flutter for both Android and iOS
- MongoDB-backed persistence (snapshot persistence) via `MONGODB_URI`

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO + Mongoose
- **Web Frontend**: HTML + Tailwind CSS + Socket.IO client
- **Mobile**: Flutter (single codebase for Android + iOS)
- **Data**: MongoDB (`MONGODB_URI`) with in-memory fallback
- **Payments**: simulated checkout/payment status flow

## Quick Start (Local)

### 1) Backend + Web

```bash
cp .env.example .env
# edit .env and set MONGODB_URI
npm install
npm start
```

Then open:
- `http://localhost:3000/admin.html`
- `http://localhost:3000/display.html`
- `http://localhost:3000/`

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

## Web Pages

| URL | Purpose |
|-----|---------|
| `http://localhost:3000/` | bidder join flow |
| `http://localhost:3000/register.html` | bidder registration |
| `http://localhost:3000/items.html` | item browsing |
| `http://localhost:3000/item.html?id=ITEM_ID` | item detail + bids |
| `http://localhost:3000/admin.html` | full admin dashboard |
| `http://localhost:3000/display.html` | projector/live display |

## API + Real-time

- REST APIs under `/api/events/...`
- Socket.IO events for live auction state (`bid:new`, `group:updated`, `item:opened`, `item:closed`, etc.)
- Health check endpoint: `/health`

## Deployment

For local-first and simple server deployment path, see `SETUP_GUIDE.md` and `QUICK_START.md` plus mobile build details in `mobile/README.md`.
