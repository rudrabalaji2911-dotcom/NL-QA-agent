# QA Test Agent - Prompt & Development Documentation

This document serves as the **Prompt Documentation** note file required by the evaluation criteria (Image 2). It logs the critical development prompts used to instruct the AI Coding Assistant to design, build, and optimize the QA Automation Bot.

---

## 1. Phase 1: Core Architecture Setup
**Objective**: Establish a full-stack Node.js + Express + React framework with Playwright browser mock sandboxing.

### Prompt:
> Create a full-stack QA Automation suite. The backend must run an Express server on Port 3000 hosting a local mock retail store (`/demo`) for sandboxed testing. Use React with Tailwind v4 for the UI, and implement a natural language test planner using Gemini which transforms user instructions like "login to demo, buy headphones, checkout, verify success" into a sequential standard Playwright execution list.

**Implemented Outcome**:
- Created `/server.ts` with custom `/demo` view simulating `FutureGadgets Hub`.
- Integrated `@google/genai` model for natural language planning.
- Created `src/utils/browserSimulator.ts` using Playwright context matching.

---

## 2. Phase 2: Live WS Logs and Real-Time Execution Monitor
**Objective**: Expose live updates during test runs to satisfy the **End-to-End Execution and Usability** evaluation criteria.

### Prompt:
> Set up an upgrade handler for a WebSocket server `/api/stream?run_id=xxx` inside Express. During browser execution, stream live action step updates, captured screenshots, and detailed driver console logs back to the React UI using active WS clients so users can watch the headless browser run live.

**Implemented Outcome**:
- Configured Node `http` upgrade hook for WebSocketServer (`ws` library).
- Emitted real-time step status (`passed`/`failed`/`running`) and file paths of captured screenshots.
- Built a terminal-like console viewer on the frontend Client.

---

## 3. Phase 4: Self-Healing Playwright Core
**Objective**: Enhance robustness of element interaction so the QA Bot doesn't crash on standard page structures.

### Prompt:
> Modify the browser simulator to auto-heal selector lookups. If a step lists a selector that fails or has slightly different casing/prefix, let the agent search for general variations (e.g. searching class names, input names, labels, button texts, or id substrings) and dynamically retry. Add an ignore guard so checkout intermediate forms do not interfere with custom test step fill tasks.

**Implemented Outcome**:
- Patched `src/utils/browserSimulator.ts` to implement multi-candidate fallback selectors.
- Added self-healing warnings and debug traces.

---

## 4. Phase 5: Run Ledger History Selection Deletion
**Objective**: Empower users to clean up historical executions or execute bulk records cleanup.

### Prompt:
> Implement multi-record bulk deletion on the Test History view. Expose a select-all header checkbox, individual row checkboxes, a selection actions banner showing count of selected, and a bulk delete POST router `/api/execution/delete-multiple` in Express to clear runs and associated report logs permanently on the JSON database.

**Implemented Outcome**:
- Added checkboxes and a red floating action bar to `src/components/TestHistory.tsx`.
- Integrated backend Express routes `/api/execution/:id` (DELETE) and `/api/execution/delete-multiple` (POST).

---

## 5. Phase 6: Full-Stack Production Reality Alignments
**Objective**: Meet the strict standards of the "Production Reality" diagram by injecting API Rate Limiting, Caching & CDN optimization, Row Level Security, and Availability indicators.

### Prompt:
> Update the Express backend to include IP-based Rate Limiting headers (max 150 req/min) on `/api/` paths and Cache-Control headers on static assets (`X-CDN-Cache: HIT` for static media, `BYPASS` for mutable responses) to demonstrate a production-grade full-stack architecture. Surface these production metrics as a "Live Architecture Registry" sidebar or panel inside the Dashboard view.

**Implemented Outcome**:
- Installed in-memory rate-limiting and CDN edge header simulations directly in `server.ts`.
- Exposed a visual Live Production Stack Auditor inside `src/components/Dashboard.tsx` demonstrating active security and RLS simulation.
