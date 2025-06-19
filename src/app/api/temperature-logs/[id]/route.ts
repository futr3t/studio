
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockTemperatureLogsData, mockAppliancesData, STATIC_NOW } from '@/lib/data';
import type { TemperatureLog, Appliance, SystemParameters } from '@/lib/types';
import { formatISO } from 'date-fns';

let tempTemperatureLogsStore: TemperatureLog[] = [...mockTemperatureLogsData.map(log => ({...log}))];
const currentSystemParameters: SystemParameters = { // Simplified for API route
  temperatureRanges: {
    fridge: { min: 0, max: 5 },
    freezer: { min: -25, max: -18 },
    hotHold: { min: 63, max: 75 },
  },
  notifications: { emailAlerts: true, smsAlerts: false }
};

const getApplianceEffectiveTempRange = (appliance: Appliance): { min: number; max: number } | null => {
    if (typeof appliance.minTemp === 'number' && typeof appliance.maxTemp === 'number') {
      return { min: appliance.minTemp, max: appliance.maxTemp };
    }
    const typeKey = appliance.type.toLowerCase().replace(/\s+/g, '');
    if (typeKey.includes('fridge')) return currentSystemParameters.temperatureRanges.fridge;
    if (typeKey.includes('freezer')) return currentSystemParameters.temperatureRanges.freezer;
    if (typeKey.includes('hothold') || typeKey.includes('bainmarie') || typeKey.includes('oven')) return currentSystemParameters.temperatureRanges.hotHold;
    return null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const log = tempTemperatureLogsStore.find(l => l.id === params.id);
  if (log) {
    return NextResponse.json(log);
  }
  return NextResponse.json({ message: 'Temperature log not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'>> & { applianceId?: string };
    const logIndex = tempTemperatureLogsStore.findIndex(l => l.id === params.id);

    if (logIndex === -1) {
      return NextResponse.json({ message: 'Temperature log not found' }, { status: 404 });
    }

    const originalLog = tempTemperatureLogsStore[logIndex];
    const applianceIdForCheck = body.applianceId || originalLog.applianceId;
    const appliance = mockAppliancesData.find(a => a.id === applianceIdForCheck);

    if (!appliance) {
        return NextResponse.json({ message: 'Appliance not found for compliance check during update' }, { status: 400 });
    }
    
    let isCompliant = true;
    const temperatureForCheck = typeof body.temperature === 'number' ? body.temperature : originalLog.temperature;
    const effectiveRange = getApplianceEffectiveTempRange(appliance);
    if (effectiveRange) {
      if (temperatureForCheck < effectiveRange.min || temperatureForCheck > effectiveRange.max) {
        isCompliant = false;
      }
    }

    const updatedLog = {
      ...originalLog,
      ...body,
      temperature: temperatureForCheck,
      isCompliant,
      logTime: body.logTime || originalLog.logTime // Preserve original log time if not updated
    };
    tempTemperatureLogsStore[logIndex] = updatedLog;
    
    const originalMockIndex = mockTemperatureLogsData.findIndex(l => l.id === params.id);
    if (originalMockIndex !== -1) {
        mockTemperatureLogsData[originalMockIndex] = {...updatedLog};
    }

    return NextResponse.json(updatedLog);
  } catch (error) {
    let errorMessage = 'Failed to update temperature log';
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
  const logIndex = tempTemperatureLogsStore.findIndex(l => l.id === params.id);

  if (logIndex === -1) {
    return NextResponse.json({ message: 'Temperature log not found' }, { status: 404 });
  }

  const deletedLog = tempTemperatureLogsStore.splice(logIndex, 1)[0];

  const originalMockIndex = mockTemperatureLogsData.findIndex(l => l.id === params.id);
  if (originalMockIndex !== -1) {
      mockTemperatureLogsData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Temperature log deleted successfully', deletedLogId: deletedLog.id });
}
