# BidFlow - Quick Start (Flutter + MongoDB)

## 5-Minute Setup

### 1) Backend

```bash
cp .env.example .env
# set MONGODB_URI
npm install
npm start
```

### 2) Flutter mobile app

```bash
cd mobile
flutter create . --platforms=android,ios --project-name bidflow_mobile
flutter pub get
flutter run
```

## What You Get

✅ Existing web app still works (`/admin.html`, `/display.html`, bidder pages)  
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

1. Open `/admin.html` on laptop
2. Open `/display.html` on second screen/projector
3. Run Flutter app on mobile and join same event
4. Register bidder(s), place bids, create groups
5. Use Flutter admin mode or web admin to open/close items and checkout
