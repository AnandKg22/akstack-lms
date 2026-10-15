# SYSTEM_STATE.md — AKStack Multi-Course LMS Architecture & State

**Project:** AKStack Multi-Course Learning Management System  
**Slug:** `akstack-lms` (Database Namespace: `app_akstack_lms_*`)  
**Created:** 2026-10-15  
**Status:** LIVE IN PRODUCTION — Deployed & Verified  
**Dokploy Application ID:** `gomNgc8X6_9ocPwdTf9VM`  
**Dokploy Project:** `Agent-Supabase` (`rQWi4G7mifTX_cwpLbWTk`)  
**Dokploy Environment:** `production` (`awOmNSOg-Crp27dEU8gm6`)  
**Production URL:** [https://lms.akstack.com](https://lms.akstack.com)  
**GitHub Repository:** [https://github.com/AnandKg22/akstack-lms](https://github.com/AnandKg22/akstack-lms)  
**Central Supabase Instance:** `https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io`  
**Database Isolation Prefix:** `app_akstack_lms_*` (5 isolated tables verified)  
**Live DB Telemetry:** 1 course, 9 modules, 84 lessons active in `public.app_akstack_lms_*`  
**Latest Deployment ID:** `1S2tZxQlnxJHrRG0EJetQ` (Status: `done`)  
**Latest Deployed Commit:** `f0c1966`  
**Global Super Admin:** `admin@akstack.com`  
**Verified Endpoints:**
- `GET https://lms.akstack.com/api/health` -> HTTP 200 OK (`{"status":"ok","service":"akstack-lms","database":"connected","records":{"courses":1}}`)
- `GET https://lms.akstack.com/` -> HTTP 200 OK (Course Catalog)
- `GET https://lms.akstack.com/courses/gtm-engineering-90-day-challenge` -> HTTP 200 OK (Course Landing Page)
- `GET https://lms.akstack.com/dashboard/admin/courses` -> HTTP 200 OK (Admin Course Studio)
- `GET https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io/rest/v1/app_akstack_lms_courses` -> HTTP 200 OK


---

## 1. Confirmed Decisions & Architectural Blueprint

1. **Core Value Proposition**:
   - Enterprise-grade multi-course Learning Management System with granular paywalls, progress telemetry, and rich dual-pane Markdown/KaTeX authoring.
   - Modules: Standalone courses with dynamic pricing, nested Course -> Modules -> Lessons hierarchy, public sales pages, entitlement-gated video & reading player, and real-time student completion tracking.

2. **Technology Stack**:
   - **Framework**: Next.js 16 (App Router), React 19, TypeScript (strict mode, zero implicit any)
   - **Styling**: Tailwind CSS v4, Lucide React icons, dark matte modern UI palette
   - **Data Layer**: Central Supabase PostgreSQL with `app_akstack_lms_*` table isolation and Row-Level Security (RLS)
   - **Containerization**: Standalone multi-stage Dockerfile (`node:20-alpine`) deployed on Dokploy VPS

3. **Multi-Tenancy & Database Isolation in Shared Supabase**:
   - Table prefix: `app_akstack_lms_*`
     1. `app_akstack_lms_courses`
     2. `app_akstack_lms_modules`
     3. `app_akstack_lms_lessons`
     4. `app_akstack_lms_course_enrollments`
     5. `app_akstack_lms_lesson_progress`
   - Strict Row-Level Security (RLS) on all tables:
     - Anonymous users can only read published course metadata and free preview lessons (`is_preview = true`).
     - Enrolled students can access paid lesson content via `app_akstack_lms_has_course_access(course_id)`.
     - Global Superadmin bypass (`admin@akstack.com` or `role IN ('admin', 'superadmin', 'super_admin')`) via `app_akstack_lms_is_admin()`.

4. **Curriculum Ingestion Engine**:
   - Automated idempotent migration script (`scripts/migrate-curriculum.ts`) targets `app_akstack_lms_*` tables to import legacy flat 90-day lessons without duplicating keys or altering other projects in the shared Supabase instance.

5. **Dokploy VPS Deployment Pipeline**:
   - Standalone multi-stage Dockerfile with internal healthcheck.
   - Deploys as an Application under Dokploy project `Agent-Supabase` (`rQWi4G7mifTX_cwpLbWTk`) in environment `production` (`awOmNSOg-Crp27dEU8gm6`).
   - Domain routing to `lms.akstack.com` with automated Let's Encrypt SSL.
