import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { Course } from "@/types/database.types";

async function getCourses(): Promise<Course[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data } = await supabase
    .from("app_akstack_lms_courses")
    .select("*")
    .order("created_at", { ascending: false });

  return (data as Course[]) || [];
}

export default async function AdminCoursesListPage() {
  const courses = await getCourses();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Course Management</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage course offerings, configure pricing, curriculum structure, and publication states.
          </p>
        </div>
        <Link
          href="/dashboard/admin/courses/new/settings"
          className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          + Create New Course
        </Link>
      </div>

      {/* Courses Table / Cards */}
      {courses.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
          <p className="text-zinc-400">No courses found in database.</p>
          <p className="text-xs text-zinc-500 mt-1">Run migration script or click above to create your first course.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Course</th>
                <th className="px-6 py-4 font-semibold">Slug</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{course.title}</div>
                    <div className="text-xs text-zinc-500 truncate max-w-xs">{course.description || "No description"}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">{course.slug}</td>
                  <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                    ${(course.price_cents / 100).toFixed(2)} {course.currency}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        course.is_published
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {course.is_published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/dashboard/admin/courses/${course.id}/curriculum`}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition"
                    >
                      Curriculum
                    </Link>
                    <Link
                      href={`/dashboard/admin/courses/${course.id}/settings`}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition"
                    >
                      Settings
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
