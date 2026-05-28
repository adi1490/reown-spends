import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // List all files in the 'backups' bucket
    const { data: files, error } = await supabase
      .storage
      .from('backups')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing backups from Supabase Storage:', error.message);
      return NextResponse.json({ exists: false, error: error.message });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ exists: false });
    }

    // Filter out internal system placeholder files if any (e.g. .emptyFolderPlaceholder)
    const backupFiles = files.filter(f => f.name.endsWith('.csv'));

    if (backupFiles.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const latest = backupFiles[0];

    return NextResponse.json({
      exists: true,
      name: latest.name,
      created_at: latest.created_at || latest.updated_at || new Date().toISOString(),
      size_kb: latest.metadata ? Math.round(latest.metadata.size / 1024) : 0
    });
  } catch (err: any) {
    console.error('Error fetching last backup metadata:', err);
    return NextResponse.json(
      { exists: false, error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
