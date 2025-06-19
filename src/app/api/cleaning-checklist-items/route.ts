
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockCleaningChecklistItemsData } from '@/lib/data';
import type { CleaningChecklistItem } from '@/lib/types';
import { formatISO } from 'date-fns';

let checklistItemsStore: CleaningChecklistItem[] = [...mockCleaningChecklistItemsData.map(item => ({...item}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(checklistItemsStore);
}

// POST for checklist items might not be common if they are auto-generated from definitions.
// However, if manual addition is allowed:
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<CleaningChecklistItem, 'id'>;
    const newItem: CleaningChecklistItem = {
      ...body,
      id: `item${Date.now()}${Math.random().toString(16).slice(2)}`,
      // completedAt might be set on update rather than creation
    };
    checklistItemsStore.unshift(newItem);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create cleaning checklist item';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
