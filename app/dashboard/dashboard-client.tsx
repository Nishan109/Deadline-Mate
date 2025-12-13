"use client"

import type React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  Plus,
  Calendar,
  CalendarPlus,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Settings,
  LogOut,
  MoreHorizontal,
  Edit,
  Trash2,
  Info,
  RefreshCw,
  Menu,
  ExternalLink,
  Share2,
  StickyNote,
  LinkIcon,
  TrendingUp,
  Star,
} from "lucide-react"
import { signOut } from "../auth/actions"
import AddDeadlineDialog from "./add-deadline-dialog"
import EditDeadlineDialog from "./edit-deadline-dialog"
import DeleteDeadlineDialog from "./delete-deadline-dialog"
import ShareDeadlineDialog from "@/components/share-deadline-dialog"
import DeadlineDetailSheet from "@/components/deadlines/deadline-detail-sheet"
import { format, isToday, isThisWeek, isPast, isFuture } from "date-fns"
import { LoadingButton } from "@/components/loading-button"
import { NotificationSystem } from "@/components/notification-system"
import { NotificationBanner } from "@/components/notification-banner"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import Link from "next/link"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { CurrentActivitySection } from "@/components/dashboard/current-activity-section"
import { NextActivitySection } from "@/components/dashboard/next-activity-section"
import { DeadlineSearch } from "@/components/dashboard/deadline-search"
import UserSubscriptionDropdown from "@/components/user-subscription-dropdown"
import { getEffectivePlan } from "@/utils/plan-helpers"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
  project_link?: string
  created_at: string
  updated_at: string
}

interface UserProfile {
  id: string
  full_name?: string
  avatar_url?: string
  email: string
}

interface DashboardClientProps {
  user: any
  initialDeadlines: Deadline[]
  isDemoMode?: boolean
}

