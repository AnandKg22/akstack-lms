"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function toggleLessonCompletionAction(
  userId: string,
  courseId: string,
  lessonId: string,
  isCompleted: boolean
) {
  if (!userId) throw new Error("Unauthorized user");
  const supabase = getServerSupabase();

  // Upsert app_akstack_lms_lesson_progress record
  const { error } = await supabase
    .from("app_akstack_lms_lesson_progress")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        is_completed: isCompleted,
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );

  if (error) {
    throw new Error(`Failed to update progress: ${error.message}`);
  }

  // Revalidate caches
  revalidatePath(`/courses/[courseSlug]/[lessonSlug]`, "page");
  revalidatePath("/dashboard");
  return { success: true, isCompleted };
}

export async function markLessonVisitedAction(
  userId: string,
  courseId: string,
  lessonId: string
) {
  if (!userId) return;
  const supabase = getServerSupabase();

  await supabase
    .from("app_akstack_lms_lesson_progress")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        lesson_id: lessonId,
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    );
}
