import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function withAuth(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>
) {
  return async function (request: NextRequest, params?: any) {
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
          },
        }
      );

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      return await handler(request, { user: session.user });
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}

export async function withAdminAuth(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>
) {
  return async function (request: NextRequest, params?: any) {
    try {
      console.log('🔒 Admin auth middleware called');
      console.log('🔧 Environment check:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      });
      
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              const value = cookieStore.get(name)?.value;
              console.log(`🍪 Cookie ${name}:`, value ? 'exists' : 'missing');
              return value;
            },
          },
        }
      );

      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📋 Session check:', { hasSession: !!session, hasUser: !!session?.user, error: error?.message });

      if (error || !session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' }, 
          { status: 401 }
        );
      }

      const userRole = session.user.user_metadata?.role;
      console.log('👤 User role check:', { userRole, userId: session.user.id });
      
      if (userRole !== 'admin') {
        console.log('❌ Access denied - not admin');
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' }, 
          { status: 403 }
        );
      }

      console.log('✅ Admin access granted, calling handler');
      return await handler(request, { user: session.user });
    } catch (error) {
      console.error('❌ Admin auth middleware error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}