import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const actor = searchParams.get('actor') || '';
    const action = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('audit_log')
      .select('*, users!audit_log_performed_by_fkey(name, username)', { count: 'exact' });

    if (actor) query = query.eq('performed_by', actor);
    if (action) query = query.eq('action', action);
    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', `${endDate}T23:59:59.999Z`);

    query = query.order('timestamp', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error.message);
      return NextResponse.json({ error: 'Could not fetch audit ledger.' }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const mappedLogs = (logs || []).map((log: any) => ({
      ...log,
      actor_name: log.users?.name || 'Unknown User',
      actor_username: log.users?.username || '',
      users: undefined,
    }));

    const { data: dbUsers } = await supabase
      .from('users')
      .select('id, name');

    return NextResponse.json({
      logs: mappedLogs,
      users: dbUsers || [],
      totalCount,
      page,
      totalPages,
      limit,
    });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/activity:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
