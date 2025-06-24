import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { DeliveryLog, DeliveryItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
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

    // Convert to app types
    const formattedLogs: DeliveryLog[] = deliveryLogs.map(log => ({
      id: log.id,
      supplierId: log.supplier_id,
      deliveryTime: log.delivery_time,
      items: log.delivery_items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        temperature: item.temperature,
        isCompliant: item.is_compliant,
        notes: item.notes,
      })) as DeliveryItem[],
      vehicleReg: log.vehicle_reg,
      driverName: log.driver_name,
      overallCondition: log.overall_condition,
      isCompliant: log.is_compliant,
      correctiveAction: log.corrective_action,
      receivedBy: log.received_by,
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching delivery logs:', error);
    return NextResponse.json({ message: 'Failed to fetch delivery logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<DeliveryLog, 'id' | 'deliveryTime'>;
    
    // Basic validation
    if (!body.supplierId || !body.items || body.items.length === 0) {
      return NextResponse.json({ message: 'Supplier ID and items are required' }, { status: 400 });
    }

    // Create delivery log first
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

    // Create delivery items
    const deliveryItems = body.items.map(item => ({
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
      // Clean up the delivery log if items creation failed
      await supabase.from('delivery_logs').delete().eq('id', deliveryLog.id);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    // Convert to app type
    const newLog: DeliveryLog = {
      id: deliveryLog.id,
      supplierId: deliveryLog.supplier_id,
      deliveryTime: deliveryLog.delivery_time,
      items: createdItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        temperature: item.temperature,
        isCompliant: item.is_compliant,
        notes: item.notes,
      })) as DeliveryItem[],
      vehicleReg: deliveryLog.vehicle_reg,
      driverName: deliveryLog.driver_name,
      overallCondition: deliveryLog.overall_condition,
      isCompliant: deliveryLog.is_compliant,
      correctiveAction: deliveryLog.corrective_action,
      receivedBy: deliveryLog.received_by,
    };

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating delivery log:', error);
    const errorMessage = error.message || 'Failed to create delivery log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
