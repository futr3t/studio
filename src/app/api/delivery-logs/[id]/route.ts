import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getDeliveryLogByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: deliveryLog, error } = await supabase
      .from('delivery_logs')
      .select(`
        *,
        delivery_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching delivery log with ID ${id}:`, error);
      return NextResponse.json({ message: `Delivery log with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(deliveryLog);
  } catch (error) {
    console.error(`Error fetching delivery log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch delivery log' }, { status: 500 });
  }
}

async function updateDeliveryLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: deliveryLog, error: logError } = await supabase
      .from('delivery_logs')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (logError) {
      console.error(`Error updating delivery log with ID ${id}:`, logError);
      return NextResponse.json({ message: logError.message }, { status: 500 });
    }

    if (body.items) {
      await supabase.from('delivery_items').delete().eq('delivery_log_id', id);
      const deliveryItems = body.items.map((item: any) => ({
        delivery_log_id: id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        temperature: item.temperature,
        is_compliant: item.is_compliant,
        notes: item.notes,
      }));
      await supabase.from('delivery_items').insert(deliveryItems);
    }

    const { data: updatedLog, error: fetchError } = await supabase
      .from('delivery_logs')
      .select(`
        *,
        delivery_items(*)
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error(`Error fetching updated delivery log with ID ${id}:`, fetchError);
      return NextResponse.json({ message: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error(`Error updating delivery log with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update delivery log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteDeliveryLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    await supabase.from('delivery_items').delete().eq('delivery_log_id', id);
    const { error } = await supabase
      .from('delivery_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting delivery log with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting delivery log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete delivery log' }, { status: 500 });
  }
}

export const GET = withAuth(getDeliveryLogByIdHandler);
export const PUT = withAdminAuth(updateDeliveryLogHandler);
export const DELETE = withAdminAuth(deleteDeliveryLogHandler);
