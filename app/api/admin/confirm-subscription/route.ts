import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const adminApiKey = request.headers.get("x-admin-api-key")
    const expectedKey = process.env.ADMIN_API_KEY

    if (!adminApiKey || !expectedKey || adminApiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized - Invalid or missing ADMIN_API_KEY" }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, new_plan, duration_in_months } = body

    if (!user_id || !new_plan || duration_in_months === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, new_plan, duration_in_months" },
        { status: 400 },
      )
    }

    const validPlans = ["free", "pro"]
    if (!validPlans.includes(new_plan.toLowerCase())) {
      return NextResponse.json({ error: `Invalid plan. Must be one of: ${validPlans.join(", ")}` }, { status: 400 })
    }

    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + duration_in_months)

    const {
      data: { user },
      error: authError,
    } = await adminSupabase.auth.admin.getUserById(user_id)

    if (authError || !user) {
      console.error("[v0] Auth user not found:", user_id, authError?.message)
      return NextResponse.json(
        {
          error: `User not found in authentication. Make sure the UUID is correct. Error: ${authError?.message || "Unknown error"}`,
        },
        { status: 404 },
      )
    }

    const { data, error } = await adminSupabase
      .from("profiles")
      .update({
        plan: new_plan.toLowerCase(),
        plan_expiry_date: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user_id)
      .select()

    if (error) {
      console.error("[v0] Database error updating subscription:", error)
      return NextResponse.json(
        { error: "Failed to update subscription in database", details: error.message },
        { status: 500 },
      )
    }

    if (!data || data.length === 0) {
      console.error("[v0] Profile not found for user:", user_id)
      return NextResponse.json(
        { error: "Profile not found for user. Ensure the migration has been run and profile exists." },
        { status: 404 },
      )
    }

    console.log(
      `[v0] Subscription updated - User: ${user_id}, Email: ${user.email}, Plan: ${new_plan}, Expiry: ${expiryDate.toISOString()}`,
    )

    return NextResponse.json(
      {
        success: true,
        message: "Subscription updated successfully",
        user: {
          id: data[0].id,
          email: user.email,
          plan: data[0].plan,
          plan_expiry_date: data[0].plan_expiry_date,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Error in confirm-subscription route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
