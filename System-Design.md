**SYSTEM DESIGN DOCUMENT**

**BidFlow**

_Real-Time Charity Auction Bid Tracking with Group Rivalries_

Islamic Relief Canada · Western University IRC · Hackathon Stream

March 2026 · v2.0

# Table of Contents

1\. Executive Summary ................................................................................ 3

2\. Requirements Analysis ................................................................................ 3

3\. System Architecture ................................................................................ 6

4\. Data Model ................................................................................ 8

5\. API Design ................................................................................ 11

6\. Real-Time Sync Layer ................................................................................ 14

7\. Group Bidding System (Deep Dive) ................................................................................ 15

8\. Anonymity and Display Names ................................................................................ 18

9\. Payment Gateway (Stripe Pre-Auth) ................................................................................ 19

10\. SwiftUI iOS App Design ................................................................................ 21

11\. Web Admin Dashboard ................................................................................ 24

12\. Live Display - Group vs. Group Showdown ................................................................................ 25

13\. Checkout and Payment Flow ................................................................................ 26

14\. Scale and Reliability ................................................................................ 27

15\. Security ................................................................................ 28

16\. Trade-Off Analysis ................................................................................ 29

17\. Tech Stack Summary ................................................................................ 30

18\. Development Roadmap ................................................................................ 30

# 1\. Executive Summary

BidFlow is a real-time bid tracking application purpose-built for live charity auctions run by Islamic Relief Canada and university chapters. It replaces error-prone paper-based and spreadsheet systems with a modern digital platform where every bidder has a proper account and every dollar is tracked.

The system has three major differentiators from typical auction apps:

**Group vs. Group Rivalries:** Two or more named groups (e.g., Brothers vs. Sisters, Table 5 vs. Table 8) compete on the same item with a live tug-of-war display. Members join groups via a short code or QR scan and contribute individually. Groups can merge when allies want to combine forces.

**Bidder Anonymity:** Every bidder chooses a display name-their real name, a nickname, or "Anonymous." The live display and other bidders never see real identities. No more tracking people by "guy with a hat." Each bidder is a proper account with a unique code, solving the lost-donation problem.

**Integrated Payment via Stripe:** When a bidder registers, they link Apple Pay or a card. The system places a pre-authorization hold that adjusts as bids change. When the auction closes, holds convert to actual charges. No volunteers chasing cash. No awkward conversations about donation amounts. Fully private.

The platform consists of a native SwiftUI iOS app (runs from Xcode onto iPhone), a Next.js web admin dashboard, and a real-time Node.js backend.

# 2\. Requirements Analysis

## 2.1 Functional Requirements

| **ID** | **Requirement**                                                                                                          | **Priority** |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------ |
| FR-01  | Register bidders with name, contact, unique bidder code, and display name preference (real name, nickname, or anonymous) | Must Have    |
| FR-02  | Create and manage auction items with description, starting bid, images, and categories                                   | Must Have    |
| FR-03  | Record individual bids in real-time with bidder ID, item, and amount                                                     | Must Have    |
| FR-04  | Group bidding: create named groups with join codes and QR codes. Members contribute individually.                        | Must Have    |
| FR-05  | Group vs. Group rivalry: display two or more groups competing on an item with live totals                                | Must Have    |
| FR-06  | Group merging: allow two existing groups on the same item to merge into one, preserving all contributions                | Must Have    |
| FR-07  | Individual contribution editing: each group member can increase or decrease their own amount at any time                 | Must Have    |
| FR-08  | Bidder anonymity: display names on live screen, real identity only visible to admins and the bidder themselves           | Must Have    |
| FR-09  | Stripe payment integration: pre-authorize on bid, adjust holds on changes, charge on auction close                       | Must Have    |
| FR-10  | Apple Pay support for frictionless mobile payment linking                                                                | Must Have    |
| FR-11  | Generate checkout summaries with per-bidder payment breakdowns (auto-charged or manual fallback)                         | Must Have    |
| FR-12  | Live group-vs-group display for projector/TV with tug-of-war animation                                                   | Should Have  |
| FR-13  | Push notifications for outbid alerts, group invites, and payment confirmations                                           | Should Have  |
| FR-14  | QR code bidder check-in at event entry                                                                                   | Should Have  |
| FR-15  | Export auction results to CSV/PDF                                                                                        | Should Have  |
| FR-16  | Support multiple concurrent events with per-chapter Stripe Connect accounts                                              | Could Have   |

## 2.2 Non-Functional Requirements

| **Category** | **Requirement**                                       | **Target**        |
| ------------ | ----------------------------------------------------- | ----------------- |
| Performance  | Bid submission to screen update                       | < 500ms           |
| Scale        | Concurrent connected devices                          | 200+ simultaneous |
| Availability | Uptime during live events                             | 99.9%             |
| Latency      | API response time (P95)                               | < 200ms           |
| Payment      | Stripe pre-auth hold creation                         | < 2 seconds       |
| Offline      | iOS app queues bids if connectivity drops             | 30-second buffer  |
| Privacy      | Bidder real identity never exposed on public displays | Zero leakage      |
| Data         | Zero data loss on bids                                | Write-ahead log   |

## 2.3 Constraints

**Team size:** Small hackathon team (3-5 developers).

**Timeline:** MVP within hackathon timeframe; production-ready within 4-6 weeks.

**Platform:** iOS app must run on iPhone via Xcode. Web dashboard on any modern browser.

