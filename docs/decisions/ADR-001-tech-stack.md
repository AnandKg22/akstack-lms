# ADR-001: Architectural Decision Record - Core Tech Stack & Security Model

## Context
AKStack needed to migrate from a hardcoded 90-day challenge curriculum into an enterprise multi-course Learning Management System supporting dynamic pricing, public sales pages, granular course entitlements, and telemetry.

## Decision
1. **Application Framework: Next.js 16 App Router & React 19**
   - Utilizes Server Components for zero-bundle-size markdown rendering and SEO optimization on public course pages.
   - Server Actions handle all mutations (enrollments, admin updates, progress tracking) with built-in CSRF protection and automatic data revalidation.
2. **Database & Auth: Supabase & PostgreSQL 16**
   - Database-level Row-Level Security (RLS) guarantees data isolation. Even direct client API calls cannot read paid lesson content without an active enrollment record.
   - PostgreSQL helper functions `is_admin()` and `has_course_access(UUID)` provide performant, cached security checks.
3. **Styling: Tailwind CSS v4**
   - Streamlined, high-performance styling using CSS variables and modern layout primitives for dual-pane editing and mobile-responsive student viewing.
4. **Validation: Zod v3**
   - Strict runtime input boundary validation across all Server Actions and DTO models.

## Consequences
- High security: Markdown bodies are protected at the database engine level.
- Low operational overhead: Serverless database and SSR computing reduce infrastructure maintenance.
- Forward compatibility: The database schema includes a `community_id` foreign key hook for future community forum integrations.
