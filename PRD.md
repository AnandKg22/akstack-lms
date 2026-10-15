# Product Requirements Document (PRD) — AKStack Multi-Course LMS

## 1. Product Overview & Vision
AKStack is transitioning from a single hardcoded 90-day challenge into an enterprise-grade multi-course Learning Management System (LMS) built with Next.js 16 (App Router), React 19, Supabase SSR Auth, and PostgreSQL.

## 2. Target Personas
- **Students:** Software engineers and technical leaders taking structured multi-week engineering challenges.
- **Instructors:** Domain specialists publishing modules, curriculum outlines, and KaTeX-rich technical lessons.
- **Super Administrators:** Platform owners managing course settings, pricing in cents, publishing status, and telemetry.

## 3. Core Functional Requirements
- **FR-001 (Multi-Course Catalog):** Courses table supporting custom title, slug, price_cents, currency, thumbnail_url, and publication toggles.
- **FR-002 (Hierarchical Curriculum):** 3-tier hierarchy: Course $\rightarrow$ Modules/Chapters $\rightarrow$ Lessons with order_index.
- **FR-003 (Entitlement Gating):** Strict access control via `course_enrollments`. Non-preview lessons accessible only if user has active enrollment or admin privileges.
- **FR-004 (Free Previews):** Lessons marked `is_preview: true` publicly readable to drive checkout conversions.
- **FR-005 (Telemetry & Progress Tracking):** Per-user, per-lesson progress persistence (`lesson_progress`) with completion checkboxes and automatic `last_accessed_at` updates.
- **FR-006 (Curriculum Migration Engine):** Automated idempotent script (`scripts/migrate-curriculum.ts`) reading legacy `lessons.json` and chunking 90 days into modules.
- **FR-007 (Super Admin Studio):** Admin CRUD suite (`/dashboard/admin/courses`) with curriculum builder, drag/drop or up/down reordering, and dual-pane Markdown/KaTeX preview editor.
- **FR-008 (PayPal Integration):** Automatic entitlement grant upon PayPal transaction capture.

## 4. Non-Functional Requirements
- **NFR-001 (Security):** Supabase Row-Level Security (RLS) enabled across 100% of tables with helper functions (`is_admin()`, `has_course_access()`).
- **NFR-002 (Performance):** Dynamic player route loads < 300ms using React 19 Server Components.
- **NFR-003 (Design):** Tailwind CSS v4 dark matte theme adhering to AKStack visual standards.
