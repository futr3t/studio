import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAuth, withAdminAuth } from '@/lib/auth-middleware';
import { createSupabaseAdminServerClient, createSupabaseServerClient } from '@/lib/supabase/server';

async function getProductionLogsHandler(request: NextRequest, context: { user: any }) {
  try {
    const supabase = createSupabaseServerClient();

    const { data: productionLogs, error } = await supabase
      .from('production_logs')
      .select('*')
      .order('log_time', { ascending: false });

    if (error) {
      console.error('Error fetching production logs:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(productionLogs);
  } catch (error) {
    console.error('Error fetching production logs:', error);
    return NextResponse.json({ message: 'Failed to fetch production logs' }, { status: 500 });
  }
}

async function createProductionLogHandler(request: NextRequest, context: { user: any }) {
  try {
    const body = await request.json();
    
    if (!body.productName || !body.batchCode || !body.criticalLimitDetails) {
      return NextResponse.json({ message: 'Product name, batch code, and critical limit details are required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminServerClient();

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .insert({
        ...body,
        log_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating production log:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(productionLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production log:', error);
    const errorMessage = error.message || 'Failed to create production log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// GET: All authenticated users can read production logs
// POST: Only admins can create production logs
export const GET = withAuth(getProductionLogsHandler);
export const POST = withAdminAuth(createProductionLogHandler);
