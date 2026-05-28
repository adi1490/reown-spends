import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getCurrentUser } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // 1. File size validation (Max 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 10 MB.' }, { status: 400 });
    }

    // 2. File type validation (JPEG, PNG, PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, and PDF files are accepted.' }, { status: 400 });
    }

    // 3. Generate unique path
    const extension = file.name.split('.').pop();
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const uniqueFilename = `${timestamp}-${randomId}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getSupabaseAdmin();

    // 4. Upload file to private 'receipts' bucket
    const { data, error } = await supabase
      .storage
      .from('receipts')
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading file to Supabase Storage:', error.message);
      return NextResponse.json({ error: 'File upload to storage failed.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      path: data.path,
      name: file.name
    });
  } catch (err: any) {
    console.error('Unexpected error in POST /api/upload:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
