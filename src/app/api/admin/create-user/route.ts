import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient } from '@/lib/supabase/server';

async function handler(request: NextRequest, context: { user: any }) {
  try {
    console.log('🔧 Create user handler called');
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { username, password, userData } = body;

    if (!username || !password || !userData?.name || !userData?.role) {
      console.log('❌ Missing required fields:', { username: !!username, password: !!password, userData });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert username to email format for Supabase
    const email = `${username}@chefcheck.local`;

    const supabase = createSupabaseAdminServerClient();

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