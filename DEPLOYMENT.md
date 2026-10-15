# AKStack LMS - Deployment & Operations Guide

This guide details the deployment architecture, infrastructure configuration, environment variables, database migration procedures, and rollback strategies for the AKStack LMS.

---

## 1. Hosting Architecture Overview

The system is designed for modern cloud-native edge and serverless environments:
- **Application Layer:** Next.js 16 (App Router) deployed on Vercel or AWS ECS / Cloud Run.
- **Data & Auth Layer:** Supabase Cloud (PostgreSQL 16, pgjwt, Supabase Auth SSR).
- **Payment Processing:** PayPal REST API & Stripe Webhooks.
- **Static Assets & Storage:** Supabase Storage / S3 with CDN caching for media.

---

## 2. Environment Variables Configuration

Ensure the following environment variables are set in your deployment dashboard (e.g., Vercel Project Settings):

```bash
# Core Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Application URLs
NEXT_PUBLIC_SITE_URL=https://learn.akstack.dev

# Payments
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret
PAYPAL_API_BASE=https://api-m.paypal.com

# Initial Super Admin
INITIAL_ADMIN_EMAIL=security@akstack.dev
```

---

## 3. Database Migration Runbook

### Step 1: Execute Schema Migration
Run the automated migration file via Supabase CLI or the Supabase SQL Web Editor:
```bash
supabase db push
# Or run migration directly:
psql "$DATABASE_URL" -f supabase/migrations/20261015000000_multi_course_lms_schema.sql
```

### Step 2: Ingest Existing Curriculum
Port existing flat curriculum data into the relational structure using the idempotent migration tool:
```bash
npm run migrate:curriculum
```
This will:
1. Verify database connectivity.
2. Upsert the foundational 90-Day Challenge course.
3. Partition 90 days into structured phases/modules.
4. Insert or update all individual lesson records preserving markdown.

---

## 4. Health Checks & Smoke Testing

After deployment, perform smoke validation:
1. Navigate to `https://learn.akstack.dev/courses/akstack-90-day-challenge`.
2. Verify public course overview and lesson curriculum rendering.
3. Click a preview lesson to test unauthenticated rendering.
4. Log in as an admin account and verify `/dashboard/admin/courses` access.

---

## 5. Rollback & Disaster Recovery

- **Database Backups:** Daily automated snapshots and Point-in-Time Recovery (PITR) enabled via Supabase.
- **Zero-Downtime Rollbacks:** Vercel allows instantaneous single-click instant rollback to prior deployment artifacts.
- **Schema Idempotency:** All DDL statements use `IF NOT EXISTS` and RLS policies use conditional drop/recreate patterns to prevent migration locks.
