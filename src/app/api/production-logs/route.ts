
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockProductionLogsData } from '@/lib/data';
import type { ProductionLog } from '@/lib/types';
import { formatISO } from 'date-fns';

let productionLogsStore: ProductionLog[] = [...mockProductionLogsData.map(log => ({...log}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(productionLogsStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<ProductionLog, 'id' | 'logTime'>;
    const newLog: ProductionLog = {
      ...body,
      id: `prod${Date.now()}${Math.random().toString(16).slice(2)}`,
      logTime: formatISO(new Date()), // API sets the log time
    };
    productionLogsStore.unshift(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create production log';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
