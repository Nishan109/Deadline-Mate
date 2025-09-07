"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  Calendar,
  Clock,
  CheckCircle,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Info,
  Menu,
  ArrowLeft,
  StickyNote,
  Star,
  AlertCircle,
} from "lucide-react"
import { signOut } from "../auth/actions"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  startOfDay,
  endOfDay,
  isWithinInterval,
  addDays,
  subDays,
  getDay,
  isBefore,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns"
import { LoadingButton } from "@/components/loading-button"
import { NotificationSystem } from "@/components/notification-system"
import { createClient } from "@/utils/supabase/client"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
}

interface CalendarClientProps {
  user: any
  initialDeadlines: Deadline[]
  isDemoMode?: boolean
}

export default function CalendarClient({ user, initialDeadlines, isDemoMode = false }: CalendarClientProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || "",
    avatar_url: user.user_metadata?.avatar_url || "",
  })

  // Enhanced deadline processing with accurate status calculation
  const processedDeadlines = useMemo(() => {
    const now = new Date()

    return deadlines.map((deadline) => {
      const dueDate = parseISO(deadline.due_date)
      let calculatedStatus = deadline.status

      // Auto-calculate overdue status for non-completed deadlines
      if (deadline.status !== "completed" && isBefore(dueDate, now)) {
        calculatedStatus = "overdue"
      }

      return {
        ...deadline,
        status: calculatedStatus,
        dueDate, // Pre-parsed date for performance
        isToday: isToday(dueDate),
        isOverdue: deadline.status !== "completed" && isBefore(dueDate, now),
        timeUntilDue: differenceInMinutes(dueDate, now),
        daysUntilDue: differenceInDays(dueDate, startOfDay(now)),
      }
    })
  }, [deadlines])

  // Fetch current profile data
  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (isDemoMode) {
        setCurrentProfile({
          id: user.id,
          email: user.email,
          full_name: "Demo User",
          avatar_url: "/placeholder.svg?height=40&width=40",
        })
        return
      }

      try {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", user.id)
          .single()

        if (profile && !error) {
          setCurrentProfile({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        setCurrentProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "",
          avatar_url: user.user_metadata?.avatar_url || "",
        })
      }
    }

    fetchCurrentProfile()
  }, [user, isDemoMode])

  // Get display name and avatar
  const displayName = currentProfile.full_name || currentProfile.email.split("@")[0] || "User"
  const avatarFallback =
    currentProfile.full_name?.charAt(0)?.toUpperCase() || currentProfile.email?.charAt(0)?.toUpperCase() || "U"

  // Enhanced calendar calculations with proper week handling
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)

    // Get the first day of the calendar (including previous month days)
    const calendarStart = subDays(monthStart, getDay(monthStart))
    // Get the last day of the calendar (including next month days)
    const calendarEnd = addDays(monthEnd, 6 - getDay(monthEnd))

    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return {
      monthStart,
      monthEnd,
      calendarDays,
      currentMonthName: format(currentDate, "MMMM yyyy"),
    }
  }, [currentDate])

  // Enhanced deadline filtering for specific dates with accurate time handling
  const getDeadlinesForDate = useCallback(
    (date: Date) => {
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      return processedDeadlines
        .filter((deadline) => isWithinInterval(deadline.dueDate, { start: dayStart, end: dayEnd }))
        .sort((a, b) => {
          // Sort by time within the day, then by priority
          const timeCompare = a.dueDate.getTime() - b.dueDate.getTime()
          if (timeCompare !== 0) return timeCompare

          // Priority sorting: high -> medium -> low
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
    },
    [processedDeadlines],
  )

  // Enhanced priority and status color functions
  const getPriorityColor = useCallback((priority: string) => {
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
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500 text-white"
      case "in_progress":
        return "bg-blue-500 text-white"
      case "overdue":
        return "bg-red-600 text-white"
      case "pending":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }, [])

  // Enhanced deadline badge with more accurate time calculations
  const getDeadlineBadge = useCallback((deadline: any) => {
    const now = new Date()
    const dueDate = deadline.dueDate

    if (deadline.status === "completed") {
      return (
        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
          ✓ Completed
        </Badge>
      )
    }

    if (deadline.isOverdue) {
      const hoursOverdue = Math.abs(differenceInHours(now, dueDate))
      const daysOverdue = Math.abs(differenceInDays(now, dueDate))

      return (
        <Badge variant="destructive" className="text-xs">
          {daysOverdue > 0 ? `${daysOverdue}d overdue` : `${hoursOverdue}h overdue`}
        </Badge>
      )
    }

    if (deadline.isToday) {
      const hoursUntil = Math.max(0, differenceInHours(dueDate, now))
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
          {hoursUntil > 0 ? `${hoursUntil}h left` : "Due now"}
        </Badge>
      )
    }

    if (deadline.daysUntilDue <= 7 && deadline.daysUntilDue > 0) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
          {deadline.daysUntilDue === 1 ? "Tomorrow" : `${deadline.daysUntilDue} days`}
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="text-xs">
        {format(dueDate, "MMM dd")}
      </Badge>
    )
  }, [])

  // Navigation functions
  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(subMonths(currentDate, 1))
  }, [currentDate])

  const goToNextMonth = useCallback(() => {
    setCurrentDate(addMonths(currentDate, 1))
  }, [currentDate])

  const goToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }, [])

  // Enhanced selected date deadlines with better sorting
  const selectedDateDeadlines = useMemo(() => {
    if (!selectedDate) return []

    const deadlinesForDate = getDeadlinesForDate(selectedDate)

    // Group by status for better organization
    const grouped = deadlinesForDate.reduce(
      (acc, deadline) => {
        const status = deadline.status
        if (!acc[status]) acc[status] = []
        acc[status].push(deadline)
        return acc
      },
      {} as Record<string, typeof deadlinesForDate>,
    )

    // Order: overdue, pending, in_progress, completed
    const statusOrder = ["overdue", "pending", "in_progress", "completed"]

    return statusOrder.flatMap((status) => grouped[status] || [])
  }, [selectedDate, getDeadlinesForDate])

  // Sidebar content component
  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-gray-900">DeadlineMate</span>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/dashboard">
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Dashboard</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start bg-emerald-50 text-emerald-700 h-10 sm:h-auto">
            <Clock className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Calendar View</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/timetable">
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Time Table</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/analytics">
            <CheckCircle className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Analytics</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/notes">
            <StickyNote className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Notes</span>
          </LoadingButton>
          <LoadingButton variant="ghost" className="w-full justify-start h-10 sm:h-auto" href="/profile">
            <Settings className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Profile Settings</span>
          </LoadingButton>
        </div>
      </nav>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              {/* Mobile Menu Button */}
              <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="p-2 sm:px-3">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline text-sm">Back to Dashboard</span>
                  </Button>
                </Link>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Calendar View</h1>
                  <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                    View your deadlines in calendar format
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* Notification System */}
              <NotificationSystem userId={user.id} isDemoMode={isDemoMode} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={currentProfile.avatar_url || "/placeholder.svg?height=32&width=32"}
                        alt={`${displayName}'s avatar`}
                      />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none truncate">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{currentProfile.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                      <button type="submit" className="flex items-center w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Calendar Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-auto">
          {/* Demo Mode Alert */}
          {isDemoMode && (
            <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                <strong>Demo Mode:</strong> You're viewing sample data. Changes won't be saved.
                <a href="/auth" className="underline ml-1">
                  Set up real authentication
                </a>{" "}
                to save your deadlines.
              </AlertDescription>
            </Alert>
          )}

          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="outline" onClick={goToPreviousMonth} size="sm">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{calendarData.currentMonthName}</h2>
              <Button variant="outline" onClick={goToNextMonth} size="sm">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button onClick={goToToday} className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
              Today
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">Calendar</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Click on a date to view deadlines</CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarData.calendarDays.map((day) => {
                      const dayDeadlines = getDeadlinesForDate(day)
                      const isSelected = selectedDate && isSameDay(day, selectedDate)
                      const isTodayDate = isToday(day)
                      const isCurrentMonth = isSameMonth(day, currentDate)

                      // Count deadlines by status for better visual indicators
                      const statusCounts = dayDeadlines.reduce(
                        (acc, deadline) => {
                          acc[deadline.status] = (acc[deadline.status] || 0) + 1
                          return acc
                        },
                        {} as Record<string, number>,
                      )

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            p-1 sm:p-2 min-h-[40px] sm:min-h-[60px] border rounded-lg text-left transition-colors relative
                            ${isSelected ? "bg-emerald-100 border-emerald-300" : "hover:bg-gray-50"}
                            ${isTodayDate ? "bg-blue-50 border-blue-200" : ""}
                            ${!isCurrentMonth ? "text-gray-400 bg-gray-50/50" : ""}
                          `}
                        >
                          <div className={`text-xs sm:text-sm font-medium ${isTodayDate ? "text-blue-700" : ""}`}>
                            {format(day, "d")}
                          </div>
                          {dayDeadlines.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {/* Show status indicators */}
                              <div className="flex flex-wrap gap-0.5">
                                {statusCounts.overdue > 0 && (
                                  <div
                                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-600"
                                    title={`${statusCounts.overdue} overdue`}
                                  />
                                )}
                                {statusCounts.pending > 0 && (
                                  <div
                                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500"
                                    title={`${statusCounts.pending} pending`}
                                  />
                                )}
                                {statusCounts.in_progress > 0 && (
                                  <div
                                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500"
                                    title={`${statusCounts.in_progress} in progress`}
                                  />
                                )}
                                {statusCounts.completed > 0 && (
                                  <div
                                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"
                                    title={`${statusCounts.completed} completed`}
                                  />
                                )}
                              </div>
                              {dayDeadlines.length > 4 && (
                                <div className="text-xs text-gray-500">+{dayDeadlines.length - 4}</div>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Date Details */}
            <div>
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-base">
                    {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a Date"}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {selectedDate ? (
                      <>
                        {selectedDateDeadlines.length} deadline{selectedDateDeadlines.length !== 1 ? "s" : ""} for this
                        date
                        {selectedDate && isToday(selectedDate) && " (Today)"}
                      </>
                    ) : (
                      "Click on a calendar date to view deadlines"
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {selectedDate ? (
                    <div className="space-y-3 sm:space-y-4">
                      {selectedDateDeadlines.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 sm:py-8 text-sm">No deadlines for this date</p>
                      ) : (
                        selectedDateDeadlines.map((deadline) => (
                          <div key={deadline.id} className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl bg-gradient-to-br from-white to-gray-50">
                            {/* Priority indicator bar */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${
                              deadline.priority === "high" ? "bg-red-500" : 
                              deadline.priority === "medium" ? "bg-orange-500" : "bg-green-500"
                            } rounded-l-xl`} />
                            
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-sm text-gray-900 group-hover:text-gray-800 transition-colors leading-tight">
                                  {deadline.title}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-medium ${
                                    deadline.priority === "high"
                                      ? "border-red-200 text-red-700 bg-gradient-to-r from-red-50 to-pink-50"
                                      : deadline.priority === "medium"
                                        ? "border-orange-200 text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50"
                                        : "border-green-200 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50"
                                  }`}
                                >
                                  <Star className="w-3 h-3 mr-1" />
                                  {deadline.priority}
                                </Badge>
                              </div>
                              
                              {deadline.description && (
                                <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
                                  {deadline.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between mb-3">
                                <span className="flex items-center text-gray-600 text-xs font-medium bg-gray-100 px-2 py-1 rounded-lg">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {format(deadline.dueDate, "h:mm a")}
                                </span>
                                <Badge 
                                  className={`text-xs font-semibold px-2 py-1 rounded-full shadow-sm border-0 ${
                                    deadline.status === "completed"
                                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                                      : deadline.status === "overdue"
                                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                                        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                  }`}
                                >
                                  {deadline.status === "completed" ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Completed
                                    </>
                                  ) : deadline.status === "overdue" ? (
                                    <>
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Overdue
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {deadline.status.replace("_", " ")}
                                    </>
                                  )}
                                </Badge>
                              </div>
                              
                              {/* Enhanced deadline badge */}
                              <div className="flex justify-center">
                                {getDeadlineBadge(deadline)}
                              </div>
                            </div>
                            
                            {/* Hover effect overlay */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-white/5 group-hover:via-white/10 group-hover:to-white/5 transition-all duration-300 rounded-xl pointer-events-none" />
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-gray-500 text-sm">Select a date from the calendar to view deadlines</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Legend */}
              <Card className="mt-3 sm:mt-4">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-xs sm:text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 sm:space-y-2 p-3 sm:p-6 pt-0">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-full"></div>
                    <span className="text-xs">Overdue</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs">Pending</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs">In Progress</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs">Completed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
