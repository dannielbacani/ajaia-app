# AI-Native Workflow Note

## 1. AI Tools Utilized
- **AI Agentic Coding Assistant (Antigravity with Gemini 3.8 Flash):** Leveraged for full-stack scaffolding, schema drafting, test authoring, and automated demo pipeline generation.
- **Node.js Playwright & FFmpeg CLI Automation:** Scripted via AI to record high-frame-rate browser interactions and encode the walkthrough video demo.

---

## 2. Where AI Materially Sped Up Delivery

1. **Rapid Schema & Seeding Scaffolding:**
   - Drafting the relational Prisma schema (`User`, `Document`, `DocumentShare`) and writing the seed dataset (`prisma/seed.ts`) took under 5 minutes.
   - Pre-populating realistic, role-oriented documents allowed testing UI states immediately without manual data entry.

2. **TipTap Extension Configuration & Toolbar Binding:**
   - Integrating ProseMirror extensions (Bold, Italic, Underline, Heading 1–3, Bullet/Ordered Lists, Blockquote, History) and generating the reactive active-state styling.

3. **Automated Testing Suite Creation:**
   - Generated unit tests for the pure markdown parsing logic (`parseFileContent`) and access-control matrix (`evaluateUserPermission`).

4. **Automated E2E Walkthrough Recording Pipeline:**
   - Crafted a Playwright runner (`scripts/record-demo.ts`) that drove the live production application through all 8 user scenarios, captured high-resolution frames, and invoked FFmpeg to render a clean 1080p MP4 walkthrough video.

---

## 3. What AI-Generated Output Was Changed or Rejected

1. **Rejected Over-Engineered WebSocket / CRDT Suggestions:**
   - Early AI suggestions proposed setting up a custom WebSocket server with Yjs for real-time multiplayer editing.
   - **Engineering Judgment:** Rejected in favor of an 800ms debounced REST autosave pattern. CRDTs in a 4–6 hour timebox introduce state synchronization edge cases and deployment complexities. Prioritizing robust persistence and clear access control was the correct product tradeoff.

2. **Corrected Experimental Next.js 16 Prerendering Directives:**
   - AI initially scaffolded Next.js with experimental `cacheComponents: true` and `partialPrefetching: true`, which caused dynamic route segment collisions (`export const dynamic = "force-dynamic"` was rejected by the experimental Turbopack compiler).
   - **Correction:** Removed the experimental flags in `next.config.ts`, restoring stable server-rendered dynamic evaluation for authenticated document routes.

3. **Refined UI & Accessibility in TipTap:**
   - Default AI toolbar generated standard buttons without clear active states or disabled handling for viewers.
   - **Correction:** Added explicit disabled styling (`readOnly` opacity and pointer-events prevention), a clear "Viewing Only" badge, and paper canvas layout matching Google Docs aesthetics.

---

## 4. How Correctness, UX Quality, and Reliability Were Verified

- **Automated Logic Testing:**
  - Ran `npm test` across all access-control boundaries (verifying that uninvited users receive 403 Forbidden, Viewers cannot edit, and only Owners can delete).
- **Production Infrastructure Verification:**
  - Deployed directly to Vercel connected to a live cloud PostgreSQL database on Neon.
  - Verified network requests with `curl` on live endpoints (`/api/users`, `/api/documents`, and `/api/documents/[id]`).
- **Cross-Persona Manual UX Verification:**
  - Switched between Danniel, Bob, and Charlie to verify that "Shared with Me" immediately reflects newly granted permissions without full-page reloads.
- **Visual Demo Validation:**
  - Generated and reviewed `demo_preview.gif` and `ajaia_walkthrough_demo.mp4` to ensure smooth frame pacing, responsive formatting, and clean UI transitions.
