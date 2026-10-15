import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { CourseWithHierarchy } from "@/types/database.types";
import { grantCourseEntitlementAction } from "@/actions/enrollment";

async function getCourseOverview(slug: string): Promise<CourseWithHierarchy | null> {
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
    .eq("slug", slug)
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

export default async function CourseSalesLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ locked?: string }>;
}) {
  const { courseSlug } = await params;
  const { locked } = await searchParams;
  const course = await getCourseOverview(courseSlug);

  if (!course) {
    notFound();
    return null;
  }


  const allLessons = course.modules.flatMap((m) => m.lessons);
  const firstLesson = allLessons[0];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Locked Access Warning Banner */}
        {locked && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-sm">
            <span>🔒 That lesson is part of the premium curriculum. Please enroll below to unlock full access.</span>
          </div>
        )}

        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            Enterprise Multi-Course Curriculum
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            {course.title}
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            {course.description || "Master high-leverage architectural patterns, end-to-end telemetry, and modern full-stack workflows."}
          </p>
        </div>

        {/* Pricing & Checkout Card */}
        <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">Lifetime Access Pass</span>
            <div className="text-3xl font-extrabold text-white mt-1">
              ${(course.price_cents / 100).toFixed(2)}{" "}
              <span className="text-sm font-normal text-zinc-400">{course.currency}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Includes all current and future module updates.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {firstLesson && (
              <Link
                href={`/courses/${course.slug}/${firstLesson.slug}`}
                className="px-5 py-3 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-center text-white transition"
              >
                Start Free Preview
              </Link>
            )}
            {/* PayPal Trigger button */}
            <form
              action={async () => {
                "use server";
                await grantCourseEntitlementAction({
                  orderId: `demo-order-${Date.now()}`,
                  courseId: course.id,
                  userId: "mock-user-id",
                  userEmail: "student@example.com",
                });
              }}
            >
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition"
              >
                Enroll Now with PayPal →
              </button>
            </form>
          </div>
        </div>

        {/* Curriculum Outline */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-white">Course Syllabus & Outline</h2>
          <div className="space-y-4">
            {course.modules.map((mod, idx) => (
              <div key={mod.id} className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <h3 className="font-semibold text-white text-base">
                    Module {idx + 1}: {mod.title}
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">
                    {mod.lessons.length} lessons
                  </span>
                </div>
                <div className="mt-3 divide-y divide-zinc-900 text-sm">
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="py-2 flex items-center justify-between text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span>{lesson.is_preview ? "📖" : "🔒"}</span>
                        <span>{lesson.title}</span>
                      </div>
                      {lesson.is_preview ? (
                        <Link
                          href={`/courses/${course.slug}/${lesson.slug}`}
                          className="text-xs text-blue-400 hover:underline font-medium"
                        >
                          View Preview →
                        </Link>
                      ) : (
                        <span className="text-xs text-zinc-600 font-mono">Enrolled Only</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
