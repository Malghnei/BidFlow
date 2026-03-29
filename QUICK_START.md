# BidFlow - Quick Start (React Web + MongoDB)

## 5-Minute Setup

### 1) Install dependencies

```bash
npm install
cd web && npm install && cd ..
```

### 2) Build web app

```bash
npm run build
```

### 3) Run backend + web

```bash
cp .env.example .env
# set MONGODB_URI
npm start
```

### 4) Open app

- Bidder: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`
- Live display: `http://localhost:3000/display`

## What You Get

✅ Refactored React web app with route-based pages  
✅ Flutter app for Android + iOS  
✅ Bidder flow (join/register/items/bids/groups/profile)  
✅ Full admin flow (dashboard/items/bidders/groups/auctioneer/checkout)  
✅ Real-time updates via Socket.IO  
✅ MongoDB persistence via snapshot storage (`MONGODB_URI`)  

## Demo Defaults

- Event passcode: `123456`
- Backend URL:
  - Android emulator: `http://10.0.2.2:3000`
  - iOS simulator: `http://localhost:3000`
  - Physical phone: `http://<your-lan-ip>:3000`

## Fast Demo Flow

1. Open `/admin` on laptop
2. Open `/display` on second screen/projector
3. Run Flutter app on mobile and join same event
4. Register bidder(s), place bids, create groups
5. Use Flutter admin mode or web admin to open/close items and checkout
