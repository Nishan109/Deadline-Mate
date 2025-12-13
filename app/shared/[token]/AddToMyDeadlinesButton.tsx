"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"

interface Props {
  token: string
  // Minimal data needed to clone a deadline
  deadline: {
    title: string
    description: string | null
    due_date: string
    priority: string
    status: string
    category: string | null
    project_link: string | null
  } | null
}

export default function AddToMyDeadlinesButton({ token, deadline }: Props) {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldAutoAdd = useMemo(() => searchParams?.get("autoAdd") === "1", [searchParams])

  useEffect(() => {
    if (!shouldAutoAdd || !deadline || adding) return
    void handleAdd()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoAdd, deadline])

  async function handleAdd() {
    try {
      setAdding(true)
      const supabase = createClient()
      const { data: userRes } = await supabase.auth.getUser()

      if (!userRes?.user) {
        const redirect = encodeURIComponent(`/shared/${token}?autoAdd=1`)
        router.push(`/auth?redirect=${redirect}`)
        return
      }

      if (!deadline) return

      const { error: insertError } = await supabase.from("deadlines").insert({
        user_id: userRes.user.id,
        title: deadline.title,
        description: deadline.description,
        due_date: deadline.due_date,
        priority: deadline.priority,
        status: deadline.status,
        category: deadline.category,
        project_link: deadline.project_link,
      })

      if (insertError) {
        setError(insertError.message)
        return
      }

      router.push("https://v0-deadline-mate-landing-page.vercel.app/dashboard")
    } catch (err: any) {
      setError(err?.message ?? "Failed to add deadline")
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleAdd} size="sm" className="text-xs sm:text-sm" disabled={adding || !deadline}>
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        {adding ? "Adding..." : "Add to My Deadlines"}
      </Button>
      {error && <span className="sr-only">{error}</span>}
    </div>
  )
}
