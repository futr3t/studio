import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { TemperatureLog, Appliance, SystemParameters } from '@/lib/types';
import { withAuth } from '@/lib/auth-middleware';
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

async function getTemperatureLogsHandler(request: NextRequest, context: { user: any }) {
  try {
    const { data: temperatureLogs, error } = await supabase
      .from('temperature_logs')
      .select('*')
      .order('log_time', { ascending: false });

    if (error) {
      console.error('Error fetching temperature logs:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedLogs: TemperatureLog[] = temperatureLogs.map(log => ({
      id: log.id,
      applianceId: log.appliance_id,
      temperature: log.temperature,
      logTime: log.log_time,
      isCompliant: log.is_compliant,
      correctiveAction: log.corrective_action,
      loggedBy: log.logged_by,
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching temperature logs:', error);
    return NextResponse.json({ message: 'Failed to fetch temperature logs' }, { status: 500 });
  }
}

async function createTemperatureLogHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json() as Omit<TemperatureLog, 'id' | 'logTime' | 'isCompliant'> & { applianceId: string };
    
    // Basic validation
    if (!body.applianceId || typeof body.temperature !== 'number') {
      return NextResponse.json({ message: 'Appliance ID and temperature are required' }, { status: 400 });
    }

    // Fetch appliance for compliance check
    const { data: appliance, error: applianceError } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', body.applianceId)
      .single();

    if (applianceError || !appliance) {
      return NextResponse.json({ message: 'Appliance not found for compliance check' }, { status: 400 });
    }

    // Convert appliance to app type for compliance check
    const applianceForCheck: Appliance = {
      id: appliance.id,
      name: appliance.name,
      location: appliance.location,
      type: appliance.type,
      minTemp: appliance.min_temp,
      maxTemp: appliance.max_temp,
    };

    let isCompliant = true;
    const effectiveRange = getApplianceEffectiveTempRange(applianceForCheck);
    if (effectiveRange) {
      if (body.temperature < effectiveRange.min || body.temperature > effectiveRange.max) {
        isCompliant = false;
      }
    }

    // Use authenticated user's info
    const userName = context.user.user_metadata?.name || context.user.user_metadata?.username || 'Unknown User';

    const { data: temperatureLog, error } = await supabase
      .from('temperature_logs')
      .insert({
        appliance_id: body.applianceId,
        temperature: body.temperature,
        log_time: new Date().toISOString(),
        is_compliant: isCompliant,
        corrective_action: body.correctiveAction || null,
        logged_by: userName,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating temperature log:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newLog: TemperatureLog = {
      id: temperatureLog.id,
      applianceId: temperatureLog.appliance_id,
      temperature: temperatureLog.temperature,
      logTime: temperatureLog.log_time,
      isCompliant: temperatureLog.is_compliant,
      correctiveAction: temperatureLog.corrective_action,
      loggedBy: temperatureLog.logged_by,
    };

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating temperature log:', error);
    const errorMessage = error.message || 'Failed to create temperature log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// All authenticated users can read and create temperature logs
export const GET = withAuth(getTemperatureLogsHandler);
export const POST = withAuth(createTemperatureLogHandler);
