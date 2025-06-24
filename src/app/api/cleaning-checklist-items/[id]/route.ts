import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CleaningChecklistItem } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Cleaning checklist item not found' }, { status: 404 });
      }
      console.error(`Error fetching cleaning checklist item ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedItem: CleaningChecklistItem = {
      id: checklistItem.id,
      taskId: checklistItem.task_id,
      name: checklistItem.name,
      area: checklistItem.area,
      frequency: checklistItem.frequency,
      description: checklistItem.description,
      completed: checklistItem.completed,
      completedAt: checklistItem.completed_at,
      completedBy: checklistItem.completed_by,
      notes: checklistItem.notes,
    };

    return NextResponse.json(formattedItem);
  } catch (error) {
    console.error(`Error fetching cleaning checklist item ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch cleaning checklist item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<CleaningChecklistItem>;

    // Basic validation
    if (!body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Name, area, and frequency cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.taskId !== undefined) updateData.task_id = body.taskId;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.completed !== undefined) {
      updateData.completed = body.completed;
      // If marking as completed and no completed_at time is provided, set it now
      if (body.completed && !body.completedAt) {
        updateData.completed_at = new Date().toISOString();
      } else if (!body.completed) {
        // If marking as not completed, clear completion fields
        updateData.completed_at = null;
        updateData.completed_by = null;
        updateData.notes = null;
      }
    }
    if (body.completedAt !== undefined) updateData.completed_at = body.completedAt;
    if (body.completedBy !== undefined) updateData.completed_by = body.completedBy;
    if (body.notes !== undefined) updateData.notes = body.notes;
    updateData.updated_at = new Date().toISOString();

    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Cleaning checklist item not found' }, { status: 404 });
      }
      console.error(`Error updating cleaning checklist item ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedItem: CleaningChecklistItem = {
      id: checklistItem.id,
      taskId: checklistItem.task_id,
      name: checklistItem.name,
      area: checklistItem.area,
      frequency: checklistItem.frequency,
      description: checklistItem.description,
      completed: checklistItem.completed,
      completedAt: checklistItem.completed_at,
      completedBy: checklistItem.completed_by,
      notes: checklistItem.notes,
    };

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating cleaning checklist item ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update cleaning checklist item';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('cleaning_checklist_items')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting cleaning checklist item ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Cleaning checklist item deleted successfully', 
      deletedItemId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting cleaning checklist item ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete cleaning checklist item' }, { status: 500 });
  }
}
