
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockCleaningTasksData } from '@/lib/data';
import type { CleaningTask } from '@/lib/types';

let tempCleaningTasksStore: CleaningTask[] = [...mockCleaningTasksData.map(task => ({...task}))];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const task = tempCleaningTasksStore.find(t => t.id === params.id);
  if (task) {
    return NextResponse.json(task);
  }
  return NextResponse.json({ message: 'Cleaning task definition not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<CleaningTask, 'id'>>;
    const taskIndex = tempCleaningTasksStore.findIndex(t => t.id === params.id);

    if (taskIndex === -1) {
      return NextResponse.json({ message: 'Cleaning task definition not found' }, { status: 404 });
    }

    const updatedTask = { ...tempCleaningTasksStore[taskIndex], ...body };
    tempCleaningTasksStore[taskIndex] = updatedTask;

    const originalMockIndex = mockCleaningTasksData.findIndex(t => t.id === params.id);
    if (originalMockIndex !== -1) {
        mockCleaningTasksData[originalMockIndex] = {...updatedTask};
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    let errorMessage = 'Failed to update cleaning task definition';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const taskIndex = tempCleaningTasksStore.findIndex(t => t.id === params.id);

  if (taskIndex === -1) {
    return NextResponse.json({ message: 'Cleaning task definition not found' }, { status: 404 });
  }

  const deletedTask = tempCleaningTasksStore.splice(taskIndex, 1)[0];

  const originalMockIndex = mockCleaningTasksData.findIndex(t => t.id === params.id);
  if (originalMockIndex !== -1) {
      mockCleaningTasksData.splice(originalMockIndex, 1);
      // Also remove related checklist items
      // This should ideally be handled by a service layer or cascade delete in a real DB.
      // For now, we assume this side effect is managed elsewhere or not critical for mock.
  }

  return NextResponse.json({ message: 'Cleaning task definition deleted successfully', deletedTaskId: deletedTask.id });
}
