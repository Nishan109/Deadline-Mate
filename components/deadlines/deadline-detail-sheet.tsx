"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ExternalLink,
  X,
  Edit,
  Trash2,
  Share2,
  MoreHorizontal,
} from "lucide-react"
import { format } from "date-fns"
import { isPast, isToday, isThisWeek } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "high" | "medium" | "low"
  status: "pending" | "in_progress" | "completed"
  category?: string
  project_link?: string
}

interface DeadlineDetailSheetProps {
  isOpen: boolean
  onClose: () => void
  deadline: Deadline | null
  onEdit?: (deadline: Deadline) => void
  onDelete?: (deadline: Deadline) => void
  onShare?: (deadline: Deadline) => void
  onToggleStatus?: (deadlineId: string) => void
}

export default function DeadlineDetailSheet({
  isOpen,
  onClose,
  deadline,
  onEdit,
  onDelete,
  onShare,
  onToggleStatus,
}: DeadlineDetailSheetProps) {
  if (!deadline) return null

  const getDeadlineBadge = (dueDate: string, status: string) => {
    const date = new Date(dueDate)

    if (status === "completed") {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0">
          <CheckCircle className="w-4 h-4 mr-2" />
          Completed
        </Badge>
      )
    }

    if (isPast(date) && status !== "completed") {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0">
          <AlertCircle className="w-4 h-4 mr-2" />
          Overdue
        </Badge>
      )
    }

    if (isToday(date)) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0">
          <Clock className="w-4 h-4 mr-2" />
          Today
        </Badge>
      )
    }

    if (isThisWeek(date)) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0">
          <Calendar className="w-4 h-4 mr-2" />
          This Week
        </Badge>
      )
    }

    return (
      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg border-0">
        <Calendar className="w-4 h-4 mr-2" />
        Later
      </Badge>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 text-red-700 bg-gradient-to-r from-red-50 to-pink-50"
      case "medium":
        return "border-orange-200 text-orange-700 bg-gradient-to-r from-orange-50 to-amber-50"
      case "low":
        return "border-green-200 text-green-700 bg-gradient-to-r from-green-50 to-emerald-50"
      default:
        return "border-gray-200 text-gray-700 bg-gray-50"
    }
  }

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(deadline.id)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(deadline)
    }
    onClose()
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(deadline)
    }
    onClose()
  }

  const handleShare = () => {
    if (onShare) {
      onShare(deadline)
    }
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-gray-900">
              Deadline Details
            </SheetTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="shadow-xl border-0 rounded-xl">
                  <DropdownMenuItem onClick={handleEdit} className="hover:bg-emerald-50 rounded-lg">
                    <Edit className="w-4 h-4 mr-3 text-emerald-600" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="hover:bg-blue-50 rounded-lg">
                    <Share2 className="w-4 h-4 mr-3 text-blue-600" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Main Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            {/* Priority indicator bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${
              deadline.priority === "high" ? "bg-red-500" : 
              deadline.priority === "medium" ? "bg-orange-500" : "bg-green-500"
            } rounded-l-2xl`} />
            
            <CardHeader className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <button
                    onClick={handleToggleStatus}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1 hover:scale-110 ${
                      deadline.status === "completed"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 shadow-lg"
                        : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
                    }`}
                  >
                    {deadline.status === "completed" && (
                      <CheckCircle className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <CardTitle className={`text-2xl font-bold leading-tight mb-3 ${
                      deadline.status === "completed" 
                        ? "line-through text-gray-500" 
                        : "text-gray-900"
                    }`}>
                      {deadline.title}
                    </CardTitle>
                  </div>
                </div>
                
                {/* Status badge */}
                <div className="flex-shrink-0">
                  {getDeadlineBadge(deadline.due_date, deadline.status)}
                </div>
              </div>

              {/* Category and Priority badges */}
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                {deadline.category && (
                  <Badge 
                    variant="outline" 
                    className="text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700"
                  >
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                    {deadline.category}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-sm font-medium ${getPriorityColor(deadline.priority)}`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {deadline.priority} priority
                </Badge>
              </div>

              {/* Due Date Section */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">
                      {format(new Date(deadline.due_date), "EEEE, MMMM dd, yyyy")}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {format(new Date(deadline.due_date), "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 pt-0 space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                  Description
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border-0">
                  <p className="text-gray-700 leading-relaxed text-base">
                    {deadline.description || "No description available."}
                  </p>
                </div>
              </div>

              {/* Project Link */}
              {deadline.project_link && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                    Project Resources
                  </h3>
                  <a
                    href={deadline.project_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-base break-all bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-4 py-3 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium"
                  >
                    <ExternalLink className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span>View Project</span>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  )
}