**Payment:** Stripe for payment processing. IRC can optionally use Stripe Connect for multi-chapter routing.

**Budget:** Free-tier cloud where possible. Stripe charges 2.9% + \$0.30 per transaction (standard nonprofit rate).

# 3\. System Architecture

## 3.1 High-Level Overview

The system follows a client-server architecture with real-time WebSocket sync, Stripe for payment processing, and MongoDB for flexible data storage.

**Architecture Overview**

┌───────────────────────────────────────────────────────────────────────┐

│ CLIENTS │

│ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────┐ │

│ │ SwiftUI iOS App │ │ Web Admin Dashboard │ │ Live Display │ │

│ │ + Apple Pay │ │ (Organizer/MC) │ │ (Projector) │ │

│ └──────────┬──────────┘ └──────────┬──────────┘ └────────┬────────┘ │

└─────────────┴─────────────────┴──────────────────┴────────────────────┘

│ HTTPS + WSS │

┌──────┴──────────┴───────┐

│ API GATEWAY / LB │

└───────────┬─────────────┘

│

┌─────────────┴──────────────┐

│ Node.js + Fastify │

│ REST API + WebSocket │

│ + Stripe SDK │

└────┬───────┬───────┬──────┬────┘

│ │ │ │

┌───────┴─┐ ┌───┴───┐ ┌──┴───┐ ┌─┴──────┐

│ MongoDB │ │ Redis │ │ R2 │ │ Stripe │

│ (Atlas) │ │(Cache) │ │(Imgs) │ │ (Pays) │

└─────────┘ └───────┘ └──────┘ └────────┘

## 3.2 Technology Choices

| **Layer**     | **Technology**          | **Rationale**                                                                     |
| ------------- | ----------------------- | --------------------------------------------------------------------------------- |
| iOS Client    | SwiftUI + Swift 5.9     | Native performance, Xcode deployment to iPhone, Apple Pay integration via PassKit |
| Web Dashboard | Next.js 14 (React)      | SSR, API routes, fast iteration                                                   |
| Backend API   | Node.js + Fastify       | High-throughput, native WebSocket, easy JSON, Stripe Node SDK                     |
| Real-Time     | Socket.IO               | Auto-reconnection, room-based broadcast, HTTP polling fallback                    |
| Database      | MongoDB Atlas (M0 free) | Flexible schema, free tier, built-in replication                                  |
| Cache         | Redis (Upstash free)    | Sub-ms reads for leaderboard, pub/sub for multi-instance sync                     |
| Payment       | Stripe + Stripe Connect | Pre-auth holds, Apple Pay, per-chapter routing, 2.9% + \$0.30                     |
| File Storage  | Cloudflare R2           | Free egress, S3-compatible, cheap image hosting                                   |
| Hosting       | Railway / Render        | One-click deploy, free tier, auto-scaling                                         |

## 3.3 Component Responsibilities

| **Component** | **Responsibilities**                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS App       | Bidder registration, Apple Pay linking, bid placement, group creation/joining via code or QR, contribution editing, anonymous display name selection, push notifications, offline bid queuing |
| Web Dashboard | Event setup, item management, auctioneer controls, live monitoring, group management, checkout processing, Stripe payment status, export reports                                              |
| Live Display  | Read-only projector/TV view: group-vs-group tug-of-war, current item, bid animations. Shows display names only, never real identities.                                                        |
| API Server    | Business logic, bid validation, group aggregation, group merging, Stripe pre-auth hold management, WebSocket broadcast, anonymity enforcement                                                 |
| MongoDB       | Primary data store: events, bidders, items, bids, groups, payment records                                                                                                                     |
| Redis         | Real-time leaderboard (sorted sets), group total caching, WebSocket pub/sub                                                                                                                   |
| Stripe        | Payment method vault, pre-authorization holds, hold adjustments, final charges, Apple Pay tokens, Stripe Connect multi-chapter routing                                                        |

# 4\. Data Model

## 4.1 Entity Relationship

The data model centers around six core entities. An Event contains Items and Bidders. Bids link Bidders to Items. Groups contain Members with individual contributions. PaymentHolds track Stripe pre-authorizations per bidder.

Event (1) ───< (\*) Item

│

├──────< (\*) Bidder ───< (\*) PaymentHold

│ │

│ ├───&lt; (\*) Bid ───&gt; (1) Item

│ │

│ └───&lt; (\*) GroupMember ──&gt; (1) Group

│

└──────&lt; (\*) Group ───&gt; (1) Item

## 4.2 Collection Schemas

**bidders**

\_id: ObjectId

eventId: ObjectId ref -> events

bidderCode: String unique 6-char code (e.g., "BF3K9X")

bidderNumber: Number auto-increment per event

firstName: String real name (admin-only visible)

lastName: String real name (admin-only visible)

displayName: String public name chosen by bidder

anonymityMode: Enum real_name | nickname | anonymous

email: String

phone: String

tableNumber: Number optional seating

stripeCustomerId: String Stripe customer ID

paymentMethodId: String default payment method (Apple Pay / card)

paymentLinked: Boolean true if payment method on file

checkedIn: Boolean false

checkedInAt: Date

createdAt: Date

**groups**

\_id: ObjectId

eventId: ObjectId ref -> events

itemId: ObjectId ref -> items (the item being bid on)

groupName: String "Brothers" / "Sisters" / "Table 5"

joinCode: String unique 4-digit code (e.g., "8472")

