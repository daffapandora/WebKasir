import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Sync token / refresh if needed
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/pos');
  const isRootPage = request.nextUrl.pathname === '/';

  // 1. Redirect unauthenticated users trying to access protected paths or root
  if (!user && (isProtectedPage || isRootPage)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const redirectResponse = NextResponse.redirect(url);
    // Propagate cookies
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // 2. Redirect authenticated users trying to access login page or root
  if (user && (isAuthPage || isRootPage)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === 'cashier') {
      url.pathname = '/pos';
    } else {
      url.pathname = '/admin/dashboard';
    }
    const redirectResponse = NextResponse.redirect(url);
    // Propagate cookies
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  return response;
}
