"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, CheckCircle, LinkIcon, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
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

interface AddDeadlineDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (deadline: Deadline) => void
  onRefresh: () => Promise<void>
  userId: string
  isDemoMode?: boolean
  userPlan?: string
  deadlineCount?: number
}

export default function AddDeadlineDialog({
  isOpen,
  onClose,
  onAdd,
  onRefresh,
  userId,
  isDemoMode = false,
  userPlan = "free",
  deadlineCount = 0,
}: AddDeadlineDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [userPlanData, setUserPlanData] = useState(userPlan)
  const [deadlineCountData, setDeadlineCountData] = useState(deadlineCount)
  const FREE_TIER_LIMIT = 5
  const canAddDeadline = userPlanData === "pro" || deadlineCountData < FREE_TIER_LIMIT

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    due_time: "",
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    project_link: "",
  })

  useEffect(() => {
    if (isOpen && !isDemoMode) {
      const fetchUserData = async () => {
        try {
          const planStatus = await getEffectivePlan(userId)
          setUserPlanData(planStatus.plan)

          const supabase = createClient()
          const { data: deadlines } = await supabase
            .from("deadlines")
            .select("id")
            .eq("user_id", userId)
            .neq("status", "completed")

          setDeadlineCountData(deadlines?.length || 0)
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      }

      fetchUserData()
    }
  }, [isOpen, userId, isDemoMode])

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      due_date: "",
      due_time: "",
      priority: "medium",
      category: "",
      project_link: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!canAddDeadline) {
      alert("You've reached the 5 deadline limit on the Free plan. Upgrade to Pro for unlimited deadlines!")
      return
    }

    setIsLoading(true)

    try {
      const dueDateTime = new Date(`${formData.due_date}T${formData.due_time || "23:59"}`)

      if (isDemoMode) {
        const newDeadline: Deadline = {
          id: `demo-${Date.now()}`,
          title: formData.title,
          description: formData.description || undefined,
          due_date: dueDateTime.toISOString(),
          priority: formData.priority,
          status: "pending",
          category: formData.category || undefined,
          project_link: formData.project_link || undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        onAdd(newDeadline)
        setShowSuccess(true)
        resetForm()

        setTimeout(async () => {
          setIsRefreshing(true)
          await onRefresh()
          setIsRefreshing(false)
          setShowSuccess(false)
          onClose()
        }, 1500)
      } else {
        const supabase = createClient()

        const { data, error } = await supabase
          .from("deadlines")
          .insert({
            title: formData.title,
            description: formData.description || null,
            due_date: dueDateTime.toISOString(),
            priority: formData.priority,
            status: "pending",
            category: formData.category || null,
            project_link: formData.project_link || null,
            user_id: userId,
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating deadline:", error)
          alert("Failed to create deadline. Please try again.")
          return
        }

        onAdd(data)
        setShowSuccess(true)
        resetForm()
        setDeadlineCountData((prev) => prev + 1)

        setTimeout(async () => {
          setIsRefreshing(true)
          await onRefresh()
          setIsRefreshing(false)
          setShowSuccess(false)
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Failed to create deadline. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    if (!isLoading && !isRefreshing) {
      setShowSuccess(false)
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => (isLoading || isRefreshing) && e.preventDefault()}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold">Add New Deadline</DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Create a new deadline to track your important tasks.
            {isDemoMode && " (Demo mode - changes won't be saved)"}
          </DialogDescription>
        </DialogHeader>

        {userPlanData === "free" && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              <strong>Free Plan:</strong> {deadlineCountData}/{FREE_TIER_LIMIT} deadlines used.{" "}
              <a href="/profile" className="underline font-semibold hover:text-amber-900">
                Upgrade to Pro
              </a>{" "}
              for unlimited deadlines.
            </AlertDescription>
          </Alert>
        )}

        {showSuccess && (
          <div className="flex items-center justify-center p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
            <span className="text-emerald-800 font-medium text-sm">
              {isRefreshing ? "Refreshing dashboard..." : "Deadline created successfully!"}
            </span>
            {isRefreshing && <LoadingSpinner size="sm" className="ml-2" />}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter deadline title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={isLoading || isRefreshing || !canAddDeadline}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Add details about this deadline"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={2}
                disabled={isLoading || isRefreshing}
                className="w-full resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_link" className="text-sm font-medium">
                Project Link
              </Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="project_link"
                  type="url"
                  className="pl-10 w-full"
                  placeholder="https://github.com/user/project"
                  value={formData.project_link}
                  onChange={(e) => handleInputChange("project_link", e.target.value)}
                  disabled={isLoading || isRefreshing}
                />
              </div>
              <p className="text-xs text-gray-500">
                Add a link to your project repository, design files, or related resources
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date" className="text-sm font-medium">
                  Due Date *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="due_date"
                    type="date"
                    className="pl-10 w-full"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                    required
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_time" className="text-sm font-medium">
                  Due Time
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="due_time"
                    type="time"
                    className="pl-10 w-full"
                    value={formData.due_time}
                    onChange={(e) => handleInputChange("due_time", e.target.value)}
                    disabled={isLoading || isRefreshing}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                  disabled={isLoading || isRefreshing}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Input
                  id="category"
                  placeholder="e.g., Work, School, Personal"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  disabled={isLoading || isRefreshing}
                  className="w-full"
                />
              </div>
            </div>
          </form>
        </div>

        <DialogFooter className="pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading || isRefreshing}
              className="w-full sm:w-auto bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
              disabled={isLoading || isRefreshing || showSuccess || !canAddDeadline}
            >
              {!canAddDeadline ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Limit Reached
                </>
              ) : isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Created!
                </>
              ) : (
                "Create Deadline"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
