# Findings Log

## Research & Discoveries

1. **Current runtime stack**: Node.js + Express + Socket.IO backend with static multi-page frontend under `public/`.
2. **Current frontend state**: HTML files contain large inline scripts and mixed styling approaches (Tailwind CDN + custom CSS), causing maintainability and duplication issues.
3. **Config duplication partially addressed**: `public/app-config.js` centralizes event join/passcode logic but most business logic is still duplicated across pages.
4. **Core pages to preserve**: `index`, `register`, `items`, `item`, `groups`, `group`, `mybids`, `profile`, `admin`, and `display`.
5. **Backend API compatibility requirement**: Frontend must continue using existing `/api/...` endpoints and Socket.IO events from `server.js`.
6. **Deployment baseline exists**: `README.md`, `QUICK_START.md`, `DEPLOY.md`, Docker assets, and `.env.example` are already present and can be simplified/updated for the frontend refactor.
7. **Planning files already present**: `task_plan.md`, `findings.md`, and `progress.md` exist and are being reused for this workflow.
8. **New frontend foundation added**: Vite React TypeScript app now lives in `web/` with route-based navigation and modular shared logic replacing inline scripts.
9. **Deployment simplification path validated**: `npm run build` now builds the web bundle (`web/dist`) and server runtime serves it directly.
10. **Backward-compatible serving behavior**: backend falls back to legacy `public/` if `web/dist` is missing, reducing rollout risk.

## Open Unknowns
- None blocking for this implementation pass.
