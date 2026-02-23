# DraftSendSign (Local-First Starter)

A local-first, production-shaped starter for an e-signature workflow:
- Template library
- Document editor + live preview
- Recipients + signing links (coming next)
- Audit trail (coming next)
- Local-only storage: SQLite + filesystem + outbox (no paid services needed)

## Repo layout
- `apps/web` — Next.js web app (UI + API routes)
- `packages/core` — shared types + validation (Zod)
- `storage/` — local file storage (S3-like layout)
- `outbox/` — local “email capture” for signing links

## Local dev (coming next)
We’ll add Next.js + scripts in the next step.
