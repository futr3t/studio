import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabase/server';

// This is a one-time setup endpoint to create the initial admin user
// Should be disabled in production after initial setup

export async function POST(request: NextRequest) {
  try {
    // Security check: Only allow this in development or with a secret key
    const setupKey = request.headers.get('setup-key');
    const expectedKey = process.env.SETUP_SECRET_KEY;
    
    if (!expectedKey || setupKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid setup key' },
        { status: 401 }
      );
    }

    const { username, password, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password, name' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminServerClient();

    // Convert username to email format
    const email = `${username}@chefcheck.local`;

    // Check if any admin users already exist
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    const adminExists = existingUsers.users.some(
      user => user.user_metadata?.role === 'admin'
    );

    if (adminExists) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      );
    }

    // Create the master admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        role: 'admin',
        username,
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
      message: 'Master admin created successfully',
      username,
      name,
      user_id: data.user.id
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}