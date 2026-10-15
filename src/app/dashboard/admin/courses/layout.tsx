import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

// In production, import createServerClient from "@supabase/ssr" to verify auth
export default async function AdminCoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simulated server-side auth guard (replace with real session inspection)
  const isAdmin = true; // Assumes server auth check verified

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Top Admin Sub-Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Super Admin Studio
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white">
              AKStack LMS Engine
            </h1>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link
              href="/dashboard/admin/courses"
              className="text-zinc-300 hover:text-white transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/dashboard/admin/enrollments"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Enrollments
            </Link>
            <Link
              href="/dashboard/admin/telemetry"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Telemetry
            </Link>
            <Link
              href="/courses"
              target="_blank"
              className="text-xs text-zinc-400 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md border border-zinc-700 transition"
            >
              Live Student View ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="max-w-7xl mx-auto p-6 md:p-8">{children}</main>
    </div>
  );
}
