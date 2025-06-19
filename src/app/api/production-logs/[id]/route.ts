
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockProductionLogsData } from '@/lib/data';
import type { ProductionLog } from '@/lib/types';
import { formatISO } from 'date-fns';

// Assuming a shared store or this will operate on a copy.
let tempProductionLogsStore: ProductionLog[] = [...mockProductionLogsData.map(log => ({...log}))];


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const log = tempProductionLogsStore.find(l => l.id === params.id);
  if (log) {
    return NextResponse.json(log);
  }
  return NextResponse.json({ message: 'Production log not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<ProductionLog, 'id' | 'logTime'>>;
    const logIndex = tempProductionLogsStore.findIndex(l => l.id === params.id);

    if (logIndex === -1) {
      return NextResponse.json({ message: 'Production log not found' }, { status: 404 });
    }

    // Preserve original logTime unless explicitly provided in body for update
    const updatedLog = { 
        ...tempProductionLogsStore[logIndex], 
        ...body,
        logTime: body.logTime || tempProductionLogsStore[logIndex].logTime // Keep original time if not changing
    };
    tempProductionLogsStore[logIndex] = updatedLog;
    
    const originalMockIndex = mockProductionLogsData.findIndex(l => l.id === params.id);
    if (originalMockIndex !== -1) {
        mockProductionLogsData[originalMockIndex] = {...updatedLog};
    }

    return NextResponse.json(updatedLog);
  } catch (error) {
    let errorMessage = 'Failed to update production log';
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
  const logIndex = tempProductionLogsStore.findIndex(l => l.id === params.id);

  if (logIndex === -1) {
    return NextResponse.json({ message: 'Production log not found' }, { status: 404 });
  }

  const deletedLog = tempProductionLogsStore.splice(logIndex, 1)[0];
  
  const originalMockIndex = mockProductionLogsData.findIndex(l => l.id === params.id);
  if (originalMockIndex !== -1) {
      mockProductionLogsData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Production log deleted successfully', deletedLogId: deletedLog.id });
}
