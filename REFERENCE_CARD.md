# BidFlow iOS - Quick Reference Card

## Files at a Glance

### By Category

#### App Entry (1)
- `BidFlowApp.swift` - NavigationStack setup, environment binding

#### Models (5)
- `Event.swift` - Event data (id, name, date, venue, status, passcode)
- `Bidder.swift` - User profile + AnonymityMode enum
- `Item.swift` - Auction item + ItemStatus + BidType enums
- `Bid.swift` - Bid record with status and formatting
- `Group.swift` - Group with members (GroupMember sub-struct)

#### ViewModels (3)
- `AppState.swift` - @Observable with currentEvent, currentBidder, isLoggedIn
- `ItemsViewModel.swift` - @Observable with items[], isLoading, fetchItems()
- `GroupBidViewModel.swift` - @Observable with currentGroup, availableGroups[]

#### Services (2)
- `APIService.swift` - Singleton, all endpoints, async/await, error handling
- `WebSocketService.swift` - Polling updates, Combine publishers

#### Views (6)
- `JoinEventView.swift` - Passcode entry + navigation to Register
- `RegisterView.swift` - Profile form + anonymity mode + bidder code sheet
- `ItemGalleryView.swift` - 2-column grid + tabs (Items/Bids/Profile)
- `ItemDetailView.swift` - Bid/Group/History tabs + group management
- `MyBidsView.swift` - Bid list grouped by status
- `ProfileView.swift` - Profile info + logout

#### Components (4)
- `ItemCard.swift` - Grid card (image, price, status, groups)
- `BidCard.swift` - Bid entry (amount, status, timestamp)
- `GroupRivalryCard.swift` - Group display with progress bar + members
- `ContributionEditor.swift` - Slider for amount editing

## Key Code Snippets

### Access AppState
```swift
@Environment(AppState.self) private var appState

// Use:
appState.currentBidder?.displayName
appState.isLoggedIn
```

### Observable ViewModel
```swift
@State private var viewModel = ItemsViewModel()

// In body:
.task {
    await viewModel.fetchItems(eventId: eventId)
}
```

### API Call
```swift
let items: [Item] = try await APIService.shared.get(
    from: "/api/events/\(eventId)/items"
)
```

### Async/Await Task
```swift
Task {
    do {
        let result = try await someAsyncFunction()
        await MainActor.run {
            // Update UI on main thread
            self.state = result
        }
    } catch {
        // Handle error
    }
}
```

### Color Usage
```swift
Color(red: 0.05, green: 0.36, blue: 0.39)    // Primary Teal
Color(red: 0.26, green: 0.58, blue: 0.44)    // Secondary Sage
Color(red: 0.96, green: 0.64, blue: 0.38)    // Accent Amber
```

## Screen Navigation Map

```
JoinEventView
    ↓ (passcode valid)
RegisterView
    ↓ (registration complete, show code)
ItemGalleryView ← MAIN HUB
    ├─ Tab: Items
    │   ↓ (select item)
    │   ItemDetailView
    │       ├─ Tab: Place Bid
    │       ├─ Tab: Groups
    │       │   ├─ CreateGroupSheet
    │       │   └─ JoinGroupSheet
    │       └─ Tab: History
    │
    ├─ Tab: My Bids
    │   └─ MyBidsView
    │
    └─ Tab: Profile
        └─ ProfileView
            └─ Log Out → back to JoinEventView
```

## API Endpoints Summary

```
Join Event
  POST /api/events/join
  { "passcode": "123456" }
  → { "eventId", "eventName" }

Register Bidder
  POST /api/events/{eventId}/bidders
  { firstName, lastName, email, phone, anonymityMode, customName }
  → Bidder object

Fetch Items
  GET /api/events/{eventId}/items
  → [Item] array

Place Bid
  POST /api/events/{eventId}/items/{itemId}/bids
  { "bidderId", "amount" }
  → Bid object

Create Group
  POST /api/events/{eventId}/items/{itemId}/groups
  { "groupName", "leaderId", "initialContribution" }
  → Group object

Join Group
  POST /api/events/{eventId}/groups/{groupId}/join
  { "bidderId", "contribution" }
  → Group object

Update Contribution
  PATCH /api/events/{eventId}/groups/{groupId}/members/{bidderId}
  { "contribution" }
  → Group object

Leave Group
  PATCH /api/events/{eventId}/groups/{groupId}/leave
  { "bidderId" }
  → Group object
```

## Common Customizations

### Change Primary Color Everywhere
Find and replace:
```swift
Color(red: 0.05, green: 0.36, blue: 0.39)
```

### Update Polling Interval
In `WebSocketService.swift`:
```swift
try await Task.sleep(nanoseconds: 2_000_000_000)  // Change 2
```

