
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockCleaningTasksData } from '@/lib/data';
import type { CleaningTask } from '@/lib/types';

let cleaningTasksStore: CleaningTask[] = [...mockCleaningTasksData.map(task => ({...task}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(cleaningTasksStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<CleaningTask, 'id'>;
    const newTask: CleaningTask = {
      ...body,
      id: `ctDef${Date.now()}${Math.random().toString(16).slice(2)}`,
    };
    cleaningTasksStore.unshift(newTask);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create cleaning task definition';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
