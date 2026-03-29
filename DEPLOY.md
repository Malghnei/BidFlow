# Deployment Guide (Simple Path)

This guide optimizes for:
- Local-first development
- One straightforward server deployment path
- Flutter app build/distribution separately

## A) Local Development

```bash
cp .env.example .env
# set MONGODB_URI and optionally PORT
npm install
npm start
```

Server starts at `http://localhost:3000`.

### Optional local Docker stack (app + Mongo)

```bash
docker compose up --build
```

This uses `docker-compose.yml` with:
- `app` on port `3000`
- `mongo` on port `27017`

## B) Simple Server Deployment (Node host + Mongo Atlas)

Works for platforms like Render, Railway, Fly.io, or a small VPS.

### 1) Required environment variables

- `MONGODB_URI` (Atlas connection string)
- `PORT` (provided by host automatically on most platforms)

### 2) Start command

```bash
npm start
```

### 3) Health check suggestion

Use `/health`.

### 4) Notes

- App persists auction state snapshots to MongoDB.
- If Mongo is unreachable, app falls back to in-memory mode with warning logs.
- If `MONGODB_URI` contains placeholders (like `<cluster>`), Mongo is intentionally disabled and app runs in-memory mode.

## C) Flutter Distribution

Flutter app is in `mobile/`.

### Android

```bash
cd mobile
flutter build appbundle --release
```

Use generated AAB for Play Store.

### iOS

```bash
cd mobile
flutter build ios --release
```

Then archive/sign in Xcode for TestFlight/App Store.

## D) Runtime Configuration in Flutter

At app launch, set:
- Backend URL (public server URL)
- Event passcode (demo default: `123456`)
- Mode (bidder/admin)
