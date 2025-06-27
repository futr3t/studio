import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getDeliveryLogsHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: deliveryLogs, error } = await supabase
      .from('delivery_logs')
      .select(`
        *,
        delivery_items(*)
      `)
      .order('delivery_time', { ascending: false });

    if (error) {
      console.error('Error fetching delivery logs:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(deliveryLogs);
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return NextResponse.json({ message: 'Failed to fetch delivery logs' }, { status: 500 });
  }
}

async function createDeliveryLogHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.supplierId || !body.items || body.items.length === 0) {
      return NextResponse.json({ message: 'Supplier ID and items are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: deliveryLog, error: logError } = await supabase
      .from('delivery_logs')
      .insert({
        supplier_id: body.supplierId,
        delivery_time: new Date().toISOString(),
        vehicle_reg: body.vehicleReg || null,
        driver_name: body.driverName || null,
        overall_condition: body.overallCondition || null,
        is_compliant: body.isCompliant,
        corrective_action: body.correctiveAction || null,
        received_by: body.receivedBy || null,
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating delivery log:', logError);
      return NextResponse.json({ message: logError.message }, { status: 500 });
    }

    const deliveryItems = body.items.map((item: any) => ({
      delivery_log_id: deliveryLog.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      temperature: item.temperature || null,
      is_compliant: item.isCompliant,
      notes: item.notes || null,
    }));

    const { data: createdItems, error: itemsError } = await supabase
      .from('delivery_items')
      .insert(deliveryItems)
      .select();

    if (itemsError) {
      console.error('Error creating delivery items:', itemsError);
      await supabase.from('delivery_logs').delete().eq('id', deliveryLog.id);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    const newLog = {
      ...deliveryLog,
      items: createdItems,
    };

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating delivery log:', error);
    const errorMessage = error.message || 'Failed to create delivery log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read delivery logs
// POST: Only admins can create delivery logs
export const GET = withAuth(getDeliveryLogsHandler);
export const POST = withAdminAuth(createDeliveryLogHandler);
