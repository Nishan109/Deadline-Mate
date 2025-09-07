"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Clock,
  ExternalLink,
  Share2,
  AlertCircle,
  Timer,
  ArrowRight,
  Target,
  Plus,
  CheckCircle,
  Star
} from "lucide-react"
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

        const supabase = createClient()
        
        const { data, error: queryError } = await supabase
          .from("shared_deadlines")
          .select(`
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
          `)
          .eq("share_token", token)
          .eq("is_active", true)
          .single()

        if (queryError) {
          console.error("Client-side query error:", queryError)
          setError(queryError.message)
          return
        }

        if (!data) {
          setError("Shared deadline not found")
          return
        }

        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          setError("This shared deadline has expired")
          return
        }

        setSharedDeadline(data)

        // Increment view count
        supabase
          .from("shared_deadlines")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("id", data.id)
          .then(({ error }: { error: any }) => {
            if (error) {
              console.error("Error updating view count:", error)
            }
          })
      } catch (err) {
        console.error("Client-side fetch error:", err)
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
      const { data: userRes } = await supabase.auth.getUser()

      if (!userRes?.user) {
        // Redirect to auth and come back to auto-add
        const redirect = encodeURIComponent(`/shared/${token}?autoAdd=1`)
        router.push(`/auth?redirect=${redirect}`)
        return
      }

      const deadline = sharedDeadline!.deadlines

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
        console.error("Insert error:", insertError)
        setError(insertError.message)
        return
      }

      // Go to dashboard after success
      router.push("https://v0-deadline-mate-landing-page.vercel.app/dashboard")
    } catch (err: any) {
      console.error("Add to my deadlines failed:", err)
      setError(err?.message ?? "Failed to add deadline")
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <CardTitle className="text-blue-900">Loading Shared Deadline</CardTitle>
            <CardDescription className="text-blue-700">
              Please wait while we fetch the deadline details...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !sharedDeadline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Error Loading Deadline</CardTitle>
            <CardDescription className="text-red-700">
              {error || "An error occurred while loading the shared deadline."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
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

  const deadline = sharedDeadline.deadlines
  const dueDate = new Date(deadline.due_date)
  const now = new Date()
  
  // Simple and reliable overdue detection
  const isOverdue = dueDate < now && deadline.status !== "completed"
  
  
  // Calculate days until due using Asia/Kolkata calendar days to avoid off-by-one
  const kolkataNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const kolkataDue = new Date(new Date(deadline.due_date).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dStart = startOfDay(kolkataDue).getTime()
  const nStart = startOfDay(kolkataNow).getTime()
  const daysUntilDue = Math.round((dStart - nStart) / (1000 * 60 * 60 * 24))
  
  
  // Create date formatters for Asia/Kolkata timezone
  const kolkataTimeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
  
  const kolkataDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  
  // Format the date and time for display
  const properDisplayDate = new Date(deadline.due_date)
  const kolkataTime = kolkataTimeFormatter.format(properDisplayDate)
  const kolkataDateFormatted = kolkataDateFormatter.format(properDisplayDate)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-orange-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

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
            <div className="flex items-center gap-2">
              <AddToMyDeadlinesButton token={token} deadline={deadline} />
              <Link href="https://v0-deadline-mate-landing-page.vercel.app/dashboard">
              <Button variant="outline" size="sm" className="bg-transparent text-xs sm:text-sm">
                <span className="hidden sm:inline">Try DeadlineMate</span>
                <span className="sm:hidden">Try App</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Deadline Card */}
          <div className="lg:col-span-2">
            <Card className="group relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl bg-gradient-to-br from-white to-gray-50 cursor-pointer active:scale-[0.98]">
              {/* Priority indicator bar */}
              <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(deadline.priority).replace('border-l-', 'bg-')} rounded-l-2xl`} />
              
              {/* Status indicator overlay */}
              {deadline.status === "completed" && (
                <div className="absolute top-6 right-6 z-10">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}

              <CardHeader className="p-4 sm:p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 break-words group-hover:text-gray-800 transition-colors">
                      {deadline.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-sm font-medium ${
                          deadline.priority === "high"
                            ? "border-red-200 text-red-700 bg-gradient-to-r from-red-50 to-pink-50 hover:bg-red-100"
                            : deadline.priority === "medium"
                              ? "border-orange-200 text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 hover:bg-orange-100"
                              : "border-green-200 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 hover:bg-green-100"
                        } transition-colors`}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {deadline.priority} priority
                      </Badge>
                      <Badge
                        className={`text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0 ${
                          isOverdue 
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                            : deadline.status === "completed"
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                              : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                        }`}
                      >
                        {isOverdue ? (
                          <>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Overdue
                          </>
                        ) : deadline.status === "completed" ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            {deadline.status.replace("_", " ")}
                          </>
                        )}
                      </Badge>
                      {deadline.category && (
                        <Badge 
                          variant="outline" 
                          className="text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                          {deadline.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Due Date Section */}
                <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-4 sm:p-6 border-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                          {kolkataDateFormatted}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          {kolkataTime}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`flex items-center justify-start sm:justify-end ${isOverdue ? "text-red-600" : "text-blue-600"}`}>
                        <Timer className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-base sm:text-lg">
                            {isOverdue 
                              ? "Overdue" 
                              : daysUntilDue > 0 
                                ? `${daysUntilDue} days left` 
                                : "Due today"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3" />
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-3 sm:p-4 border-0">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base break-words">
                      {deadline.description || "No description available."}
                    </p>
                  </div>
                </div>

                {/* Project Link */}
                {deadline.project_link && (
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2 sm:mr-3" />
                      Project Resources
                    </h3>
                    <a
                      href={deadline.project_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm sm:text-base break-all bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium"
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                      <span>View Project</span>
                    </a>
                  </div>
                )}
              </CardContent>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-white/5 group-hover:via-white/10 group-hover:to-white/5 transition-all duration-500 rounded-2xl pointer-events-none" />
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
                  <span className="text-blue-900 text-sm sm:text-base">{sharedDeadline.created_by}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Views:</span>
                  <span className="text-blue-900 text-sm sm:text-base">{sharedDeadline.view_count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium text-sm sm:text-base">Expires:</span>
                  <span className="text-blue-900 text-sm sm:text-base">
                    {sharedDeadline.expires_at ? format(new Date(sharedDeadline.expires_at), "PPP") : "Never"}
                  </span>
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
            <p>© 2024 DeadlineMate. All rights reserved.</p>
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
