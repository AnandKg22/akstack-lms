# MEMORY.md — AKStack Multi-Course LMS Project Memory

> Curated long-term memory for **AKStack Multi-Course LMS**. Holds distilled architecture decisions, user requirements, key trade-offs, and preferences.

## Project Identity & Scope
- **Project Name:** AKStack Multi-Course LMS Transformation
- **Goal:** Transform AKStack from a single hardcoded 90-day challenge into an enterprise-grade multi-course LMS built with Next.js 16 (App Router), React 19 Server Components, Supabase SSR Auth, and PostgreSQL with Row-Level Security.
- **Organization:** AKStack Enterprise Engineering
- **Target Audience:** Engineering professionals, student cohorts, instructors, and super administrators.

## Key Technical Decisions
- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind CSS v4 (dark matte palette).
- **Central Supabase Instance:** `https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io`
- **Multi-Project Isolation:** Unique table namespace `app_akstack_lms_*` (coexists with `app_school_management_*` in the shared database).
- **Database & Auth:** Supabase PostgreSQL with strict Row-Level Security (RLS) policies and helper security-definer functions (`app_akstack_lms_is_admin()`, `app_akstack_lms_has_course_access()`).
- **Global Super Admin:** `admin@akstack.com` (#Akaash22#) has platform-wide bypass.
- **Containerization & Deployment:** Multi-stage Dockerfile deployed on Dokploy VPS under Project `Agent-Supabase` (`rQWi4G7mifTX_cwpLbWTk`), Environment `production` (`awOmNSOg-Crp27dEU8gm6`), URL `https://lms.akstack.com`.
- **Access Control:** Per-course entitlement validation in both database RLS and Next.js Server Components.
- **Curriculum Hierarchy:** Course $\rightarrow$ Modules/Chapters $\rightarrow$ Lessons with order indices.
- **Migration Engine:** Automated idempotent script (`scripts/migrate-curriculum.ts`) targeting `app_akstack_lms_*` without data loss or duplication.
- **GitHub Repository:** `https://github.com/AnandKg22/akstack-lms.git` (Pushed to `main`)
- **Live Database Telemetry:** 1 course, 9 modules, 84 lessons active in `public.app_akstack_lms_*`
- **Telemetry:** Real-time lesson progress tracking (`app_akstack_lms_lesson_progress`) with completion percentages and access timestamps.



## Milestones & Status
- **Phase 1 (Database & RLS Engine):** COMPLETE
- **Phase 2 (Super Admin Content Studio):** COMPLETE
- **Phase 3 (Student Course Player & Entitlements):** COMPLETE
- **Phase 4 (Testing, Quality Gates & Production Documentation):** COMPLETE

## Test & Governance Suite
- Zod Schema validation unit tests: `tests/zod-schemas.test.ts`
- Entitlement gating unit tests: `tests/entitlements.test.ts`
- Quality Plan: `TEST_PLAN.md`
- Production Runbook: `DEPLOYMENT.md`
- Task Tracking: `TASKS.md`
- Tech Stack ADR: `docs/decisions/ADR-001-tech-stack.md`
- Threat Model & Security Audit: `docs/reviews/SECURITY_REVIEW.md`
- Final Delivery Report: `docs/FINAL_DELIVERY_REPORT.md`

