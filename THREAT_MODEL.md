# Threat Model — AKStack Multi-Course LMS

> Methodology: STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## 1. Trust Boundaries & Assets
- **Critical Assets:** Proprietary course content (non-preview lessons), student PII, enrollment status, and payment transaction IDs.
- **Trust Boundaries:**
  - Public Internet $\leftrightarrow$ Next.js Server Components.
  - Next.js Server Actions $\leftrightarrow$ Supabase PostgreSQL.
  - Anonymous Users $\leftrightarrow$ Authenticated Students $\leftrightarrow$ Super Administrators.

---

## 2. STRIDE Analysis & Mitigations

| Threat ID | Threat Category | Threat Scenario | Impact | Mitigation & Security Control | Status |
|---|---|---|---|---|---|
| **TM-001** | Elevation of Privilege | Non-admin user calls `createCourseAction` or `updateLessonAction` directly. | Critical | Server Action checks `is_admin()` claim on server side; database RLS restricts write operations to admin role. | Mitigated |
| **TM-002** | Information Disclosure | Unauthorized user accesses protected lesson markdown by requesting `/courses/[courseSlug]/[lessonSlug]`. | High | Server Component checks `has_course_access()`; database RLS policy blocks direct table SELECT for non-preview lessons without active enrollment. | Mitigated |
| **TM-003** | Tampering | Student tampers with lesson progress to mark another student's lessons complete. | High | RLS policy on `lesson_progress` enforces `auth.uid() = user_id`; Server Action validates authenticated session ID. | Mitigated |
| **TM-004** | Spoofing | Attacker sends forged PayPal webhook/capture payload to grant course access. | Critical | Webhook signature verification and server-side capture verification against PayPal REST API before inserting active enrollment. | Mitigated |
| **TM-005** | Information Disclosure | Database credentials or `SUPABASE_SERVICE_ROLE_KEY` leak into client bundle. | Critical | Service role key restricted strictly to server actions and server components. Zero client exposure. | Mitigated |
| **TM-006** | Denial of Service | Malicious user submits deeply nested or oversized markdown payload to crash KaTeX parser. | Medium | Zod input length constraints on lesson content; sanitized markdown rendering. | Mitigated |
