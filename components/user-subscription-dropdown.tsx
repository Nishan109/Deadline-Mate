"use client"

import { useState, useEffect } from "react"
import { Crown, Calendar, Clock, AlertCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface SubscriptionDropdownProps {
  userId: string
  email: string
  isDemoMode?: boolean
}

export default function UserSubscriptionDropdown({ userId, email, isDemoMode = false }: SubscriptionDropdownProps) {
  const [plan, setPlan] = useState<"free" | "pro">("free")
  const [expiryDate, setExpiryDate] = useState<string | null>(null)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (isDemoMode) {
        setPlan("free")
        setExpiryDate(null)
        setStartDate(null)
        setDaysRemaining(null)
        setIsLoading(false)
        return
      }

      try {
        const supabase = createClient()
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("plan, plan_expiry_date, created_at")
          .eq("id", userId)
          .single()

        if (error || !profile) {
          console.error("Error fetching subscription:", error)
          setIsLoading(false)
          return
        }

        setPlan(profile.plan || "free")
        setStartDate(profile.created_at)

        if (profile.plan === "pro" && profile.plan_expiry_date) {
          setExpiryDate(profile.plan_expiry_date)

          const expiryTime = new Date(profile.plan_expiry_date).getTime()
          const now = new Date().getTime()
          const msPerDay = 24 * 60 * 60 * 1000
          const days = Math.ceil((expiryTime - now) / msPerDay)
          setDaysRemaining(Math.max(0, days))
        }
      } catch (error) {
        console.error("Error fetching subscription:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionData()
  }, [userId, isDemoMode])

  const planFeatures = {
    free: ["Up to 5 active deadlines", "Smart notifications", "Basic calendar view"],
    pro: ["Unlimited deadlines", "Advanced analytics", "Team sharing", "Advanced timetable", "Priority support"],
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysRemainingColor = () => {
    if (!daysRemaining) return "text-gray-600"
    if (daysRemaining <= 7) return "text-red-600"
    if (daysRemaining <= 30) return "text-orange-600"
    return "text-emerald-600"
  }

  if (isLoading) {
    return (
      <div className="w-64 p-4">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 space-y-3">
      {/* Plan Badge */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Crown className={`w-5 h-5 ${plan === "pro" ? "text-purple-600" : "text-amber-600"}`} />
        <div>
          <p className="text-xs text-gray-600">Current Plan</p>
          <p className="text-sm font-semibold text-gray-900">{plan === "pro" ? "Pro Plan" : "Free Plan"}</p>
        </div>
      </div>

      {/* Plan Features */}
      <div className="px-3 py-2 border-t border-b border-gray-200 space-y-1">
        <p className="text-xs font-semibold text-gray-600 mb-2">Features</p>
        {planFeatures[plan].map((feature, idx) => (
          <div key={idx} className="flex items-start gap-2 text-xs">
            <span
              className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                plan === "pro" ? "bg-purple-500" : "bg-emerald-500"
              }`}
            />
            <span className="text-gray-600">{feature}</span>
          </div>
        ))}
      </div>

      {/* Dates */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600">Member Since</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(startDate)}</p>
          </div>
        </div>

        {plan === "pro" && expiryDate && (
          <>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600">Expires</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(expiryDate)}</p>
              </div>
            </div>

            {daysRemaining !== null && (
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${getDaysRemainingColor()}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600">Days Remaining</p>
                  <p className={`text-sm font-bold ${getDaysRemainingColor()}`}>
                    {daysRemaining} {daysRemaining === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="px-3 py-2 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-xs text-blue-700">Showing demo subscription data</p>
        </div>
      )}
    </div>
  )
}