qrCodeUrl: String QR code image URL encoding the joinCode

leaderId: ObjectId ref -> bidders (group creator)

totalAmount: Number computed sum of all member contributions

members: \[{

bidderId: ObjectId ref -> bidders

displayName: String cached from bidder profile

contribution: Number individual pledge amount

holdId: String Stripe PaymentIntent ID for this hold

holdStatus: Enum pending | held | charged | released

joinedAt: Date

updatedAt: Date

}\]

mergedFrom: \[ObjectId\] IDs of groups that merged into this one

status: Enum active | won | lost | merged

createdAt: Date

updatedAt: Date

**items**

\_id: ObjectId

eventId: ObjectId ref -> events

lotNumber: Number display order

title: String "Weekend Getaway Package"

description: String

imageUrl: String R2 presigned URL

startingBid: Number 100

currentBid: Number denormalized highest bid

currentBidder: ObjectId ref -> bidders or groups

currentBidType: Enum individual | group

bidCount: Number denormalized

activeGroups: \[ObjectId\] groups currently competing on this item

status: Enum upcoming | live | sold | unsold

category: String optional

createdAt: Date

**bids**

\_id: ObjectId

eventId: ObjectId

itemId: ObjectId

bidderId: ObjectId ref -> bidders (null if group bid)

groupId: ObjectId ref -> groups (null if individual)

amount: Number 150

type: Enum individual | group

displayName: String cached display name at time of bid

timestamp: Date server-assigned

source: Enum ios | web | manual

status: Enum active | outbid | winning

**paymentHolds**

\_id: ObjectId

eventId: ObjectId

bidderId: ObjectId

itemId: ObjectId

groupId: ObjectId null if individual bid

stripePaymentIntentId: String Stripe PI ID

amount: Number current hold amount (cents)

status: Enum pending | authorized | captured | canceled

createdAt: Date

updatedAt: Date

## 4.3 Key Indexes

| **Collection** | **Index**                             | **Purpose**                     |
| -------------- | ------------------------------------- | ------------------------------- |
| bidders        | { eventId: 1, bidderCode: 1 }         | Unique bidder lookup by code    |
| groups         | { eventId: 1, joinCode: 1 }           | Group lookup by join code       |
| groups         | { eventId: 1, itemId: 1, status: 1 }  | Active groups on an item        |
| groups         | { "members.bidderId": 1 }             | Find groups a bidder belongs to |
| bids           | { eventId: 1, itemId: 1, amount: -1 } | Highest bid per item            |
| paymentHolds   | { bidderId: 1, status: 1 }            | Active holds for a bidder       |

# 5\. API Design

All endpoints use JSON. Authentication via JWT. Base URL: <https://api.bidflow.app/v1>

## 5.1 Authentication

| **Method** | **Endpoint**      | **Description**                                           |
| ---------- | ----------------- | --------------------------------------------------------- |
| POST       | /auth/join        | Join event with passcode, returns JWT with bidder context |
| POST       | /auth/admin/login | Admin login with email + password                         |
| POST       | /auth/refresh     | Refresh expired JWT                                       |

## 5.2 Bidders

| **Method** | **Endpoint**                               | **Description**                                             |
| ---------- | ------------------------------------------ | ----------------------------------------------------------- |
| POST       | /events/:id/bidders                        | Register bidder (name, display name, anonymity mode)        |
| GET        | /events/:id/bidders/:bidderId              | Get bidder details (own profile or admin view)              |
| PATCH      | /events/:id/bidders/:bidderId              | Update display name or anonymity mode                       |
| POST       | /events/:id/bidders/:bidderId/link-payment | Link Stripe payment method (Apple Pay token or card)        |
| GET        | /events/:id/bidders/:bidderId/qr           | Get bidder's QR code (encodes bidderCode for group invites) |

## 5.3 Items

| **Method** | **Endpoint**                    | **Description**                                        |
| ---------- | ------------------------------- | ------------------------------------------------------ |
| POST       | /events/:id/items               | Create auction item (admin)                            |
| GET        | /events/:id/items               | List all items with current bid and active group count |
| PATCH      | /events/:id/items/:itemId       | Update item details                                    |
| POST       | /events/:id/items/:itemId/open  | Open item for bidding (triggers WebSocket)             |
| POST       | /events/:id/items/:itemId/close | Close bidding, trigger payment captures                |

## 5.4 Individual Bids

| **Method** | **Endpoint**                   | **Description**                                  |
| ---------- | ------------------------------ | ------------------------------------------------ |
| POST       | /events/:id/items/:itemId/bids | Place individual bid (creates Stripe hold)       |
| GET        | /events/:id/items/:itemId/bids | Bid history (display names only, not real names) |

## 5.5 Group Bidding

| **Method** | **Endpoint**                                  | **Description**                                                                     |
| ---------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| POST       | /events/:id/items/:itemId/groups              | Create a group (returns joinCode + QR). Creator sets name and initial contribution. |
| POST       | /events/:id/groups/:groupId/join              | Join group by code or QR scan. Member sets their contribution amount.               |
| POST       | /events/:id/groups/:groupId/add-member        | Group leader scans a bidder's QR to add them. Member confirms and sets amount.      |
| PATCH      | /events/:id/groups/:groupId/members/:bidderId | Update individual contribution (increase or decrease). Adjusts Stripe hold.         |
| POST       | /events/:id/groups/:groupId/merge             | Merge another group into this one. All members and contributions transfer.          |
| GET        | /events/:id/groups/:groupId                   | Get group details (members see display names + own contribution only)               |
| DELETE     | /events/:id/groups/:groupId/members/:bidderId | Leave a group. Releases that member's Stripe hold.                                  |

