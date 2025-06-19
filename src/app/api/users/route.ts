
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockUsersData } from '@/lib/data';
import type { User } from '@/lib/types';

let usersStore: User[] = [...mockUsersData.map(user => ({...user}))];

export async function GET(request: NextRequest) {
  return NextResponse.json(usersStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<User, 'id'>;
    const newUser: User = {
      ...body,
      id: `user${Date.now()}${Math.random().toString(16).slice(2)}`,
    };
    usersStore.unshift(newUser);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    let errorMessage = 'Failed to create user';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 400 });
  }
}
