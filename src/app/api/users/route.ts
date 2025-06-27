import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient } from '@/lib/supabase/server';

async function getUsersHandler(request: NextRequest, context: { user: any }) {
  try {
    // Check if user is admin
    const userRole = context.user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' }, 
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

async function createUserHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ message: 'Name, email, and role are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    const errorMessage = error.message || 'Failed to create user';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: Use withAuth with internal admin check for better error handling
// POST: Keep withAdminAuth for user creation
export const GET = withAuth(getUsersHandler);
export const POST = withAdminAuth(createUserHandler);
