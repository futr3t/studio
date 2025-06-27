import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getAppliancesHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: appliances, error } = await supabase
      .from('appliances')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching appliances:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(appliances);
  } catch (error) {
    console.error('Error fetching appliances:', error);
    return NextResponse.json({ message: 'Failed to fetch appliances' }, { status: 500 });
  }
}

async function createApplianceHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.location || !body.type) {
      return NextResponse.json({ message: 'Name, location, and type are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: appliance, error } = await supabase
      .from('appliances')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating appliance:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(appliance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating appliance:', error);
    const errorMessage = error.message || 'Failed to create appliance';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read appliances
// POST: Only admins can create appliances
export const GET = withAuth(getAppliancesHandler);
export const POST = withAdminAuth(createApplianceHandler);
