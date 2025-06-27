import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getApplianceByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: appliance, error } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching appliance with ID ${id}:`, error);
      return NextResponse.json({ message: `Appliance with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(appliance);
  } catch (error) {
    console.error(`Error fetching appliance with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch appliance' }, { status: 500 });
  }
}

async function updateApplianceHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: appliance, error } = await supabase
      .from('appliances')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating appliance with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(appliance);
  } catch (error: any) {
    console.error(`Error updating appliance with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update appliance';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteApplianceHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('appliances')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting appliance with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting appliance with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete appliance' }, { status: 500 });
  }
}

// GET: All authenticated users can read a single appliance
// PUT: Only admins can update an appliance
// DELETE: Only admins can delete an appliance
export const GET = withAuth(getApplianceByIdHandler);
export const PUT = withAdminAuth(updateApplianceHandler);
export const DELETE = withAdminAuth(deleteApplianceHandler);
