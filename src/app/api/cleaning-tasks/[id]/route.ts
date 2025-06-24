import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CleaningTask } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Cleaning task not found' }, { status: 404 });
      }
      console.error(`Error fetching cleaning task ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedTask: CleaningTask = {
      id: cleaningTask.id,
      name: cleaningTask.name,
      area: cleaningTask.area,
      frequency: cleaningTask.frequency,
      description: cleaningTask.description,
      equipment: cleaningTask.equipment,
    };

    return NextResponse.json(formattedTask);
  } catch (error) {
    console.error(`Error fetching cleaning task ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch cleaning task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<CleaningTask>;

    // Basic validation
    if (!body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Name, area, and frequency cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.frequency !== undefined) updateData.frequency = body.frequency;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.equipment !== undefined) updateData.equipment = body.equipment;
    updateData.updated_at = new Date().toISOString();

    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Cleaning task not found' }, { status: 404 });
      }
      console.error(`Error updating cleaning task ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedTask: CleaningTask = {
      id: cleaningTask.id,
      name: cleaningTask.name,
      area: cleaningTask.area,
      frequency: cleaningTask.frequency,
      description: cleaningTask.description,
      equipment: cleaningTask.equipment,
    };

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error(`Error updating cleaning task ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update cleaning task';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('cleaning_tasks')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting cleaning task ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Cleaning task deleted successfully', 
      deletedTaskId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting cleaning task ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete cleaning task' }, { status: 500 });
  }
}
