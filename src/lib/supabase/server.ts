import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getCookie(cookieStore: any, name: string) {
    return cookieStore.get(name)?.value
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return getCookie(cookieStore, name);
        },
      },
    }
  );
}

export function createSupabaseAdminServerClient() {
    const cookieStore = cookies();
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        cookies: {
            get(name: string) {
              return getCookie(cookieStore, name);
            },
          },
      }
    );
  }