Create group request body:

{

"groupName": "Brothers",

"contribution": 5000 // in cents (\$50.00)

}

Join group request body:

{

"joinCode": "8472", // or scanned from QR

"contribution": 7500 // in cents (\$75.00)

}

Merge group request body:

{

"sourceGroupId": "abc123" // group to absorb into this one

}

## 5.6 Payments

| **Method** | **Endpoint**                                     | **Description**                                      |
| ---------- | ------------------------------------------------ | ---------------------------------------------------- |
| POST       | /events/:id/bidders/:bidderId/link-payment       | Create Stripe customer + attach payment method       |
| GET        | /events/:id/bidders/:bidderId/holds              | View all active pre-auth holds for this bidder       |
| POST       | /events/:id/checkout/capture-all                 | Admin: capture all winning holds after auction close |
| POST       | /events/:id/checkout/bidder/:bidderId/capture    | Capture specific bidder's holds                      |
| POST       | /events/:id/checkout/bidder/:bidderId/manual-pay | Mark as paid manually (cash/e-transfer fallback)     |
| GET        | /events/:id/checkout/summary                     | Full checkout breakdown with payment statuses        |

# 6\. Real-Time Sync Layer

Every bid, group change, and item status update propagates to all connected clients within 500ms via Socket.IO.

## 6.1 WebSocket Events

| **Event**       | **Direction** | **Payload**                           | **Trigger**           |
| --------------- | ------------- | ------------------------------------- | --------------------- |
| bid:new         | Server → All  | { itemId, amount, displayName, type } | New bid placed        |
| bid:outbid      | Server → User | { itemId, oldAmount, newAmount }      | User outbid           |
| group:updated   | Server → Room | { groupId, total, memberCount }       | Contribution changed  |
| group:joined    | Server → Room | { groupId, displayName }              | New member joined     |
| group:merged    | Server → Room | { targetId, sourceId, newTotal }      | Groups merged         |
| rivalry:update  | Server → All  | { itemId, groups: \[{name, total}\] } | Group totals changed  |
| item:opened     | Server → All  | { itemId, title, startingBid }        | Auctioneer opens item |
| item:closed     | Server → All  | { itemId, winner, finalAmount }       | Bidding closed        |
| payment:held    | Server → User | { amount, itemId }                    | Hold placed/updated   |
| payment:charged | Server → User | { amount, itemId }                    | Final charge captured |

## 6.2 Room Strategy

**event:{eventId} -** All participants. Item opens/closes, leaderboard updates.

**item:{itemId} -** Watchers of a specific item. Bid updates and rivalry updates.

**group:{groupId} -** Group members. Contribution changes, merge notifications.

**user:{bidderId} -** Personal. Outbid alerts, payment confirmations, group invites.

## 6.3 Offline Resilience (iOS)

Bids placed offline are queued in Core Data with timestamps. On reconnection, the queue drains in FIFO order. The server validates each against current state. Stale bids are rejected with a clear error. A sync indicator shows pending/synced status. Stripe holds are only created when the bid is confirmed server-side.

# 7\. Group Bidding System (Deep Dive)

Group bidding is the signature feature of BidFlow. It transforms charity auctions from individual paddle-raising into a team sport with named rivalries, pooled contributions, and competitive energy that drives up donations.

## 7.1 Group Creation

**Step 1:** A bidder opens an item and taps "Start Group."

**Step 2:** They name the group (e.g., "Brothers," "Sisters," "Table 5") and set their own contribution.

**Step 3:** The system generates a 4-digit join code and a QR code. A Stripe pre-auth hold is placed for the creator's contribution.

**Step 4:** The group appears on the live display immediately with the creator's contribution as the starting total.

## 7.2 Joining a Group

There are two ways to join an existing group:

**Code Entry (primary):** The MC announces "Join the Brothers at code 8472!" Anyone opens the item, taps "Join Group," enters 8472, and sets their contribution. Fast and works in a loud room.

**QR Scan (secondary):** The group leader walks around with their phone showing the group's QR code. Others scan it to join instantly. Great for recruiting at tables.

**Leader Adds You:** The group leader can also scan YOUR bidder QR code from your phone to add you. You get a push notification to confirm and set your amount. This is the fastest path when the leader is actively recruiting.

## 7.3 Individual Contribution Editing

Every member controls their own contribution independently. If you pledged \$100 and want to increase to \$150 during the heat of battle, you adjust your amount and the group total updates instantly for everyone. If you need to decrease to \$75, that works too - the system recalculates the group total and adjusts your Stripe hold accordingly.

Crucially, other group members only see the group total change - they never see what you individually contributed. The MC and live display show the group total. Only you and the admin dashboard see your personal amount. This preserves privacy while keeping the competitive energy alive.

## 7.4 Group vs. Group Rivalry

When two or more groups are bidding on the same item, the live display switches to rivalry mode. For example, during a charity dinner the MC might set up "Brothers vs. Sisters" on a high-value item. The display shows:

┌─────────────────────────────────────────────────────────────────┐

│ WEEKEND GETAWAY PACKAGE │

│ │

│ BROTHERS vs. SISTERS │

│ │

│ \$1,250 \$1,475 │

│ 8 members 12 members │

│ │

