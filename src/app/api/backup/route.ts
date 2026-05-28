import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET(request: Request) {
  try {
    // 1. Verify BACKUP_CRON_SECRET to protect route from unauthorized execution
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
    
    // We can also allow a query parameter fallback for easy browser testing
    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('secret') || '';
    
    const cronSecret = process.env.BACKUP_CRON_SECRET || 'fallback-cron-secret-123456';
    
    if (token !== cronSecret && queryToken !== cronSecret) {
      console.warn('Unauthorized attempt to trigger automated database backup.');
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Fetch all expenses from database
    const { data: expenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*, users(name)')
      .order('date', { ascending: true });

    if (fetchError) {
      console.error('Error fetching expenses for auto-backup:', fetchError.message);
      return NextResponse.json({ error: 'Database fetch failed: ' + fetchError.message }, { status: 500 });
    }

    const backupData = expenses || [];

    // 3. Format dataset as a clean CSV string
    const csvHeaders = ['ID', 'Date', 'Amount (INR)', 'Category', 'Paid By', 'Vendor', 'Description', 'Notes', 'Receipt Path', 'Receipt Name', 'Logged By'];
    const csvRows = backupData.map(e => [
      e.id,
      e.date,
      e.amount,
      `"${e.category.replace(/"/g, '""')}"`,
      `"${e.paid_by.replace(/"/g, '""')}"`,
      `"${e.vendor.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
      `"${(e.receipt_path || '').replace(/"/g, '""')}"`,
      `"${(e.receipt_name || '').replace(/"/g, '""')}"`,
      `"${(e.users?.name || 'Unknown').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // 4. Construct timestamped filename (e.g. backup-2026-05-28.csv)
    // Convert UTC now to IST date string
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' } as const;
    const formattedDate = new Intl.DateTimeFormat('en-IN', options).format(new Date());
    const [day, month, year] = formattedDate.split('/');
    const timestampStr = `${year}-${month}-${day}`;
    const filename = `backup-${timestampStr}.csv`;

    console.log(`Starting automated backup upload: ${filename} to 'backups' storage bucket...`);

    // 5. Upload CSV file to private 'backups' bucket in Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('backups')
      .upload(filename, csvBuffer, {
        contentType: 'text/csv; charset=utf-8',
        upsert: true // overwrite if triggered multiple times on the same calendar day
      });

    if (uploadError) {
      console.error('Failed to upload backup to Supabase Storage:', uploadError.message);
      return NextResponse.json({ error: 'Storage upload failed: ' + uploadError.message }, { status: 500 });
    }

    console.log(`Successfully completed automated database backup to storage: ${filename}`);

    return NextResponse.json({
      success: true,
      message: 'Automated database backup completed successfully.',
      filename,
      path: uploadData.path,
      total_records: backupData.length
    });
  } catch (err: any) {
    console.error('Unhandled database backup failure:', err);
    return NextResponse.json(
      { error: 'An unexpected backup error occurred: ' + err.message },
      { status: 500 }
    );
  }
}
