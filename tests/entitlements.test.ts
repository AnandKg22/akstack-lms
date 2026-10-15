import { describe, it, expect } from 'vitest';

interface AccessContext {
  userRole: 'admin' | 'student' | 'anonymous';
  enrolledCourseIds: string[];
  lesson: {
    courseId: string;
    isPreview: boolean;
  };
}

function canAccessLesson(ctx: AccessContext): boolean {
  // 1. Super Admins bypass all paywalls
  if (ctx.userRole === 'admin') {
    return true;
  }

  // 2. Free preview lessons are publicly accessible
  if (ctx.lesson.isPreview) {
    return true;
  }

  // 3. Anonymous users cannot access paid lessons
  if (ctx.userRole === 'anonymous') {
    return false;
  }

  // 4. Enrolled students with active entitlement have access
  return ctx.enrolledCourseIds.includes(ctx.lesson.courseId);
}

describe('Course Entitlement Access Logic', () => {
  const courseId = 'course-uuid-101';

  it('grants admin access unconditionally', () => {
    const access = canAccessLesson({
      userRole: 'admin',
      enrolledCourseIds: [],
      lesson: { courseId, isPreview: false },
    });
    expect(access).toBe(true);
  });

  it('allows anonymous users to view preview lessons', () => {
    const access = canAccessLesson({
      userRole: 'anonymous',
      enrolledCourseIds: [],
      lesson: { courseId, isPreview: true },
    });
    expect(access).toBe(true);
  });

  it('denies anonymous users from viewing non-preview paid lessons', () => {
    const access = canAccessLesson({
      userRole: 'anonymous',
      enrolledCourseIds: [],
      lesson: { courseId, isPreview: false },
    });
    expect(access).toBe(false);
  });

  it('grants enrolled student access to non-preview lessons', () => {
    const access = canAccessLesson({
      userRole: 'student',
      enrolledCourseIds: [courseId],
      lesson: { courseId, isPreview: false },
    });
    expect(access).toBe(true);
  });

  it('denies unenrolled student access to non-preview lessons', () => {
    const access = canAccessLesson({
      userRole: 'student',
      enrolledCourseIds: ['other-course-id'],
      lesson: { courseId, isPreview: false },
    });
    expect(access).toBe(false);
  });
});