export default function DashboardClient({ user, initialDeadlines = [], isDemoMode = false }: DashboardClientProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>(initialDeadlines)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Deadline[] | null>(null)
  const [currentProfile, setCurrentProfile] = useState<UserProfile>({
    id: user?.id || "demo-user",
    email: user?.email || "demo@example.com",
    full_name: user?.user_metadata?.full_name || "Demo User",
    avatar_url: user?.user_metadata?.avatar_url || "",
  })
  const [userPlan, setUserPlan] = useState("free")

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (isDemoMode || !user) {
        setCurrentProfile({
          id: "demo-user",
          email: "demo@example.com",
          full_name: "Demo User",
          avatar_url: "/placeholder.svg?height=40&width=40",
        })
        return
      }

      try {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, plan, plan_expiry_date")
          .eq("id", user.id)
          .single()

        if (profile && !error) {
          console.log("[v0] Profile data fetched:", { plan: profile.plan, expiryDate: profile.plan_expiry_date })

          setCurrentProfile({
            id: user.id,
            email: user.email,
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || "",
          })
          const planStatus = await getEffectivePlan(user.id)
          console.log("[v0] Effective plan status:", planStatus)
          setUserPlan(planStatus.plan)
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isDemoMode && user) {
        const fetchProfile = async () => {
          try {
            const supabase = createClient()
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url, plan")
              .eq("id", user.id)
              .single()

            if (profile && !error) {
              setCurrentProfile({
                id: user.id,
                email: user.email,
                full_name: profile.full_name || user.user_metadata?.full_name || "",
                avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || "",
              })
              const planStatus = await getEffectivePlan(user.id)
              setUserPlan(planStatus.plan)
            }
          } catch (error) {
            console.error("Error refetching profile:", error)
          }
        }
        fetchProfile()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [user, isDemoMode])

  const refreshDeadlines = useCallback(async () => {
    if (isDemoMode || !user) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("deadlines")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true })

      if (error) {
        console.error("Error refreshing deadlines:", error)
        return
      }

      setDeadlines(data || [])
    } catch (error) {
      console.error("Error refreshing deadlines:", error)
    }
  }, [user, isDemoMode])

  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshDeadlines()
    setIsRefreshing(false)
  }, [refreshDeadlines])

  const getDeadlineBadge = (dueDate: string, status: string) => {
    const date = new Date(dueDate)

    if (status === "completed") {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
          <CheckCircle className="w-3 h-3 mr-1.5" />
          Completed
        </Badge>
      )
    }

    if (isPast(date) && status !== "completed") {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
          <AlertCircle className="w-3 h-3 mr-1.5" />
          Overdue
        </Badge>
      )
    }

    if (isToday(date)) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
          <Clock className="w-3 h-3 mr-1.5" />
          Today
        </Badge>
      )
    }

    if (isThisWeek(date)) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
          <Calendar className="w-3 h-3 mr-1.5" />
          This Week
        </Badge>
      )
    }

    return (
      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg border-0">
        <Calendar className="w-3 h-3 mr-1.5" />
        Later
      </Badge>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-orange-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  const filteredDeadlines = useMemo(() => {
    const baseDeadlines = searchResults !== null ? searchResults : deadlines

    return baseDeadlines.filter((deadline) => {
      const dueDate = new Date(deadline.due_date)

      switch (activeFilter) {
        case "upcoming":
          return deadline.status !== "completed" && isFuture(dueDate)
        case "completed":
          return deadline.status === "completed"
        case "overdue":
          return deadline.status !== "completed" && isPast(dueDate)
        default:
          return true
      }
    })
  }, [deadlines, searchResults, activeFilter])

  const stats = useMemo(() => {
    const total = deadlines.length
    const completed = deadlines.filter((d) => d.status === "completed").length
    const overdue = deadlines.filter((d) => d.status !== "completed" && isPast(new Date(d.due_date))).length
    const upcoming = deadlines.filter((d) => d.status !== "completed" && isFuture(new Date(d.due_date))).length

    return { total, completed, overdue, upcoming }
  }, [deadlines])

  const handleAddDeadline = useCallback((newDeadline: Deadline) => {
    setDeadlines((prev) => [...prev, newDeadline])
  }, [])

  const handleUpdateDeadline = useCallback((updatedDeadline: Deadline) => {
    setDeadlines((prev) => prev.map((deadline) => (deadline.id === updatedDeadline.id ? updatedDeadline : deadline)))
  }, [])

  const handleDeleteDeadline = useCallback((deadlineId: string) => {
    setDeadlines((prev) => prev.filter((deadline) => deadline.id !== deadlineId))
  }, [])

  const toggleDeadlineStatus = useCallback(
    async (id: string) => {
      const deadline = deadlines.find((d) => d.id === id)
      if (!deadline) return

      const newStatus = deadline.status === "completed" ? "pending" : "completed"

      setDeadlines((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus, updated_at: new Date().toISOString() } : d)),
      )

      if (!isDemoMode && user) {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from("deadlines")
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", id)

          if (error) {
            console.error("Error updating deadline status:", error)
            setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, status: deadline.status } : d)))
          }
        } catch (error) {
          console.error("Error updating deadline status:", error)
          setDeadlines((prev) => prev.map((d) => (d.id === id ? { ...d, status: deadline.status } : d)))
        }
      }
    },
    [deadlines, isDemoMode, user],
  )

  const handleEditClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsEditDialogOpen(true)
  }, [])

  const handleDeleteClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsDeleteDialogOpen(true)
  }, [])

  const handleShareClick = useCallback((e: React.MouseEvent, deadline: Deadline) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedDeadline(deadline)
    setIsShareDialogOpen(true)
  }, [])

  const handleDeadlineClick = useCallback((deadline: Deadline) => {
    setSelectedDeadline(deadline)
    setIsDetailSheetOpen(true)
  }, [])

  const formatICSDate = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0")
    const yyyy = date.getUTCFullYear()
    const mm = pad(date.getUTCMonth() + 1)
    const dd = pad(date.getUTCDate())
    const hh = pad(date.getUTCHours())
    const min = pad(date.getUTCMinutes())
    const ss = pad(date.getUTCSeconds())
    return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`
  }

  const openGoogleCalendarForDeadline = (d: Deadline) => {
    const start = new Date(d.due_date)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const pad = (n: number) => String(n).padStart(2, "0")
    const fmt = (dt: Date) =>
      `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`
    const dates = `${fmt(start)}/${fmt(end)}`
    const text = encodeURIComponent(d.title || "Deadline")
    const details = encodeURIComponent(d.description || "")
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dates}`
    window.open(url, "_blank")
  }

  const openOutlookForDeadline = (d: Deadline) => {
    const start = new Date(d.due_date)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    const subject = encodeURIComponent(d.title || "Deadline")
    const body = encodeURIComponent((d.description || "") + "\n\nAdded from DeadlineMate")
    const startIso = encodeURIComponent(start.toISOString())
    const endIso = encodeURIComponent(end.toISOString())
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&body=${body}&startdt=${startIso}&enddt=${endIso}&allday=false`
    window.open(url, "_blank")
  }

  const displayName = currentProfile.full_name || currentProfile.email.split("@")[0] || "User"
  const avatarFallback =
    currentProfile.full_name?.charAt(0)?.toUpperCase() || currentProfile.email?.charAt(0)?.toUpperCase() || "U"

  const SidebarContent = () => (
    <>
      <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
            <Target className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            DeadlineMate
          </span>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4">
        <div className="space-y-1 sm:space-y-2">
          <LoadingButton
            variant="ghost"
            className="w-full justify-start bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 h-10 sm:h-auto hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200"
          >
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base font-medium">Dashboard</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/calendar"
          >
            <Clock className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Calendar View</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/timetable"
          >
            <Calendar className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Time Table</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/analytics"
          >
            <TrendingUp className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Analytics</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/notes"
          >
            <StickyNote className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Notes</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/quick-links"
          >
            <LinkIcon className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Quick Links</span>
          </LoadingButton>
          <LoadingButton
            variant="ghost"
            className="w-full justify-start h-10 sm:h-auto hover:bg-gray-100 transition-all duration-200"
            href="/profile"
          >
            <Settings className="w-4 h-4 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-base">Profile Settings</span>
          </LoadingButton>
        </div>
      </nav>

      <div className="p-3 sm:p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="mb-3">
          <Badge
            className={`${
              userPlan === "pro"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Star className="w-3 h-3 mr-1" />
            {userPlan === "pro" ? "Pro Plan" : `Free (${activeDeadlines}/5)`}
          </Badge>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 mb-2 font-medium">Quick Stats</div>
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center p-2 rounded-lg bg-white shadow-sm">
            <span>Total</span>
            <span className="font-bold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-white shadow-sm">
            <span>Completed</span>
            <span className="font-bold text-emerald-600">{stats.completed}</span>
          </div>
          <div className="flex justify-between items-center p-2 rounded-lg bg-white shadow-sm">
            <span>Overdue</span>
            <span className="font-bold text-red-600">{stats.overdue}</span>
          </div>
        </div>
      </div>
    </>
  )

  const activeDeadlines = useMemo(() => {
    const count = deadlines.filter((d) => d.status !== "completed").length
    console.log("[v0] Active deadlines count:", count, "User plan:", userPlan)
    return count
  }, [deadlines, userPlan])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50 flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col">
        <SidebarContent />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
              <Button variant="ghost" size="sm" className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5" />
              </Button>

              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Dashboard</h1>
                <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                  Manage your deadlines and stay organized
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center bg-transparent p-2 sm:px-3"
              >
                {isRefreshing ? (
                  <LoadingSpinner size="sm" className="animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1 sm:ml-2 hidden sm:inline text-sm">
                  {isRefreshing ? "Refreshing..." : "Refresh"}
                </span>
              </Button>

              <NotificationSystem userId={currentProfile.id} isDemoMode={isDemoMode} />

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
                    <div className="w-full p-0">
                      <UserSubscriptionDropdown
                        userId={currentProfile.id}
                        email={currentProfile.email}
                        isDemoMode={isDemoMode}
                      />
                    </div>
                  </DropdownMenuItem>
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

        <main className="flex-1 p-3 sm:p-6 overflow-auto">
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

          <NotificationBanner deadlines={deadlines} isDemoMode={isDemoMode} />

          <div className="mb-4 sm:mb-8 text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2 sm:mb-3">
              Welcome back, {displayName}! 👋
            </h2>
            <p className="text-sm sm:text-lg text-gray-600">Here's what's happening with your deadlines today.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
            <Card className="p-3 sm:p-4 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Total Deadlines</CardTitle>
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-500">All your deadlines</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Upcoming</CardTitle>
                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.upcoming}</div>
                <p className="text-xs text-gray-500">Due in the future</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-white to-emerald-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Completed</CardTitle>
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats.completed}</div>
                <p className="text-xs text-gray-500">Successfully finished</p>
              </CardContent>
            </Card>

            <Card className="p-3 sm:p-4 bg-gradient-to-br from-white to-red-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-0">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Overdue</CardTitle>
                <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-1 sm:pt-2">
                <div className="text-2xl sm:text-3xl font-bold text-red-600">{stats.overdue}</div>
                <p className="text-xs text-gray-500">Need attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-4 sm:mb-8">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <CurrentActivitySection user={user} isDemoMode={isDemoMode} />
              <NextActivitySection user={user} isDemoMode={isDemoMode} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">Your Deadlines</h2>
              <p className="text-sm text-gray-600">Manage and track your important deadlines</p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 h-12 sm:h-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              disabled={userPlan === "free" && activeDeadlines >= 5}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="text-sm sm:text-base font-medium">
                {userPlan === "free" && activeDeadlines >= 5 ? "Limit Reached (5/5)" : "Add New Deadline"}
              </span>
            </Button>
          </div>

          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            <DeadlineSearch deadlines={deadlines} onSearch={setSearchResults} onClear={() => setSearchResults(null)} />
          </div>

          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="mb-4 sm:mb-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto h-auto bg-white shadow-sm border">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                All ({deadlines.length})
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className="text-xs sm:text-sm py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
              >
                Upcoming ({stats.upcoming})
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                className="text-xs sm:text-sm py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
              >
                Completed ({stats.completed})
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="text-xs sm:text-sm py-3 px-2 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
              >
                Overdue ({stats.overdue})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3 sm:space-y-4">
            {filteredDeadlines.length === 0 ? (
              <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">No deadlines found</h3>
                  <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8 max-w-md">
                    {activeFilter === "all"
                      ? "Ready to get organized? Add your first deadline and take control of your schedule!"
                      : `No ${activeFilter} deadlines at the moment. Great job staying on track!`}
                  </p>
                  {activeFilter === "all" && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Deadline
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              filteredDeadlines.map((deadline) => (
                <Card
                  key={deadline.id}
                  onClick={() => handleDeadlineClick(deadline)}
                  className={`group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 sm:duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 rounded-xl sm:rounded-2xl cursor-pointer active:scale-[0.98] mobile-tap-feedback ${
                    deadline.status === "completed"
                      ? "opacity-75 bg-gradient-to-br from-gray-50 to-gray-100"
                      : "bg-gradient-to-br from-white to-gray-50"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(deadline.priority).replace("border-l-", "bg-")} rounded-l-2xl`}
                  />

                  {deadline.status === "completed" && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-3 p-3 sm:pb-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleDeadlineStatus(deadline.id)
                              }}
                              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1 hover:scale-110 ${
                                deadline.status === "completed"
                                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 shadow-lg"
                                  : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 group-hover:border-emerald-400"
                              }`}
                            >
                              {deadline.status === "completed" && (
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <CardTitle
                                className={`text-base sm:text-lg font-bold leading-tight mb-2 ${
                                  deadline.status === "completed"
                                    ? "line-through text-gray-500"
                                    : "text-gray-900 group-hover:text-gray-800"
                                }`}
                              >
                                {deadline.title}
                              </CardTitle>
                            </div>
                          </div>

                          <div className="flex-shrink-0 hidden sm:block">
                            {getDeadlineBadge(deadline.due_date, deadline.status)}
                          </div>
                        </div>

                        <div className="flex-shrink-0 sm:hidden mb-2 ml-8">
                          {getDeadlineBadge(deadline.due_date, deadline.status)}
                        </div>

                        {deadline.description && (
                          <CardDescription className="ml-8 sm:ml-9 text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                            {deadline.description}
                          </CardDescription>
                        )}

                        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 ml-8 sm:ml-9 flex-wrap">
                          {deadline.category && (
                            <Badge
                              variant="outline"
                              className="text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-1.5" />
                              {deadline.category}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-xs font-medium ${
                              deadline.priority === "high"
                                ? "border-red-200 text-red-700 bg-gradient-to-r from-red-50 to-pink-50 hover:bg-red-100"
                                : deadline.priority === "medium"
                                  ? "border-orange-200 text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50 hover:bg-orange-100"
                                  : "border-green-200 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 hover:bg-green-100"
                            } transition-colors`}
                          >
                            <Star className="w-3 h-3 mr-1.5" />
                            {deadline.priority} priority
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-gray-100 transition-all duration-200 rounded-full group-hover:bg-gray-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-xl border-0 rounded-xl">
                          {userPlan === "pro" ? (
                            <DropdownMenuItem
                              onClick={(e) => handleShareClick(e, deadline)}
                              className="hover:bg-blue-50 rounded-lg"
                            >
                              <Share2 className="w-4 h-4 mr-3 text-blue-600" />
                              Share
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                alert("Sharing is a Pro feature. Upgrade to Pro to share deadlines with others!")
                              }}
                              className="hover:bg-amber-50 rounded-lg opacity-60 cursor-not-allowed"
                            >
                              <Share2 className="w-4 h-4 mr-3 text-amber-600" />
                              <span>
                                Share <Badge className="ml-2 text-xs bg-amber-500">Pro</Badge>
                              </span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openGoogleCalendarForDeadline(deadline)
                            }}
                            className="hover:bg-gray-50 rounded-lg"
                          >
                            <CalendarPlus className="w-4 h-4 mr-3 text-gray-700" />
                            Add to Google Calendar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openOutlookForDeadline(deadline)
                            }}
                            className="hover:bg-gray-50 rounded-lg"
                          >
                            <Calendar className="w-4 h-4 mr-3 text-indigo-700" />
                            Add to Outlook
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleEditClick(e, deadline)}
                            className="hover:bg-emerald-50 rounded-lg"
                          >
                            <Edit className="w-4 h-4 mr-3 text-emerald-600" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, deadline)}
                            className="text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4 mr-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="ml-8 sm:ml-9 space-y-2 sm:space-y-3">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                        <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-200">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-600" />
                          {format(new Date(deadline.due_date), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center bg-gradient-to-r from-gray-100 to-gray-200 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:from-gray-200 hover:to-gray-300 transition-all duration-200">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-600" />
                          {format(new Date(deadline.due_date), "h:mm a")}
                        </div>
                        {deadline.project_link && (
                          <a
                            href={deadline.project_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800 transition-all duration-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-1.5 sm:px-3 py-1 sm:py-2 rounded-md sm:rounded-xl text-xs sm:text-sm font-medium border border-blue-200 hover:border-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            <span className="hidden sm:inline">Project Link</span>
                            <span className="sm:hidden">Link</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:from-white/5 group-hover:via-white/10 group-hover:to-white/5 transition-all duration-500 rounded-2xl pointer-events-none" />
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      <AddDeadlineDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddDeadline}
        onRefresh={refreshDeadlines}
        userId={currentProfile.id}
        isDemoMode={isDemoMode}
        userPlan={userPlan}
        deadlineCount={activeDeadlines}
      />

      <EditDeadlineDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedDeadline(null)
        }}
        onUpdate={handleUpdateDeadline}
        onRefresh={refreshDeadlines}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />

      <DeleteDeadlineDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setSelectedDeadline(null)
        }}
        onDelete={handleDeleteDeadline}
        onRefresh={refreshDeadlines}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />

      <ShareDeadlineDialog
        key={selectedDeadline?.id || "new"}
        isOpen={isShareDialogOpen}
        onClose={() => {
          setIsShareDialogOpen(false)
          setSelectedDeadline(null)
        }}
        deadline={selectedDeadline}
        isDemoMode={isDemoMode}
      />

      <DeadlineDetailSheet
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false)
          setSelectedDeadline(null)
        }}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onShare={handleShareClick}
        onToggleStatus={toggleDeadlineStatus}
        userPlan={userPlan}
        deadline={selectedDeadline}
      />
    </div>
  )
}