│ ███████████████████ ████████████████████████ │

│ \[◀ TUG OF WAR BAR ▶\] │

│ │

│ + \$50 from "The Don" + \$100 from "Anonymous" │

│ + \$75 from "Nadia S." + \$25 from "Table Queen" │

└─────────────────────────────────────────────────────────────────┘

The tug-of-war bar shifts in proportion to each group's total. Recent contributions scroll as a live feed showing display names (never real names). The MC can call out contributions to build excitement.

## 7.5 Group Merging

Sometimes two groups on the same side want to combine. For example, two separate groups of brothers both started bidding and now want to join forces against the sisters. The leader of Group A requests a merge with Group B. Group B's leader gets a notification to approve.

On approval, all members and their individual contributions transfer from Group B into Group A. Group B's status changes to "merged" and its join code deactivates. The combined total becomes Group A's new bid. All existing Stripe holds remain attached to their original bidders - no payment disruption.

The merge is atomic: if any step fails, the entire merge rolls back. This is implemented as a MongoDB transaction.

## 7.6 Group Bidding Rules

| **Rule**                      | **Behavior**                                                       |
| ----------------------------- | ------------------------------------------------------------------ |
| Minimum group size            | 1 (a solo person can start a group and recruit later)              |
| Maximum group size            | No limit (the more the merrier for charity)                        |
| Contribution minimum          | \$5 per member (prevents spam joins)                               |
| Contribution changes          | Allowed anytime while item is live. Stripe hold adjusts.           |
| Leave group                   | Allowed anytime. Your contribution is removed, hold released.      |
| Group vs. individual          | Groups compete alongside individual bidders. Highest total wins.   |
| Multiple groups per item      | Unlimited. Rivalry display shows top 2 with a "+N more" indicator. |
| One group per person per item | A bidder can only be in one group per item.                        |

# 8\. Anonymity and Display Names

The "guy with a hat" problem ends here. Every bidder is a proper account with a unique 6-character bidder code. But how they appear to other people is their choice.

## 8.1 Anonymity Modes

| **Mode**  | **Live Display Shows** | **Other Bidders See**     | **Admin Dashboard Shows** |
| --------- | ---------------------- | ------------------------- | ------------------------- |
| Real Name | "Fatima A."            | First name + last initial | Full name + contact       |
| Nickname  | "The Don"              | Chosen nickname           | Full name + nickname      |
| Anonymous | "Anonymous #7"         | Numbered anonymous badge  | Full name + anonymous tag |

The system assigns a unique anonymous number per event to prevent the "multiple anonymous" confusion. Internally, Anonymous #7 maps to a real bidder, but only the admin dashboard reveals the connection.

## 8.2 Privacy Enforcement

**API layer:** All public-facing endpoints (bid history, leaderboard, group members) return displayName, never real names. The API physically strips real names from responses unless the requester is an admin or the bidder themselves.

**WebSocket events:** Broadcast events like bid:new and rivalry:update only include display names.

**Live display:** Never receives real names from the server. Even if someone inspects the WebSocket traffic, they only see display names and anonymous numbers.

**Group members:** Within a group, members see each other's display names but not contribution amounts. Only the group total is visible.

**Checkout:** When Stripe charges are captured, the receipt goes to the bidder's own email. No one else sees the charge amount.

# 9\. Payment Gateway (Stripe Pre-Auth)

No more volunteers chasing cash. No more awkward conversations about donation amounts. Stripe handles everything privately, and bidders never have to reveal what they're contributing to anyone except the system.

## 9.1 Why Stripe

| **Feature**             | **Stripe Advantage**                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| Pre-authorization holds | Native support via PaymentIntents with capture_method: manual                                                  |
| Hold adjustments        | Increment or decrement holds via PaymentIntent.update()                                                        |
| Apple Pay               | Built-in via Stripe iOS SDK + PassKit. One-tap payment linking.                                                |
| Canadian dollars        | Full CAD support with Canadian acquiring banks                                                                 |
| Nonprofit rates         | Standard 2.9% + \$0.30. Stripe offers discounts for registered nonprofits.                                     |
| Stripe Connect          | IRC Canada can be the platform. Each university chapter is a connected account. Donations route automatically. |
| Receipts                | Automatic email receipts to bidders after charge capture                                                       |
| Refunds                 | Easy refund API if a bidder disputes or auction is canceled                                                    |

## 9.2 Payment Flow

Bidder Registers

│

▼

┌────────────────────────────────────────┐

│ Link Payment Method │

│ Apple Pay (one tap) or card entry │

│ -> Creates Stripe Customer │

│ -> Attaches PaymentMethod │

└─────────────────┬──────────────────────┘

│

Bidder Places Bid ▼

┌────────────────────────────────────────┐

│ Create Pre-Auth Hold │

│ PaymentIntent(amount, capture: │

│ manual, customer, payment_method) │

│ -> Hold appears as "pending" on │

│ bidder's Apple Pay / bank app │

└─────────────────┬──────────────────────┘

│

Bid Changes ▼

┌────────────────────────────────────────┐

│ Adjust Hold │

│ Increase: create new PI for delta │

│ Decrease: cancel old, create new PI │

│ -> Pending charge updates on phone │

└─────────────────┬──────────────────────┘

│

Auction Closes ▼

┌────────────────────────────────────────┐

│ WINNERS: Capture holds │

│ PaymentIntent.capture() │

│ -> Pending becomes real charge │

