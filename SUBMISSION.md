# Ajaia Full Stack Developer Assignment — Submission Package

**Candidate:** Practical Exam Submission  
**Live Deployment URL:** [https://ajaia-app-ruddy.vercel.app](https://ajaia-app-ruddy.vercel.app)  
**Walkthrough Video File:** `ajaia_walkthrough_demo.mp4` (Included in folder; encoded via FFmpeg)

---

## 1. Submission Manifest

This package contains all materials requested by the assignment specification:

| File / Folder | Description |
| :--- | :--- |
| **`ajaia_walkthrough_demo.mp4`** | Complete 1080p walkthrough video of the real, end-to-end product flow. |
| **`demo_preview.gif`** | Short animated preview demonstrating editor interactions and live UI responsiveness. |
| **`README.md`** | Comprehensive project overview, local installation guide, and feature summary. |
| **`ARCHITECTURE.md`** | Technical architecture, data modeling, trade-offs, and deliberate scope cuts. |
| **`AI_WORKFLOW.md`** | Practical AI tooling analysis, rejected outputs, and reliability verification. |
| **`walkthrough_video_url.txt`** | Walkthrough video metadata, timestamps, and upload notes. |
| **`Sprint_Retrospective.md`** | Sample markdown document used to demonstrate file upload/ingestion. |
| **`src/`** | Complete application source code (Next.js 16, TypeScript, Tailwind CSS, TipTap). |
| **`prisma/`** | Database schema and deterministic multi-user seed script. |

---

## 2. Reviewer Test Personas & Credentials

The application includes a **1-click Persona Switcher** in the top navigation bar. No passwords or registration required:

1. **Danniel Bacani** (`danniel@ajaia.io`) — *Product Lead*
   - Pre-seeded with 2 owned documents:
     - *"Ajaia Product Roadmap Q1"* (Shared with Bob as Editor)
     - *"Confidential: Q2 Product Strategy"* (Private, unshared)
   - Has 1 shared document from Bob (*"Engineering Architecture & Tradeoffs"*, Viewer access).
2. **Bob Smith** (`bob@ajaia.io`) — *Senior Engineer*
   - Pre-seeded with 1 owned document (*"Engineering Architecture & Tradeoffs"*).
   - Has 1 shared document from Danniel (*"Ajaia Product Roadmap Q1"*, Editor access).
3. **Charlie Davis** (`charlie@ajaia.io`) — *Design Partner*
   - Clean slate persona to test receiving new shares and creating new documents from scratch.

---

## 3. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and set DATABASE_URL to any Postgres (free Neon/Supabase works)
cp .env.example .env

# 3. Synchronize database and seed data
npx prisma db push
npm run db:seed

# 4. Run automated test suite
npm test

# 5. Start dev server
npm run dev
```

---

## 4. Feature Completeness Status

### What is Working End-to-End
- **Document Creation & Editing:** Create, inline rename, edit with TipTap (Bold, Italic, Underline, H1, H2, Bullet List, Numbered List, Blockquote, Undo/Redo).
- **Persistence:** Real-time debounced autosave (800ms) with visual status indicator; full persistence to cloud PostgreSQL.
- **File Upload & Ingestion:** Upload `.md` or `.txt` files to instantly generate editable documents with parsed structure.
- **Sharing & Access Boundaries:** Owner-controlled sharing dialog, role-based permissions (Owner, Editor, Viewer), visual distinction between "Owned by Me" and "Shared with Me", and access denied guards (HTTP 403) for unauthorized users.
- **Single-Click Export:** Download any document as Markdown (`.md`) or HTML (`.html`).
- **Automated Testing:** 7 passing unit and logic tests verifying file parsing and access-control matrix.
- **Live Deployment:** Fast, responsive production deployment on Vercel backed by Neon PostgreSQL.

### What Was Intentionally Deprioritized (Scope Cuts)
- **Complex WebSocket CRDTs (Yjs):** Replaced with reliable 800ms debounced autosave to eliminate race-conditions and synchronization splits within the 4–6 hour delivery window.
- **Heavyweight Binary File Parsing (.docx / .pdf):** Restricted ingestion to Markdown and Plain Text to ensure 100% deterministic parsing without bloat.

### What We Would Build Next (With 2–4 Additional Hours)
1. **Real-Time Multiplayer Presence:** WebSocket-based cursor indicators showing active collaborators in the document.
2. **Inline Comments & Suggestion Mode:** Ability to annotate selected text spans without editing the original draft.
3. **Revision History:** Point-in-time document snapshotting with visual diff comparison and one-click rollback.
