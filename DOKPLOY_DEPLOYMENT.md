# Dokploy VPS Deployment Guide — AKStack LMS

This guide details deploying the AKStack Multi-Course LMS to your VPS using **Dokploy** inside the shared Supabase infrastructure.

---

## 1. Deployment Metadata

| Attribute | Value |
|---|---|
| **Target Host** | Dokploy VPS |
| **Dokploy Project** | `Agent-Supabase` (ID: `rQWi4G7mifTX_cwpLbWTk`) |
| **Dokploy Environment** | `production` (ID: `awOmNSOg-Crp27dEU8gm6`) |
| **Application Name** | `akstack-lms` |
| **Domain** | `lms.akstack.com` |
| **Central Supabase** | `https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io` |
| **Database Namespace** | `app_akstack_lms_*` (5 isolated tables) |
| **Global Super Admin** | `admin@akstack.com` |

---

## 2. Step 1: Run Database Migration on Central Supabase

Before starting the web application container, execute the schema migration on your central Supabase database:

1. Open your Supabase SQL Editor at `https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io`.
2. Run the script: [supabase/migrations/20261015000000_multi_course_lms_schema.sql](file:///d:/VSCode/MiMo/Agent-Builder/web-application-builder/projects/akstack-lms/supabase/migrations/20261015000000_multi_course_lms_schema.sql).
3. Confirm that the following 5 isolated tables and functions are created:
   - `app_akstack_lms_courses`
   - `app_akstack_lms_modules`
   - `app_akstack_lms_lessons`
   - `app_akstack_lms_course_enrollments`
   - `app_akstack_lms_lesson_progress`
   - Function: `public.app_akstack_lms_is_admin()`
   - Function: `public.app_akstack_lms_has_course_access(UUID)`

---

## 3. Step 2: Ingest 90-Day Curriculum

Run the idempotent curriculum migration tool to populate the initial courses and lessons:
```bash
npx ts-node scripts/migrate-curriculum.ts
```

---

## 4. Step 3: Create Dokploy Application

1. Log into your Dokploy Dashboard on the VPS.
2. Select Project **`Agent-Supabase`** (`rQWi4G7mifTX_cwpLbWTk`).
3. Select Environment **`production`** (`awOmNSOg-Crp27dEU8gm6`).
4. Click **Create Application**:
   - **Name:** `akstack-lms`
   - **Build Type:** Dockerfile (uses `./Dockerfile`)
   - **Port:** `3000`

---

## 5. Step 4: Configure Environment Variables in Dokploy

In the Application's **Environment** tab, set:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_supabase_service_role_key>
NEXT_PUBLIC_SITE_URL=https://lms.akstack.com
INITIAL_ADMIN_EMAIL=admin@akstack.com
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

---

## 6. Step 5: Configure Domain & SSL

1. In the **Domains** tab:
   - **Domain:** `lms.akstack.com` (ensure DNS A record points to your VPS IP `185.205.244.119`)
   - **Certificate:** Let's Encrypt (Automated SSL)
   - **Container Port:** `3000`
2. Click **Save** and **Deploy**.

---

## 7. Step 6: Post-Deployment Verification

Once deployed, verify the service status:

```bash
# Health Check Endpoint
curl -i https://lms.akstack.com/api/health
```

Expected response (HTTP 200 OK):
```json
{
  "status": "ok",
  "service": "akstack-lms",
  "database": "connected",
  "records": {
    "courses": 1
  },
  "namespace": "app_akstack_lms_*",
  "central_supabase": "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io"
}
```
