# BidFlow iOS App - Complete Setup Guide

## Project Overview

BidFlow is a complete, production-ready SwiftUI iOS application for tracking charity auction bids. The app is designed for iOS 17+ and uses modern Swift features including the `@Observable` macro and async/await patterns.

## File Structure

```
BidFlow/ios/BidFlow/
├── BidFlowApp.swift                 # App entry point with NavigationStack
├── Models/
│   ├── Event.swift                  # Event data model
│   ├── Bidder.swift                 # Bidder profile with anonymity modes
│   ├── Item.swift                   # Auction item with bid tracking
│   ├── Bid.swift                    # Bid records with status
│   └── Group.swift                  # Group bidding with members
├── ViewModels/
│   ├── AppState.swift               # Observable app state (auth, event, bidder)
│   ├── ItemsViewModel.swift         # Items fetching and management
│   └── GroupBidViewModel.swift      # Group operations
├── Services/
│   ├── APIService.swift             # Singleton API client with all endpoints
│   └── WebSocketService.swift       # Polling-based real-time updates
└── Views/
    ├── JoinEventView.swift          # Passcode entry screen
    ├── RegisterView.swift           # Profile creation form
    ├── ItemGalleryView.swift        # Main grid gallery with tabs
    ├── ItemDetailView.swift         # Bid and group management
    ├── MyBidsView.swift             # Bid history
    ├── ProfileView.swift            # User profile
    └── Components/
        ├── ItemCard.swift           # Grid card component
        ├── BidCard.swift            # Bid history component
        ├── GroupRivalryCard.swift   # Group rivalry display
        └── ContributionEditor.swift # Contribution amount editor
```

## Key Features Implemented

### 1. User Onboarding
- **JoinEventView**: Beautiful landing with 6-digit passcode entry
- **RegisterView**: Multi-field form with:
  - First/Last name
  - Email and phone
  - Anonymity mode selector (Real Name, Nickname, Anonymous)
  - Apple Pay linking UI
  - Bidder code display after registration

### 2. Auction Browsing
- **ItemGalleryView**: 2-column responsive grid with:
  - Pull-to-refresh capability
  - Live status indicators
  - Current bid display
  - Group member count badges
  - Tab navigation (Items, My Bids, Profile)

### 3. Bidding System
- **ItemDetailView**: Complete bid management with:
  - Item image gallery
  - Current/starting bid display
  - Manual amount input with stepper
  - Quick bid buttons (+$5, +$10, +$25, +$50)
  - Bid history with timestamps and status

### 4. Group Bidding
- Create collaborative bidding groups
- Join existing groups with join codes
- Display group members and contributions
- Update contribution amounts
- Rivalry visualization with progress bars

### 5. Real-time Updates
- **WebSocketService**: Polling-based updates every 2 seconds
  - Item updates published via Combine
  - Automatic refresh of bid history
  - Group membership changes

### 6. User Management
- **ProfileView**: Complete profile dashboard with:
  - Bidder code display
  - Email and phone info
  - Anonymity mode selection
  - Payment status
  - Check-in status
  - Logout functionality

## Design System

### Color Palette
- **Primary (Teal)**: `#0D5C63` - Main UI elements, buttons, links
- **Secondary (Sage Green)**: `#1A936F` - Accents, secondary actions, success states
- **Accent (Amber)**: `#F4A261` - Highlights, status badges, warnings

### Typography
- Headlines: System font, 17-24pt, semibold/bold
- Body: System font, 14-16pt, regular
- Captions: System font, 11-13pt, regular/semibold

### Layout
- Spacing unit: 4pt (multiples of 4)
- Corner radius: 8-12pt
- Button height: 50pt
- Card padding: 12-16pt

## Setup Instructions

### Step 1: Create Xcode Project
```bash
# In Xcode:
File → New → Project
Select iOS → App
- Product Name: BidFlow
- Interface: SwiftUI
- Language: Swift
```

### Step 2: Add Project Files
1. Delete the default `ContentView.swift`
2. Drag the entire BidFlow folder contents into Xcode
3. Ensure "Copy items if needed" is checked
4. Target is set to BidFlow

### Step 3: Configure API Endpoint
Edit `Services/APIService.swift`:
```swift
var baseURL: String = "http://192.168.1.XX:3000"  // Replace with your IP
```

### Step 4: Run the App
```bash
# In Xcode:
Cmd + R  # Build and run
```

## API Integration

### Required Backend Endpoints

**Events**
- `POST /api/events/join` - Join with passcode → Returns eventId, eventName
- `GET /api/events/{eventId}/items` - Fetch all items for event

**Bidders**
- `POST /api/events/{eventId}/bidders` - Register new bidder → Returns Bidder

**Items**
- `GET /api/events/{eventId}/items/{itemId}` - Get item details
- `GET /api/events/{eventId}/items/{itemId}/bids` - Get bid history

