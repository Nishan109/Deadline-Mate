import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const adminApiKey = request.headers.get("x-admin-api-key")

    if (!adminApiKey || adminApiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")
    const userId = searchParams.get("user_id")

    if (!email && !userId) {
      return NextResponse.json({ error: "Email or user_id is required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    let authQuery
    if (email) {
      authQuery = supabase.auth.admin.listUsers()
    } else {
      authQuery = supabase.auth.admin.getUserById(userId!)
    }

    const { data: authData, error: authError } = await authQuery

    if (authError) {
      console.error("[Admin API] Error fetching user from auth:", authError)
      return NextResponse.json({ error: "Failed to fetch user from auth" }, { status: 500 })
    }

    let user
    if (email) {
      // Find user by email from the list
      const users = (authData as any).users || []
      user = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    } else {
      user = (authData as any).user
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError && profileError.code !== "PGRST116") {
      console.error("[Admin API] Error fetching profile:", profileError)
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 })
    }

    const userProfile = {
      id: user.id,
      email: user.email,
      full_name: profileData?.full_name || null,
      plan: profileData?.plan || "free",
      plan_expiry_date: profileData?.plan_expiry_date || null,
      created_at: user.created_at,
      updated_at: profileData?.updated_at || user.updated_at,
      avatar_url: profileData?.avatar_url || null,
      location: profileData?.location || null,
      timezone: profileData?.timezone || null,
    }

    return NextResponse.json({ user: userProfile })
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
