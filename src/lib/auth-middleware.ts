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
      
      console.log('Auth middleware - Header check:', { 
        hasAuthHeader: !!authHeader,
        hasAccessToken: !!accessToken 
      });

      if (!accessToken) {
        console.log('Auth middleware - No access token found');
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      // Verify the token with Supabase
      const supabase = createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);

      console.log('Auth middleware - Token verification:', { 
        hasUser: !!user, 
        error: error?.message 
      });

      if (error || !user) {
        console.log('Auth middleware - Invalid token');
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      console.log('Auth middleware - Access granted for user:', user.id);
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