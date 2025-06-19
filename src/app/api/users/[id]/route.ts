
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockUsersData } from '@/lib/data';
import type { User } from '@/lib/types';

let tempUsersStore: User[] = [...mockUsersData.map(user => ({...user}))];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = tempUsersStore.find(u => u.id === params.id);
  if (user) {
    return NextResponse.json(user);
  }
  return NextResponse.json({ message: 'User not found' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Omit<User, 'id'>>;
    const userIndex = tempUsersStore.findIndex(u => u.id === params.id);

    if (userIndex === -1) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const updatedUser = { ...tempUsersStore[userIndex], ...body };
    tempUsersStore[userIndex] = updatedUser;

    const originalMockIndex = mockUsersData.findIndex(u => u.id === params.id);
    if (originalMockIndex !== -1) {
        mockUsersData[originalMockIndex] = {...updatedUser};
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    let errorMessage = 'Failed to update user';
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
  const userIndex = tempUsersStore.findIndex(u => u.id === params.id);

  if (userIndex === -1) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }

  const deletedUser = tempUsersStore.splice(userIndex, 1)[0];

  const originalMockIndex = mockUsersData.findIndex(u => u.id === params.id);
  if (originalMockIndex !== -1) {
      mockUsersData.splice(originalMockIndex, 1);
  }

  return NextResponse.json({ message: 'User deleted successfully', deletedUserId: deletedUser.id });
}
