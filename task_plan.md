# Task Plan: Frontend Refactor and Easy Deployment

## Goal
Refactor the frontend side of the project around a single clear web stack (the `web/` Vite + React + TypeScript app), align deployment/run docs to this stack, and fully implement an easy-to-deploy path.

## Sequence of Execution
1. **[complete] Context Gathering**
   - Inspect current repo structure, frontend variants, scripts, and docs.
   - Confirm planning files and repurpose for the current request.
2. **[in_progress] Brainstorming Understanding Lock**
   - Confirm which frontend should be canonical (`web/` React app vs static `public/*.html` pages).
   - Confirm expected deployment target and minimal DX requirements.
3. **[pending] Design Selection**
   - Propose 2-3 viable frontend refactor approaches with trade-offs.
   - Finalize chosen approach and document assumptions + decisions.
4. **[pending] Implementation**
   - Refactor frontend architecture in `web/` (routing, pages, shared API/socket client, state).
   - Align backend static serving path to deploy the built frontend cleanly.
   - Remove or de-prioritize duplicate frontend artifacts as decided.
5. **[pending] Deployment Simplification**
   - Provide one-command local run.
   - Provide production deployment instructions (build + start) with environment variables.
6. **[pending] Validation**
   - Run frontend lint/build checks and backend startup checks.
   - Verify docs match executable commands.

## Errors Encountered
- None yet for this refactor cycle.

## Decision Log
- Initial observation: there are currently two frontend paradigms (`public/*.html` and `web/` React app), causing duplicated UI stack and unclear deployment defaults.
- Pending user confirmation: which frontend should be canonical after refactor.
