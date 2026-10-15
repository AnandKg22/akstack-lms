# API & Server Actions Specification — AKStack Multi-Course LMS

---

## 1. Admin Course Management (`src/actions/admin-courses.ts`)

### `createCourseAction(input: CourseSchema)`
- **Role:** Super Admin only
- **Input:** `{ title: string, slug: string, description?: string, price_cents: number, currency?: string, thumbnail_url?: string, is_published?: boolean }`
- **Output:** `Course` object
- **Cache Revalidation:** `/dashboard/admin/courses`

### `updateCourseAction(courseId: string, input: Partial<CourseSchema>)`
- **Role:** Super Admin only
- **Output:** Updated `Course` object
- **Cache Revalidation:** `/dashboard/admin/courses`, `/dashboard/admin/courses/[courseId]/settings`, `/courses/[slug]`

### `deleteCourseAction(courseId: string)`
- **Role:** Super Admin only
- **Output:** `{ success: true }`

---

## 2. Admin Curriculum Builder (`src/actions/admin-courses.ts`)

### `createModuleAction(input: ModuleSchema)`
- **Role:** Super Admin only
- **Input:** `{ course_id: UUID, title: string, description?: string, order_index: number }`
- **Output:** `Module` object

### `reorderModulesAction(courseId: string, orderedModuleIds: string[])`
- **Role:** Super Admin only
- **Input:** Array of Module UUIDs in new sequential order
- **Output:** `{ success: true }`

### `createLessonAction(courseId: string, input: LessonSchema)`
- **Role:** Super Admin only
- **Input:** `{ module_id: UUID, title: string, slug: string, content?: string, order_index: number, is_preview?: boolean }`
- **Output:** `Lesson` object

### `updateLessonAction(lessonId: string, courseId: string, input: Partial<LessonSchema>)`
- **Role:** Super Admin only
- **Output:** Updated `Lesson` object

### `reorderLessonsAction(courseId: string, moduleId: string, orderedLessonIds: string[])`
- **Role:** Super Admin only
- **Input:** Array of Lesson UUIDs in new sequential order
- **Output:** `{ success: true }`

---

## 3. Student Telemetry (`src/actions/progress.ts`)

### `toggleLessonCompletionAction(userId: string, courseId: string, lessonId: string, isCompleted: boolean)`
- **Role:** Authenticated Student (`auth.uid() = userId`)
- **Output:** `{ success: true, isCompleted: boolean }`
- **Cache Revalidation:** `/courses/[courseSlug]/[lessonSlug]`, `/dashboard`

### `markLessonVisitedAction(userId: string, courseId: string, lessonId: string)`
- **Role:** Authenticated Student
- **Output:** Updates `last_accessed_at` in `lesson_progress`

---

## 4. Enrollment & Entitlements (`src/actions/enrollment.ts`)

### `grantCourseEntitlementAction(payload: PayPalCapturePayload)`
- **Role:** Internal / Server
- **Input:** `{ orderId: string, courseId: string, userId: string, userEmail: string, transactionId?: string }`
- **Output:** `{ success: true, enrollment: CourseEnrollment }`
