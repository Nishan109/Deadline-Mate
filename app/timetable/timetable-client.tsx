"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Calendar, Plus, Search, ChevronLeft, ChevronRight, Settings, MapPin, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AddActivityDialog } from "@/components/timetable/add-activity-dialog"
import { EditActivityDialog } from "@/components/timetable/edit-activity-dialog"
import { CurrentActivityCard } from "@/components/timetable/current-activity-card"
import { NextActivityCard } from "@/components/timetable/next-activity-card"
import { v4 as uuidv4 } from "uuid"

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface Timetable {
  id: string
  user_id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  timetable_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  created_at: string
  updated_at: string
  schedules: ActivitySchedule[]
}

interface ActivitySchedule {
  id: string
  activity_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
  recurrence_pattern: string
  specific_dates: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CurrentActivity {
  activity_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  start_time: string
  end_time: string
  day_of_week: number
}

interface NextActivity extends CurrentActivity {
  days_until: number
}

interface TimetableClientProps {
  user: User
  profile: Profile
  initialTimetables: Timetable[]
  initialActivities: Activity[]
  initialSchedules: ActivitySchedule[]
  isDemoMode: boolean
}

const DAYS_OF_WEEK = [
  { short: "Sun", full: "Sunday", value: 0 },
  { short: "Mon", full: "Monday", value: 1 },
  { short: "Tue", full: "Tuesday", value: 2 },
  { short: "Wed", full: "Wednesday", value: 3 },
  { short: "Thu", full: "Thursday", value: 4 },
  { short: "Fri", full: "Friday", value: 5 },
  { short: "Sat", full: "Saturday", value: 6 },
]

const COLOR_OPTIONS = [
  { name: "Red", value: "red", class: "bg-red-100 text-red-800 border-red-200" },
  { name: "Orange", value: "orange", class: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { name: "Green", value: "green", class: "bg-green-100 text-green-800 border-green-200" },
  { name: "Blue", value: "blue", class: "bg-blue-100 text-blue-800 border-blue-200" },
  { name: "Indigo", value: "indigo", class: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { name: "Purple", value: "purple", class: "bg-purple-100 text-purple-800 border-purple-200" },
  { name: "Pink", value: "pink", class: "bg-pink-100 text-pink-800 border-pink-200" },
  { name: "Gray", value: "gray", class: "bg-gray-100 text-gray-800 border-gray-200" },
]

const FILTER_TABS = [
  { label: "All", value: "all" },
  { label: "Work", value: "work" },
  { label: "Health", value: "health" },
  { label: "Personal", value: "personal" },
]

export function TimetableClient({
  user,
  profile,
  initialTimetables = [],
  initialActivities = [],
  initialSchedules = [],
  isDemoMode = false,
}: TimetableClientProps) {
  const [timetables, setTimetables] = useState<Timetable[]>(initialTimetables)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity | null>(null)
  const [nextActivity, setNextActivity] = useState<NextActivity | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(isDemoMode || !user?.id)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const supabase = createClient()

  const generateUUID = () => uuidv4()

  const currentTimetable = useMemo(() => {
    if (timetables.length > 0) {
      return timetables.find((t) => t.is_active) || timetables[0]
    }

    return {
      id: generateUUID(),
      user_id: user?.id || "demo-user",
      name: "My Timetable",
      description: "Default timetable",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }, [timetables, user])

  const demoActivities: Activity[] = [
    {
      id: generateUUID(),
      timetable_id: generateUUID(),
      title: "Morning Workout",
      description: "Daily exercise routine",
      category: "Health",
      location: "Home Gym",
      color: "green",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: generateUUID(),
          activity_id: generateUUID(),
          day_of_week: 1,
          start_time: "07:00",
          end_time: "08:00",
          is_recurring: true,
          recurrence_pattern: "weekly",
          specific_dates: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: generateUUID(),
      timetable_id: generateUUID(),
      title: "Team Meeting",
      description: "Weekly team sync",
      category: "Work",
      location: "Conference Room A",
      color: "blue",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      schedules: [
        {
          id: generateUUID(),
          activity_id: generateUUID(),
          day_of_week: 1,
          start_time: "10:00",
          end_time: "11:00",
          is_recurring: true,
          recurrence_pattern: "weekly",
          specific_dates: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
  ]

  useEffect(() => {
    const initializeTimetables = async () => {
      try {
        console.log("[v0] Initializing timetables with user:", user?.id, "demo mode:", isDemo)
        setError(null)

        if (initialTimetables.length > 0 || initialActivities.length > 0) {
          console.log("[v0] Using server-provided initial data")
          setTimetables(initialTimetables)
          setActivities(initialActivities)
          setIsDemo(false)
          setLoading(false)
          return
        }

        // If no initial data but user is authenticated, try to load from database
        if (user?.id && !isDemoMode) {
          console.log("[v0] Loading from database for authenticated user")
          try {
            const { data: userTimetables, error: timetablesError } = await supabase
              .from("timetables")
              .select("*")
              .eq("user_id", user.id)
              .eq("is_active", true)
              .order("created_at", { ascending: false })

            if (timetablesError && timetablesError.code !== "42P01") {
              console.error("[v0] Error fetching timetables:", timetablesError)
              throw timetablesError
            }

            if (userTimetables && userTimetables.length > 0) {
              setTimetables(userTimetables)

              // Load activities for these timetables
              const timetableIds = userTimetables.map((t) => t.id)
              const { data: userActivities, error: activitiesError } = await supabase
                .from("activities")
                .select("*")
                .in("timetable_id", timetableIds)
                .order("title", { ascending: true })

              if (!activitiesError && userActivities) {
                setActivities(userActivities)
              }

              setIsDemo(false)
              setLoading(false)
              return
            }
          } catch (dbError) {
            console.log("[v0] Database load failed, will use demo data:", dbError)
            // Fall through to demo mode
          }
        }

        // Fallback to demo mode
        console.log("[v0] Using demo mode")
        setIsDemo(true)
        setActivities(demoActivities)
        setLoading(false)
      } catch (err) {
        console.error("[v0] Initialization error:", err)
        setError(err instanceof Error ? err.message : "Failed to load timetable")
        setIsDemo(true)
        setActivities(demoActivities)
        setLoading(false)
      }
    }

    initializeTimetables()
  }, [user?.id, isDemoMode, initialTimetables, initialActivities])

  useEffect(() => {
    if (activities.length > 0) {
      console.log("[v0] Calculating current and next activities from", activities.length, "activities")
      activities.forEach((activity, index) => {
        console.log(`[v0] Activity ${index + 1}: "${activity.title}" - Schedules:`, activity.schedules?.length || 0)
        if (activity.schedules && activity.schedules.length > 0) {
          activity.schedules.forEach((schedule, sIndex) => {
            console.log(
              `  Schedule ${sIndex + 1}: Day ${schedule.day_of_week}, ${schedule.start_time}-${schedule.end_time}, Active: ${schedule.is_active}`,
            )
          })
        }
      })
      try {
        loadCurrentAndNextActivity()
      } catch (error) {
        console.error("[v0] Error calculating current/next activity:", error)
      }
    }
  }, [activities])

  useEffect(() => {
    const interval = setInterval(() => {
      if (activities.length > 0) {
        console.log("[v0] Updating current and next activities (1-minute interval)")
        loadCurrentAndNextActivity()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [activities])

  const loadActivitiesFromDatabase = async () => {
    if (!currentTimetable?.id || isDemo || !user?.id) return

    try {
      console.log("[v0] Loading activities from database for timetable:", currentTimetable.id)

      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          schedules(*)
        `)
        .eq("timetable_id", currentTimetable.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.log("[v0] Error loading activities from database:", error)
        return
      }

      console.log("[v0] Loaded activities from database:", data?.length || 0)
      const activitiesWithSchedules = (data || []).map((activity) => ({
        ...activity,
        schedules: Array.isArray(activity.schedules) ? activity.schedules : [],
      }))
      setActivities(activitiesWithSchedules)
    } catch (error) {
      console.log("[v0] Error loading activities:", error)
    }
  }

  const loadActivities = async () => {
    if (isDemo) {
      setActivities(demoActivities)
      return
    }
    await loadActivitiesFromDatabase()
  }

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await loadActivities()
    } finally {
      setIsRefreshing(false)
    }
  }

  const loadCurrentAndNextActivity = () => {
    console.log("[v0] Calculating current and next activities from", activities.length, "activities")

    const now = new Date()
    const currentTime = now.getHours() * 60 + now.getMinutes() // minutes since midnight
    const currentDayOfWeek = now.getDay()

    const todaySchedules = activities
      .filter((activity) => activity.schedules && Array.isArray(activity.schedules))
      .flatMap((activity) =>
        activity.schedules
          .filter((schedule) => schedule.day_of_week === currentDayOfWeek && schedule.is_active)
          .map((schedule) => ({
            ...schedule,
            activity,
            startMinutes:
              Number.parseInt(schedule.start_time.split(":")[0]) * 60 +
              Number.parseInt(schedule.start_time.split(":")[1]),
            endMinutes:
              Number.parseInt(schedule.end_time.split(":")[0]) * 60 + Number.parseInt(schedule.end_time.split(":")[1]),
          })),
      )
      .sort((a, b) => a.startMinutes - b.startMinutes)

    const current = todaySchedules.find(
      (schedule) => currentTime >= schedule.startMinutes && currentTime < schedule.endMinutes,
    )

    if (current) {
      console.log("[v0] Found current activity:", current.activity.title)
      setCurrentActivity({
        activity_id: current.activity.id,
        title: current.activity.title,
        description: current.activity.description,
        category: current.activity.category,
        color: current.activity.color,
        location: current.activity.location,
        start_time: current.start_time,
        end_time: current.end_time,
        day_of_week: current.day_of_week,
      })
    } else {
      console.log("[v0] No current activity found")
      setCurrentActivity(null)
    }

    let nextActivityFound = null

    const upcomingToday = todaySchedules.filter((schedule) => schedule.startMinutes > currentTime)
    if (upcomingToday.length > 0) {
      const next = upcomingToday[0]
      console.log("[v0] Found next activity today:", next.activity.title)
      nextActivityFound = {
        activity_id: next.activity.id,
        title: next.activity.title,
        description: next.activity.description,
        category: next.activity.category,
        color: next.activity.color,
        location: next.activity.location,
        start_time: next.start_time,
        end_time: next.end_time,
        day_of_week: next.day_of_week,
        days_until: 0,
      }
    } else {
      for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
        const checkDay = (currentDayOfWeek + daysAhead) % 7
        const daySchedules = activities
          .filter((activity) => activity.schedules && Array.isArray(activity.schedules))
          .flatMap((activity) =>
            activity.schedules
              .filter((schedule) => schedule.day_of_week === checkDay && schedule.is_active)
              .map((schedule) => ({
                ...schedule,
                activity,
                startMinutes:
                  Number.parseInt(schedule.start_time.split(":")[0]) * 60 +
                  Number.parseInt(schedule.start_time.split(":")[1]),
              })),
          )
          .sort((a, b) => a.startMinutes - b.startMinutes)

        if (daySchedules.length > 0) {
          const next = daySchedules[0]
          console.log("[v0] Found next activity in", daysAhead, "days:", next.activity.title)
          nextActivityFound = {
            activity_id: next.activity.id,
            title: next.activity.title,
            description: next.activity.description,
            category: next.activity.category,
            color: next.activity.color,
            location: next.activity.location,
            start_time: next.start_time,
            end_time: next.end_time,
            day_of_week: next.day_of_week,
            days_until: daysAhead,
          }
          break
        }
      }
    }

    if (nextActivityFound) {
      console.log("[v0] Setting next activity:", nextActivityFound.title)
    } else {
      console.log("[v0] No next activity found")
    }

    setNextActivity(nextActivityFound)
  }

  const filteredActivities = useMemo(() => {
    console.log("[v0] Filtering activities for day:", selectedDay, "Total activities:", activities.length)

    const filtered = activities.filter((activity) => {
      if (!activity.schedules || !Array.isArray(activity.schedules)) {
        console.log(`[v0] Activity "${activity.title}" has no schedules array`)
        return false
      }

      const hasScheduleForDay = activity.schedules.some(
        (schedule) => schedule.day_of_week === selectedDay && schedule.is_active !== false,
      )

      if (!hasScheduleForDay) {
        console.log(`[v0] Activity "${activity.title}" has no schedule for day ${selectedDay}`)
        return false
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = activity.title.toLowerCase().includes(query)
        const matchesDescription = activity.description?.toLowerCase().includes(query)
        const matchesCategory = activity.category?.toLowerCase().includes(query)
        const matchesLocation = activity.location?.toLowerCase().includes(query)

        if (!matchesTitle && !matchesDescription && !matchesCategory && !matchesLocation) {
          return false
        }
      }

      if (activeFilter !== "all" && activity.category?.toLowerCase() !== activeFilter.toLowerCase()) {
        return false
      }

      return true
    })

    console.log("[v0] Filtered activities count:", filtered.length)
    return filtered
  }, [activities, selectedDay, searchQuery, activeFilter])

  const categories = useMemo(() => {
    const cats = activities
      .map((a) => a.category)
      .filter(Boolean)
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
    return cats as string[]
  }, [activities])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getColorClass = (color: string) => {
    return COLOR_OPTIONS.find((c) => c.value === color)?.class || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getAccentBorder = (color: string) => {
    switch (color) {
      case "red":
        return "border-l-4 border-red-400"
      case "orange":
        return "border-l-4 border-orange-400"
      case "yellow":
        return "border-l-4 border-yellow-400"
      case "green":
        return "border-l-4 border-green-400"
      case "blue":
        return "border-l-4 border-blue-400"
      case "indigo":
        return "border-l-4 border-indigo-400"
      case "purple":
        return "border-l-4 border-purple-400"
      case "pink":
        return "border-l-4 border-pink-400"
      case "gray":
        return "border-l-4 border-gray-300"
      default:
        return "border-l-4 border-gray-200"
    }
  }

  const computedTabs = useMemo(() => {
    const counts = new Map<string, number>()
    activities.forEach((a) => {
      const key = (a.category || "uncategorized").toLowerCase()
      counts.set(key, (counts.get(key) || 0) + 1)
    })
    const tabs: { label: string; value: string; count: number }[] = []

    const totalForDay = activities.filter(
      (a) =>
        a.schedules &&
        Array.isArray(a.schedules) &&
        a.schedules.some((s) => s.day_of_week === selectedDay && s.is_active !== false),
    ).length

    tabs.push({ label: "All", value: "all", count: totalForDay })
    counts.forEach((count, key) => {
      const label = key === "uncategorized" ? "Uncategorized" : key.charAt(0).toUpperCase() + key.slice(1)
      tabs.push({
        label,
        value: key,
        count: activities.filter(
          (a) =>
            (a.category || "uncategorized").toLowerCase() === key.toLowerCase() &&
            a.schedules &&
            Array.isArray(a.schedules) &&
            a.schedules.some((s) => s.day_of_week === selectedDay && s.is_active !== false),
        ).length,
      })
    })

    console.log("[v0] Computed tabs:", tabs)
    return tabs
  }, [activities, selectedDay])

  const handlePrevDay = () => setSelectedDay((d) => (d - 1 + 7) % 7)
  const handleNextDay = () => setSelectedDay((d) => (d + 1) % 7)
  const jumpToToday = () => setSelectedDay(new Date().getDay())

  const isToday = (value: number) => value === new Date().getDay()
  const formatSelectedDayDate = () => {
    const now = new Date()
    const diff = (selectedDay + 7 - now.getDay()) % 7
    const date = new Date(now)
    date.setDate(now.getDate() + diff)
    return date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your timetable...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  if (error && !isDemo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Timetable</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with gradient background */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Time Table
                </h1>
                <p className="text-sm text-gray-600 mt-1">Organize your day with precision and clarity</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-72 bg-white/70 backdrop-blur-sm border-gray-200/50 focus:bg-white transition-all duration-200"
                  aria-label="Search activities"
                />
              </div>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-white/70 backdrop-blur-sm border-gray-200/50"
                aria-label="Refresh activities"
              >
                <RotateCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing" : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Enhanced day navigation toolbar */}
          <div className="py-4 border-t border-gray-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/50 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevDay}
                    className="hover:bg-gray-100/70"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="px-4 py-2">
                    <span className="text-sm font-semibold text-gray-900">{formatSelectedDayDate()}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextDay}
                    className="hover:bg-gray-100/70"
                    aria-label="Next day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={jumpToToday}
                  className="bg-white/70 backdrop-blur-sm border-gray-200/50 hover:bg-white"
                >
                  Today
                </Button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200/30">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
        {/* Enhanced Sidebar */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Day Navigation Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                Week Overview
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 lg:grid-cols-1 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setSelectedDay(day.value)}
                    className={`relative p-2 sm:p-3 text-xs sm:text-sm rounded-lg sm:rounded-xl transition-all duration-200 border ${
                      selectedDay === day.value
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg transform scale-105"
                        : "bg-white/50 text-gray-700 hover:bg-white hover:shadow-md border-gray-200/50"
                    }`}
                    aria-pressed={selectedDay === day.value}
                    aria-label={`Select ${day.full}`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between lg:justify-start">
                      <span className="lg:hidden font-medium">{day.short}</span>
                      <span className="hidden lg:inline font-medium">{day.full}</span>
                      {isToday(day.value) && (
                        <span
                          className={`mt-1 sm:mt-0 sm:ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            selectedDay === day.value ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          Today
                        </span>
                      )}
                    </div>
                    {selectedDay === day.value && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-600/20 animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Activity Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                Current Activity
              </h3>
              <CurrentActivityCard activity={currentActivity} formatTime={formatTime} getColorClass={getColorClass} />
            </CardContent>
          </Card>

          {/* Next Activity Card */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                Up Next
              </h3>
              <NextActivityCard activity={nextActivity} formatTime={formatTime} getColorClass={getColorClass} />
            </CardContent>
          </Card>

          {/* Quick Add Button */}
          <div className="hidden lg:block">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 py-3"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Activity
            </Button>
          </div>
        </div>

        {/* Enhanced Main Content */}
        <div className="flex-1 space-y-6">
          {/* Enhanced Category Filter */}
          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Filter Activities</h3>
                {(searchQuery || activeFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setActiveFilter("all")
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {computedTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border transition-all duration-200 whitespace-nowrap ${
                      activeFilter === tab.value
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-300 shadow-lg transform scale-105"
                        : "bg-white/50 text-gray-700 border-gray-200/50 hover:bg-white hover:shadow-md"
                    }`}
                    aria-pressed={activeFilter === tab.value}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        activeFilter === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Activities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredActivities.map((activity) => (
              <Card
                key={activity.id}
                className={`group bg-white/70 backdrop-blur-sm border-gray-200/50 hover:shadow-xl hover:bg-white transition-all duration-300 transform hover:-translate-y-1 ${getAccentBorder(activity.color)}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-emerald-700 transition-colors">
                        {activity.title}
                      </h3>
                      {activity.category && (
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getColorClass(activity.color)}`}
                        >
                          {activity.category}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingActivity(activity)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 hover:bg-gray-100"
                      aria-label={`Edit ${activity.title}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {activity.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{activity.description}</p>
                  )}

                  {activity.location && (
                    <div className="flex items-center text-sm text-gray-500 mb-4 bg-gray-50/50 rounded-lg p-2">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{activity.location}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Schedule</h4>
                    {activity.schedules
                      .filter((schedule) => schedule.day_of_week === selectedDay && schedule.is_active)
                      .slice(0, 3)
                      .map((schedule, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-lg border border-gray-100/50"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                activity.color === "green"
                                  ? "bg-green-400"
                                  : activity.color === "blue"
                                    ? "bg-blue-400"
                                    : activity.color === "purple"
                                      ? "bg-purple-400"
                                      : activity.color === "red"
                                        ? "bg-red-400"
                                        : activity.color === "yellow"
                                          ? "bg-yellow-400"
                                          : activity.color === "orange"
                                            ? "bg-orange-400"
                                            : activity.color === "pink"
                                              ? "bg-pink-400"
                                              : activity.color === "indigo"
                                                ? "bg-indigo-400"
                                                : "bg-gray-400"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-700">
                              {DAYS_OF_WEEK.find((d) => d.value === schedule.day_of_week)?.short}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                          </span>
                        </div>
                      ))}

                    {activity.schedules.filter((s) => s.day_of_week === selectedDay && s.is_active).length === 0 && (
                      <div className="text-center py-4 text-gray-500 text-sm">
                        No schedule for {DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.full}
                      </div>
                    )}

                    {activity.schedules.filter((s) => s.day_of_week === selectedDay && s.is_active).length > 3 && (
                      <div className="text-center text-xs text-gray-500">
                        +{activity.schedules.filter((s) => s.day_of_week === selectedDay && s.is_active).length - 3}{" "}
                        more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredActivities.length === 0 && (
            <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery || activeFilter !== "all"
                    ? "Try adjusting your search or filter criteria to find activities."
                    : `No activities scheduled for ${DAYS_OF_WEEK.find((d) => d.value === selectedDay)?.full}. Start by adding your first activity.`}
                </p>
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating action button on mobile for quicker access */}
      <Button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-5 right-5 sm:hidden rounded-full h-12 w-12 p-0 shadow-lg bg-emerald-600 hover:bg-emerald-700"
        aria-label="Add activity"
      >
        <Plus className="w-5 h-5" />
      </Button>

      <AddActivityDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        timetableId={currentTimetable?.id}
        onActivityAdded={loadActivities}
      />

      {editingActivity && (
        <EditActivityDialog
          isOpen={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          activity={editingActivity}
          onActivityUpdated={loadActivities}
        />
      )}
    </div>
  )
}

export default TimetableClient
