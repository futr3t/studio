
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SystemParameters } from '@/lib/types';

// Initial system parameters (could be from a config file or DB in a real app)
let currentSystemParameters: SystemParameters = {
  temperatureRanges: {
    fridge: { min: 0, max: 5 },
    freezer: { min: -25, max: -18 },
    hotHold: { min: 63, max: 75 },
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
  },
};

export async function GET(request: NextRequest) {
  return NextResponse.json(currentSystemParameters);
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as SystemParameters;
    // Basic validation could be added here
    currentSystemParameters = body;
    return NextResponse.json(currentSystemParameters);
  } catch (error) {
    let errorMessage = 'Failed to update system parameters';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
