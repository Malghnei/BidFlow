# BidFlow Build Plan

## Goal
Build BidFlow in phases based on `System-Design.md`, with Flutter replacing SwiftUI for mobile.

## Current Phase
`Phase 1: Foundation & Backend Scaffold` (complete)

## Phases
- [x] Phase 1: Foundation & Backend Scaffold
- [ ] Phase 2: Real-Time Engine
- [ ] Phase 3: High-Fidelity Web Client
- [ ] Phase 4: Cross-Platform Mobile App (Flutter) & Payment Logic

## Phase 1 Checklist
- [x] Initialize monorepo structure (`apps/web`, `apps/backend`, `apps/mobile`)
- [x] Scaffold Node.js + Fastify backend
- [x] Implement MongoDB schemas from design doc:
  - [x] `bidders`
  - [x] `groups`
  - [x] `items`
  - [x] `bids`
  - [x] `paymentHolds`
- [x] Set up REST API routing structure from section 5
- [x] Add JWT authentication middleware/plugin
- [x] Verify backend builds successfully

## Constraints
- Follow field names/enums from section 4.2 exactly.
- Follow endpoint structure from section 5 exactly.
- Respect room/event names from section 6.2 (implemented in Phase 2).
- Web UX/UI quality bar is premium (implemented in Phase 3).
- Mobile app must be Flutter (override accepted).

## Decisions
| Decision | Reason |
|---|---|
| Use npm workspaces monorepo | Fast setup with minimal overhead for hackathon timeline |
| Use TypeScript for backend | Strong schema/type safety across APIs and events |
| Use Mongoose for MongoDB schemas | Clear model/index mapping to design spec |

## Errors Encountered
| Error | Attempt | Resolution |
|---|---|---|
| None yet | - | - |
