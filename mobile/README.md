# BidFlow Flutter App (Android + iOS)

This folder contains the Flutter client that replaces the previous Swift-only iOS path.

## 1) Generate platform scaffolding (first time)

If `android/` and `ios/` are not present yet:

```bash
cd mobile
flutter create . --platforms=android,ios --project-name bidflow_mobile
```

Then re-run:

```bash
flutter pub get
```

## 2) Run locally

Make sure backend is running first (`../server.js`), then:

```bash
cd mobile
flutter pub get
flutter run
```

Default backend URL in app is `http://10.0.2.2:3000` (Android emulator).
If testing on iOS simulator, use `http://localhost:3000`.
If testing on physical device, use your machine LAN IP.

## 3) Core features in app

- Bidder: join event, register, browse items, place bids, create/join/leave groups, view personal bids/profile
- Admin: dashboard, manage items, register walk-ins, manage/merge groups, auctioneer controls (open/close), checkout + export CSV + mark paid

## 4) Code structure

- `lib/main.dart`: app bootstrap
- `lib/src/app.dart`: MaterialApp shell
- `lib/src/state/app_state.dart`: REST + Socket.IO state manager
- `lib/src/ui/ui.dart`: bidder/admin screens and tabs

## 5) Release builds

Android:

```bash
flutter build apk --release
# or
flutter build appbundle --release
```

iOS (requires Xcode + signing):

```bash
flutter build ios --release
```

For App Store/TestFlight distribution, archive from Xcode after build.
