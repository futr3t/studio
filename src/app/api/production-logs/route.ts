import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProductionLog } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { data: productionLogs, error } = await supabase
      .from('production_logs')
      .select('*')
      .order('log_time', { ascending: false });

    if (error) {
      console.error('Error fetching production logs:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app types
    const formattedLogs: ProductionLog[] = productionLogs.map(log => ({
      id: log.id,
      productName: log.product_name,
      batchCode: log.batch_code,
      logTime: log.log_time,
      criticalLimitDetails: log.critical_limit_details,
      isCompliant: log.is_compliant,
      correctiveAction: log.corrective_action,
      verifiedBy: log.verified_by,
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching production logs:', error);
    return NextResponse.json({ message: 'Failed to fetch production logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<ProductionLog, 'id' | 'logTime'>;
    
    // Basic validation
    if (!body.productName || !body.batchCode || !body.criticalLimitDetails) {
      return NextResponse.json({ message: 'Product name, batch code, and critical limit details are required' }, { status: 400 });
    }

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .insert({
        product_name: body.productName,
        batch_code: body.batchCode,
        log_time: new Date().toISOString(),
        critical_limit_details: body.criticalLimitDetails,
        is_compliant: body.isCompliant,
        corrective_action: body.correctiveAction || null,
        verified_by: body.verifiedBy || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating production log:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const newLog: ProductionLog = {
      id: productionLog.id,
      productName: productionLog.product_name,
      batchCode: productionLog.batch_code,
      logTime: productionLog.log_time,
      criticalLimitDetails: productionLog.critical_limit_details,
      isCompliant: productionLog.is_compliant,
      correctiveAction: productionLog.corrective_action,
      verifiedBy: productionLog.verified_by,
    };

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production log:', error);
    const errorMessage = error.message || 'Failed to create production log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
