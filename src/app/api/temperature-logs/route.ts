
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockTemperatureLogsData, mockAppliancesData, STATIC_NOW } from '@/lib/data'; // Assuming STATIC_NOW for initial parameters
import type { TemperatureLog, Appliance, SystemParameters } from '@/lib/types';
import { formatISO } from 'date-fns';

let temperatureLogsStore: TemperatureLog[] = [...mockTemperatureLogsData.map(log => ({...log}))];
// For compliance check, we need system parameters. For now, hardcode or fetch from a simplified source.
// This should ideally come from a system parameters API or be passed if context is available.
const currentSystemParameters: SystemParameters = {
  temperatureRanges: {
    fridge: { min: 0, max: 5 },
    freezer: { min: -25, max: -18 },
    hotHold: { min: 63, max: 75 },
  },
  notifications: { emailAlerts: true, smsAlerts: false } // Default
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


export async function GET(request: NextRequest) {
  return NextResponse.json(temperatureLogsStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'> & { applianceId: string };
    
    const appliance = mockAppliancesData.find(a => a.id === body.applianceId); // Use mock for this check
    if (!appliance) {
        return NextResponse.json({ message: 'Appliance not found for compliance check' }, { status: 400 });
    }

    let isCompliant = true;
    const effectiveRange = getApplianceEffectiveTempRange(appliance);
    if (effectiveRange) {
      if (body.temperature < effectiveRange.min || body.temperature > effectiveRange.max) {
        isCompliant = false;
      }
    }

    const newLog: TemperatureLog = {
      ...body,
      id: `temp${Date.now()}${Math.random().toString(16).slice(2)}`,
      logTime: formatISO(new Date()),
      isCompliant,
    };
    temperatureLogsStore.unshift(newLog);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create temperature log';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
