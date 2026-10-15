-- ==============================================================================
-- AKStack Multi-Course LMS Migration (Isolated Multi-Project Supabase Namespace)
-- Version: 20261015000000
-- Target Instance: https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io
-- Database Isolation Prefix: app_akstack_lms_*
-- Global Super Admin: admin@akstack.com
-- ==============================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Project-Isolated User Role Enum
DO $$ BEGIN
    CREATE TYPE app_akstack_lms_user_role_enum AS ENUM ('admin', 'instructor', 'student');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Triggers helper for updated_at timestamps
CREATE OR REPLACE FUNCTION app_akstack_lms_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Helper Function: Check if authenticated user is Admin or Global Super Admin
CREATE OR REPLACE FUNCTION public.app_akstack_lms_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        auth.jwt() ->> 'email' = 'admin@akstack.com' OR
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                email = 'admin@akstack.com' OR
                raw_user_meta_data->>'role' IN ('admin', 'super_admin', 'superadmin') OR
                raw_app_meta_data->>'role' IN ('admin', 'super_admin', 'superadmin')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Table 1: app_akstack_lms_courses
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_akstack_lms_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    thumbnail_url TEXT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    community_id UUID, -- Forward-compatible hook for future community hubs
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_akstack_lms_courses_slug_idx ON public.app_akstack_lms_courses (slug);
CREATE INDEX IF NOT EXISTS app_akstack_lms_courses_is_published_idx ON public.app_akstack_lms_courses (is_published);
CREATE INDEX IF NOT EXISTS app_akstack_lms_courses_community_id_idx ON public.app_akstack_lms_courses (community_id);

DROP TRIGGER IF EXISTS trg_app_akstack_lms_courses_updated_at ON public.app_akstack_lms_courses;
CREATE TRIGGER trg_app_akstack_lms_courses_updated_at
BEFORE UPDATE ON public.app_akstack_lms_courses
FOR EACH ROW EXECUTE FUNCTION app_akstack_lms_set_updated_at();

-- ------------------------------------------------------------------------------
-- Table 2: app_akstack_lms_modules (Chapters)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_akstack_lms_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.app_akstack_lms_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_akstack_lms_modules_course_id_idx ON public.app_akstack_lms_modules (course_id);
CREATE INDEX IF NOT EXISTS app_akstack_lms_modules_order_idx ON public.app_akstack_lms_modules (course_id, order_index);

DROP TRIGGER IF EXISTS trg_app_akstack_lms_modules_updated_at ON public.app_akstack_lms_modules;
CREATE TRIGGER trg_app_akstack_lms_modules_updated_at
BEFORE UPDATE ON public.app_akstack_lms_modules
FOR EACH ROW EXECUTE FUNCTION app_akstack_lms_set_updated_at();

-- ------------------------------------------------------------------------------
-- Table 3: app_akstack_lms_lessons
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_akstack_lms_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.app_akstack_lms_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT, -- Markdown / KaTeX source
    order_index INTEGER NOT NULL,
    is_preview BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS app_akstack_lms_lessons_module_slug_idx ON public.app_akstack_lms_lessons (module_id, slug);
CREATE INDEX IF NOT EXISTS app_akstack_lms_lessons_module_order_idx ON public.app_akstack_lms_lessons (module_id, order_index);
CREATE INDEX IF NOT EXISTS app_akstack_lms_lessons_is_preview_idx ON public.app_akstack_lms_lessons (is_preview);

DROP TRIGGER IF EXISTS trg_app_akstack_lms_lessons_updated_at ON public.app_akstack_lms_lessons;
CREATE TRIGGER trg_app_akstack_lms_lessons_updated_at
BEFORE UPDATE ON public.app_akstack_lms_lessons
FOR EACH ROW EXECUTE FUNCTION app_akstack_lms_set_updated_at();

-- ------------------------------------------------------------------------------
-- Table 4: app_akstack_lms_course_enrollments (Entitlements)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_akstack_lms_course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.app_akstack_lms_courses(id) ON DELETE CASCADE,
    payment_provider TEXT NOT NULL DEFAULT 'manual', -- 'paypal', 'stripe', 'manual'
    transaction_id TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'refunded'
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT app_akstack_lms_enrollments_user_course_unique UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS app_akstack_lms_enrollments_user_idx ON public.app_akstack_lms_course_enrollments (user_id);
CREATE INDEX IF NOT EXISTS app_akstack_lms_enrollments_course_idx ON public.app_akstack_lms_course_enrollments (course_id);
CREATE INDEX IF NOT EXISTS app_akstack_lms_enrollments_status_idx ON public.app_akstack_lms_course_enrollments (status);

