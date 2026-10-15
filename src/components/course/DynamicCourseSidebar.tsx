"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CourseWithHierarchy, LessonProgress } from "@/types/database.types";

interface DynamicCourseSidebarProps {
  course: CourseWithHierarchy;
  progressList: LessonProgress[];
  hasEntitlement: boolean;
}

export function DynamicCourseSidebar({
  course,
  progressList,
  hasEntitlement,
}: DynamicCourseSidebarProps) {
  const pathname = usePathname();

  // Compute total lessons and completed count
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedIds = new Set(
    progressList.filter((p) => p.is_completed).map((p) => p.lesson_id)
  );
  const completedCount = allLessons.filter((l) => completedIds.has(l.id)).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <aside className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full shrink-0">
      {/* Course Title & Progress Bar Header */}
      <div className="p-5 border-b border-zinc-800 space-y-3 bg-zinc-900/40">
        <Link
          href={`/courses/${course.slug}`}
          className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1.5"
        >
          <span>←</span>
          <span className="truncate">{course.title}</span>
        </Link>
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-zinc-300">Course Progress</span>
          <span className="text-emerald-400 font-mono">{completionPercentage}%</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-zinc-500 font-mono">
          {completedCount} of {totalLessons} lessons completed
        </p>
      </div>

      {/* Module and Lesson Tree */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900 p-2 space-y-2">
        {course.modules.map((mod, modIdx) => (
          <div key={mod.id} className="pt-2">
            <h4 className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Module {modIdx + 1}: {mod.title}
            </h4>
            <div className="space-y-0.5 mt-1">
              {mod.lessons.map((lesson) => {
                const isCompleted = completedIds.has(lesson.id);
                const isLocked = !hasEntitlement && !lesson.is_preview;
                const lessonUrl = `/courses/${course.slug}/${lesson.slug}`;
                const isActive = pathname === lessonUrl;

                return (
                  <Link
                    key={lesson.id}
                    href={isLocked ? `/courses/${course.slug}?locked=true` : lessonUrl}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white font-semibold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* State Indicator Icon */}
                      {isCompleted ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                          ✓
                        </span>
                      ) : isLocked ? (
                        <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center text-[10px] shrink-0">
                          🔒
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-zinc-700 flex items-center justify-center text-[9px] shrink-0">
                          •
                        </span>
                      )}
                      <span className="truncate">{lesson.title}</span>
                    </div>

                    {lesson.is_preview && (
                      <span className="text-[9px] px-1 py-0.5 font-bold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 ml-2 shrink-0">
                        Free
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
