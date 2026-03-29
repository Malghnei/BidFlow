# Task Plan: Flutter Migration and Deployment Simplification

## Goal
Refactor the project to keep the existing backend/web stack and replace any Swift iOS implementation with a single Flutter mobile app targeting both Android and iOS, then provide straightforward deployment and run instructions.

## Sequence of Execution
1. **[complete] Context Gathering**
   - Inspect current repository structure, docs, and runtime stack.
   - Confirm current planning files exist and repurpose them for this task.
2. **[complete] Brainstorming Understanding Lock**
   - Clarify the exact target architecture and scope for "teck stack" migration.
   - Confirm whether existing web app remains first-class or Flutter should become primary client.
3. **[complete] Design Selection**
   - Propose migration approaches and select one with trade-offs.
   - Capture assumptions and decision log.
4. **[complete] Implementation**
   - Scaffold Flutter app structure for Android/iOS.
   - Implement API/socket integration with existing Node backend.
   - Replace/retire Swift references and update project docs/scripts.
5. **[complete] Deployment Simplification**
   - Add copy-paste setup and deployment instructions for local/dev/prod.
   - Add build commands for Android APK/AAB and iOS IPA/archive prerequisites.
6. **[complete] Validation**
   - Run lint/tests/build checks where available.
   - Verify docs align with actual commands and paths.

## Errors Encountered
- `flutter --version` failed in this environment due root-level telemetry permission error; Flutter project generation/verification commands were documented for local non-root execution.

## Decision Log
- Keep existing web frontend and backend contracts; add Flutter as additional client.
- Implement full admin controls in Flutter (dashboard, items, bidders, groups, auctioneer, checkout).
- Add MongoDB persistence using `MONGODB_URI` from `.env`.
- Optimize for local-first usage with one simple server deployment path.
