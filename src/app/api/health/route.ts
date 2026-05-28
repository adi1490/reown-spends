import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Perform a lightweight query on 'users' table to keep database connection active and awake
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Database health-check returned a warning:', error.message);
      return NextResponse.json(
        { status: 'warning', database: 'error', error: error.message, timestamp: new Date().toISOString() },
        { status: 200 } // Still return 200 to keep the ping tool happy
      );
    }

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      user_count: count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Database connection keep-alive exception:', err);
    return NextResponse.json(
      { status: 'critical', error: err.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
