
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getSystemParametersHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('system_parameters')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching system parameters:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching system parameters:', error);
    return NextResponse.json({ message: 'Failed to fetch system parameters' }, { status: 500 });
  }
}

async function updateSystemParametersHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    const supabase = createSupabaseAdminServerClient();

    const { data, error } = await supabase
      .from('system_parameters')
      .update(body)
      .eq('id', body.id) // Assuming there's a single row with a known ID, or upsert
      .select()
      .single();

    if (error) {
      console.error('Error updating system parameters:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating system parameters:', error);
    const errorMessage = error.message || 'Failed to update system parameters';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read system parameters
// PUT: Only admins can update system parameters
export const GET = withAuth(getSystemParametersHandler);
export const PUT = withAdminAuth(updateSystemParametersHandler);
