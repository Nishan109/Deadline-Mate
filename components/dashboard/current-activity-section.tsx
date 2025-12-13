"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import type { User } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Tag, Calendar } from "lucide-react"

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

interface CurrentActivityData {
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

interface CurrentActivitySectionProps {
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

export function CurrentActivitySection({ user, isDemoMode = false }: CurrentActivitySectionProps) {
  const [currentActivity, setCurrentActivity] = useState<CurrentActivityData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCurrentActivity = async () => {
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
                endMinutes:
                  Number.parseInt(schedule.end_time.split(":")[0]) * 60 +
                  Number.parseInt(schedule.end_time.split(":")[1]),
              })),
          )
          .sort((a, b) => a.startMinutes - b.startMinutes)

        const current = todaySchedules.find(
          (schedule) => currentTime >= schedule.startMinutes && currentTime < schedule.endMinutes,
        )

        if (current) {
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
        }
      } catch (error) {
        console.error("Error loading current activity:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCurrentActivity()
  }, [user, isDemoMode])

  useEffect(() => {
    if (!currentActivity) return

    const updateTimeRemaining = () => {
      const now = new Date()
      const [endHours, endMinutes] = currentActivity.end_time.split(":").map(Number)
      const endTime = new Date()
      endTime.setHours(endHours, endMinutes, 0, 0)

      const diff = endTime.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeRemaining("Activity ended")
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`)
      } else {
        setTimeRemaining(`${minutes}m remaining`)
      }
    }

    updateTimeRemaining()
    const interval = setInterval(updateTimeRemaining, 60000)

    return () => clearInterval(interval)
  }, [currentActivity])

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

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
            Current Activity
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

  if (!currentActivity) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            Current Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No activity in progress</p>
            <p className="text-xs text-gray-400">Enjoy your free time!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
          Current Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${getColorClass(currentActivity.color)} text-xs`}>{currentActivity.title}</Badge>
            {currentActivity.category && (
              <Badge variant="outline" className="text-xs">
                <Tag className="w-2 h-2 mr-1" />
                {currentActivity.category}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-2 flex-shrink-0" />
              <span>
                {formatTime(currentActivity.start_time)} - {formatTime(currentActivity.end_time)}
              </span>
            </div>

            {currentActivity.location && (
              <div className="flex items-center">
                <MapPin className="w-3 h-3 mr-2 flex-shrink-0" />
                <span className="truncate">{currentActivity.location}</span>
              </div>
            )}
          </div>

          {currentActivity.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{currentActivity.description}</p>
          )}

          <div className="mt-3 p-2.5 bg-emerald-100/70 rounded-lg">
            <p className="text-xs font-medium text-emerald-800">In Progress</p>
            <p className="text-xs text-emerald-700">{timeRemaining}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
