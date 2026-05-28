import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    // 1. Authenticate user session
    const session = await getCurrentUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch fresh user metadata from DB
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', session.userId)
      .maybeSingle();

    if (error || !user) {
      console.error('Error fetching verified profile me-metadata:', error?.message);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err: any) {
    console.error('Unhandled profile me-fetch error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
