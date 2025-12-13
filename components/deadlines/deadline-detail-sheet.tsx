"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  ExternalLink,
  Edit,
  Trash2,
  Share2,
  MoreHorizontal,
} from "lucide-react"
import { format } from "date-fns"
import { isPast, isToday, isThisWeek } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
  userPlan?: string
}

export default function DeadlineDetailSheet({
  isOpen,
  onClose,
  deadline,
  onEdit,
  onDelete,
  onShare,
  onToggleStatus,
  userPlan = "free",
}: DeadlineDetailSheetProps) {
  if (!deadline) return null

  const getDeadlineBadge = (dueDate: string, status: string) => {
    const date = new Date(dueDate)

    if (status === "completed") {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg border-0 whitespace-nowrap">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span>Completed</span>
        </Badge>
      )
    }

    if (isPast(date) && status !== "completed") {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg border-0 whitespace-nowrap">
          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span>Overdue</span>
        </Badge>
      )
    }

    if (isToday(date)) {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg border-0 whitespace-nowrap">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span>Today</span>
        </Badge>
      )
    }

    if (isThisWeek(date)) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg border-0 whitespace-nowrap">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span>This Week</span>
        </Badge>
      )
    }

    return (
      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs sm:text-sm font-semibold px-2 sm:px-4 py-1 sm:py-2 rounded-full shadow-lg border-0 whitespace-nowrap">
        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
        <span>Later</span>
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
    if (userPlan === "free") {
      alert("Sharing is a Pro feature. Upgrade to Pro to share deadlines with others!")
      return
    }
    if (onShare) {
      onShare(deadline)
    }
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto px-3 sm:px-6 py-6">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold text-gray-900">Deadline Details</SheetTitle>
            <div className="flex items-center">
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
                  {userPlan === "pro" ? (
                    <DropdownMenuItem onClick={handleShare} className="hover:bg-blue-50 rounded-lg">
                      <Share2 className="w-4 h-4 mr-3 text-blue-600" />
                      Share
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleShare} className="hover:bg-amber-50 rounded-lg opacity-60">
                      <Share2 className="w-4 h-4 mr-3 text-amber-600" />
                      <span>
                        Share <Badge className="ml-2 text-xs bg-amber-500">Pro</Badge>
                      </span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 mr-3" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Main Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            {/* Priority indicator bar */}
            <div
              className={`absolute top-0 left-0 w-1 h-full ${
                deadline.priority === "high"
                  ? "bg-red-500"
                  : deadline.priority === "medium"
                    ? "bg-orange-500"
                    : "bg-green-500"
              } rounded-l-2xl`}
            />

            <CardHeader className="p-6 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  <button
                    onClick={handleToggleStatus}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 hover:scale-110 ${
                      deadline.status === "completed"
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500 shadow-lg"
                        : "border-gray-300 hover:border-emerald-500 hover:bg-emerald-50"
                    }`}
                  >
                    {deadline.status === "completed" && <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                  </button>
                  <div className="min-w-0 overflow-hidden">
                    <CardTitle
                      className={`text-lg sm:text-2xl font-bold leading-tight truncate ${
                        deadline.status === "completed" ? "line-through text-gray-500" : "text-gray-900"
                      }`}
                    >
                      {deadline.title}
                    </CardTitle>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex-shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                  {getDeadlineBadge(deadline.due_date, deadline.status)}
                </div>
              </div>

              {/* Category and Priority badges */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 mt-2 sm:mt-3">
                {deadline.category && (
                  <Badge
                    variant="outline"
                    className="text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 py-1 sm:py-1.5 max-w-full overflow-hidden"
                  >
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span className="truncate">{deadline.category}</span>
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs sm:text-sm font-medium ${getPriorityColor(deadline.priority)} py-1 sm:py-1.5`}
                >
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>{deadline.priority} priority</span>
                </Badge>
              </div>

              {/* Due Date Section */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-3 sm:p-6 border-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="font-bold text-gray-900 text-sm sm:text-lg truncate">
                      {format(new Date(deadline.due_date), "EEEE, MMMM dd, yyyy")}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
                      <span>{format(new Date(deadline.due_date), "h:mm a")}</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
              {/* Description */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-lg flex items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                  <span>Description</span>
                </h3>
                <div className="bg-gray-50 rounded-xl p-2.5 sm:p-4 border-0">
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-base break-words">
                    {deadline.description || "No description available."}
                  </p>
                </div>
              </div>

              {/* Project Link */}
              {deadline.project_link && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-lg flex items-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-2 sm:mr-3 flex-shrink-0" />
                    <span>Project Resources</span>
                  </h3>
                  <a
                    href={deadline.project_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs sm:text-base break-all bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 px-2.5 py-1.5 sm:px-4 sm:py-3 rounded-xl border border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium max-w-full overflow-hidden"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-5 sm:h-5 mr-1.5 sm:mr-3 flex-shrink-0" />
                    <span className="truncate">View Project</span>
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
