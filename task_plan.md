# Task Plan: Frontend Refactor and Deployment Simplification

## Goal
Refactor the web frontend into a maintainable, modular, production-ready structure aligned with the existing Node/Express backend APIs, and provide easy, copy-paste deployment instructions.

## Sequence of Execution
1. **[complete] Context Gathering**
   - Inspect repository structure, frontend files, docs, and runtime stack.
   - Confirm existing planning files and repurpose them for this task.
2. **[complete] Brainstorming Understanding Lock**
   - Clarify required target frontend stack and migration depth.
   - Confirm page parity expectations and acceptable UX changes.
3. **[complete] Design Selection**
   - Propose 2-3 viable frontend architectures and select one.
   - Capture assumptions, trade-offs, and decision log.
4. **[complete] Implementation**
   - Create frontend app structure, shared modules, and routing strategy.
   - Migrate existing page functionality (join, register, items, groups, bids, admin, display).
   - Preserve backend API contracts and realtime Socket.IO behavior.
5. **[complete] Deployment Simplification**
   - Add clear local/dev/prod instructions.
   - Add build/start commands, environment setup, and static hosting notes.
6. **[complete] Validation**
   - Run lint/build/runtime checks for frontend and server.
   - Verify docs match real commands and app behavior.

## Errors Encountered
- TypeScript build errors after initial scaffold:
  - type-only imports required under `verbatimModuleSyntax`
  - `useEffect` cleanup returning `Socket` instead of `void`
  - resolved by converting to type imports and explicit cleanup blocks.

## Decision Log
- Existing backend API endpoints and Socket.IO events remain source-of-truth contracts.
- Refactor focuses on web frontend only for this request.
- Implemented React SPA in `web/` with route parity for bidder/admin/display pages.
- Backend now serves `web/dist` when present with SPA fallback; legacy `public/` remains fallback when dist is absent.
