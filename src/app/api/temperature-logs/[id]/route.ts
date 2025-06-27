import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Appliance, SystemParameters } from '@/lib/types';
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

async function getTemperatureLogByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: temperatureLog, error } = await supabase
      .from('temperature_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching temperature log with ID ${id}:`, error);
      return NextResponse.json({ message: `Temperature log with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(temperatureLog);
  } catch (error) {
    console.error(`Error fetching temperature log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch temperature log' }, { status: 500 });
  }
}

async function updateTemperatureLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

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
    if (effectiveRange && typeof body.temperature === 'number') {
      if (body.temperature < effectiveRange.min || body.temperature > effectiveRange.max) {
        isCompliant = false;
      }
    }

    const { data: temperatureLog, error } = await supabase
      .from('temperature_logs')
      .update({
        ...body,
        is_compliant: isCompliant,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating temperature log with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(temperatureLog);
  } catch (error: any) {
    console.error(`Error updating temperature log with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update temperature log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteTemperatureLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('temperature_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting temperature log with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting temperature log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete temperature log' }, { status: 500 });
  }
}

// All authenticated users can perform these actions
export const GET = withAuth(getTemperatureLogByIdHandler);
export const PUT = withAdminAuth(updateTemperatureLogHandler);
export const DELETE = withAdminAuth(deleteTemperatureLogHandler);
