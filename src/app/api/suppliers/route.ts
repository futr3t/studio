import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Supplier } from '@/lib/types';
import { withAuth } from '@/lib/auth-middleware';

async function getSuppliersHandler(request: NextRequest, context: { user: any }) {
  try {
    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedSuppliers: Supplier[] = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
    }));

    return NextResponse.json(formattedSuppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

async function createSupplierHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json() as Omit<Supplier, 'id'>;
    
    // Basic validation
    if (!body.name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }

    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        name: body.name,
        contact_person: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newSupplier: Supplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
    };

    return NextResponse.json(newSupplier, { status: 201 });
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