│ -> Receipt emailed to bidder │

│ │

│ LOSERS: Cancel holds │

│ PaymentIntent.cancel() │

│ -> Pending charge disappears │

└────────────────────────────────────────┘

## 9.3 Stripe Connect for IRC Chapters

Islamic Relief Canada acts as the Stripe Connect platform account. Each university chapter (Western, U of T, McGill, etc.) is a connected account. When a donation is captured at a Western event, the funds route to Western's connected account, with IRC Canada optionally taking a small platform fee to cover Stripe costs.

This means IRC Canada gets a unified dashboard of all donations nationwide, while each chapter handles their own events independently. Setup is a one-time process per chapter.

## 9.4 Manual Payment Fallback

Not everyone will want to link a card or use Apple Pay. The system supports a manual payment mode where the bidder opts out of digital payment at registration. Their bids are tracked normally, but no Stripe holds are created. At checkout, a volunteer marks them as paid after collecting cash or an e-transfer. The admin dashboard clearly distinguishes "auto-pay" bidders from "manual-pay" bidders so volunteers know who to follow up with.

# 10\. SwiftUI iOS App Design

## 10.1 App Architecture

MVVM pattern with @Observable ViewModels (Swift 5.9), a service layer for networking and WebSocket, and Stripe iOS SDK for Apple Pay integration.

┌───────────────────────────────────────────────────────────┐

│ Views (SwiftUI) │

│ JoinEvent │ Register │ ItemGallery │ ItemDetail │

│ GroupBid │ MyBids │ Checkout │ PaymentSetup │

└───────────┬──────────┬────────────┬───────────────────────┘

│ │ │

┌───────────┴──────────┴────────────┴───────────────────────┐

│ ViewModels (@Observable) │

│ EventVM │ ItemsVM │ GroupBidVM │ PaymentVM │ ProfileVM │

└───────────┬──────────┬────────────┬───────────────────────┘

│ │ │

┌───────────┴──────────┴────────────┴───────────────────────┐

│ Services │

│ APIService │ WebSocketService │ StripeService │ Queue │

└───────────────────────────────────────────────────────────┘

## 10.2 Screen Flow

| **Screen**    | **Purpose**                                              | **Key Elements**                                                                      |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Join Event    | Enter 6-digit passcode to join an auction                | Passcode input, event name, "Join" button                                             |
| Register      | Create bidder account with display name choice           | Name, contact, display name, anonymity mode selector                                  |
| Payment Setup | Link Apple Pay or card via Stripe                        | Apple Pay button (one tap), manual card entry fallback, "Skip" for cash               |
| Item Gallery  | Browse auction items in a scrollable grid                | Item cards with image, title, current bid, active group indicators                    |
| Item Detail   | View item and place bid or join/create group             | Image, description, bid history, "Place Bid" / "Start Group" / "Join Group"           |
| Group Bid     | Manage group membership and contributions                | Group name, join code, QR display, member list, your contribution slider, group total |
| QR Scanner    | Scan bidder QR to add to group, or scan group QR to join | Camera view with overlay, auto-detect bidder vs. group QR                             |
| My Bids       | View personal bid history and group memberships          | Bids with won/outbid/active status, group cards with your contribution                |
| Checkout      | View items won, amounts owed, payment status             | Auto-charged items, pending charges, receipt links                                    |
| Profile       | Edit display name, anonymity mode, payment method        | Display name editor, anonymity toggle, linked payment info                            |

## 10.3 Xcode Project Structure

BidFlow/

├── BidFlowApp.swift

├── Models/

│ ├── Event.swift

│ ├── Bidder.swift // includes displayName, anonymityMode

│ ├── Item.swift

│ ├── Bid.swift

│ ├── Group.swift // joinCode, members, totalAmount

│ └── PaymentHold.swift

├── ViewModels/

│ ├── EventViewModel.swift

│ ├── ItemsViewModel.swift

│ ├── GroupBidViewModel.swift // group CRUD, join, merge

│ ├── PaymentViewModel.swift // Stripe + Apple Pay

│ └── ProfileViewModel.swift // display name, anonymity

├── Views/

│ ├── JoinEventView.swift

│ ├── RegisterView.swift // includes anonymity picker

│ ├── PaymentSetupView.swift // Apple Pay + card linking

│ ├── ItemGalleryView.swift

│ ├── ItemDetailView.swift

│ ├── GroupBidView.swift // create/join/manage group

│ ├── QRScannerView.swift // camera-based QR scanning

│ ├── MyBidsView.swift

│ ├── CheckoutView.swift

│ ├── ProfileView.swift

│ └── Components/

│ ├── BidCard.swift

│ ├── ItemCard.swift

│ ├── GroupMemberRow.swift

│ ├── ContributionSlider.swift

│ └── RivalryBanner.swift // mini group-vs-group on item

├── Services/

│ ├── APIService.swift

│ ├── WebSocketService.swift

│ ├── StripeService.swift // Stripe iOS SDK wrapper

│ └── OfflineQueueService.swift

├── Utilities/

│ ├── Constants.swift

│ ├── QRGenerator.swift // generate bidder QR codes

│ └── Extensions.swift

└── Resources/

└── Assets.xcassets

# 11\. Web Admin Dashboard

Next.js 14 web app for event organizers, auctioneers, and checkout volunteers.

## 11.1 Pages

