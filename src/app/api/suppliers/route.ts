import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient } from '@/lib/supabase/server';

async function getSuppliersHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseAdminServerClient();

    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

async function createSupplierHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    const errorMessage = error.message || 'Failed to create supplier';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read suppliers
// POST: All authenticated users can create suppliers
export const GET = withAuth(getSuppliersHandler);
export const POST = withAuth(createSupplierHandler);