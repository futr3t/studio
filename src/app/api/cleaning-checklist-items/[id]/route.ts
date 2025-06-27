import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getCleaningChecklistItemByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching cleaning checklist item with ID ${id}:`, error);
      return NextResponse.json({ message: `Checklist item with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(checklistItem);
  } catch (error) {
    console.error(`Error fetching cleaning checklist item with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch cleaning checklist item' }, { status: 500 });
  }
}

async function updateCleaningChecklistItemHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating cleaning checklist item with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(checklistItem);
  } catch (error: any) {
    console.error(`Error updating cleaning checklist item with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update cleaning checklist item';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteCleaningChecklistItemHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('cleaning_checklist_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting cleaning checklist item with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting cleaning checklist item with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete cleaning checklist item' }, { status: 500 });
  }
}

export const GET = withAuth(getCleaningChecklistItemByIdHandler);
export const PUT = withAdminAuth(updateCleaningChecklistItemHandler);
export const DELETE = withAdminAuth(deleteCleaningChecklistItemHandler);
