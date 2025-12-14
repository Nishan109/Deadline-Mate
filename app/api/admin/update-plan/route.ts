import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const adminApiKey = request.headers.get("x-admin-api-key")

    if (!adminApiKey || adminApiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId, plan, durationMonths } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json({ error: "userId and plan are required" }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const updateData: any = {
      plan,
      updated_at: new Date().toISOString(),
    }

    if (plan === "pro" && durationMonths) {
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + durationMonths)
      updateData.plan_expiry_date = expiryDate.toISOString()
    } else if (plan === "free") {
      updateData.plan_expiry_date = null
    }

    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", userId).select().single()

    if (error) {
      console.error("[Admin API] Error updating plan:", error)
      return NextResponse.json({ error: "Failed to update plan" }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
