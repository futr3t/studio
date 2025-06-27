import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getUserHandler(
  request: NextRequest,
  context: { user: any },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error(`Error fetching user with ID ${params.id}:`, error);
      return NextResponse.json({ message: `User with ID ${params.id} not found` }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

async function updateUserHandler(
  request: NextRequest,
  context: { user: any },
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: user, error } = await supabase
      .from('users')
      .update(body)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating user with ID ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`Error updating user with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update user';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteUserHandler(
  request: NextRequest,
  context: { user: any },
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting user with ID ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting user with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}

// Apply admin authentication to all routes
export const GET = withAdminAuth(getUserHandler);
export const PUT = withAdminAuth(updateUserHandler);
export const DELETE = withAdminAuth(deleteUserHandler);
