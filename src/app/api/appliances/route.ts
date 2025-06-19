
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockAppliancesData } from '@/lib/data';
import type { Appliance } from '@/lib/types';
import { formatISO } from 'date-fns';

// In-memory store for appliances, initialized from mock data
let appliancesStore: Appliance[] = [...mockAppliancesData.map(a => ({...a}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(appliancesStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Appliance, 'id'>;
    const newAppliance: Appliance = {
      ...body,
      id: `app${Date.now()}${Math.random().toString(16).slice(2)}`,
    };
    appliancesStore.unshift(newAppliance); // Add to the beginning
    return NextResponse.json(newAppliance, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create appliance';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
