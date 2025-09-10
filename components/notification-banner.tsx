"use client"

import { useState, useEffect } from "react"
import { X, Calendar, AlertTriangle, Clock, Bell } from "lucide-react"
import { AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface Deadline {
  id: string
  title: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed"
  category?: string
}

interface NotificationBannerProps {
  deadlines: Deadline[]
  isDemoMode?: boolean
}

export function NotificationBanner({ deadlines = [], isDemoMode = false }: NotificationBannerProps) {
  const [dismissedToday, setDismissedToday] = useState<Set<string>>(new Set())

  // Load dismissed notifications from localStorage
  useEffect(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem(`dismissed-notifications-${today}`)
    if (stored) {
      try {
        setDismissedToday(new Set(JSON.parse(stored)))
      } catch (error) {
        console.error("Error parsing dismissed notifications:", error)
      }
    }
  }, [])

  // Save dismissed notifications to localStorage
  const saveDismissed = (dismissed: Set<string>) => {
    const today = new Date().toDateString()
    localStorage.setItem(`dismissed-notifications-${today}`, JSON.stringify(Array.from(dismissed)))
  }

  // Dismiss notification
  const dismissNotification = (deadlineId: string) => {
    const newDismissed = new Set(dismissedToday)
    newDismissed.add(deadlineId)
    setDismissedToday(newDismissed)
    saveDismissed(newDismissed)
  }

  // Filter deadlines to show notifications for
  const getNotificationDeadlines = () => {
    if (!Array.isArray(deadlines)) return []

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return deadlines
      .filter((deadline) => {
        if (deadline.status === "completed") return false
        if (dismissedToday.has(deadline.id)) return false

        const dueDate = new Date(deadline.due_date)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

        // Show notifications for:
        // 1. Overdue deadlines
        // 2. Due today
        // 3. Due tomorrow (any priority)
        return (
          dueDateOnly < today || // Overdue
          dueDateOnly.getTime() === today.getTime() || // Due today
          dueDateOnly.getTime() === tomorrow.getTime() // Due tomorrow
        )
      })
      .sort((a, b) => {
        // Sort by due date, then by priority
        const dateA = new Date(a.due_date)
        const dateB = new Date(b.due_date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
  }

  const notificationDeadlines = getNotificationDeadlines()

  if (notificationDeadlines.length === 0) {
    return null
  }

  const getNotificationVariant = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    if (dueDateOnly < today) return "destructive" // Overdue
    if (dueDateOnly.getTime() === today.getTime()) return "default" // Due today
    return "default" // Due tomorrow
  }

  const getNotificationStyles = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    if (dueDateOnly < today) {
      return {
        containerClass:
          "bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300",
        iconClass: "text-red-600 bg-red-100 p-2 rounded-full",
        badgeClass: "bg-red-500 text-white",
        badgeText: "OVERDUE",
      }
    }
    if (dueDateOnly.getTime() === today.getTime()) {
      return {
        containerClass:
          "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300",
        iconClass: "text-orange-600 bg-orange-100 p-2 rounded-full",
        badgeClass: "bg-orange-500 text-white",
        badgeText: "DUE TODAY",
      }
    }
    return {
      containerClass:
        "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300",
      iconClass: "text-blue-600 bg-blue-100 p-2 rounded-full",
      badgeClass: "bg-blue-500 text-white",
      badgeText: "DUE TOMORROW",
    }
  }

  const getNotificationIcon = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    if (dueDateOnly < today) return <AlertTriangle className="h-5 w-5" />
    if (dueDateOnly.getTime() === today.getTime()) return <Calendar className="h-5 w-5" />
    return <Clock className="h-5 w-5" />
  }

  const getNotificationMessage = (deadline: Deadline) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDate = new Date(deadline.due_date)
    const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

    const timeString = dueDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

    if (dueDateOnly < today) {
      const daysOverdue = Math.floor((today.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24))
      return `"${deadline.title}" was due ${daysOverdue === 1 ? "yesterday" : `${daysOverdue} days ago`}`
    }
    if (dueDateOnly.getTime() === today.getTime()) {
      return `"${deadline.title}" is due today at ${timeString}`
    }
    return `"${deadline.title}" is due tomorrow at ${timeString}`
  }

  return (
    <div className="space-y-3 mb-6">
      {notificationDeadlines.slice(0, 3).map((deadline) => {
        const styles = getNotificationStyles(deadline)
        return (
          <div
            key={deadline.id}
            className={`relative rounded-xl border-l-4 p-4 ${styles.containerClass} animate-in slide-in-from-top-2 duration-300`}
          >
            <div className="flex items-start space-x-4">
              <div className={styles.iconClass}>{getNotificationIcon(deadline)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge className={`${styles.badgeClass} text-xs font-semibold px-2 py-1`}>{styles.badgeText}</Badge>
                  {deadline.category && (
                    <Badge variant="outline" className="text-xs">
                      {deadline.category}
                    </Badge>
                  )}
                </div>

                <AlertDescription className="text-sm font-medium text-gray-800 leading-relaxed">
                  {getNotificationMessage(deadline)}
                </AlertDescription>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(deadline.id)}
                className="h-8 w-8 p-0 rounded-full hover:bg-white/50 transition-all duration-200 hover:scale-110"
              >
                <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
              </Button>
            </div>
          </div>
        )
      })}

      {notificationDeadlines.length > 3 && (
        <div className="relative rounded-xl border p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="text-gray-600 bg-gray-100 p-2 rounded-full">
              <Bell className="h-4 w-4" />
            </div>
            <AlertDescription className="text-sm font-medium text-gray-700">
              <span className="font-semibold text-gray-900">
                {notificationDeadlines.length - 3} more deadline{notificationDeadlines.length - 3 !== 1 ? "s" : ""}
              </span>{" "}
              need your attention
            </AlertDescription>
          </div>
        </div>
      )}
    </div>
  )
}
