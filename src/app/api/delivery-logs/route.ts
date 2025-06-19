
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockDeliveryLogsData } from '@/lib/data';
import type { DeliveryLog } from '@/lib/types';
import { formatISO } from 'date-fns';

let deliveryLogsStore: DeliveryLog[] = [...mockDeliveryLogsData.map(log => ({...log}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(deliveryLogsStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<DeliveryLog, 'id' | 'deliveryTime'>;
    const newLog: DeliveryLog = {
      ...body,
      id: `del${Date.now()}${Math.random().toString(16).slice(2)}`,
      deliveryTime: formatISO(new Date()), // API sets the delivery time
    };
    deliveryLogsStore.unshift(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create delivery log';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
