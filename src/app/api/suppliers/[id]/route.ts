import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getSupplierByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching supplier with ID ${id}:`, error);
      return NextResponse.json({ message: `Supplier with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error(`Error fetching supplier with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch supplier' }, { status: 500 });
  }
}

async function updateSupplierHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating supplier with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(supplier);
  } catch (error: any) {
    console.error(`Error updating supplier with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update supplier';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteSupplierHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting supplier with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting supplier with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete supplier' }, { status: 500 });
  }
}

// All authenticated users can perform these actions
export const GET = withAuth(getSupplierByIdHandler);
export const PUT = withAdminAuth(updateSupplierHandler);
export const DELETE = withAdminAuth(deleteSupplierHandler);