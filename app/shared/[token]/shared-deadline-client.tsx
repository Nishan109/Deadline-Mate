"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, ExternalLink, Share2, AlertCircle, Timer, ArrowRight, Target, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import AddToMyDeadlinesButton from "./AddToMyDeadlinesButton"

interface SharedDeadlineClientProps {
  token: string
}

interface SharedDeadline {
  id: string
  deadline_id: string
  share_token: string
  created_by: string
  expires_at: string | null
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
  deadlines: {
    id: string
    title: string
    description: string | null
    due_date: string
    priority: string
    status: string
    category: string | null
    project_link: string | null
    created_at: string
    user_id: string
  }
}

export default function SharedDeadlineClient({ token }: SharedDeadlineClientProps) {
  const [sharedDeadline, setSharedDeadline] = useState<SharedDeadline | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldAutoAdd = useMemo(() => searchParams?.get("autoAdd") === "1", [searchParams])

  useEffect(() => {
    async function fetchSharedDeadline() {
      try {
        setLoading(true)
        setError(null)

        console.log("[v0] Fetching shared deadline via API route...")

        // Use API route to fetch shared deadline with service role bypass
        const response = await fetch(`/api/shared-deadline/${token}`)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] API error:", errorData)

          if (response.status === 410) {
            setError("This shared deadline has expired")
          } else if (response.status === 404) {
            setError("Shared deadline not found")
          } else {
            setError(errorData.error || "Failed to load shared deadline")
          }
          return
        }

        const data = await response.json()
        console.log("[v0] Successfully fetched shared deadline:", data)

        if (!data || !data.deadlines) {
          setError("Shared deadline not found")
          return
        }

        setSharedDeadline(data)
      } catch (err) {
        console.error("[v0] Fetch error:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedDeadline()
  }, [token])

  // Auto-add flow after login
  useEffect(() => {
    if (!shouldAutoAdd || !sharedDeadline || adding) return
    void handleAddToMyDeadlines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoAdd, sharedDeadline])

  async function handleAddToMyDeadlines() {
    try {
      setAdding(true)
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/auth?redirectTo=/shared/${token}?autoAdd=1`)
        return
      }

      if (!sharedDeadline?.deadlines) {
        throw new Error("No deadline data available")
      }

      const deadline = sharedDeadline.deadlines

      const { error: insertError } = await supabase.from("deadlines").insert({
        user_id: user.id,
        title: deadline.title,
        description: deadline.description,
        due_date: deadline.due_date,
        priority: deadline.priority,
        status: deadline.status,
        category: deadline.category,
        project_link: deadline.project_link,
      })

      if (insertError) throw insertError

      router.push("/dashboard?added=true")
    } catch (err) {
      console.error("[v0] Error adding deadline:", err)
      alert("Failed to add deadline to your account. Please try again.")
    } finally {
      setAdding(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-600">Loading shared deadline...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Unable to Load Shared Deadline</CardTitle>
            <CardDescription className="text-red-700">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Link href="/" className="flex-1">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">Go to Homepage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!sharedDeadline || !sharedDeadline.deadlines) {
    return null
  }

  const deadline = sharedDeadline.deadlines
  const dueDate = new Date(deadline.due_date)
  const now = new Date()
  const diffTime = dueDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const priorityColors = {
    low: "bg-blue-100 text-blue-800 border-blue-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-red-100 text-red-800 border-red-200",
  }

  const statusColors = {
    pending: "bg-gray-100 text-gray-800 border-gray-200",
    in_progress: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    overdue: "bg-red-100 text-red-800 border-red-200",
  }

  const timeLeftColor = diffDays <= 1 ? "text-red-600" : diffDays <= 3 ? "text-orange-600" : "text-blue-600"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">DeadlineMate</h1>
                <p className="text-xs sm:text-sm text-gray-600">Shared Deadline</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent text-xs sm:text-sm">
                <span className="hidden sm:inline">Try DeadlineMate</span>
                <span className="sm:hidden">Try App</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Deadline Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-2 break-words">
                      {deadline.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 flex-wrap">
                      <Badge
                        className={`${
                          priorityColors[deadline.priority as keyof typeof priorityColors]
                        } border text-xs sm:text-sm`}
                      >
                        {deadline.priority} priority
                      </Badge>
                      <Badge
                        className={`${
                          statusColors[deadline.status as keyof typeof statusColors]
                        } border text-xs sm:text-sm`}
                      >
                        {deadline.status.replace("_", " ")}
                      </Badge>
                      {deadline.category && (
                        <Badge variant="outline" className="bg-gray-50 text-xs sm:text-sm">
                          {deadline.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Due Date Section */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm sm:text-base">
                          {format(dueDate, "EEEE, MMMM do, yyyy")}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {format(dueDate, "h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`flex items-center ${timeLeftColor}`}>
                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <div className="text-right">
                          <p className="font-medium">
                            {diffDays > 0 ? `${diffDays} day${diffDays !== 1 ? "s" : ""} left` : "Due today"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                {/* Description */}
                {deadline.description && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Description</h3>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words whitespace-pre-wrap">
                      {deadline.description}
                    </p>
                  </div>
                )}

                {/* Project Link */}
                {deadline.project_link && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Project Resources</h3>
                    <a
                      href={deadline.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all"
                    >
                      <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span className="truncate">{deadline.project_link}</span>
                    </a>
                  </div>
                )}

                {/* Add to My Deadlines Button */}
                <AddToMyDeadlinesButton deadline={deadline} adding={adding} onAdd={handleAddToMyDeadlines} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Share Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-lg flex items-center text-blue-900">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Share Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Shared By:</span>
                  <span className="text-blue-900 text-sm sm:text-base truncate max-w-[150px]">
                    {sharedDeadline.created_by.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Views:</span>
                  <span className="text-blue-900 text-sm sm:text-base">{sharedDeadline.view_count}</span>
                </div>
                {sharedDeadline.expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-700 font-medium text-sm sm:text-base">Expires:</span>
                    <span className="text-blue-900 text-sm sm:text-base">
                      {format(new Date(sharedDeadline.expires_at), "MMM do, yyyy")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
                <CardTitle className="text-lg text-emerald-900">Try DeadlineMate</CardTitle>
                <CardDescription className="text-emerald-700 text-sm sm:text-base">
                  Organize your deadlines and collaborate with your team
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <Link href="/" className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base h-9 sm:h-10">
                      Get Started Free
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/auth" className="block">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-sm sm:text-base h-9 sm:h-10"
                    >
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 text-xs sm:text-sm text-gray-600">
            <p>© 2025 DeadlineMate. All rights reserved.</p>
            <div className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-900">
                Home
              </Link>
              <Link href="/auth" className="hover:text-gray-900">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
