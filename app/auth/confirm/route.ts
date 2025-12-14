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

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    console.log("[v0] Auth confirm - verifyOtp error:", error)

    if (!error) {
      if (type === "recovery") {
        console.log("[v0] Auth confirm - Recovery type detected, redirecting to reset-password")
        return NextResponse.redirect(new URL("/auth/reset-password", request.url))
      }

      console.log("[v0] Auth confirm - Standard type, redirecting to:", next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.log("[v0] Auth confirm - Verification failed with error:", error.message)
    }
  } else {
    console.log("[v0] Auth confirm - Missing token_hash or type")
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(new URL("/auth?message=Could not verify email", request.url))
}
