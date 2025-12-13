"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Tag, Calendar, ArrowRight } from "lucide-react"

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

interface NextActivityData {
  activity_id: string
  title: string
  description: string | null
  category: string | null
  color: string
  location: string | null
  start_time: string
  end_time: string
  day_of_week: number
  days_until: number
}

interface NextActivitySectionProps {
  user: User | null
  isDemoMode?: boolean
}

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

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function NextActivitySection({ user, isDemoMode = false }: NextActivitySectionProps) {
  const [nextActivity, setNextActivity] = useState<NextActivityData | null>(null)
  const [timeUntil, setTimeUntil] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNextActivity = async () => {
      if (!user?.id || isDemoMode) {
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: activities } = await supabase
          .from("activities")
          .select(`
            *,
            schedules:activity_schedules(*)
          `)
          .order("created_at", { ascending: false })

        if (!activities) {
          setLoading(false)
          return
        }

        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()
        const currentDayOfWeek = now.getDay()

        // Check for upcoming today
        const todaySchedules = activities
          .flatMap((activity: Activity) =>
            activity.schedules
              .filter((schedule) => schedule.day_of_week === currentDayOfWeek && schedule.is_active)
              .map((schedule) => ({
                ...schedule,
                activity,
                startMinutes:
                  Number.parseInt(schedule.start_time.split(":")[0]) * 60 +
                  Number.parseInt(schedule.start_time.split(":")[1]),
              })),
          )
          .sort((a, b) => a.startMinutes - b.startMinutes)

        const upcomingToday = todaySchedules.filter((schedule) => schedule.startMinutes > currentTime)

        if (upcomingToday.length > 0) {
          const next = upcomingToday[0]
          setNextActivity({
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
          })
        } else {
          // Check upcoming days
          for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
            const checkDay = (currentDayOfWeek + daysAhead) % 7
            const daySchedules = activities
              .flatMap((activity: Activity) =>
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
              setNextActivity({
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
              })
              break
            }
          }
        }
      } catch (error) {
        console.error("Error loading next activity:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNextActivity()
  }, [user, isDemoMode])

  useEffect(() => {
    if (!nextActivity) return

    const updateTimeUntil = () => {
      const now = new Date()
      const [startHours, startMinutes] = nextActivity.start_time.split(":").map(Number)

      const startTime = new Date()
      startTime.setHours(startHours, startMinutes, 0, 0)

      if (nextActivity.days_until > 0) {
        startTime.setDate(startTime.getDate() + nextActivity.days_until)
      }

      if (nextActivity.days_until === 0 && startTime.getTime() <= now.getTime()) {
        startTime.setDate(startTime.getDate() + 1)
      }

      const diff = startTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeUntil("Starting now")
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) {
        setTimeUntil(`in ${days}d ${hours}h`)
      } else if (hours > 0) {
        setTimeUntil(`in ${hours}h ${minutes}m`)
      } else {
        setTimeUntil(`in ${minutes}m`)
      }
    }

    updateTimeUntil()
    const interval = setInterval(updateTimeUntil, 60000)

    return () => clearInterval(interval)
  }, [nextActivity])

  const getColorClass = (color: string) => {
    return COLOR_OPTIONS.find((c) => c.value === color)?.class || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTimeUntilText = (daysUntil: number) => {
    if (daysUntil === 0) {
      return "Later today"
    } else if (daysUntil === 1) {
      return "Tomorrow"
    } else {
      return `In ${daysUntil} days`
    }
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            Next Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!nextActivity) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <ArrowRight className="w-4 h-4 mr-2 text-gray-400" />
            Next Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No upcoming activities</p>
            <p className="text-xs text-gray-400">Your schedule is clear</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-white border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Next Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getColorClass(nextActivity.color)} text-xs`}>{nextActivity.title}</Badge>
            {nextActivity.category && (
              <Badge variant="outline" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {nextActivity.category}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>
                {formatTime(nextActivity.start_time)} - {formatTime(nextActivity.end_time)}
              </span>
            </div>

            {nextActivity.location && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="truncate">{nextActivity.location}</span>
              </div>
            )}
          </div>

          {nextActivity.description && <p className="text-xs text-gray-600 line-clamp-2">{nextActivity.description}</p>}

          <div className="mt-3 p-2.5 bg-blue-100/70 rounded-lg">
            <p className="text-xs font-medium text-blue-800">{getTimeUntilText(nextActivity.days_until)}</p>
            <p className="text-xs text-blue-700">
              {DAYS_OF_WEEK[nextActivity.day_of_week]} at {formatTime(nextActivity.start_time)} ({timeUntil})
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