-- ------------------------------------------------------------------------------
-- Helper Function: Check course entitlement
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.app_akstack_lms_has_course_access(p_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.app_akstack_lms_is_admin() THEN
        RETURN true;
    END IF;

    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.app_akstack_lms_course_enrollments
        WHERE user_id = auth.uid()
          AND course_id = p_course_id
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Table 5: app_akstack_lms_lesson_progress (Telemetry)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_akstack_lms_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES public.app_akstack_lms_lessons(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.app_akstack_lms_courses(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT app_akstack_lms_progress_user_lesson_unique UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS app_akstack_lms_progress_user_course_idx ON public.app_akstack_lms_lesson_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS app_akstack_lms_progress_completed_idx ON public.app_akstack_lms_lesson_progress (user_id, is_completed);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.app_akstack_lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_akstack_lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_akstack_lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_akstack_lms_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_akstack_lms_lesson_progress ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Policies: app_akstack_lms_courses
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "app_akstack_lms_courses_read" ON public.app_akstack_lms_courses;
CREATE POLICY "app_akstack_lms_courses_read"
ON public.app_akstack_lms_courses FOR SELECT
USING (is_published = true OR public.app_akstack_lms_is_admin());

DROP POLICY IF EXISTS "app_akstack_lms_courses_admin_all" ON public.app_akstack_lms_courses;
CREATE POLICY "app_akstack_lms_courses_admin_all"
ON public.app_akstack_lms_courses FOR ALL
USING (public.app_akstack_lms_is_admin())
WITH CHECK (public.app_akstack_lms_is_admin());

-- ------------------------------------------------------------------------------
-- Policies: app_akstack_lms_modules
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "app_akstack_lms_modules_read" ON public.app_akstack_lms_modules;
CREATE POLICY "app_akstack_lms_modules_read"
ON public.app_akstack_lms_modules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.app_akstack_lms_courses c
        WHERE c.id = app_akstack_lms_modules.course_id
        AND (c.is_published = true OR public.app_akstack_lms_is_admin())
    )
);

DROP POLICY IF EXISTS "app_akstack_lms_modules_admin_all" ON public.app_akstack_lms_modules;
CREATE POLICY "app_akstack_lms_modules_admin_all"
ON public.app_akstack_lms_modules FOR ALL
USING (public.app_akstack_lms_is_admin())
WITH CHECK (public.app_akstack_lms_is_admin());

-- ------------------------------------------------------------------------------
-- Policies: app_akstack_lms_lessons
-- ------------------------------------------------------------------------------
-- Free preview lessons can be read by anyone if course is published
DROP POLICY IF EXISTS "app_akstack_lms_lessons_read_preview" ON public.app_akstack_lms_lessons;
CREATE POLICY "app_akstack_lms_lessons_read_preview"
ON public.app_akstack_lms_lessons FOR SELECT
USING (
    is_preview = true AND
    EXISTS (
        SELECT 1 FROM public.app_akstack_lms_modules m
        JOIN public.app_akstack_lms_courses c ON c.id = m.course_id
        WHERE m.id = app_akstack_lms_lessons.module_id
        AND (c.is_published = true OR public.app_akstack_lms_is_admin())
    )
);

-- Protected lessons require active enrollment or admin privilege
DROP POLICY IF EXISTS "app_akstack_lms_lessons_read_enrolled" ON public.app_akstack_lms_lessons;
CREATE POLICY "app_akstack_lms_lessons_read_enrolled"
ON public.app_akstack_lms_lessons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.app_akstack_lms_modules m
        WHERE m.id = app_akstack_lms_lessons.module_id
        AND public.app_akstack_lms_has_course_access(m.course_id)
    )
);

DROP POLICY IF EXISTS "app_akstack_lms_lessons_admin_all" ON public.app_akstack_lms_lessons;
CREATE POLICY "app_akstack_lms_lessons_admin_all"
ON public.app_akstack_lms_lessons FOR ALL
USING (public.app_akstack_lms_is_admin())
WITH CHECK (public.app_akstack_lms_is_admin());

-- ------------------------------------------------------------------------------
-- Policies: app_akstack_lms_course_enrollments
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "app_akstack_lms_enrollments_read_own" ON public.app_akstack_lms_course_enrollments;
CREATE POLICY "app_akstack_lms_enrollments_read_own"
ON public.app_akstack_lms_course_enrollments FOR SELECT
USING (auth.uid() = user_id OR public.app_akstack_lms_is_admin());

DROP POLICY IF EXISTS "app_akstack_lms_enrollments_admin_all" ON public.app_akstack_lms_course_enrollments;
CREATE POLICY "app_akstack_lms_enrollments_admin_all"
ON public.app_akstack_lms_course_enrollments FOR ALL
USING (public.app_akstack_lms_is_admin())
WITH CHECK (public.app_akstack_lms_is_admin());

-- ------------------------------------------------------------------------------
-- Policies: app_akstack_lms_lesson_progress
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "app_akstack_lms_progress_manage_own" ON public.app_akstack_lms_lesson_progress;
CREATE POLICY "app_akstack_lms_progress_manage_own"
ON public.app_akstack_lms_lesson_progress FOR ALL
USING (auth.uid() = user_id OR public.app_akstack_lms_is_admin())
WITH CHECK (auth.uid() = user_id OR public.app_akstack_lms_is_admin());
