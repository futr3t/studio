import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getCleaningChecklistItemsHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: checklistItems, error } = await supabase
      .from('cleaning_checklist_items')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching cleaning checklist items:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(checklistItems);
  } catch (error) {
    console.error('Error fetching cleaning checklist items:', error);
    return NextResponse.json({ message: 'Failed to fetch cleaning checklist items' }, { status: 500 });
  }
}

async function createCleaningChecklistItemHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.taskId || !body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Task ID, name, area, and frequency are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating cleaning checklist item:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(checklistItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cleaning checklist item:', error);
    const errorMessage = error.message || 'Failed to create cleaning checklist item';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export const GET = withAuth(getCleaningChecklistItemsHandler);
export const POST = withAdminAuth(createCleaningChecklistItemHandler);
