"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize server-side Supabase client with Service Role for admin operations
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin configuration");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// Security Gate: Verify admin privileges (allows global superadmin admin@akstack.com)
async function verifyAdminAuth(userId?: string) {
  const supabase = getAdminSupabase();
  if (userId) {
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    const email = user?.user?.email;
    const role = user?.user?.user_metadata?.role || user?.user?.app_metadata?.role;
    if (email !== "admin@akstack.com" && role !== "admin" && role !== "superadmin" && role !== "super_admin") {
      throw new Error("Unauthorized: Super Admin privileges required");
    }
  }
}

// -----------------------------------------------------------------------------
// Zod Schemas (Internal)
// -----------------------------------------------------------------------------
const CourseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().nullable(),
  price_cents: z.number().int().min(0, "Price must be positive in cents"),
  currency: z.string().default("USD"),
  thumbnail_url: z.string().url("Valid URL required").optional().nullable(),
  is_published: z.boolean().default(false),
  community_id: z.string().uuid().optional().nullable(),
});

const ModuleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(2, "Module title required"),
  description: z.string().optional().nullable(),
  order_index: z.number().int().min(1),
});

const LessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(2, "Lesson title required"),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  content: z.string().optional().nullable(),
  order_index: z.number().int().min(1),
  is_preview: z.boolean().default(false),
});

// -----------------------------------------------------------------------------
// Course Server Actions (app_akstack_lms_courses)
// -----------------------------------------------------------------------------
export async function createCourseAction(rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = CourseSchema.parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_courses")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(`Failed to create course: ${error.message}`);
  revalidatePath("/dashboard/admin/courses");
  return data;
}

export async function updateCourseAction(courseId: string, rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = CourseSchema.partial().parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_courses")
    .update(parsed)
    .eq("id", courseId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update course: ${error.message}`);
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}/settings`);
  revalidatePath(`/courses/${data.slug}`);
  return data;
}

export async function deleteCourseAction(courseId: string) {
  await verifyAdminAuth();
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("app_akstack_lms_courses")
    .delete()
    .eq("id", courseId);

  if (error) throw new Error(`Failed to delete course: ${error.message}`);
  revalidatePath("/dashboard/admin/courses");
  return { success: true };
}

// -----------------------------------------------------------------------------
// Module Server Actions (app_akstack_lms_modules)
// -----------------------------------------------------------------------------
export async function createModuleAction(rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = ModuleSchema.parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_modules")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(`Failed to create module: ${error.message}`);
  revalidatePath(`/dashboard/admin/courses/${parsed.course_id}/curriculum`);
  return data;
}

export async function updateModuleAction(moduleId: string, rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = ModuleSchema.partial().parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_modules")
    .update(parsed)
    .eq("id", moduleId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update module: ${error.message}`);
  if (data?.course_id) {
    revalidatePath(`/dashboard/admin/courses/${data.course_id}/curriculum`);
  }
  return data;
}

export async function deleteModuleAction(moduleId: string, courseId: string) {
  await verifyAdminAuth();
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("app_akstack_lms_modules")
    .delete()
    .eq("id", moduleId);

  if (error) throw new Error(`Failed to delete module: ${error.message}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  return { success: true };
}

export async function reorderModulesAction(courseId: string, orderedModuleIds: string[]) {
  await verifyAdminAuth();
  const supabase = getAdminSupabase();

  const updates = orderedModuleIds.map((id, index) =>
    supabase
      .from("app_akstack_lms_modules")
      .update({ order_index: index + 1 })
      .eq("id", id)
      .eq("course_id", courseId)
  );

  await Promise.all(updates);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  return { success: true };
}

// -----------------------------------------------------------------------------
// Lesson Server Actions (app_akstack_lms_lessons)
// -----------------------------------------------------------------------------
export async function createLessonAction(courseId: string, rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = LessonSchema.parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_lessons")
    .insert(parsed)
    .select()
    .single();

  if (error) throw new Error(`Failed to create lesson: ${error.message}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  return data;
}

export async function updateLessonAction(lessonId: string, courseId: string, rawInput: unknown) {
  await verifyAdminAuth();
  const parsed = LessonSchema.partial().parse(rawInput);
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("app_akstack_lms_lessons")
    .update(parsed)
    .eq("id", lessonId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update lesson: ${error.message}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/lessons/${lessonId}`);
  return data;
}

export async function deleteLessonAction(lessonId: string, courseId: string) {
  await verifyAdminAuth();
  const supabase = getAdminSupabase();

  const { error } = await supabase
    .from("app_akstack_lms_lessons")
    .delete()
    .eq("id", lessonId);

  if (error) throw new Error(`Failed to delete lesson: ${error.message}`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  return { success: true };
}

export async function reorderLessonsAction(courseId: string, moduleId: string, orderedLessonIds: string[]) {
  await verifyAdminAuth();
  const supabase = getAdminSupabase();

  const updates = orderedLessonIds.map((id, index) =>
    supabase
      .from("app_akstack_lms_lessons")
      .update({ order_index: index + 1 })
      .eq("id", id)
      .eq("module_id", moduleId)
  );

  await Promise.all(updates);
  revalidatePath(`/dashboard/admin/courses/${courseId}/curriculum`);
  return { success: true };
}
