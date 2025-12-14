import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] Auth confirm - token_hash:", token_hash ? "present" : "missing")
  console.log("[v0] Auth confirm - type:", type)

  const redirectUrl = new URL(request.url)
  const cookieStore = await cookies()

  if (token_hash && type) {
    const supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              // Also set in response
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log("[v0] Auth confirm - verifyOtp result:", {
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error?.message,
    })

    if (!error && data?.session) {
      console.log("[v0] Auth confirm - Session established successfully")

      if (type === "recovery") {
        console.log("[v0] Auth confirm - Recovery type detected, redirecting to reset-password")
        redirectUrl.pathname = "/auth/reset-password"
      } else {
        console.log("[v0] Auth confirm - Standard type, redirecting to:", next)
        redirectUrl.pathname = next
      }

      redirectUrl.search = ""

      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Copy all cookies from the supabase response to the redirect response
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })

      return redirectResponse
    } else {
      console.error("[v0] Auth confirm - Verification failed:", error?.message || "No session created")
      redirectUrl.pathname = "/auth"
      redirectUrl.search = `?message=${encodeURIComponent(error?.message || "Could not verify email. Please try again.")}`
      return NextResponse.redirect(redirectUrl)
    }
  } else {
    console.log("[v0] Auth confirm - Missing token_hash or type")
    redirectUrl.pathname = "/auth"
    redirectUrl.search = `?message=${encodeURIComponent("Invalid verification link")}`
    return NextResponse.redirect(redirectUrl)
  }
}
