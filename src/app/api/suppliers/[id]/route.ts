import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
      }
      console.error(`Error fetching supplier ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedSupplier: Supplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
    };

    return NextResponse.json(formattedSupplier);
  } catch (error) {
    console.error(`Error fetching supplier ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Supplier>;

    // Basic validation
    if (body.name === '') {
      return NextResponse.json({ message: 'Supplier name cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.contactPerson !== undefined) updateData.contact_person = body.contactPerson;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    updateData.updated_at = new Date().toISOString();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
      }
      console.error(`Error updating supplier ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedSupplier: Supplier = {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person,
      phone: supplier.phone,
      email: supplier.email,
    };

    return NextResponse.json(updatedSupplier);
  } catch (error: any) {
    console.error(`Error updating supplier ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update supplier';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting supplier ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Supplier deleted successfully', 
      deletedSupplierId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting supplier ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete supplier' }, { status: 500 });
  }
}