
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Supplier } from '@/lib/types';

// Collection reference
const suppliersCollection = db.collection('suppliers');

export async function GET(request: NextRequest) {
  try {
    const snapshot = await suppliersCollection.orderBy('name').get();
    if (snapshot.empty) {
      return NextResponse.json([]);
    }
    const suppliers: Supplier[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Supplier));
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Supplier, 'id'>;
    
    // Basic validation (could be more robust with Zod, etc.)
    if (!body.name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }

    const docRef = await suppliersCollection.add(body);
    const newSupplier: Supplier = {
      id: docRef.id,
      ...body
    };
    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    console.error('Error creating supplier:', error);
    let errorMessage = 'Failed to create supplier';
    if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
