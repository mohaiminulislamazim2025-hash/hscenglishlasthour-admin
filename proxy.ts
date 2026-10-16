import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

/**
 * Next.js 16 Proxy (formerly Middleware). Refreshes the Supabase Auth session
 * cookie on every request and performs an optimistic redirect for
 * unauthenticated users. The authoritative admin check is performed server-side
 * in `lib/auth/dal.ts` (`requireAdmin`), not here.
 */

const PUBLIC_PATHS = ["/login", "/unauthorized", "/api/health"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabasePublicConfig();
  if (!config) {
    // Without Supabase config there is nothing to authenticate against; let the
    // login page render its configuration error.
    return response;
  }

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token and refreshes cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets and metadata files.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif|ico)$).*)",
  ],
};