| **Route**            | **Page**        | **Functions**                                                                                          |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| /login               | Admin Login     | Email + password authentication                                                                        |
| /events              | Event List      | Create, edit, activate events                                                                          |
| /events/:id          | Event Dashboard | Live stats: active bidders, total raised, bid velocity, payment collection rate                        |
| /events/:id/items    | Item Manager    | CRUD items, upload images, open/close bidding, see active groups per item                              |
| /events/:id/bidders  | Bidder Registry | Search by name or code, filter by payment status, register walk-ins, view real identities (admin only) |
| /events/:id/groups   | Group Manager   | View all groups, member lists, totals, approve merge requests, override contributions                  |
| /events/:id/live     | Auctioneer View | Current item, bid stream, group rivalry controls, "Sold!" button, announcement bar                     |
| /events/:id/display  | Live Display    | Full-screen projector view with group-vs-group tug-of-war (see Section 12)                             |
| /events/:id/checkout | Checkout        | Per-bidder: auto-charged (green), pending (yellow), manual-pay (red). Capture/refund controls.         |
| /events/:id/reports  | Reports         | Export CSV/PDF, revenue by item, group breakdowns, payment collection rates                            |

# 12\. Live Display - Group vs. Group Showdown

The live display at /events/:id/display is designed for a projector or large TV visible to the entire venue. It's the heart of the competitive bidding experience.

## 12.1 Display Modes

| **Mode**           | **When Active**                  | **What It Shows**                                                              |
| ------------------ | -------------------------------- | ------------------------------------------------------------------------------ |
| Item Showcase      | When a new item opens            | Large item image, title, description, starting bid. Builds anticipation.       |
| Individual Bidding | Bids coming in, no active groups | Current highest bid, display name of leader, scrolling bid feed                |
| Group Rivalry      | 2+ groups active on same item    | Tug-of-war bar, group names + totals + member counts, live contribution feed   |
| Sold!              | Item closes                      | Winner announcement with confetti animation. Shows group name or display name. |
| Leaderboard        | Between items                    | Top items by final price, top donors by display name, total raised counter     |

## 12.2 Rivalry Display Design

When two groups compete, the screen splits into a dramatic head-to-head view. Each side shows the group name, current total, and member count. A central tug-of-war bar shifts proportionally. New contributions animate in as a scrolling feed on each side, showing display names only (e.g., "+ \$50 from Anonymous #3"). The MC can call out contributions to build excitement without revealing real identities.

When three or more groups compete, the top two get the rivalry display and a "+N more groups" indicator shows below with their totals in a compact list.

## 12.3 Technical Implementation

**Framework:** React with Framer Motion for animations. The tug-of-war bar, contribution pop-ins, and confetti are all motion-driven.

**Data:** WebSocket-only. No polling. The display subscribes to rivalry:update events for real-time group totals.

**Privacy:** The live display client never receives real names. The server only sends display names in broadcast events.

**Fallback:** If WebSocket disconnects, the display shows a "Reconnecting..." overlay and auto-retries. No stale data shown.

# 13\. Checkout and Payment Flow

## 13.1 Automatic Checkout (Stripe)

When the auctioneer closes an item, the server determines the winner (highest individual bid or group total). For auto-pay bidders:

**Winners:** All pre-auth holds for the winning bid/group are captured. Each group member's hold is captured for their individual contribution amount. Stripe sends a receipt to each person's email. The checkout dashboard shows green checkmarks.

**Losers:** All pre-auth holds for losing bids/groups are canceled immediately. The pending charge disappears from their Apple Pay / bank app within minutes.

## 13.2 Manual Checkout Fallback

Bidders who opted out of digital payment are flagged in the checkout dashboard. Volunteers see a list of manual-pay bidders with their items won and amounts owed. After collecting cash or e-transfer, the volunteer taps "Mark Paid" and optionally enters a reference (e.g., e-transfer confirmation number).

## 13.3 Group Checkout

When a group wins, checkout is split automatically. Each member's Stripe hold captures for exactly their contribution. If the group had 8 members contributing different amounts, each person is charged their own amount. Nobody sees what anyone else paid. Receipts are individual. The admin dashboard shows per-member payment status within the group.

# 14\. Scale and Reliability

## 14.1 Load Estimation

| **Metric**              | **Estimate** | **Notes**                                       |
| ----------------------- | ------------ | ----------------------------------------------- |
| Concurrent devices      | 200-500      | Phones + tablets + admin + display screens      |
| WebSocket connections   | 200-500      | One per device, persistent                      |
| Bids per minute (peak)  | 30-60        | Hot items during group rivalries                |
| Stripe API calls/minute | 20-40        | Hold creation, adjustments, captures            |
| API requests/minute     | 500-1,000    | Polling, registrations, group joins, item loads |
| Database writes/minute  | 50-100       | Bids, group updates, payment records            |

## 14.2 Scaling Strategy

**Single instance sufficient:** For events up to 500 devices, one 2-vCPU Node.js instance handles the load. Node.js excels at WebSocket connections.

**Horizontal path:** Redis pub/sub syncs WebSocket broadcasts across multiple API instances behind a load balancer with sticky sessions.

**Stripe rate limits:** Stripe allows 100 requests/second in live mode. Well within our estimates.

**Database:** MongoDB Atlas M0 (free) for hackathon. M10 for production multi-event deployments.

## 14.3 Reliability

**Write-ahead logging:** Every bid is persisted before WebSocket broadcast. If broadcast fails, the bid is still saved.

**Idempotent submissions:** Client-generated UUID deduplicates retries and offline queue replays.

