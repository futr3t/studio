import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { CleaningTask } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data: cleaningTasks, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching cleaning tasks:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedTasks: CleaningTask[] = cleaningTasks.map(task => ({
      id: task.id,
      name: task.name,
      area: task.area,
      frequency: task.frequency,
      description: task.description,
      equipment: task.equipment,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching cleaning tasks:', error);
    return NextResponse.json({ message: 'Failed to fetch cleaning tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<CleaningTask, 'id'>;
    
    // Basic validation
    if (!body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Name, area, and frequency are required' }, { status: 400 });
    }

    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .insert({
        name: body.name,
        area: body.area,
        frequency: body.frequency,
        description: body.description || null,
        equipment: body.equipment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cleaning task:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newTask: CleaningTask = {
      id: cleaningTask.id,
      name: cleaningTask.name,
      area: cleaningTask.area,
      frequency: cleaningTask.frequency,
      description: cleaningTask.description,
      equipment: cleaningTask.equipment,
    };

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cleaning task:', error);
    const errorMessage = error.message || 'Failed to create cleaning task';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
