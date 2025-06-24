import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Appliance } from '@/lib/types';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';

async function getAppliancesHandler(request: NextRequest, context: { user: any }) {
  try {
    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: appliances, error } = await supabase
      .from('appliances')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching appliances:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedAppliances: Appliance[] = appliances.map(appliance => ({
      id: appliance.id,
      name: appliance.name,
      location: appliance.location,
      type: appliance.type,
      minTemp: appliance.min_temp,
      maxTemp: appliance.max_temp,
    }));

    return NextResponse.json(formattedAppliances);
  } catch (error) {
    console.error('Error fetching appliances:', error);
    return NextResponse.json({ message: 'Failed to fetch appliances' }, { status: 500 });
  }
}

async function createApplianceHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json() as Omit<Appliance, 'id'>;
    
    // Basic validation
    if (!body.name || !body.location || !body.type) {
      return NextResponse.json({ message: 'Name, location, and type are required' }, { status: 400 });
    }

    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: appliance, error } = await supabase
      .from('appliances')
      .insert({
        name: body.name,
        location: body.location,
        type: body.type,
        min_temp: body.minTemp || null,
        max_temp: body.maxTemp || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appliance:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newAppliance: Appliance = {
      id: appliance.id,
      name: appliance.name,
      location: appliance.location,
      type: appliance.type,
      minTemp: appliance.min_temp,
      maxTemp: appliance.max_temp,
    };

    return NextResponse.json(newAppliance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating appliance:', error);
    const errorMessage = error.message || 'Failed to create appliance';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read appliances
// POST: Only admins can create appliances
export const GET = withAuth(getAppliancesHandler);
export const POST = withAdminAuth(createApplianceHandler);