**Stripe webhooks:** Payment status is confirmed via Stripe webhooks, not just API responses. If a capture fails, the webhook triggers a retry.

**Auto-reconnection:** Socket.IO handles reconnection. iOS app replays missed events via REST on reconnect.

# 15\. Security

| **Concern**      | **Mitigation**                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Authentication   | JWT with 24h expiry. Event passcode gates entry. Admin accounts require email + password.                    |
| Authorization    | Roles: admin (full), volunteer (bids + checkout), bidder (own data only). Middleware validates per endpoint. |
| Anonymity        | Real names stripped from all public API responses. Display names only in WebSocket broadcasts.               |
| Bid tampering    | Server-side validation. Amount must exceed current highest by minimum increment. Never trusted from client.  |
| Payment security | Stripe handles all card data. BidFlow never sees card numbers. PCI compliance is Stripe's responsibility.    |
| Rate limiting    | Max 10 bids/minute per bidder. Max 5 group joins/minute per bidder. Prevents spam.                           |
| Data in transit  | HTTPS/WSS everywhere. Stripe SDK uses TLS.                                                                   |
| Input validation | Zod schemas on every endpoint. MongoDB injection prevented by parameterized queries.                         |

# 16\. Trade-Off Analysis

| **Decision**   | **Chosen**                | **Alternative**         | **Trade-off**                                                                                                                                         |
| -------------- | ------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment        | Stripe                    | Square / IRC website    | Stripe has better pre-auth API and Apple Pay support. Square better for in-person card readers. IRC website would require custom payment integration. |
| Database       | MongoDB                   | PostgreSQL              | Flexible schema speeds hackathon dev. Lose strong ACID for complex group merges (mitigated by MongoDB transactions).                                  |
| iOS framework  | SwiftUI                   | React Native            | Native Apple Pay via PassKit, Xcode deployment. Smaller cross-platform reach but that's the explicit ask.                                             |
| Anonymity      | Display names             | Full encryption         | Display names balance privacy with social experience. Full encryption would prevent the MC from calling out contributions.                            |
| Group merging  | Leader-to-leader approval | Auto-merge              | Approval prevents accidental merges. Adds one extra step but protects group integrity.                                                                |
| Pre-auth holds | Per-bid holds             | Charge on auction close | Holds guarantee funds are available. Alternative risks declined charges at checkout. Holds cost nothing if canceled.                                  |

## 16.1 What to Revisit at Scale

**Multi-currency:** If IRC expands internationally, add multi-currency support via Stripe's multi-currency PaymentIntents.

**Database:** If running 10+ concurrent events, consider sharding by eventId or PostgreSQL with connection pooling.

**Analytics:** Post-event dashboards with bid velocity, group engagement metrics, and donation patterns for IRC headquarters.

**Offline payments:** For venues with poor connectivity, add Stripe Terminal support for in-person card readers as a third payment path.

# 17\. Tech Stack Summary

| **Layer**       | **Technology**                           | **Version**              |
| --------------- | ---------------------------------------- | ------------------------ |
| iOS App         | SwiftUI + Swift + Stripe iOS SDK         | 5.9+ / iOS 17+           |
| Web Dashboard   | Next.js + React                          | 14.x / 18.x              |
| UI Components   | Tailwind CSS + shadcn/ui + Framer Motion | 3.x / latest             |
| Backend API     | Node.js + Fastify + Stripe Node SDK      | 20 LTS / 4.x             |
| Real-Time       | Socket.IO                                | 4.x                      |
| Database        | MongoDB Atlas                            | 7.x (M0 free → M10 prod) |
| Cache / Pub-Sub | Redis (Upstash)                          | 7.x (free tier)          |
| Payment         | Stripe + Stripe Connect                  | Latest API version       |
| File Storage    | Cloudflare R2                            | S3-compatible            |
| Hosting (API)   | Railway                                  | Hobby tier               |
| Hosting (Web)   | Vercel                                   | Free tier                |
| CI/CD           | GitHub Actions                           | Automatic deploys        |
| QR Codes        | qrcode (npm) + AVFoundation (iOS)        | Native                   |

# 18\. Development Roadmap

## Phase 1: Core MVP (Day 1-2)

Bidder registration with display names and anonymity modes. Item CRUD and individual bidding. Basic SwiftUI app: join event, item gallery, bid placement. Web dashboard: item management, live bid feed. WebSocket real-time updates. Stripe customer creation and Apple Pay linking.

## Phase 2: Group Bidding (Day 2-3)

Group creation with join codes and QR codes. Join-by-code and QR scan flows. Individual contribution editing with live total updates. Stripe pre-auth holds per group member. Group-vs-group rivalry display on live screen. Group merging with leader approval.

## Phase 3: Payments + Polish (Day 3-Demo)

Stripe pre-auth hold creation on bid/join. Hold adjustment on contribution changes. Auto-capture on auction close (winners) and auto-cancel (losers). Checkout dashboard with auto-pay vs. manual-pay views. Push notifications for outbid, group invites, payment confirmations. Offline bid queuing. Tug-of-war animation on live display.

## Phase 4: Production (Post-Hackathon)

Stripe Connect setup for IRC Canada + university chapters. Multi-event support with event archiving. Admin user management with role permissions. Analytics dashboard for IRC Canada. App Store submission with TestFlight beta. Load testing for nationwide deployment.

_End of System Design Document_

BidFlow v2.0 · March 2026