# AGENTS.md — AKStack Multi-Course LMS Project Rules

This repository contains the enterprise-grade **AKStack Multi-Course LMS**, built with Next.js 16 (App Router), React 19 Server Components, Tailwind CSS v4, and Supabase PostgreSQL with Row-Level Security.

---

## Technical Stack & Architectural Invariants
- **Framework:** Next.js 16 (App Router), React 19, TypeScript (strict mode enabled).
- **Styling:** Tailwind CSS v4 (AKStack dark matte design system: zinc-950 background, emerald accents, border-zinc-800).
- **Database:** Supabase PostgreSQL with strict Row-Level Security (RLS) on all tables.
- **Access Control:** Per-course entitlement checking via `course_enrollments` and `public.has_course_access(course_id)`.
- **Formulas & Markdown:** KaTeX math expressions (`$$...$$`) and Markdown dual-pane preview.

---

## Repository Structure
```text
akstack-lms/
├── AGENTS.md                          # Persistent instructions for AI agents
├── README.md                          # Quickstart, migration, and runbook
├── PRD.md                             # Requirements & acceptance criteria
├── ARCHITECTURE.md                    # Architecture & data flows
├── DATA_MODEL.md                      # Database schema & RLS matrix
├── THREAT_MODEL.md                    # STRIDE threat model
├── security-reviewer.md               # Independent security auditor guidelines
├── API_SPEC.md                        # Server Actions & API specifications
├── UI_UX_SPEC.md                      # UI tokens, accessibility, responsive breakpoints
├── TEST_PLAN.md                       # Test suites & quality gates
├── DEPLOYMENT.md                      # Deployment configuration & rollback procedures
├── TASKS.md                           # Resumable task execution tracking
├── .env.example                       # Environment variables template
├── supabase/migrations/               # PostgreSQL schema migrations
├── scripts/                           # TypeScript migration scripts
├── src/
│   ├── actions/                       # Next.js Server Actions with Zod schemas
│   ├── app/                           # App Router routes (admin, player, sales)
│   ├── components/                    # UI components (sidebar, player)
│   └── types/                         # Database TypeScript interfaces
├── docs/                              # Architecture decision records & reviews
└── tests/                             # Unit & integration test suites
```

---

## Coding & Security Guidelines
1. **Never Bypass RLS:** Never execute client queries using the Service Role Key. Server Actions must respect auth session boundaries.
2. **Strict Zod Validation:** All Server Action inputs must be validated with Zod schemas before interacting with the database.
3. **Cache Invalidation:** Always call `revalidatePath` after mutating courses, modules, lessons, or progress.
4. **No Secrets in Code:** `SUPABASE_SERVICE_ROLE_KEY` and payment tokens must only exist in server environment variables.
