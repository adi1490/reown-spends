import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { verifyJWT } from '@/lib/auth-jwt';

export async function POST(request: Request) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. Retrieve the session cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => c.trim().split('='))
    );
    const sessionToken = cookies['reown_spends_session'];

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // 2. Verify the session JWT
    const payload = await verifyJWT(sessionToken);
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid session.' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    // 3. Retrieve current user password hash from db
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', payload.userId)
      .maybeSingle();

    if (error || !user) {
      console.error('Error fetching user for password change:', error?.message);
      return NextResponse.json(
        { error: 'User not found or database error.' },
        { status: 500 }
      );
    }

    // 4. Validate current password
    const isPasswordValid = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect current password.' },
        { status: 400 }
      );
    }

    // 5. Hash new password with cost factor 12
    const salt = bcrypt.genSaltSync(12);
    const newHash = bcrypt.hashSync(newPassword, salt);

    // 6. Update user password in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating password:', updateError.message);
      return NextResponse.json(
        { error: 'Could not update password. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (err: any) {
    console.error('Unhandled password change error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
