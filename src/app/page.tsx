import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { BookOpen, ShieldCheck, Terminal, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

async function getPublishedCourses() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from("app_akstack_lms_courses")
      .select(`
        *,
        modules:app_akstack_lms_modules(
          id,
          lessons:app_akstack_lms_lessons(id)
        )
      `)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const courses = await getPublishedCourses();

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Top Navigation */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              AK
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                AKStack LMS
              </span>
              <span className="text-[10px] text-zinc-400 leading-tight">
                Engineering Curriculum Platform
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link
              href="/courses"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/dashboard/admin/courses"
              className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Studio
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              className="text-zinc-500 hover:text-zinc-300 text-xs font-mono"
            >
              API Status
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Course Learning Management System</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
            Architect, Deploy & Scale <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Enterprise AI & GTM Systems
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Structured 90-day technical tracks, interactive lesson telemetry, gated module progression, and Supabase Row-Level Security isolation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/courses/gtm-engineering-90-day-challenge"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>Explore 90-Day Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/admin/courses"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-sm border border-zinc-700 transition-all"
            >
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Open Course Studio</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Course Catalog Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Available Curricula</h2>
            <p className="text-sm text-zinc-400 mt-1">Select a track to start learning or preview introductory lessons.</p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {courses.length} Active {courses.length === 1 ? "Track" : "Tracks"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const moduleCount = course.modules?.length || 0;
            const lessonCount = course.modules?.reduce(
              (acc: number, m: any) => acc + (m.lessons?.length || 0),
              0
            ) || 0;

            return (
              <div
                key={course.id}
                className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900/70 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {course.status.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-white">
                      ${Number(course.price).toFixed(0)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors mb-2">
                    {course.title}
                  </h3>

                  <p className="text-sm text-zinc-400 line-clamp-3 mb-6">
                    {course.description || "Master engineering and go-to-market workflows with high-leverage architectural patterns."}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs text-zinc-400 py-3 border-y border-zinc-800/80 mb-6">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{moduleCount} Modules</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{lessonCount} Lessons</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/courses/${course.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-emerald-500 hover:text-zinc-950 text-white font-medium text-sm transition-all"
                >
                  <span>View Course</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8 px-6 bg-zinc-900/20 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 AKStack LMS. Database Namespace: <code className="text-zinc-400 font-mono">app_akstack_lms_*</code></p>
          <div className="flex items-center gap-6">
            <Link href="/courses/gtm-engineering-90-day-challenge" className="hover:text-zinc-300">
              GTM Engineering
            </Link>
            <Link href="/dashboard/admin/courses" className="hover:text-zinc-300">
              Admin Studio
            </Link>
            <Link href="/api/health" className="hover:text-zinc-300 font-mono">
              /api/health
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
