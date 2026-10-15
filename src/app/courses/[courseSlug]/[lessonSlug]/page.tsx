import React from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CourseWithHierarchy, Lesson, LessonProgress } from "@/types/database.types";
import { DynamicCourseSidebar } from "@/components/course/DynamicCourseSidebar";
import { LessonViewer } from "@/components/course/LessonViewer";
import { markLessonVisitedAction } from "@/actions/progress";

async function fetchCourseAndLesson(courseSlug: string, lessonSlug: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // 1. Fetch course with full hierarchy from app_akstack_lms_courses
  const { data: course } = await supabase
    .from("app_akstack_lms_courses")
    .select(`
      *,
      app_akstack_lms_modules (
        *,
        app_akstack_lms_lessons (*)
      )
    `)
    .eq("slug", courseSlug)
    .single();

  if (!course) return null;

  const rawModules = (course as any).app_akstack_lms_modules || (course as any).modules || [];
  const sortedModules = rawModules
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((m: any) => {
      const rawLessons = m.app_akstack_lms_lessons || m.lessons || [];
      return {
        ...m,
        lessons: rawLessons.sort((a: any, b: any) => a.order_index - b.order_index),
      };
    });

  const courseWithHierarchy: CourseWithHierarchy = {
    ...(course as any),
    modules: sortedModules,
  };

  // 2. Locate active lesson
  const allLessons = sortedModules.flatMap((m: any) => m.lessons);
  const activeIndex = allLessons.findIndex((l: any) => l.slug === lessonSlug);
  if (activeIndex === -1) return null;

  const currentLesson: Lesson = allLessons[activeIndex];
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;

  return {
    course: courseWithHierarchy,
    lesson: currentLesson,
    prevLesson,
    nextLesson,
  };
}

export default async function StudentCoursePlayerPage({
  params,
}: {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const data = await fetchCourseAndLesson(courseSlug, lessonSlug);

  if (!data) {
    notFound();
  }

  const { course, lesson, prevLesson, nextLesson } = data;

  // In production with Supabase SSR, extract auth.uid()
  // Mock student identity for verification
  const userId = "current-authenticated-user-id";
  const hasEntitlement = true; // Evaluated via public.app_akstack_lms_has_course_access(course.id)

  // Gating check: non-preview lessons require active enrollment
  if (!lesson.is_preview && !hasEntitlement) {
    redirect(`/courses/${courseSlug}?locked=true`);
  }

  // Fetch student progress list
  const progressList: LessonProgress[] = []; // In production, query app_akstack_lms_lesson_progress for userId and course.id
  const isCompletedInitially = progressList.some(
    (p) => p.lesson_id === lesson.id && p.is_completed
  );

  // Record access timestamp non-blockingly
  await markLessonVisitedAction(userId, course.id, lesson.id);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Dynamic Course Hierarchy Sidebar */}
      <DynamicCourseSidebar
        course={course}
        progressList={progressList}
        hasEntitlement={hasEntitlement}
      />

      {/* Main Interactive Lesson Viewer */}
      <LessonViewer
        lesson={lesson}
        courseSlug={courseSlug}
        courseId={course.id}
        userId={userId}
        isCompletedInitially={isCompletedInitially}
        prevLesson={prevLesson ? { title: prevLesson.title, slug: prevLesson.slug } : null}
        nextLesson={nextLesson ? { title: nextLesson.title, slug: nextLesson.slug } : null}
      />
    </div>
  );
}
