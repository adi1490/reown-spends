import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { signJWT } from '@/lib/auth-jwt';

export async function POST(request: Request) {
  try {
    const { username, password, rememberMe } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Look up user by username (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Database error during login:', error.message);
      return NextResponse.json(
        { error: 'An internal error occurred.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const expirationDays = rememberMe ? 7 : 1;

    const token = await signJWT({
      userId: user.id,
      username: user.username,
      name: user.name,
      rememberMe: !!rememberMe,
    }, expirationDays);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
      },
    });

    response.cookies.set('reown_spends_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined,
    });

    return response;
  } catch (err: any) {
    console.error('Unhandled login error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
