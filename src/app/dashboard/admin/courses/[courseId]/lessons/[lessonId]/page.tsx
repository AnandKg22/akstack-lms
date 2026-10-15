"use client";

import React, { useState } from "react";
import Link from "next/link";
import { updateLessonAction } from "@/actions/admin-courses";

interface LessonEditorProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default function AdminLessonEditorPage({ params }: LessonEditorProps) {
  const unwrappedParams = React.use(params);
  const { courseId, lessonId } = unwrappedParams;

  // Editor State
  const [title, setTitle] = useState("Day 1: Enterprise Architecture Foundations");
  const [slug, setSlug] = useState("day-1-foundations");
  const [isPreview, setIsPreview] = useState(true);
  const [content, setContent] = useState(
    `# Lesson Overview\n\nIn this module we establish high-scale platform invariants.\n\n### Mathematical Formulation\n$$\\text{Availability} = \\frac{\\text{MTTF}}{\\text{MTTF} + \\text{MTTR}}$$\n\n\`\`\`typescript\nexport const computeHealth = () => ({ status: "OK", latencyMs: 24 });\n\`\`\``
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateLessonAction(lessonId, courseId, {
        title,
        slug,
        is_preview: isPreview,
        content,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Save failed: ${err}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href={`/dashboard/admin/courses/${courseId}/curriculum`} className="hover:underline">
              ← Back to Curriculum
            </Link>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Lesson Editor Studio</h2>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-medium animate-pulse">
              ✓ Saved successfully
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            {isSaving ? "Saving..." : "Save Lesson"}
          </button>
        </div>
      </div>

      {/* Metadata Form Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Lesson Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">Lesson Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono bg-zinc-950 border border-zinc-800 rounded-md text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isPreview"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500"
          />
          <label htmlFor="isPreview" className="text-sm font-medium text-zinc-300">
            Allow Free Preview (Accessible without course purchase)
          </label>
        </div>
      </div>

      {/* Dual-Pane Editor & KaTeX Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[650px]">
        {/* Left Pane: Markdown Source */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono font-medium text-zinc-400 flex items-center justify-between">
            <span>Markdown / KaTeX Source</span>
            <span className="text-[10px] text-zinc-500">Supports Math $$ & ```code</span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 w-full p-4 bg-zinc-950 text-zinc-200 font-mono text-sm resize-none focus:outline-none"
            placeholder="Write your markdown and math formulas here..."
          />
        </div>

        {/* Right Pane: Live Preview */}
        <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
          <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono font-medium text-zinc-400">
            <span>Live Rendered Preview</span>
          </div>
          <div className="flex-1 p-6 bg-zinc-950 overflow-y-auto prose prose-invert prose-zinc max-w-none text-zinc-300">
            {/* Simple live preview simulation */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold text-white border-b border-zinc-800 pb-2">{title}</h1>
              <div className="p-4 rounded bg-zinc-900 border border-zinc-800 font-mono text-xs text-emerald-400">
                {"Formula Preview: $$\\text{Availability} = \\frac{\\text{MTTF}}{\\text{MTTF} + \\text{MTTR}}$$"}
              </div>
              <pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto">
                <code>{`// Compiled syntax preview:\nexport const ready = true;`}</code>
              </pre>
              <div className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed font-sans">
                {content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