**Bids**
- `POST /api/events/{eventId}/items/{itemId}/bids` - Place bid → Returns Bid

**Groups**
- `GET /api/events/{eventId}/items/{itemId}/groups` - List groups for item
- `POST /api/events/{eventId}/items/{itemId}/groups` - Create new group
- `POST /api/events/{eventId}/groups/{groupId}/join` - Join group
- `PATCH /api/events/{eventId}/groups/{groupId}/members/{bidderId}` - Update contribution
- `PATCH /api/events/{eventId}/groups/{groupId}/leave` - Leave group

### Request/Response Format Example

```swift
// Join Event Request
{
  "passcode": "123456"
}

// Join Event Response
{
  "eventId": "evt_123",
  "eventName": "Western IRC Charity Auction 2024"
}

// Register Bidder Request
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1 555 123 4567",
  "anonymityMode": "realName",
  "customName": null
}

// Register Bidder Response
{
  "id": "bddr_123",
  "eventId": "evt_123",
  "bidderNumber": 42,
  "bidderCode": "ABC42XYZ",
  "firstName": "John",
  "lastName": "Doe",
  "displayName": "John Doe",
  "anonymityMode": "realName",
  "email": "john@example.com",
  "phone": "+1 555 123 4567",
  "paymentLinked": true,
  "checkedIn": false
}
```

## State Management

### AppState (Observable)
Central state container with:
- `currentEvent?: Event` - Active event
- `currentBidder?: Bidder` - Logged-in bidder
- `isLoggedIn: Bool` - Auth state
- `baseURL: String` - API endpoint
- Computed properties: `authHeaders`, `eventId`, `bidderId`

### View Models
- **ItemsViewModel**: Manages item fetching, caching, and refresh
- **GroupBidViewModel**: Handles group creation, joining, and updates
- All marked as `@Observable` for reactive updates

## iOS Features Used

- **@Observable**: Modern state management without ObservedObject
- **NavigationStack**: Declarative navigation with state preservation
- **AsyncImage**: Native image loading with placeholder states
- **@MainActor**: Thread-safe UI updates
- **Combine**: Real-time event publishing
- **URLSession**: Native HTTP client with async/await

## Hackathon Demo Tips

1. **Pre-test with Backend**: Have a working backend running before the demo
2. **Test Data**: Create several items with different bid states (upcoming, live, sold)
3. **Group Demo**: Create test groups to showcase collaboration features
4. **Network**: Use a stable local network, not cellular
5. **Device**: Demo on a real iPhone for best visual impact
6. **Light/Dark**: Test both light and dark mode appearances

## Common Customizations

### Change Primary Colors
Edit color values in Views:
```swift
Color(red: 0.05, green: 0.36, blue: 0.39)  // Replace these values
```

### Adjust Item Grid
In `ItemGalleryView.swift`:
```swift
private let columns = [
    GridItem(.flexible(), spacing: 16),  // Change 16 to your spacing
    GridItem(.flexible(), spacing: 16)
]
```

### Modify Poll Interval
In `WebSocketService.swift`:
```swift
try await Task.sleep(nanoseconds: 2_000_000_000)  // Change 2 to your seconds
```

### Update API Timeout
In `APIService.swift`:
```swift
config.timeoutIntervalForRequest = 10  // Change 10 to your seconds
```

## Performance Optimization

1. **Image Caching**: AsyncImage automatically caches responses
2. **Polling**: Only enabled when ItemGalleryView is active
3. **Lazy Loading**: LazyVGrid only renders visible items
4. **Data Models**: Lightweight Codable structs
5. **Async/Await**: Non-blocking network requests

## Troubleshooting

### Build Errors
- Ensure iOS 17+ is selected as minimum deployment target
- Check that all files are in the correct folder structure
- Verify BidFlowApp.swift has `@main` attribute

### Runtime Errors
- Verify API base URL is correct and backend is running
- Check network connectivity on the device
- Enable verbose logging in APIService for debugging

### UI Issues
- Test on different device sizes (SE, Pro, Pro Max)
- Check both light and dark mode appearance
- Verify colors are accessible (WCAG AA)

## File Summary

| File | Lines | Purpose |
|------|-------|---------|
| BidFlowApp.swift | 20 | App entry point |
| Models/*.swift | 200 | Data structures |
| ViewModels/*.swift | 150 | State management |
| Services/*.swift | 300 | API + real-time |
| Views/*.swift | 1200 | UI components |
| Components/*.swift | 300 | Reusable widgets |
| Total | ~2300 | Complete app |

## Next Steps

1. Create your backend API using the endpoint specifications
2. Test each screen with real data
3. Customize branding/colors as needed
4. Add push notifications (optional)
5. Implement error handling edge cases
6. Add comprehensive logging for debugging

All files are ready to use - just copy them into your Xcode project and configure the API endpoint!
