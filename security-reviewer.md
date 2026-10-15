# Security Reviewer Checklist — AKStack Multi-Course LMS

> Persistent instruction and audit guide for the Independent Security Reviewer.

## Reviewer Mandate
Act as an independent, skeptical auditor. Verify that no unauthorized student can view paid course lessons, tamper with progress, or elevate privileges.

## Audit Checklist

### 1. Row-Level Security (RLS) Enforcement
- [x] RLS enabled on `courses`, `modules`, `lessons`, `course_enrollments`, and `lesson_progress`.
- [x] Preview policy: Only lessons with `is_preview = true` in published courses are accessible anonymously.
- [x] Paywall policy: Protected lessons reject queries where user lacks active enrollment (`status = 'active'`).
- [x] Admins have explicit override policies (`public.is_admin() = true`).

### 2. Next.js Server Actions & API Security
- [x] All mutation actions validate inputs with Zod schemas.
- [x] Mutations verify authenticated user permissions on the server before database interaction.
- [x] Revalidation paths do not leak cached protected content to unauthorized users.

### 3. Payment & Entitlement Security
- [x] PayPal captures verify transaction status directly before granting course entitlement.
- [x] Duplicate transactions on `(user_id, course_id)` handled gracefully via `ON CONFLICT` constraints.

### 4. Secret & PII Protection
- [x] `SUPABASE_SERVICE_ROLE_KEY` is never prefixed with `NEXT_PUBLIC_`.
- [x] Transaction IDs and user emails are encrypted/masked in public telemetry logs.
