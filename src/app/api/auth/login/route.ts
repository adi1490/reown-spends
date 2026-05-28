import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { signJWT } from '@/lib/auth-jwt';

export async function POST(request: Request) {
  try {
    const { email, password, rememberMe } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // 1. Get database client
    const supabase = getSupabaseAdmin();

    // 2. Fetch user from db
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
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
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 3. Verify password using bcryptjs
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // 4. Calculate expiration days
    const expirationDays = rememberMe ? 7 : 1; // 7 days if remember me, 1 day otherwise

    // 5. Generate secure JWT
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
      rememberMe: !!rememberMe
    }, expirationDays);

    // 6. Construct response with HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

    response.cookies.set('reown_spends_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : undefined
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
