import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { Appliance } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: appliance, error } = await supabase
      .from('appliances')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Appliance not found' }, { status: 404 });
      }
      console.error(`Error fetching appliance ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedAppliance: Appliance = {
      id: appliance.id,
      name: appliance.name,
      location: appliance.location,
      type: appliance.type,
      minTemp: appliance.min_temp,
      maxTemp: appliance.max_temp,
    };

    return NextResponse.json(formattedAppliance);
  } catch (error) {
    console.error(`Error fetching appliance ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch appliance' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Appliance>;

    // Basic validation
    if (body.name === '' || body.location === '' || body.type === '') {
      return NextResponse.json({ message: 'Name, location, and type cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.minTemp !== undefined) updateData.min_temp = body.minTemp;
    if (body.maxTemp !== undefined) updateData.max_temp = body.maxTemp;
    updateData.updated_at = new Date().toISOString();

    const { data: appliance, error } = await supabase
      .from('appliances')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Appliance not found' }, { status: 404 });
      }
      console.error(`Error updating appliance ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedAppliance: Appliance = {
      id: appliance.id,
      name: appliance.name,
      location: appliance.location,
      type: appliance.type,
      minTemp: appliance.min_temp,
      maxTemp: appliance.max_temp,
    };

    return NextResponse.json(updatedAppliance);
  } catch (error: any) {
    console.error(`Error updating appliance ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update appliance';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('appliances')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting appliance ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Appliance deleted successfully', 
      deletedApplianceId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting appliance ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete appliance' }, { status: 500 });
  }
}
