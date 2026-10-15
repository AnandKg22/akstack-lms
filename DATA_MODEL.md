# Data Model & RLS Matrix — AKStack Multi-Course LMS

## 1. Entity-Relationship Model (Mermaid)
```mermaid
erDiagram
    COURSES ||--o{ MODULES : "contains"
    MODULES ||--o{ LESSONS : "contains"
    COURSES ||--o{ COURSE_ENROLLMENTS : "grants"
    AUTH_USERS ||--o{ COURSE_ENROLLMENTS : "holds"
    AUTH_USERS ||--o{ LESSON_PROGRESS : "records"
    LESSONS ||--o{ LESSON_PROGRESS : "tracks"

    COURSES {
        uuid id PK
        text title
        text slug UK
        text description
        integer price_cents
        text currency
        text thumbnail_url
        boolean is_published
        uuid community_id FK
        timestamptz created_at
        timestamptz updated_at
    }

    MODULES {
        uuid id PK
        uuid course_id FK
        text title
        text description
        integer order_index
        timestamptz created_at
        timestamptz updated_at
    }

    LESSONS {
        uuid id PK
        uuid module_id FK
        text title
        text slug UK
        text content
        integer order_index
        boolean is_preview
        timestamptz created_at
        timestamptz updated_at
    }

    COURSE_ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        text payment_provider
        text transaction_id
        text status
        timestamptz enrolled_at
    }

    LESSON_PROGRESS {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        uuid course_id FK
        boolean is_completed
        timestamptz last_accessed_at
    }
```

## 2. Row-Level Security (RLS) Policy Matrix
| Table | Operation | Target | Condition / Policy |
|---|---|---|---|
| `courses` | SELECT | Public | `is_published = true OR is_admin()` |
| `courses` | ALL | Admin | `is_admin()` |
| `modules` | SELECT | Public | Course is published OR `is_admin()` |
| `modules` | ALL | Admin | `is_admin()` |
| `lessons` | SELECT | Public | `is_preview = true` (in published courses) |
| `lessons` | SELECT | Student | `has_course_access(module.course_id)` |
| `lessons` | ALL | Admin | `is_admin()` |
| `course_enrollments` | SELECT | Student | `auth.uid() = user_id OR is_admin()` |
| `course_enrollments` | ALL | Admin | `is_admin()` |
| `lesson_progress` | ALL | Student | `auth.uid() = user_id OR is_admin()` |
