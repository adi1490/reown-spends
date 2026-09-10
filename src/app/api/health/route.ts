import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Attempts to trigger the Supabase Management API to restore/unpause the project
 * if SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF are configured.
 */
async function attemptAutoRestore(): Promise<{ attempted: boolean; success?: boolean; error?: string }> {
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!accessToken || !projectRef) {
    return {
      attempted: false,
      error: 'SUPABASE_ACCESS_TOKEN or SUPABASE_PROJECT_REF environment variables are not configured',
    };
  }

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/restore`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return { attempted: true, success: false, error: `Supabase restore API returned ${res.status}: ${errText}` };
    }

    return { attempted: true, success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { attempted: true, success: false, error: message };
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Perform a lightweight query on 'users' table to keep database connection active and awake
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Database health-check returned a warning:', error.message);

      // Check if error suggests paused database connection failure or unreachable project
      const autoRestoreResult = await attemptAutoRestore();

      return NextResponse.json(
        {
          status: 'warning',
          database: 'error',
          error: error.message,
          auto_restore: autoRestoreResult,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      user_count: count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Database connection keep-alive exception:', message);

    const autoRestoreResult = await attemptAutoRestore();

    return NextResponse.json(
      {
        status: 'critical',
        error: message,
        auto_restore: autoRestoreResult,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
