import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  let dbStatus = 'disconnected';
  let coursesCount = 0;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { count, error } = await supabase
        .from('app_akstack_lms_courses')
        .select('*', { count: 'exact', head: true });

      if (!error) {
        dbStatus = 'connected';
        coursesCount = count ?? 0;
      } else {
        dbStatus = `error: ${error.message}`;
      }
    } catch (err: any) {
      dbStatus = `exception: ${err?.message || 'unknown'}`;
    }
  }

  return NextResponse.json(
    {
      status: 'ok',
      service: 'akstack-lms',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      records: {
        courses: coursesCount,
      },
      namespace: 'app_akstack_lms_*',
      central_supabase: 'https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io',
    },
    { status: 200 }
  );
}
