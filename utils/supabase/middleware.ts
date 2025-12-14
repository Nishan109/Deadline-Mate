import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip authentication for shared deadline routes (public access)
  if (request.nextUrl.pathname.startsWith("/shared/")) {
    return supabaseResponse
  }

  // Check if Supabase environment variables are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === "your_supabase_project_url_here") {
    // If no Supabase config or placeholder values, just pass through the request (demo mode)
    return supabaseResponse
  }

  // Validate URL format
  try {
    new URL(supabaseUrl)
  } catch (error) {
    console.warn("Invalid Supabase URL format, running in demo mode:", supabaseUrl)
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Try to get user, but handle errors gracefully
  let user = null
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.warn("Auth error in middleware (non-critical):", authError.message)
      // Don't throw - just continue without user
    } else {
      user = authUser
    }
  } catch (error) {
    console.warn("Auth check failed in middleware (non-critical):", error)
    // Don't throw - just continue without user
  }

  // Redirect behavior and protection rules
  const pathname = request.nextUrl.pathname

  // If authenticated users visit '/' or '/auth' (but NOT reset-password or confirm), send them to dashboard
  if (
    user &&
    (pathname === "/" ||
      (pathname.startsWith("/auth") &&
        !pathname.startsWith("/auth/reset-password") &&
        !pathname.startsWith("/auth/confirm")))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Gate protected routes for unauthenticated users
  const protectedPrefixes = [
    "/dashboard",
    "/notes",
    "/calendar",
    "/timetable",
    "/quick-links",
    "/analytics",
    "/profile",
  ]

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (supabaseUrl && supabaseAnonKey && !user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object here instead of the supabaseResponse object

  return supabaseResponse
}
