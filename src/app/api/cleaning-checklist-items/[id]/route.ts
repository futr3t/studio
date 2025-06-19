
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockCleaningChecklistItemsData } from '@/lib/data';
import type { CleaningChecklistItem } from '@/lib/types';
import { formatISO } from 'date-fns';

let tempChecklistItemsStore: CleaningChecklistItem[] = [...mockCleaningChecklistItemsData.map(item => ({...item}))];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = tempChecklistItemsStore.find(i => i.id === params.id);
  if (item) {
    return NextResponse.json(item);
  }
  return NextResponse.json({ message: 'Cleaning checklist item not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<CleaningChecklistItem, 'id'>>;
    const itemIndex = tempChecklistItemsStore.findIndex(i => i.id === params.id);

    if (itemIndex === -1) {
      return NextResponse.json({ message: 'Cleaning checklist item not found' }, { status: 404 });
    }

    const updatedItem = { ...tempChecklistItemsStore[itemIndex], ...body };
    // If 'completed' is true and completedAt is not set, set it.
    if (updatedItem.completed && !updatedItem.completedAt) {
        updatedItem.completedAt = formatISO(new Date());
    } else if (!updatedItem.completed) {
        updatedItem.completedAt = undefined;
        updatedItem.completedBy = undefined;
        updatedItem.notes = undefined;
    }
    tempChecklistItemsStore[itemIndex] = updatedItem;

    const originalMockIndex = mockCleaningChecklistItemsData.findIndex(i => i.id === params.id);
    if (originalMockIndex !== -1) {
        mockCleaningChecklistItemsData[originalMockIndex] = {...updatedItem};
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    let errorMessage = 'Failed to update cleaning checklist item';
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
  const itemIndex = tempChecklistItemsStore.findIndex(i => i.id === params.id);

  if (itemIndex === -1) {
    return NextResponse.json({ message: 'Cleaning checklist item not found' }, { status: 404 });
  }

  const deletedItem = tempChecklistItemsStore.splice(itemIndex, 1)[0];

  const originalMockIndex = mockCleaningChecklistItemsData.findIndex(i => i.id === params.id);
  if (originalMockIndex !== -1) {
      mockCleaningChecklistItemsData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'Cleaning checklist item deleted successfully', deletedItemId: deletedItem.id });
}
