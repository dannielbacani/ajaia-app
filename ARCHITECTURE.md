# Architecture & Technical Decision Record

## 1. System Overview

Ajaia Docs is designed as a modular, lightweight collaborative document editor built to ship maximum product utility within a 4–6 hour delivery constraints.

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  - Next.js 16 App Router (React 19 Server & Client Components) │
│  - TipTap Core & ProseMirror Extension Engine               │
│  - Debounced Autosave Controller (800ms window)            │
│  - Reviewer Persona Switcher (Client Session Context)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON & Multipart
┌──────────────────────────────▼──────────────────────────────┐
│                    API & Business Logic                     │
│  - /api/documents (CRUD, pagination, tab filtering)         │
│  - /api/documents/[id]/share (Relational access control)    │
│  - /api/documents/import (Markdown/Text parsing pipeline)   │
│  - Pure Access Control Evaluator (Role validation)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────┐
│                      Data Persistence                       │
│  - Neon Serverless PostgreSQL Cloud Database                │
│  - Relations: User 1:N Document, Document M:N User (Shares) │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Decisions

### Editor Framework: TipTap (ProseMirror)
- **Why:** Custom `contenteditable` implementations are notoriously brittle across browsers. TipTap provides an enterprise-tested headless ProseMirror abstraction with deterministic DOM serialization and full keyboard shortcut support (Bold, Italic, Underline, Lists).
- **Format Storage:** Content is stored as validated HTML strings in PostgreSQL. This allows instantaneous document rehydration and avoids complex schema migration overhead for simple text nodes.

### Data Model & Sharing Engine
- **Relational Integrity:**
  - `User`: Pre-seeded identity records (`Danniel`, `Bob`, `Charlie`).
  - `Document`: Enforces explicit `ownerId` cascading delete.
  - `DocumentShare`: Unique compound key on `(documentId, userId)` ensuring a collaborator cannot have duplicate contradictory roles.
- **Access Boundary:**
  - Evaluated on every read and mutation in pure functions (`src/lib/accessControl.ts`).
  - **Owner:** Full edit and delete rights.
  - **Editor:** Full editing rights; prohibited from deleting the document or modifying owner permissions.
  - **Viewer:** Read-only mode; TipTap editor is set to `editable: false`, toolbar inputs are locked, and PATCH endpoints reject requests with HTTP 403.

### Reviewer Persona Switcher vs. Heavy Auth (Product Judgment)
- **Tradeoff:** Implementing Google OAuth or Magic Link authentication requires reviewers to sign in, create temporary inboxes, and switch browser incognito windows to test sharing.
- **Solution:** A 1-click header switcher that immediately transitions between Danniel, Bob, and Charlie. The active persona is maintained in client state and persisted to `localStorage`, allowing immediate end-to-end verification of cross-user permissions within seconds.

### Ingestion Engine (File Upload)
- Built a streaming file reader that parses `.md` and `.txt` files directly into rich-text DOM structures using `marked` and sanitizes linebreaks into paragraph tags.
- Converts uploaded files into instant editable drafts without external binary dependencies.

---

## 3. Deliberate Scope Cuts & Tradeoffs

| Capability | Chosen Approach | Deprioritized Alternative | Rationale |
| :--- | :--- | :--- | :--- |
| **Real-Time Sync** | **Debounced Cloud Autosave (800ms)** | WebSockets + CRDTs (Yjs / Automerge) | CRDTs introduce network split edge-cases and operational overhead that detract from delivery reliability in a 4–6h timebox. Debounced persistence guarantees zero data loss with high predictability. |
| **Authentication** | **Mocked Persona Switcher** | Full NextAuth / Supabase Auth | Assignment explicitly permitted seeded users. Eliminates auth redirect friction for reviewers. |
| **File Types** | **Markdown (.md) & Plain Text (.txt)** | DOCX / PDF Ingestion | Markdown ingestion delivers genuine product value without fragile heavyweight binary unpackers. |

---

## 4. What We Would Build Next (With 2–4 Additional Hours)

1. **Real-Time Presence Cursors:** Introduce lightweight Pusher or Supabase Realtime channels to broadcast active collaborator cursor positions and selections.
2. **Inline Comments & Suggestions Mode:** Allow collaborators to highlight text spans and attach threaded comments without altering source text.
3. **Document Version History:** Snapshot document states upon every manual save or significant edit with a visual diff viewer to rollback accidental changes.
