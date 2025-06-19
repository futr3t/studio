
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockSuppliersData } from '@/lib/data'; // Using this as the initial store
import type { Supplier } from '@/lib/types';

// In a real app, this would be a database connection
// For this example, we'll re-initialize it on each module load for simplicity,
// but in a real scenario it would persist or connect to a DB.
// To make PUT/DELETE work with the POSTed data, we need a shared mutable store for the API.
// However, Next.js API routes are stateless by default.
// For now, these will operate on a copy of mockSuppliersData or a locally managed one.
// A proper database would solve this.
// Let's assume suppliersStore is somehow persisted or shared across API calls (which isn't true for simple let)
// For a more robust mock, this should be in a global singleton or similar, but for now:
let suppliersStore: Supplier[] = [...mockSuppliersData.map(s => ({...s}))]; // Deep copy for modification

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supplier = suppliersStore.find(s => s.id === params.id);
  if (supplier) {
    return NextResponse.json(supplier);
  }
  return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<Supplier, 'id'>>;
    const supplierIndex = suppliersStore.findIndex(s => s.id === params.id);

    if (supplierIndex === -1) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    const updatedSupplier = { ...suppliersStore[supplierIndex], ...body };
    suppliersStore[supplierIndex] = updatedSupplier;
    
    // To reflect changes for subsequent GETs to /api/suppliers, we'd need to update the source mockSuppliersData
    // or use a more persistent mock store. This is a limitation of simple in-memory mock APIs.
    // For now, it updates its local 'suppliersStore' copy.
    const originalMockIndex = mockSuppliersData.findIndex(s => s.id === params.id);
    if (originalMockIndex !== -1) {
        mockSuppliersData[originalMockIndex] = {...updatedSupplier};
    }


    return NextResponse.json(updatedSupplier);
  } catch (error) {
    let errorMessage = 'Failed to update supplier';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supplierIndex = suppliersStore.findIndex(s => s.id === params.id);

  if (supplierIndex === -1) {
    return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
  }

  const deletedSupplier = suppliersStore.splice(supplierIndex, 1)[0];
  
  // Also attempt to remove from the original mockSuppliersData if present
  const originalMockIndex = mockSuppliersData.findIndex(s => s.id === params.id);
    if (originalMockIndex !== -1) {
        mockSuppliersData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Supplier deleted successfully', deletedSupplierId: deletedSupplier.id });
}

// Helper to reset the store for testing purposes if needed (not for production)
export function resetSuppliersStore() {
    suppliersStore = [...mockSuppliersData.map(s => ({...s}))];
}
