
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockAppliancesData } from '@/lib/data'; // Used for re-initializing store if needed, not directly modified
import type { Appliance } from '@/lib/types';

// This store should be the same instance as in the collection route.
// For simplicity in Next.js dev mode where modules can be re-evaluated,
// we re-use the mutable array from data.ts (if we directly modified it)
// or manage a singleton. For now, let's assume a shared mutable store logic.
// A better approach for shared in-memory store would be a singleton pattern.
// For now, this might lead to inconsistencies if the base `mockAppliancesData` is re-imported.
// Let's ensure our main route.ts manages the store, and this one refers to that, or it operates on a copy.
// To simplify, we'll use the same "global" store as the POST route, by re-filtering from initial mock.
// This is a limitation of simple in-memory stores across different route files without a proper singleton.

// Hacky way to get a somewhat shared store for demo purposes.
// In a real app, this would be a DB.
let tempAppliancesStore: Appliance[] = [...mockAppliancesData.map(a => ({...a}))];
// This function is a placeholder for a proper way to share the store instance.
// Ideally, the store from the collection route (POST/GET all) should be used.
// We will manually update this internal store based on operations.

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const appliance = tempAppliancesStore.find(a => a.id === params.id);
  if (appliance) {
    return NextResponse.json(appliance);
  }
  return NextResponse.json({ message: 'Appliance not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<Appliance, 'id'>>;
    const applianceIndex = tempAppliancesStore.findIndex(a => a.id === params.id);

    if (applianceIndex === -1) {
      return NextResponse.json({ message: 'Appliance not found' }, { status: 404 });
    }

    const updatedAppliance = { ...tempAppliancesStore[applianceIndex], ...body };
    tempAppliancesStore[applianceIndex] = updatedAppliance;

    // Reflect change in original mock for other routes, VERY HACKY
     const originalMockIndex = mockAppliancesData.findIndex(s => s.id === params.id);
     if (originalMockIndex !== -1) {
        mockAppliancesData[originalMockIndex] = {...updatedAppliance};
     }


    return NextResponse.json(updatedAppliance);
  } catch (error) {
    let errorMessage = 'Failed to update appliance';
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
  const applianceIndex = tempAppliancesStore.findIndex(a => a.id === params.id);

  if (applianceIndex === -1) {
    return NextResponse.json({ message: 'Appliance not found' }, { status: 404 });
  }

  const deletedAppliance = tempAppliancesStore.splice(applianceIndex, 1)[0];
  
  // Reflect change in original mock for other routes, VERY HACKY
  const originalMockIndex = mockAppliancesData.findIndex(s => s.id === params.id);
  if (originalMockIndex !== -1) {
      mockAppliancesData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Appliance deleted successfully', deletedApplianceId: deletedAppliance.id });
}

// This function is used by the main route to update this local store.
export function syncStoreWithGlobal(globalStore: Appliance[]) {
    tempAppliancesStore = [...globalStore];
}

export function resetApplianceStore() {
    tempAppliancesStore = [...mockAppliancesData.map(s => ({...s}))];
}
