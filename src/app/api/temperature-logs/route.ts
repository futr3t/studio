import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { TemperatureLog, Appliance, SystemParameters } from '@/lib/types';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

const getApplianceEffectiveTempRange = (appliance: Appliance, systemParameters: SystemParameters): { min: number; max: number } | null => {
    if (typeof appliance.minTemp === 'number' && typeof appliance.maxTemp === 'number') {
      return { min: appliance.minTemp, max: appliance.maxTemp };
    }
    const typeKey = appliance.type.toLowerCase().replace(/\s+/g, '');
    if (typeKey.includes('fridge')) return systemParameters.temperatureRanges.fridge;
    if (typeKey.includes('freezer')) return systemParameters.temperatureRanges.freezer;
    if (typeKey.includes('hothold') || typeKey.includes('bainmarie') || typeKey.includes('oven')) return systemParameters.temperatureRanges.hotHold;
    return null;
};

async function getTemperatureLogsHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: temperatureLogs, error } = await supabase
      .from('temperature_logs')
      .select('*')
      .order('log_time', { ascending: false });

    if (error) {
      console.error('Error fetching temperature logs:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(temperatureLogs);
  } catch (error) {
    console.error('Error fetching temperature logs:', error);
    return NextResponse.json({ message: 'Failed to fetch temperature logs' }, { status: 500 });
  }
}

async function createTemperatureLogHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.applianceId || typeof body.temperature !== 'number') {
      return NextResponse.json({ message: 'Appliance ID and temperature are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: appliance, error: applianceError } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', body.applianceId)
      .single();

    if (applianceError || !appliance) {
      return NextResponse.json({ message: 'Appliance not found for compliance check' }, { status: 400 });
    }

    const { data: systemParameters, error: systemParametersError } = await supabase
      .from('system_parameters')
      .select('*')
      .single();

    if (systemParametersError || !systemParameters) {
      return NextResponse.json({ message: 'System parameters not found for compliance check' }, { status: 400 });
    }

    let isCompliant = true;
    const effectiveRange = getApplianceEffectiveTempRange(appliance, systemParameters);
    if (effectiveRange) {
      if (body.temperature < effectiveRange.min || body.temperature > effectiveRange.max) {
        isCompliant = false;
      }
    }

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

    return NextResponse.json(temperatureLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating temperature log:', error);
    const errorMessage = error.message || 'Failed to create temperature log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// All authenticated users can read and create temperature logs
export const GET = withAuth(getTemperatureLogsHandler);
export const POST = withAdminAuth(createTemperatureLogHandler);
