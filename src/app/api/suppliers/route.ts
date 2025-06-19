
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockSuppliersData } from '@/lib/data'; // We'll manage this "database" in memory for now
import type { Supplier } from '@/lib/types';

// In a real app, this would be a database connection
let suppliersStore: Supplier[] = [...mockSuppliersData];

export async function GET(request: NextRequest) {
  return NextResponse.json(suppliersStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Supplier, 'id'>;
    const newSupplier: Supplier = { 
      ...body, 
      id: `sup${Date.now()}${Math.random().toString(16).slice(2)}` // More unique ID
    };
    suppliersStore.unshift(newSupplier); // Add to the beginning like current context
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create supplier';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
