
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { SystemParameters } from '@/lib/types';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';

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

async function getSystemParametersHandler(request: NextRequest, context: { user: any }) {
  return NextResponse.json(currentSystemParameters);
}

async function updateSystemParametersHandler(request: NextRequest, context: { user: any }) {
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

// GET: All authenticated users can read system parameters
// PUT: Only admins can update system parameters
export const GET = withAuth(getSystemParametersHandler);
export const PUT = withAdminAuth(updateSystemParametersHandler);
