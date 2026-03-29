# Task Plan: Backend Compatibility with SYSTEM_DESIGN

## Goal
Implement backend logic so the current project is fully compatible with `SYSTEM_DESIGN.md`, including API behavior, realtime events, data model expectations, and backend stack alignment decisions.

## Sequence of Execution
1. **[complete] Context Gathering**
   - Read `SYSTEM_DESIGN.md`.
   - Read existing project planning files and current migration state.
2. **[complete] Brainstorming Understanding Lock**
   - Confirm backend stack direction (keep current Express baseline vs migrate to Fastify as specified).
   - Confirm implementation scope (MVP-compatible subset vs full FR-01..FR-16 and payment flows).
3. **[complete] Design Selection**
   - Propose 2-3 backend implementation approaches with trade-offs.
   - Finalize one approach and assumptions.
4. **[complete] Implementation**
   - Align domain models (events, bidders, items, bids, groups, payment holds).
   - Implement/adjust REST endpoints and request/response contracts.
   - Align Socket.IO event payloads/rooms.
   - Implement missing business rules (group merge, contribution privacy, bidding validation, hold lifecycle hooks).
5. **[complete] Verification**
   - Run backend checks/tests.
   - Validate compatibility against `SYSTEM_DESIGN.md` sections for API + realtime + security constraints.
6. **[complete] Documentation**
   - Update README/runtime notes with backend expectations and environment variables.

## Errors Encountered
- Smoke test command interpolation error (`bad substitution`) when mixing shell interpolation and Node template literals; resolved by moving tests into a single quoted Node script.

## Decision Log
- Existing codebase already contains a broad backend/API footprint and Socket.IO; compatibility likely requires targeted alignment rather than greenfield rewrite.
- Confirmed stack direction: migrate to Node.js + Fastify.
- Confirmed scope: MVP core + checkout/payment-hold lifecycle endpoints (not full production Stripe-only implementation).
- Confirmed compatibility mode: keep backward compatibility for existing routes while adding spec-aligned endpoints.
- Confirmed payment approach: switchable Stripe mode (real Stripe when keys are present; safe local stub mode otherwise).
