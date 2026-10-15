import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const CourseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  price_cents: z.number().int().nonnegative(),
  is_published: z.boolean().default(false),
});

const ModuleSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(2),
  order_index: z.number().int().nonnegative(),
});

const LessonSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content_markdown: z.string().default(''),
  is_preview: z.boolean().default(false),
  order_index: z.number().int().nonnegative(),
});

describe('AKStack LMS Zod Validation Schemas', () => {
  it('validates a valid course payload', () => {
    const validData = {
      title: 'AKStack Platform Engineering Masterclass',
      slug: 'akstack-platform-engineering',
      description: 'Comprehensive 90-day multi-course platform engineering track.',
      price_cents: 49900,
      is_published: true,
    };
    expect(() => CourseSchema.parse(validData)).not.toThrow();
  });

  it('rejects invalid slug with spaces or uppercase letters in course schema', () => {
    const invalidData = {
      title: 'Bad Slug Course',
      slug: 'Invalid Slug Name',
      price_cents: 1000,
    };
    expect(() => CourseSchema.parse(invalidData)).toThrow();
  });

  it('validates module ordering and UUID', () => {
    const validModule = {
      course_id: 'e3b0c442-98fc-1c14-9afb-4c729934e8ac',
      title: 'Phase 1: Database Architecture',
      order_index: 0,
    };
    expect(() => ModuleSchema.parse(validModule)).not.toThrow();
  });

  it('allows free preview flag on lessons', () => {
    const previewLesson = {
      module_id: 'e3b0c442-98fc-1c14-9afb-4c729934e8ac',
      title: 'Day 1: Platform Overview',
      slug: 'day-1-overview',
      content_markdown: '# Welcome to AKStack LMS',
      is_preview: true,
      order_index: 0,
    };
    const parsed = LessonSchema.parse(previewLesson);
    expect(parsed.is_preview).toBe(true);
  });
});
