import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Create Supabase admin client for user creation
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // This needs to be set in environment
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
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