import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CourseWithHierarchy } from "@/types/database.types";
import {
  deleteModuleAction,
  deleteLessonAction,
  reorderModulesAction,
  reorderLessonsAction
} from "@/actions/admin-courses";

async function getCourseCurriculum(courseId: string): Promise<CourseWithHierarchy | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: course } = await supabase
    .from("app_akstack_lms_courses")
    .select(`
      *,
      app_akstack_lms_modules (
        *,
        app_akstack_lms_lessons (*)
      )
    `)
    .eq("id", courseId)
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

  return { ...(course as any), modules: sortedModules };
}

export default async function AdminCurriculumBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseCurriculum(courseId);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/dashboard/admin/courses" className="hover:underline">Courses</Link>
            <span>/</span>
            <span className="text-zinc-200">{course.title}</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Curriculum Builder</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/admin/courses/${courseId}/settings`}
            className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition"
          >
            Course Settings
          </Link>
          <button
            type="button"
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md shadow-sm transition"
          >
            + Add Module
          </button>
        </div>
      </div>

      {/* Modules List */}
      {course.modules.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <p className="text-zinc-400">No modules added yet.</p>
          <p className="text-xs text-zinc-500 mt-1">Start by adding your first module to organize lessons.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {course.modules.map((mod, modIdx) => (
            <div
              key={mod.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
            >
              {/* Module Header */}
              <div className="p-4 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800 text-xs font-mono font-bold text-zinc-400">
                    {modIdx + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{mod.title}</h3>
                    {mod.description && (
                      <p className="text-xs text-zinc-400">{mod.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/admin/courses/${courseId}/modules/${mod.id}/new-lesson`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20"
                  >
                    + Add Lesson
                  </Link>
                  <form action={deleteModuleAction.bind(null, mod.id, courseId)}>
                    <button
                      type="submit"
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/10 rounded transition"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>

              {/* Lessons Sub-Tree */}
              <div className="p-3 divide-y divide-zinc-800/60">
                {mod.lessons.length === 0 ? (
                  <p className="text-xs text-zinc-500 p-2 italic">No lessons in this module.</p>
                ) : (
                  mod.lessons.map((lesson, lessonIdx) => (
                    <div
                      key={lesson.id}
                      className="py-2.5 px-3 flex items-center justify-between hover:bg-zinc-800/20 rounded transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-zinc-500">
                          {modIdx + 1}.{lessonIdx + 1}
                        </span>
                        <Link
                          href={`/dashboard/admin/courses/${courseId}/lessons/${lesson.id}`}
                          className="text-sm font-medium text-zinc-200 hover:text-white hover:underline"
                        >
                          {lesson.title}
                        </Link>
                        {lesson.is_preview && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Preview
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/admin/courses/${courseId}/lessons/${lesson.id}`}
                          className="text-xs text-zinc-400 hover:text-white px-2 py-1 bg-zinc-800 rounded border border-zinc-700"
                        >
                          Edit
                        </Link>
                        <form action={deleteLessonAction.bind(null, lesson.id, courseId)}>
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 hover:text-red-400 p-1 transition"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
