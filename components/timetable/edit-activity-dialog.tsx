"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Save, Plus, X, Trash2 } from "lucide-react"

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

interface EditActivityDialogProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
  onActivityUpdated: () => void
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

interface Schedule {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_recurring: boolean
  is_active: boolean
}

export function EditActivityDialog({ isOpen, onClose, activity, onActivityUpdated }: EditActivityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    color: "blue",
    location: "",
  })
  const [schedules, setSchedules] = useState<Schedule[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (activity) {
      setFormData({
        title: activity.title,
        description: activity.description || "",
        category: activity.category || "",
        color: activity.color,
        location: activity.location || "",
      })
      setSchedules(
        activity.schedules.map((schedule) => ({
          id: schedule.id,
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          is_recurring: schedule.is_recurring,
          is_active: schedule.is_active,
        })),
      )
    }
  }, [activity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activity) return

    setLoading(true)
    try {
      const { error: activityError } = await supabase
        .from("activities")
        .update({
          title: formData.title,
          description: formData.description || null,
          category: formData.category || null,
          color: formData.color,
          location: formData.location || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activity.id)

      if (activityError) throw activityError

      const existingScheduleIds = activity.schedules.map((s) => s.id)
      const currentScheduleIds = schedules.filter((s) => s.id).map((s) => s.id)

      const schedulesToDelete = existingScheduleIds.filter((id) => !currentScheduleIds.includes(id))
      if (schedulesToDelete.length > 0) {
        const { error: deleteError } = await supabase.from("activity_schedules").delete().in("id", schedulesToDelete)

        if (deleteError) throw deleteError
      }

      for (const schedule of schedules) {
        if (schedule.id) {
          const { error: updateError } = await supabase
            .from("activity_schedules")
            .update({
              day_of_week: schedule.day_of_week,
              start_time: schedule.start_time,
              end_time: schedule.end_time,
              is_recurring: schedule.is_recurring,
              is_active: schedule.is_active,
              updated_at: new Date().toISOString(),
            })
            .eq("id", schedule.id)

          if (updateError) throw updateError
        } else {
          const { error: insertError } = await supabase.from("activity_schedules").insert({
            activity_id: activity.id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            is_recurring: schedule.is_recurring,
            recurrence_pattern: "weekly",
            is_active: schedule.is_active,
          })

          if (insertError) throw insertError
        }
      }

      onActivityUpdated()
      onClose()
    } catch (error) {
      console.error("Error updating activity:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!activity) return

    setDeleteLoading(true)
    try {
      const { error } = await supabase.from("activities").delete().eq("id", activity.id)

      if (error) throw error

      onActivityUpdated()
      onClose()
    } catch (error) {
      console.error("Error deleting activity:", error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const addSchedule = () => {
    setSchedules([
      ...schedules,
      {
        day_of_week: 1,
        start_time: "09:00",
        end_time: "10:00",
        is_recurring: true,
        is_active: true,
      },
    ])
  }

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index))
  }

  const updateSchedule = (index: number, field: keyof Schedule, value: any) => {
    setSchedules(schedules.map((schedule, i) => (i === index ? { ...schedule, [field]: value } : schedule)))
  }

  if (!activity) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Activity</DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Update your activity details and schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm sm:text-base">
                Activity Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Math Class, Gym Workout, Team Meeting"
                required
                className="text-sm sm:text-base"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the activity"
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="category" className="text-sm sm:text-base">
                  Category
                </Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Work, Study, Exercise"
                  className="text-sm sm:text-base"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm sm:text-base">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Room 101, Gym, Online"
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">Color Theme</Label>
              <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border-2 transition-all ${
                      formData.color === color.value
                        ? `${color.class} border-current`
                        : `${color.class} border-transparent opacity-60 hover:opacity-100`
                    }`}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm sm:text-base font-medium">Schedule</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSchedule}
                className="text-xs sm:text-sm bg-transparent"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add Time Slot
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm sm:text-base">Time Slot {index + 1}</h4>
                    {schedules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-sm">Day of Week</Label>
                      <select
                        value={schedule.day_of_week}
                        onChange={(e) => updateSchedule(index, "day_of_week", Number.parseInt(e.target.value))}
                        className="w-full mt-1 px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {DAYS_OF_WEEK.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.full}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm">Start Time</Label>
                      <Input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => updateSchedule(index, "start_time", e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">End Time</Label>
                      <Input
                        type="time"
                        value={schedule.end_time}
                        onChange={(e) => updateSchedule(index, "end_time", e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`recurring-${index}`}
                        checked={!!schedule.is_recurring}
                        onCheckedChange={(checked) => updateSchedule(index, "is_recurring", Boolean(checked))}
                      />
                      <Label htmlFor={`recurring-${index}`} className="text-xs sm:text-sm">
                        Repeat weekly
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`active-${index}`}
                        checked={!!schedule.is_active}
                        onCheckedChange={(checked) => updateSchedule(index, "is_active", Boolean(checked))}
                      />
                      <Label htmlFor={`active-${index}`} className="text-xs sm:text-sm">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-between gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleteLoading}
              className="w-full sm:w-auto text-sm order-2 sm:order-1"
            >
              {deleteLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Delete Activity
                </>
              )}
            </Button>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading || deleteLoading}
                className="w-full sm:w-auto text-sm bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || deleteLoading || !formData.title.trim()}
                className="w-full sm:w-auto text-sm"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
