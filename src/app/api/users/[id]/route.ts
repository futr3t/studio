import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { User, TrainingRecord } from '@/lib/types';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      console.error(`Error fetching user ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trainingRecords: convertTrainingRecordsFromDb(user.training_records),
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error(`Error fetching user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<User>;

    // Basic validation
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ message: 'Name, email, and role cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.trainingRecords !== undefined) updateData.training_records = convertTrainingRecordsToDb(body.trainingRecords);
    updateData.updated_at = new Date().toISOString();

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      console.error(`Error updating user ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedUser: User = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      trainingRecords: convertTrainingRecordsFromDb(user.training_records),
    };

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error(`Error updating user ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update user';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting user ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User deleted successfully', 
      deletedUserId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete user' }, { status: 500 });
  }
}
