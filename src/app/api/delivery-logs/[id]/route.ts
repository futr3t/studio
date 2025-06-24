import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { DeliveryLog, DeliveryItem } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: deliveryLog, error } = await supabase
      .from('delivery_logs')
      .select(`
        *,
        delivery_items(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Delivery log not found' }, { status: 404 });
      }
      console.error(`Error fetching delivery log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedLog: DeliveryLog = {
      id: deliveryLog.id,
      supplierId: deliveryLog.supplier_id,
      deliveryTime: deliveryLog.delivery_time,
      items: deliveryLog.delivery_items.map((item: any) => ({
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

    return NextResponse.json(formattedLog);
  } catch (error) {
    console.error(`Error fetching delivery log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch delivery log' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<DeliveryLog>;

    // Basic validation
    if (body.supplierId === '' || (body.items && body.items.length === 0)) {
      return NextResponse.json({ message: 'Supplier ID and items cannot be empty' }, { status: 400 });
    }

    // Update delivery log
    const updateData: any = {};
    if (body.supplierId !== undefined) updateData.supplier_id = body.supplierId;
    if (body.deliveryTime !== undefined) updateData.delivery_time = body.deliveryTime;
    if (body.vehicleReg !== undefined) updateData.vehicle_reg = body.vehicleReg;
    if (body.driverName !== undefined) updateData.driver_name = body.driverName;
    if (body.overallCondition !== undefined) updateData.overall_condition = body.overallCondition;
    if (body.isCompliant !== undefined) updateData.is_compliant = body.isCompliant;
    if (body.correctiveAction !== undefined) updateData.corrective_action = body.correctiveAction;
    if (body.receivedBy !== undefined) updateData.received_by = body.receivedBy;
    updateData.updated_at = new Date().toISOString();

    const { data: deliveryLog, error: logError } = await supabase
      .from('delivery_logs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (logError) {
      if (logError.code === 'PGRST116') {
        return NextResponse.json({ message: 'Delivery log not found' }, { status: 404 });
      }
      console.error(`Error updating delivery log ${params.id}:`, logError);
      return NextResponse.json({ message: logError.message }, { status: 500 });
    }

    // Update delivery items if provided
    if (body.items) {
      // Delete existing items
      const { error: deleteError } = await supabase
        .from('delivery_items')
        .delete()
        .eq('delivery_log_id', params.id);

      if (deleteError) {
        console.error(`Error deleting delivery items for log ${params.id}:`, deleteError);
        return NextResponse.json({ message: deleteError.message }, { status: 500 });
      }

      // Create new items
      const deliveryItems = body.items.map(item => ({
        delivery_log_id: params.id,
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
        console.error(`Error creating delivery items for log ${params.id}:`, itemsError);
        return NextResponse.json({ message: itemsError.message }, { status: 500 });
      }

      // Convert to app type with new items
      const updatedLog: DeliveryLog = {
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

      return NextResponse.json(updatedLog);
    } else {
      // Fetch existing items if items weren't updated
      const { data: existingItems, error: fetchItemsError } = await supabase
        .from('delivery_items')
        .select('*')
        .eq('delivery_log_id', params.id);

      if (fetchItemsError) {
        console.error(`Error fetching delivery items for log ${params.id}:`, fetchItemsError);
        return NextResponse.json({ message: fetchItemsError.message }, { status: 500 });
      }

      // Convert to app type with existing items
      const updatedLog: DeliveryLog = {
        id: deliveryLog.id,
        supplierId: deliveryLog.supplier_id,
        deliveryTime: deliveryLog.delivery_time,
        items: existingItems.map(item => ({
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

      return NextResponse.json(updatedLog);
    }
  } catch (error: any) {
    console.error(`Error updating delivery log ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update delivery log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete delivery items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from('delivery_items')
      .delete()
      .eq('delivery_log_id', params.id);

    if (itemsError) {
      console.error(`Error deleting delivery items for log ${params.id}:`, itemsError);
      return NextResponse.json({ message: itemsError.message }, { status: 500 });
    }

    // Delete delivery log
    const { error } = await supabase
      .from('delivery_logs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting delivery log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Delivery log deleted successfully', 
      deletedLogId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting delivery log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete delivery log' }, { status: 500 });
  }
}
