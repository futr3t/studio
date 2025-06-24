import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Supplier } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Supplier, 'id'>;
    
    // Basic validation
    if (!body.name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }

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