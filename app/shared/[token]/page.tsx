import { createClient } from "@/utils/supabase/server"
import { format } from "date-fns"
import type { Metadata } from "next"
import SharedDeadlineClient from "./shared-deadline-client"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

interface PageProps {
  params: {
    token: string
  }
}

// Generate metadata for SEO and social sharing
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = await createClient()

    // Get shared deadline info
    const { data: sharedDeadline } = await supabase
      .from("shared_deadlines")
      .select(`
        *,
        deadlines (
          title,
          description,
          due_date,
          priority,
          category
        )
      `)
      .eq("share_token", params.token)
      .eq("is_active", true)
      .single()

    if (!sharedDeadline?.deadlines) {
      return {
        title: "Shared Deadline - DeadlineMate",
        description: "View shared deadline details on DeadlineMate",
      }
    }

    const deadline = sharedDeadline.deadlines
    const dueDate = format(new Date(deadline.due_date), "PPP")

    return {
      title: `${deadline.title} - Shared Deadline | DeadlineMate`,
      description: `${deadline.description || deadline.title} - Due ${dueDate}. Shared via DeadlineMate.`,
      openGraph: {
        title: `${deadline.title} - Shared Deadline`,
        description: `${deadline.description || deadline.title} - Due ${dueDate}`,
        type: "website",
        siteName: "DeadlineMate",
      },
      twitter: {
        card: "summary_large_image",
        title: `${deadline.title} - Shared Deadline`,
        description: `${deadline.description || deadline.title} - Due ${dueDate}`,
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Shared Deadline - DeadlineMate",
      description: "View shared deadline details on DeadlineMate",
    }
  }
}

export default function SharedDeadlinePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
            <p className="text-gray-600">Loading shared deadline...</p>
          </div>
        </div>
      }
    >
      <SharedDeadlineClient token={params.token} />
    </Suspense>
  )
}
