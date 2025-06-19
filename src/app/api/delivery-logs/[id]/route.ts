
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockDeliveryLogsData } from '@/lib/data';
import type { DeliveryLog } from '@/lib/types';
import { formatISO } from 'date-fns';

let tempDeliveryLogsStore: DeliveryLog[] = [...mockDeliveryLogsData.map(log => ({...log}))];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const log = tempDeliveryLogsStore.find(l => l.id === params.id);
  if (log) {
    return NextResponse.json(log);
  }
  return NextResponse.json({ message: 'Delivery log not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<DeliveryLog, 'id' | 'deliveryTime'>>;
    const logIndex = tempDeliveryLogsStore.findIndex(l => l.id === params.id);

    if (logIndex === -1) {
      return NextResponse.json({ message: 'Delivery log not found' }, { status: 404 });
    }
    
    const updatedLog = { 
        ...tempDeliveryLogsStore[logIndex], 
        ...body,
        deliveryTime: body.deliveryTime || tempDeliveryLogsStore[logIndex].deliveryTime 
    };
    tempDeliveryLogsStore[logIndex] = updatedLog;

    const originalMockIndex = mockDeliveryLogsData.findIndex(l => l.id === params.id);
    if (originalMockIndex !== -1) {
        mockDeliveryLogsData[originalMockIndex] = {...updatedLog};
    }

    return NextResponse.json(updatedLog);
  } catch (error) {
    let errorMessage = 'Failed to update delivery log';
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
  const logIndex = tempDeliveryLogsStore.findIndex(l => l.id === params.id);

  if (logIndex === -1) {
    return NextResponse.json({ message: 'Delivery log not found' }, { status: 404 });
  }

  const deletedLog = tempDeliveryLogsStore.splice(logIndex, 1)[0];

  const originalMockIndex = mockDeliveryLogsData.findIndex(l => l.id === params.id);
  if (originalMockIndex !== -1) {
      mockDeliveryLogsData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Delivery log deleted successfully', deletedLogId: deletedLog.id });
}
