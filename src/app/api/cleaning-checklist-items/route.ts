import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CleaningChecklistItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data: checklistItems, error } = await supabase
      .from('cleaning_checklist_items')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching cleaning checklist items:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedItems: CleaningChecklistItem[] = checklistItems.map(item => ({
      id: item.id,
      taskId: item.task_id,
      name: item.name,
      area: item.area,
      frequency: item.frequency,
      description: item.description,
      completed: item.completed,
      completedAt: item.completed_at,
      completedBy: item.completed_by,
      notes: item.notes,
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching cleaning checklist items:', error);
    return NextResponse.json({ message: 'Failed to fetch cleaning checklist items' }, { status: 500 });
  }
}

// POST for checklist items might not be common if they are auto-generated from definitions.
// However, if manual addition is allowed:
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<CleaningChecklistItem, 'id'>;
    
    // Basic validation
    if (!body.taskId || !body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Task ID, name, area, and frequency are required' }, { status: 400 });
    }

    const { data: checklistItem, error } = await supabase
      .from('cleaning_checklist_items')
      .insert({
        task_id: body.taskId,
        name: body.name,
        area: body.area,
        frequency: body.frequency,
        description: body.description || null,
        completed: body.completed || false,
        completed_at: body.completedAt || null,
        completed_by: body.completedBy || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cleaning checklist item:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newItem: CleaningChecklistItem = {
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

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cleaning checklist item:', error);
    const errorMessage = error.message || 'Failed to create cleaning checklist item';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
