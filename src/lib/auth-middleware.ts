import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabase/server';

export function withAuth(
  handler: (request: NextRequest, context: { user: any }, params?: any) => Promise<NextResponse>
) {
  return async function (request: NextRequest, params?: any) {
    try {
      // Get the Authorization header
      const authHeader = request.headers.get('authorization');
      const accessToken = authHeader?.replace('Bearer ', '');
      
      if (!accessToken) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      // Verify the token with Supabase
      const supabase = createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }
      return await handler(request, { user }, params);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

export function withAdminAuth(
  handler: (request: NextRequest, context: { user: any }, params?: any) => Promise<NextResponse>
) {
  return async function (request: NextRequest, params?: any) {
    try {
      const supabase = createSupabaseAdminServerClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      const userRole = session.user.user_metadata?.role;
      
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' }, 
          { status: 403 }
        );
      }

      return await handler(request, { user: session.user }, params);
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}