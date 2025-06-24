import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { TemperatureLog, Appliance, SystemParameters } from '@/lib/types';

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
  try {
    const { data: temperatureLog, error } = await supabase
      .from('temperature_logs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Temperature log not found' }, { status: 404 });
      }
      console.error(`Error fetching temperature log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedLog: TemperatureLog = {
      id: temperatureLog.id,
      applianceId: temperatureLog.appliance_id,
      temperature: temperatureLog.temperature,
      logTime: temperatureLog.log_time,
      isCompliant: temperatureLog.is_compliant,
      correctiveAction: temperatureLog.corrective_action,
      loggedBy: temperatureLog.logged_by,
    };

    return NextResponse.json(formattedLog);
  } catch (error) {
    console.error(`Error fetching temperature log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch temperature log' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<TemperatureLog>;

    // Get the current log to determine appliance ID for compliance check
    const { data: currentLog, error: fetchError } = await supabase
      .from('temperature_logs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ message: 'Temperature log not found' }, { status: 404 });
      }
      console.error(`Error fetching temperature log ${params.id}:`, fetchError);
      return NextResponse.json({ message: fetchError.message }, { status: 500 });
    }

    const applianceIdForCheck = body.applianceId || currentLog.appliance_id;
    const temperatureForCheck = typeof body.temperature === 'number' ? body.temperature : currentLog.temperature;

    // Fetch appliance for compliance check
    const { data: appliance, error: applianceError } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', applianceIdForCheck)
      .single();

    if (applianceError || !appliance) {
      return NextResponse.json({ message: 'Appliance not found for compliance check during update' }, { status: 400 });
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
      if (temperatureForCheck < effectiveRange.min || temperatureForCheck > effectiveRange.max) {
        isCompliant = false;
      }
    }

    const updateData: any = {};
    if (body.applianceId !== undefined) updateData.appliance_id = body.applianceId;
    if (body.temperature !== undefined) updateData.temperature = body.temperature;
    if (body.logTime !== undefined) updateData.log_time = body.logTime;
    if (body.correctiveAction !== undefined) updateData.corrective_action = body.correctiveAction;
    if (body.loggedBy !== undefined) updateData.logged_by = body.loggedBy;
    updateData.is_compliant = isCompliant;
    updateData.updated_at = new Date().toISOString();

    const { data: temperatureLog, error } = await supabase
      .from('temperature_logs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating temperature log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedLog: TemperatureLog = {
      id: temperatureLog.id,
      applianceId: temperatureLog.appliance_id,
      temperature: temperatureLog.temperature,
      logTime: temperatureLog.log_time,
      isCompliant: temperatureLog.is_compliant,
      correctiveAction: temperatureLog.corrective_action,
      loggedBy: temperatureLog.logged_by,
    };

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error(`Error updating temperature log ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update temperature log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('temperature_logs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting temperature log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Temperature log deleted successfully', 
      deletedLogId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting temperature log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete temperature log' }, { status: 500 });
  }
}
