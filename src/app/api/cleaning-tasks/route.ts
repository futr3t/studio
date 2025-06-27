import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getCleaningTasksHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: cleaningTasks, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching cleaning tasks:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(cleaningTasks);
  } catch (error) {
    console.error('Error fetching cleaning tasks:', error);
    return NextResponse.json({ message: 'Failed to fetch cleaning tasks' }, { status: 500 });
  }
}

async function createCleaningTaskHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.area || !body.frequency) {
      return NextResponse.json({ message: 'Name, area, and frequency are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating cleaning task:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(cleaningTask, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cleaning task:', error);
    const errorMessage = error.message || 'Failed to create cleaning task';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read cleaning tasks
// POST: Only admins can create cleaning tasks
export const GET = withAuth(getCleaningTasksHandler);
export const POST = withAdminAuth(createCleaningTaskHandler);
