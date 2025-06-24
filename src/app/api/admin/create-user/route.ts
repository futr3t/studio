import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';

async function handler(request: NextRequest, context: { user: any }) {
  try {
    const { username, password, userData } = await request.json();

    if (!username || !password || !userData?.name || !userData?.role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert username to email format for Supabase
    const email = `${username}@chefcheck.local`;

    // Create Supabase admin client for user creation (direct connection, no cookies needed)
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create the user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name: userData.name,
        role: userData.role,
        username: username, // Store the actual username
      },
      email_confirm: true, // Skip email verification
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      message: 'User created successfully',
      user: data.user 
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(handler);