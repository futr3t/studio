import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ProductionLog } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Production log not found' }, { status: 404 });
      }
      console.error(`Error fetching production log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const formattedLog: ProductionLog = {
      id: productionLog.id,
      productName: productionLog.product_name,
      batchCode: productionLog.batch_code,
      logTime: productionLog.log_time,
      criticalLimitDetails: productionLog.critical_limit_details,
      isCompliant: productionLog.is_compliant,
      correctiveAction: productionLog.corrective_action,
      verifiedBy: productionLog.verified_by,
    };

    return NextResponse.json(formattedLog);
  } catch (error) {
    console.error(`Error fetching production log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to fetch production log' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<ProductionLog>;

    // Basic validation
    if (body.productName === '' || body.batchCode === '' || body.criticalLimitDetails === '') {
      return NextResponse.json({ message: 'Product name, batch code, and critical limit details cannot be empty' }, { status: 400 });
    }

    const updateData: any = {};
    if (body.productName !== undefined) updateData.product_name = body.productName;
    if (body.batchCode !== undefined) updateData.batch_code = body.batchCode;
    if (body.logTime !== undefined) updateData.log_time = body.logTime;
    if (body.criticalLimitDetails !== undefined) updateData.critical_limit_details = body.criticalLimitDetails;
    if (body.isCompliant !== undefined) updateData.is_compliant = body.isCompliant;
    if (body.correctiveAction !== undefined) updateData.corrective_action = body.correctiveAction;
    if (body.verifiedBy !== undefined) updateData.verified_by = body.verifiedBy;
    updateData.updated_at = new Date().toISOString();

    const { data: productionLog, error } = await supabase
      .from('production_logs')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ message: 'Production log not found' }, { status: 404 });
      }
      console.error(`Error updating production log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    // Convert to app type
    const updatedLog: ProductionLog = {
      id: productionLog.id,
      productName: productionLog.product_name,
      batchCode: productionLog.batch_code,
      logTime: productionLog.log_time,
      criticalLimitDetails: productionLog.critical_limit_details,
      isCompliant: productionLog.is_compliant,
      correctiveAction: productionLog.corrective_action,
      verifiedBy: productionLog.verified_by,
    };

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error(`Error updating production log ${params.id}:`, error);
    const errorMessage = error.message || 'Failed to update production log';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('production_logs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error(`Error deleting production log ${params.id}:`, error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Production log deleted successfully', 
      deletedLogId: params.id 
    });
  } catch (error) {
    console.error(`Error deleting production log ${params.id}:`, error);
    return NextResponse.json({ message: 'Failed to delete production log' }, { status: 500 });
  }
}
