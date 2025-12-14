import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const next = searchParams.get("next") ?? "/dashboard"

  console.log("[v0] Auth confirm - token_hash:", token_hash ? "present" : "missing")
  console.log("[v0] Auth confirm - type:", type)
  console.log("[v0] Auth confirm - next:", next)
  console.log("[v0] Auth confirm - full URL:", request.url)

  const redirectUrl = new URL(request.url)

  if (token_hash && type) {
    const supabase = await createClient()

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
        redirectUrl.search = "" // Clear all query params

        const response = NextResponse.redirect(redirectUrl)

        // Ensure session cookies are set in the response
        return response
      }

      console.log("[v0] Auth confirm - Standard type, redirecting to:", next)
      redirectUrl.pathname = next
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error("[v0] Auth confirm - Verification failed:", error?.message || "No session created")
      redirectUrl.pathname = "/auth"
      redirectUrl.search = `?message=${encodeURIComponent("Could not verify email. Please try again.")}`
      return NextResponse.redirect(redirectUrl)
    }
  } else {
    console.log("[v0] Auth confirm - Missing token_hash or type")
    redirectUrl.pathname = "/auth"
    redirectUrl.search = `?message=${encodeURIComponent("Invalid verification link")}`
    return NextResponse.redirect(redirectUrl)
  }
}
