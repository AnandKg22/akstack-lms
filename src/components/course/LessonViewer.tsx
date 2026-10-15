"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lesson } from "@/types/database.types";
import { toggleLessonCompletionAction } from "@/actions/progress";

interface LessonViewerProps {
  lesson: Lesson;
  courseSlug: string;
  courseId: string;
  userId: string;
  isCompletedInitially: boolean;
  prevLesson?: { title: string; slug: string } | null;
  nextLesson?: { title: string; slug: string } | null;
}

export function LessonViewer({
  lesson,
  courseSlug,
  courseId,
  userId,
  isCompletedInitially,
  prevLesson,
  nextLesson,
}: LessonViewerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCompleted, setIsCompleted] = useState(isCompletedInitially);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleToggleCompletion = async () => {
    const nextState = !isCompleted;
    setIsCompleted(nextState);

    startTransition(async () => {
      try {
        await toggleLessonCompletionAction(userId, courseId, lesson.id, nextState);
        router.refresh();
      } catch (err) {
        setIsCompleted(!nextState); // rollback
        alert(`Failed to save progress: ${err}`);
      }
    });
  };

  const handleCompleteAndNext = async () => {
    if (!isCompleted) {
      await handleToggleCompletion();
    }
    if (nextLesson) {
      router.push(`/courses/${courseSlug}/${nextLesson.slug}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-10 max-w-4xl mx-auto">
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          {prevLesson ? (
            <Link
              href={`/courses/${courseSlug}/${prevLesson.slug}`}
              className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            >
              ← Previous Lesson
            </Link>
          ) : (
            <span className="text-zinc-600 px-3 py-1.5">First Lesson</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleCompletion}
            disabled={isPending}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs border transition flex items-center gap-1.5 ${
              isCompleted
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                : "bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500"
            }`}
          >
            <span>{isCompleted ? "✓ Completed" : "Mark as Complete"}</span>
          </button>

          {nextLesson && (
            <Link
              href={`/courses/${courseSlug}/${nextLesson.slug}`}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition"
            >
              Next Lesson →
            </Link>
          )}
        </div>
      </div>

      {/* Main Lesson Content */}
      <article className="mt-8 space-y-6">
        <div>
          {lesson.is_preview && (
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              Free Preview Lesson
            </span>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2">
            {lesson.title}
          </h1>
        </div>

        {/* Content Body with Math & Code styling */}
        <div className="prose prose-invert prose-zinc max-w-none text-zinc-300 leading-relaxed font-sans text-base">
          {lesson.content ? (
            <div className="space-y-6">
              {/* Formula Demonstration Block */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <span className="font-mono text-sm text-emerald-400">
                  {"$$\\text{System Leverage} = \\frac{\\Delta \\text{Throughput}}{\\Delta \\text{Latency}}$$"}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                  KaTeX Formula
                </span>
              </div>

              {/* Sample Code Block with Copy */}
              <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                <div className="px-4 py-2 bg-zinc-800/60 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-mono">pipeline.ts</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`export async function processTelemetry(event: Event) {\n  console.log("Telemetry ingested", event.id);\n}`)}
                    className="hover:text-white transition"
                  >
                    {copiedCode ? "✓ Copied" : "Copy Code"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto">
                  <code>{`export async function processTelemetry(event: Event) {\n  console.log("Telemetry ingested", event.id);\n}`}</code>
                </pre>
              </div>

              {/* Rendered Text Body */}
              <div className="whitespace-pre-wrap leading-relaxed">
                {lesson.content}
              </div>
            </div>
          ) : (
            <p className="text-zinc-500 italic">No text content in this lesson.</p>
          )}
        </div>
      </article>

      {/* Bottom Footer Call to Action */}
      <div className="mt-16 pt-8 border-t border-zinc-800 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500">Progress automatically recorded upon interaction.</p>
        </div>
        <button
          type="button"
          onClick={handleCompleteAndNext}
          disabled={isPending}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          {isCompleted ? "Proceed to Next Lesson →" : "Mark as Complete & Next →"}
        </button>
      </div>
    </div>
  );
}
