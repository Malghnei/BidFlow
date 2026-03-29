# Findings Log

## Research & Discoveries

0. **Current request scope (latest)**: implement backend logic to be fully compatible with `SYSTEM_DESIGN.md`.
1. **Design doc backend baseline**: Node.js + Fastify + Socket.IO + MongoDB + Redis + Stripe is the target architecture.
2. **Design doc API contract is explicit**: endpoint families for auth, bidders, items, bids, groups, and checkout with event-scoped paths.
3. **Design doc rules are strict**: contribution privacy, display-name-only public surfaces, one-group-per-bidder-per-item, atomic group merge, and payment hold lifecycle requirements.
4. **Realtime requirements are explicit**: named Socket.IO events (`bid:new`, `group:updated`, `group:merged`, `rivalry:update`, `item:opened`, `item:closed`, etc.) and room strategy (`event:*`, `item:*`, `group:*`, `user:*`).
5. **NFR targets to preserve**: sub-500ms realtime updates and low-latency API behavior, with idempotent submission and persistence expectations.
6. **User-locked design decisions**:
   - Backend stack: migrate to Fastify.
   - Scope: MVP + checkout/payment-hold lifecycle endpoints.
   - Compatibility: preserve old routes while adding spec routes.
   - Payments: switchable mode (real Stripe if configured, stub mode otherwise).
7. **Migration implementation outcome**:
   - Runtime now uses Fastify as the host server while preserving existing Express route handlers via adapter mounting.
   - `/v1/*` compatibility is implemented via URL rewrite to `/api/*`, allowing spec-style clients to use the same backend logic.
   - Added hold lifecycle domain (`paymentHolds`) with persistence and Stripe/stub switchable behavior.
8. **Added missing endpoint coverage for MVP+checkout**:
   - bidder payment linking
   - bidder hold retrieval
   - item bid history endpoint
   - checkout capture-all / capture-bidder / manual-pay
   - admin auth stubs (`/auth/admin/login`, `/auth/refresh`)
9. **Business rules alignment updates**:
   - one-group-per-bidder-per-item enforcement
   - contribution minimum guard (>= 5)
   - item close now captures winner holds and cancels loser holds
10. **Verification status**:
   - Legacy smoke tests (`test_api.js`) pass.
   - `/v1` smoke tests for join/register/link-payment/bid/holds/capture/manual-pay pass.

## Prior Findings (Historical)

0. **Current request scope (new)**: user requested a frontend-focused refactor and easy deployment instructions, with full implementation.
1. **Current runtime stack**: The active app is a Node.js + Express + Socket.IO backend with static web pages under `public/`.
2. **Current package scripts**: Root `package.json` only includes `start`/`dev` running `server.js`; no monorepo tooling is currently configured.
3. **Mobile status**: `README.md` still documents an iOS SwiftUI path, but the current repo snapshot appears to have shifted away from a dedicated `apps/mobile` structure and removed prior `apps/*` folders.
4. **Planning files exist already**: `task_plan.md`, `findings.md`, and `progress.md` were present and have been repurposed for this migration workflow.
5. **Backend API surface is broad enough for full mobile admin**: `server.js` already exposes bidder, item, group, bidding, checkout, merge, contribution, and CSV endpoints.
6. **Realtime integration is already compatible with Flutter**: Socket.IO events (`bid:new`, `group:updated`, `item:opened`, `item:closed`, plus room joins) can be consumed from Flutter with `socket_io_client`.
7. **Admin controls coverage**: Existing admin web behavior maps to API actions we can replicate in Flutter:
   - open/close item bidding
   - create items
   - register walk-in bidders
   - monitor groups and merge groups
   - view checkout summary and mark bidder paid
8. **Current persistence is in-memory only**: all state is stored in Maps/arrays in `server.js`, so a repository/data-layer extraction is needed before MongoDB integration.
9. **Implemented Mongo persistence strategy**: used a Mongo snapshot persistence layer (`state_snapshots` collection) to persist/restore all in-memory structures without breaking current API behavior.
10. **Mutation persistence trigger**: write scheduling added as middleware for mutating HTTP methods to reduce route-level code churn while preserving data across restarts.
11. **Flutter replacement delivered**: created `mobile/` Flutter app code with bidder + full admin tabs mapped to existing REST/socket APIs.
12. **Deployment docs now centralized**: updated `README.md`, `QUICK_START.md`, added `DEPLOY.md`, and added `.env.example` for straightforward setup.
13. **Operational hardening pass**: added `/health` endpoint for platform health probes and expanded `.gitignore` for `.env` and Flutter build artifacts.
14. **Dockerized local stack added**: introduced `Dockerfile` and `docker-compose.yml` for one-command app + Mongo local startup.
15. **Mongo placeholder safety check added**: backend now detects placeholder URI patterns like `<cluster>` and explicitly disables Mongo with a clear warning instead of failing noisy DNS lookup.
16. **Flutter maintainability refactor completed**: split monolithic `mobile/lib/main.dart` into:
   - `mobile/lib/src/state/app_state.dart` (state + API/socket integration)
   - `mobile/lib/src/ui/ui.dart` (all screens/tabs)
   - `mobile/lib/src/app.dart` (MaterialApp shell)
   - `mobile/lib/main.dart` (minimal bootstrap)
17. **Website refactor started with shared runtime config**:
   - Added `public/app-config.js` as a shared frontend config layer (passcode management + event join helper).
   - Updated `public/index.html`, `public/admin.html`, and `public/display.html` to use this shared layer and remove duplicated hardcoded join logic.
18. **Frontend duplication is unresolved**: repository now includes both old static pages (`public/`) and a separate React app (`web/`), but docs still position static pages as primary user paths.
19. **Web stack details**: `web/` currently uses React + TypeScript + Vite + React Router + Socket.IO client but appears minimal scaffold-level and not yet feature-equivalent to static pages.
20. **React parity refactor completed for bidder-facing surface**: `web/src/App.tsx` now implements route-based pages that follow the same layout/element patterns as `public/` pages:
   - `/` join
   - `/register`
   - `/items`
   - `/item?itemId=...`
   - `/mybids`
   - `/groups`
   - `/group?groupId=...`
   - `/profile`
21. **Styling migration path**: theme tokens and reusable UI styles from `public/theme.css` were translated into `web/src/index.css` + `web/src/App.css` so the React app visually matches cards, typography, nav bar, and form controls.
22. **Realtime behavior retained**: React pages use Socket.IO to mirror live bid/group updates on list/detail screens.

## Open Unknowns
- Flutter CLI/tool execution in this root sandbox environment cannot be used to generate platform folders; users should run setup commands locally as non-root.
- Whether to keep static `public/*.html` as fallback or fully migrate all bidder/admin/display UX into `web/` and serve `web/dist` as the only frontend.
