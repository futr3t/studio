import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function withAuth(
  handler: (request: NextRequest, context: { user: any }) => Promise<NextResponse>
) {
  return async function (request: NextRequest, params?: any) {
    try {
      const cookieStore = cookies();
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
      const cookieStore = cookies();
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

      const userRole = session.user.user_metadata?.role;
      if (userRole !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' }, 
          { status: 403 }
        );
      }

      return await handler(request, { user: session.user });
    } catch (error) {
      console.error('Admin auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' }, 
        { status: 500 }
      );
    }
  };
}