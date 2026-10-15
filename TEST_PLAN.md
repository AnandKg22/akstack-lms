# AKStack LMS - Comprehensive Quality & Test Plan

This document establishes the testing strategy, acceptance criteria, and automated quality gates for the AKStack Multi-Course Learning Management System.

---

## 1. Quality Gates (G1 to G7)

| Gate | Category | Description | Enforcement Mechanism |
|---|---|---|---|
| **G1** | Requirements Compliance | 100% of user prompt specifications implemented (Multi-course schema, RLS, Admin studio, Dynamic player, Telemetry). | Acceptance Review Checklist |
| **G2** | Type & Schema Safety | Strict TypeScript type checking and Zod schema validations for all DB models and Server Action inputs. | `npm run test` & `tsc --noEmit` |
| **G3** | Security & RLS Isolation | Multi-tenant and student isolation; anonymous users cannot access paid lesson markdown. Super Admin bypass enforced safely. | Vitest unit tests & Postgres RLS integration tests |
| **G4** | Migration Idempotency | `scripts/migrate-curriculum.ts` can run repeatedly against `lessons.json` without duplicate keys or data corruption. | ON CONFLICT DO UPDATE upserts |
| **G5** | Server-Side State & Cache | Next.js Server Actions enforce `revalidatePath` to keep client cache fresh upon edits or progress marking. | Integration test & smoke verification |
| **G6** | Telemetry & Progress Integrity | Lesson progress tracks completion state, percentage calculation, and last accessed timestamp accurately. | Unit test suites & DB triggers |
| **G7** | Zero CJK & English Compliance | Strictly 0 non-English/CJK characters across all codebase files, logs, and artifacts. | Evaluator Regex Scan |

---

## 2. Test Execution Matrix

### Unit Testing (`vitest run`)
- **Validation Tests:** [tests/zod-schemas.test.ts](file:///d:/VSCode/MiMo/Agent-Builder/web-application-builder/projects/akstack-lms/tests/zod-schemas.test.ts)
  - Validates Course, Module, and Lesson schema invariants.
  - Verifies rejection of malformed slugs and negative pricing.
- **Entitlement Tests:** [tests/entitlements.test.ts](file:///d:/VSCode/MiMo/Agent-Builder/web-application-builder/projects/akstack-lms/tests/entitlements.test.ts)
  - Verifies anonymous access gating.
  - Verifies enrolled student permissions.
  - Verifies Super Admin unconditional bypass.

### Database & RLS Testing
- Execute SQL migration: [supabase/migrations/20261015000000_multi_course_lms_schema.sql](file:///d:/VSCode/MiMo/Agent-Builder/web-application-builder/projects/akstack-lms/supabase/migrations/20261015000000_multi_course_lms_schema.sql) in local Supabase CLI (`supabase db reset`).
- Test security helper functions:
  ```sql
  SELECT public.is_admin();
  SELECT public.has_course_access('00000000-0000-0000-0000-000000000000');
  ```
- Verify that querying `lessons` table as unauthenticated anon key returns only rows where `is_preview = true`.

---

## 3. Browser & Interactive Verification Checklist

1. **Course Marketplace (`/courses/[courseSlug]`):**
   - Displays course banner, price tag, author metadata, and interactive module accordion.
   - Preview lessons feature an active "Free Preview" badge and allow one-click playback.
   - Non-preview lessons show a padlock icon and prompt unauthenticated/unenrolled users to purchase.
2. **Student Player (`/courses/[courseSlug]/[lessonSlug]`):**
   - `DynamicCourseSidebar` displays completion percentage bar and checklist of lessons.
   - `LessonViewer` renders GitHub Flavored Markdown and KaTeX mathematical notation.
   - Clicking "Mark Complete & Continue" executes Server Action `updateLessonProgress`, recalculates progress, and advances navigation.
3. **Super Admin Content Studio (`/dashboard/admin/courses`):**
   - Non-admin attempts to access `/dashboard/admin/courses` are redirected to `/dashboard`.
   - Course CRUD dialogs enable quick creation with slug auto-generation.
   - Curriculum builder supports reordering modules and lessons.
   - Dual-pane Markdown editor synchronizes live preview with syntax highlighting.
