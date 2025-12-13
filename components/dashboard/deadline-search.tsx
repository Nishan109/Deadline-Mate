"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Deadline {
  id: string
  title: string
  description?: string
  due_date: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in_progress" | "completed" | "overdue"
  category?: string
}

interface DeadlineSearchProps {
  deadlines: Deadline[]
  onSearch: (results: Deadline[]) => void
  onClear: () => void
}

export function DeadlineSearch({ deadlines, onSearch, onClear }: DeadlineSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const categories = useMemo(() => Array.from(new Set(deadlines.map((d) => d.category).filter(Boolean))), [deadlines])

  const searchResults = useMemo(() => {
    let results = deadlines

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(
        (d) => d.title.toLowerCase().includes(query) || (d.description && d.description.toLowerCase().includes(query)),
      )
    }

    if (filterPriority) {
      results = results.filter((d) => d.priority === filterPriority)
    }

    if (filterStatus) {
      results = results.filter((d) => d.status === filterStatus)
    }

    if (filterCategory) {
      results = results.filter((d) => d.category === filterCategory)
    }

    return results
  }, [deadlines, searchQuery, filterPriority, filterStatus, filterCategory])

  useEffect(() => {
    const hasActiveSearch = searchQuery.trim() || filterPriority || filterStatus || filterCategory
    if (hasActiveSearch) {
      onSearch(searchResults)
    }
  }, [searchResults, onSearch, searchQuery, filterPriority, filterStatus, filterCategory])

  const handleClearSearch = useCallback(() => {
    setSearchQuery("")
    setFilterPriority(null)
    setFilterStatus(null)
    setFilterCategory(null)
    onClear()
  }, [onClear])

  const activeFilterCount = [filterPriority, filterStatus, filterCategory].filter(Boolean).length
  const hasActiveSearch = searchQuery.trim() || activeFilterCount > 0

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white border-gray-200 shadow-sm hover:border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
        {/* Priority Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 ${
                filterPriority ? "bg-blue-50 border-blue-200 text-blue-700" : ""
              }`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Priority
              {filterPriority && <Badge className="ml-1.5 bg-blue-600">{filterPriority}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="shadow-xl border-0 rounded-xl">
            <DropdownMenuLabel className="text-xs sm:text-sm">Filter by Priority</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setFilterPriority(null)}
              className="text-xs sm:text-sm hover:bg-gray-50 rounded-lg"
            >
              All Priorities
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("high")}
              className={`text-xs sm:text-sm hover:bg-red-50 rounded-lg ${filterPriority === "high" ? "bg-red-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 mr-2" />
              High Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("medium")}
              className={`text-xs sm:text-sm hover:bg-orange-50 rounded-lg ${filterPriority === "medium" ? "bg-orange-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-500 mr-2" />
              Medium Priority
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterPriority("low")}
              className={`text-xs sm:text-sm hover:bg-green-50 rounded-lg ${filterPriority === "low" ? "bg-green-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500 mr-2" />
              Low Priority
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 ${
                filterStatus ? "bg-orange-50 border-orange-200 text-orange-700" : ""
              }`}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              Status
              {filterStatus && <Badge className="ml-1.5 bg-orange-600">{filterStatus.replace("_", " ")}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="shadow-xl border-0 rounded-xl">
            <DropdownMenuLabel className="text-xs sm:text-sm">Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setFilterStatus(null)}
              className="text-xs sm:text-sm hover:bg-gray-50 rounded-lg"
            >
              All Statuses
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("pending")}
              className={`text-xs sm:text-sm hover:bg-yellow-50 rounded-lg ${filterStatus === "pending" ? "bg-yellow-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500 mr-2" />
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("in_progress")}
              className={`text-xs sm:text-sm hover:bg-blue-50 rounded-lg ${filterStatus === "in_progress" ? "bg-blue-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 mr-2" />
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("completed")}
              className={`text-xs sm:text-sm hover:bg-emerald-50 rounded-lg ${filterStatus === "completed" ? "bg-emerald-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 mr-2" />
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus("overdue")}
              className={`text-xs sm:text-sm hover:bg-red-50 rounded-lg ${filterStatus === "overdue" ? "bg-red-50" : ""}`}
            >
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-600 mr-2" />
              Overdue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Category Filter */}
        {categories.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 ${
                  filterCategory ? "bg-purple-50 border-purple-200 text-purple-700" : ""
                }`}
              >
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                Category
                {filterCategory && <Badge className="ml-1.5 bg-purple-600">{filterCategory}</Badge>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="shadow-xl border-0 rounded-xl">
              <DropdownMenuLabel className="text-xs sm:text-sm">Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setFilterCategory(null)}
                className="text-xs sm:text-sm hover:bg-gray-50 rounded-lg"
              >
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setFilterCategory(category)}
                  className={`text-xs sm:text-sm hover:bg-indigo-50 rounded-lg ${
                    filterCategory === category ? "bg-indigo-50" : ""
                  }`}
                >
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 mr-2" />
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear Filters Button */}
        {hasActiveSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3 hover:bg-red-50 hover:text-red-600 text-gray-600"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
            Clear
          </Button>
        )}

        {/* Results Count */}
        {hasActiveSearch && (
          <span className="text-xs sm:text-sm text-gray-600 font-medium ml-auto">
            {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}
