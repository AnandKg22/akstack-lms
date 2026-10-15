# AKStack Multi-Course LMS Engine

Enterprise-grade multi-course Learning Management System built for AKStack using Next.js 16 (App Router), React 19, Supabase SSR Auth, and PostgreSQL.

---

## Architecture Overview
- **Database & RLS Engine (`supabase/migrations/`):** Full PostgreSQL migration with enums, courses, modules, lessons, course enrollments, and progress telemetry.
- **Migration Engine (`scripts/migrate-curriculum.ts`):** Automated idempotent migration script mapping legacy `lessons.json` into the relational hierarchy.
- **Admin Studio (`src/app/dashboard/admin/courses/`):** Visual curriculum builder, course settings, and dual-pane Markdown/KaTeX preview editor.
- **Student Player (`src/app/courses/[courseSlug]/[lessonSlug]/`):** Paywall access gating, interactive sidebar with real-time completion percentages, and KaTeX math formulas.
- **Server Actions (`src/actions/`):** Zod-validated mutations for admin management, student progress telemetry, and PayPal checkout capture.

---

## How to Run Migrations

1. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
2. Apply the PostgreSQL database migration via Supabase CLI or Dashboard SQL Editor:
   ```bash
   cat supabase/migrations/20261015000000_multi_course_lms_schema.sql
   ```
3. Run the curriculum migration script to port `lessons.json`:
   ```bash
   npx ts-node scripts/migrate-curriculum.ts
   ```

---

## Key Directories
- `src/types/database.types.ts`: TypeScript definitions matching Supabase schema.
- `src/actions/admin-courses.ts`: Course, module, and lesson CRUD Server Actions.
- `src/actions/progress.ts`: Lesson telemetry and completion tracking.
- `src/actions/enrollment.ts`: PayPal checkout capture and entitlement granting.
- `src/components/course/`: `DynamicCourseSidebar.tsx` and `LessonViewer.tsx`.
