# Findings

## System Design Extraction
- Data model section is defined in `System-Design.md` under section `4.2 Collection Schemas`.
- Required collections for Phase 1:
  - `bidders`
  - `groups`
  - `items`
  - `bids`
  - `paymentHolds`
- Key route groups for Phase 1 are in section `5`:
  - Auth
  - Bidders
  - Items
  - Individual Bids
  - Group Bidding
  - Payments
- Authentication requirement: JWT (section `5.1` + base API note).

## Real-Time Preview (for Phase 2)
- Required room naming:
  - `event:{eventId}`
  - `item:{itemId}`
  - `group:{groupId}`
  - `user:{bidderId}`
- Required event names include:
  - `bid:new`
  - `group:updated`
  - `rivalry:update`