### Adjust Grid Columns
In `ItemGalleryView.swift`:
```swift
private let columns = [
    GridItem(.flexible(), spacing: 16),
    GridItem(.flexible(), spacing: 16)
    // Add more GridItem() for more columns
]
```

### Set API Base URL
In `APIService.swift`:
```swift
var baseURL: String = "http://YOUR_IP:3000"
```

## File Size Reference

| File | Lines | Purpose |
|------|-------|---------|
| BidFlowApp.swift | 20 | Entry point |
| AppState.swift | 30 | State |
| APIService.swift | 180 | API |
| WebSocketService.swift | 60 | Updates |
| Item.swift | 50 | Model |
| Bidder.swift | 40 | Model |
| Event.swift | 15 | Model |
| Bid.swift | 40 | Model |
| Group.swift | 50 | Model |
| ItemsViewModel.swift | 35 | Logic |
| GroupBidViewModel.swift | 65 | Logic |
| JoinEventView.swift | 85 | UI |
| RegisterView.swift | 180 | UI |
| ItemGalleryView.swift | 90 | UI |
| ItemDetailView.swift | 250 | UI |
| MyBidsView.swift | 100 | UI |
| ProfileView.swift | 100 | UI |
| ItemCard.swift | 80 | Component |
| BidCard.swift | 65 | Component |
| GroupRivalryCard.swift | 95 | Component |
| ContributionEditor.swift | 90 | Component |

## iOS 17+ Features Used

- `@Observable` macro for state
- `NavigationStack` for routing
- `async/await` for concurrency
- `@Environment` for dependency injection
- `AsyncImage` for image loading
- `@MainActor` for UI thread safety
- `Combine` for reactive updates
- Native `URLSession` with async

## Testing Scenarios

### Scenario 1: Complete User Journey
1. App launches → JoinEventView
2. Enter "123456" → RegisterView
3. Fill form → ItemGalleryView
4. Browse items → ItemDetailView
5. Place bid → Success message
6. Check My Bids → See bid
7. View Profile → See info
8. Log out → Back to JoinEventView

### Scenario 2: Group Bidding
1. Open ItemDetailView
2. Go to "Groups" tab
3. Click "Start a Group"
4. Create group with $50
5. Go back
6. Join same group
7. Update contribution to $100
8. See totals update

### Scenario 3: Error Handling
1. Wrong passcode → Error message
2. Invalid bid → Error message
3. Network error → Error message
4. Missing data → Error message

## Debug Tips

### Check AppState
```swift
print("Event: \(appState.currentEvent?.name ?? "None")")
print("Bidder: \(appState.currentBidder?.displayName ?? "None")")
print("Logged in: \(appState.isLoggedIn)")
```

### Log API Calls
In `APIService.swift`, add:
```swift
print("🔵 GET \(endpoint)")
```

### Monitor State Changes
In view:
```swift
.onChange(of: appState.currentBidder) { old, new in
    print("Bidder changed: \(new?.displayName ?? "None")")
}
```

### Check Network
On device settings:
- Developer → Enable Wi-Fi logging
- Console shows all network traffic

## Performance Optimization Tips

1. **Images**: AsyncImage caches automatically
2. **Grid**: LazyVGrid renders visible items only
3. **Network**: Reduce polling interval if possible
4. **Memory**: Remove image URL cache if needed
5. **CPU**: Profile with Xcode Instruments

## Troubleshooting Quick Fix

| Issue | Solution |
|-------|----------|
| "Cannot find type AppState" | Ensure AppState.swift imported |
| API not working | Check baseURL IP address |
| Images not loading | Verify imageUrl is valid URL |
| Crashes on registration | Check Bidder model fields |
| Bids not appearing | Check bid polling is active |
| Groups not loading | Verify API endpoint exists |

## Before Submission

- [ ] All 21 Swift files added to Xcode
- [ ] API baseURL configured with your IP
- [ ] BidFlowApp set as @main
- [ ] Builds without errors (Cmd + B)
- [ ] Runs on iPhone (Cmd + R)
- [ ] Can complete full user flow
- [ ] Backend API is running
- [ ] All color scheme matches design

## File Locations

```
Project Root:
  └─ /ios/BidFlow/
      ├─ BidFlowApp.swift
      ├─ Models/ (5 files)
      ├─ ViewModels/ (3 files)
      ├─ Services/ (2 files)
      └─ Views/ (6 files + Components subfolder with 4 files)
```

## Color Codes Quick Reference

- **Teal Primary**: `(0.05, 0.36, 0.39)` or `#0D5C63`
- **Sage Secondary**: `(0.26, 0.58, 0.44)` or `#1A936F`
- **Amber Accent**: `(0.96, 0.64, 0.38)` or `#F4A261`
- **Gray Text**: `(0.55, 0.55, 0.55)` or `#8B8B8B`

## Next Step

→ Start with: `QUICK_START.md`
