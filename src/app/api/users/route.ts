import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { User, TrainingRecord } from '@/lib/types';
import { withAdminAuth } from '@/lib/auth-middleware';

// Helper function to convert training records from database format
function convertTrainingRecordsFromDb(dbRecords: any[] | null): TrainingRecord[] {
  if (!dbRecords) return [];
  return dbRecords.map(record => ({
    name: record.name,
    dateCompleted: record.date_completed,
    expiryDate: record.expiry_date,
    certificateUrl: record.certificate_url,
  }));
}

// Helper function to convert training records to database format
function convertTrainingRecordsToDb(records: TrainingRecord[] | undefined): any[] | null {
  if (!records) return null;
  return records.map(record => ({
    name: record.name,
    date_completed: record.dateCompleted,
    expiry_date: record.expiryDate,
    certificate_url: record.certificateUrl,
  }));
}

async function getUsersHandler(request: NextRequest, context: { user: any }) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedUsers: User[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trainingRecords: convertTrainingRecordsFromDb(user.training_records),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
  }
}

async function createUserHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json() as Omit<User, 'id'>;
    
    // Basic validation
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ message: 'Name, email, and role are required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: body.name,
        email: body.email,
        role: body.role,
        training_records: convertTrainingRecordsToDb(body.trainingRecords),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trainingRecords: convertTrainingRecordsFromDb(user.training_records),
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    const errorMessage = error.message || 'Failed to create user';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// Apply admin authentication to both routes
export const GET = withAdminAuth(getUsersHandler);
export const POST = withAdminAuth(createUserHandler);
