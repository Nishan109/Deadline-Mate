import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token

    console.log("[v0] Fetching shared deadline with token:", token)

    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Querying shared_deadlines table...")

    // Query the shared deadline
    const { data, error } = await supabase
      .from("shared_deadlines")
      .select(
        `
        id,
        deadline_id,
        share_token,
        created_by,
        expires_at,
        is_active,
        view_count,
        created_at,
        updated_at,
        deadlines (
          id,
          title,
          description,
          due_date,
          priority,
          status,
          category,
          project_link,
          created_at,
          user_id
        )
      `,
      )
      .eq("share_token", token)
      .eq("is_active", true)
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 404 })
    }

    if (!data) {
      console.log("[v0] No shared deadline found")
      return NextResponse.json({ error: "Shared deadline not found" }, { status: 404 })
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log("[v0] Shared deadline has expired")
      return NextResponse.json({ error: "This shared deadline has expired" }, { status: 410 })
    }

    if (!data.deadlines) {
      console.log("[v0] No deadline data found")
      return NextResponse.json({ error: "Deadline data not found" }, { status: 404 })
    }

    console.log("[v0] Successfully fetched shared deadline:", data.deadlines.title)

    // Increment view count (fire and forget)
    supabase
      .from("shared_deadlines")
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq("id", data.id)
      .then(({ error }) => {
        if (error) {
          console.error("[v0] Error updating view count:", error)
        }
      })

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
