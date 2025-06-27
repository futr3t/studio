import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getProductionLogByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching production log with ID ${id}:`, error);
      return NextResponse.json({ message: `Production log with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(productionLog);
  } catch (error) {
    console.error(`Error fetching production log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch production log' }, { status: 500 });
  }
}

async function updateProductionLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating production log with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(productionLog);
  } catch (error: any) {
    console.error(`Error updating production log with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update production log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteProductionLogHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('production_logs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting production log with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting production log with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete production log' }, { status: 500 });
  }
}

// All authenticated users can perform these actions
export const GET = withAuth(getProductionLogByIdHandler);
export const PUT = withAdminAuth(updateProductionLogHandler);
export const DELETE = withAdminAuth(deleteProductionLogHandler);
