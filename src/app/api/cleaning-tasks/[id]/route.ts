import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getCleaningTaskByIdHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseServerClient();

    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching cleaning task with ID ${id}:`, error);
      return NextResponse.json({ message: `Cleaning task with ID ${id} not found` }, { status: 404 });
    }

    return NextResponse.json(cleaningTask);
  } catch (error) {
    console.error(`Error fetching cleaning task with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch cleaning task' }, { status: 500 });
  }
}

async function updateCleaningTaskHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;
    const body = await request.json();

    const supabase = createSupabaseAdminServerClient();

    const { data: cleaningTask, error } = await supabase
      .from('cleaning_tasks')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating cleaning task with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(cleaningTask);
  } catch (error: any) {
    console.error(`Error updating cleaning task with ID ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update cleaning task';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

async function deleteCleaningTaskHandler(request: NextRequest, context: { user: any }, params: { id: string }) {
  try {
    const { id } = params;

    const supabase = createSupabaseAdminServerClient();

    const { error } = await supabase
      .from('cleaning_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Error deleting cleaning task with ID ${id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`Error deleting cleaning task with ID ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete cleaning task' }, { status: 500 });
  }
}

// All authenticated users can perform these actions
export const GET = withAuth(getCleaningTaskByIdHandler);
export const PUT = withAdminAuth(updateCleaningTaskHandler);
export const DELETE = withAdminAuth(deleteCleaningTaskHandler);
