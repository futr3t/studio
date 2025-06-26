import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { CleaningTask } from '@/lib/types';
import { withAuth } from '@/lib/auth-middleware';

async function getCleaningTasksHandler(request: NextRequest, context: { user: any }) {
  try {
    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

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

async function createCleaningTaskHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json() as Omit<CleaningTask, 'id'>;
    
    // Basic validation
    if (!body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Name, area, and frequency are required' }, { status: 400 });
    }

    // Create authenticated Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

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

// GET: All authenticated users can read cleaning tasks
// POST: All authenticated users can create cleaning tasks
export const GET = withAuth(getCleaningTasksHandler);
export const POST = withAuth(createCleaningTaskHandler);
