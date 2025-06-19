
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import type { Supplier } from '@/lib/types';

const suppliersCollection = db.collection('suppliers');

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = suppliersCollection.doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }
    const supplier: Supplier = { id: docSnap.id, ...docSnap.data() } as Supplier;
    return NextResponse.json(supplier);
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
    const body = await request.json() as Partial<Omit<Supplier, 'id'>>;
    const docRef = suppliersCollection.doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    // Basic validation
    if (body.name === '') { // Example: disallow empty name on update
        return NextResponse.json({ message: 'Supplier name cannot be empty' }, { status: 400 });
    }
    
    await docRef.update(body);
    const updatedSupplierData = { id: params.id, ...docSnap.data(), ...body };

    return NextResponse.json(updatedSupplierData as Supplier);
  } catch (error: any) {
    console.error(`Error updating supplier ${params.id}:`, error);
    let errorMessage = 'Failed to update supplier';
    if (error.message) {
        errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = suppliersCollection.doc(params.id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Supplier deleted successfully', deletedSupplierId: params.id });
  } catch (error) {
    console.error(`Error deleting supplier ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete supplier' }, { status: 500 });
  }
}
