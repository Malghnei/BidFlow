# Findings Log

## Research & Discoveries

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
