"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2, Search, User, Calendar, Shield, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type UserProfile = {
  id: string
  full_name: string | null
  email: string
  plan: string
  plan_expiry_date: string | null
  created_at: string
  updated_at: string
  avatar_url: string | null
  location: string | null
  timezone: string | null
}

export default function AdminPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"email" | "id">("email")
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Upgrade form states
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("pro")
  const [duration, setDuration] = useState("30")

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      setMessage({ type: "error", text: "Please enter a search query" })
      return
    }

    const adminKey = prompt("Enter your ADMIN_API_KEY:")
    if (!adminKey) return

    setLoading(true)
    setMessage(null)
    setUserProfile(null)

    try {
      const queryParam = searchType === "email" ? `email=${encodeURIComponent(searchQuery)}` : `user_id=${searchQuery}`
      const response = await fetch(`/api/admin/get-user?${queryParam}`, {
        headers: {
          "x-admin-api-key": adminKey,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to fetch user" })
        return
      }

      setUserProfile(data.user)
      setMessage({ type: "success", text: "User found successfully" })
    } catch (error) {
      setMessage({ type: "error", text: "Error: " + (error instanceof Error ? error.message : "Unknown error") })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePlan = async () => {
    if (!userProfile) return

    const adminKey = prompt("Enter your ADMIN_API_KEY:")
    if (!adminKey) return

    setActionLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/admin/confirm-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-api-key": adminKey,
        },
        body: JSON.stringify({
          user_id: userProfile.id,
          new_plan: selectedPlan,
          duration_in_months: selectedPlan === "pro" ? Number.parseInt(duration) : 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "Failed to change plan" })
        return
      }

      // Refresh user data
      const refreshResponse = await fetch(`/api/admin/get-user?user_id=${userProfile.id}`, {
        headers: {
          "x-admin-api-key": adminKey,
        },
      })
      const refreshData = await refreshResponse.json()
      if (refreshResponse.ok) {
        setUserProfile(refreshData.user)
      }

      setMessage({
        type: "success",
        text: `Successfully changed plan to ${selectedPlan.toUpperCase()}${selectedPlan === "pro" ? ` for ${duration} days` : ""}`,
      })
    } catch (error) {
      setMessage({ type: "error", text: "Error: " + (error instanceof Error ? error.message : "Unknown error") })
    } finally {
      setActionLoading(false)
    }
  }

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return null
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Admin Panel</h1>
          <p className="text-slate-600">Manage user subscriptions and account details</p>
        </div>

        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="search">Search Users</TabsTrigger>
            <TabsTrigger value="quick-upgrade">Quick Upgrade</TabsTrigger>
          </TabsList>

          {/* Search & Manage Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find User
              </h2>

              <form onSubmit={handleSearchUser} className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search-query">Search by</Label>
                    <div className="flex gap-2 mt-2">
                      <Select value={searchType} onValueChange={(value: "email" | "id") => setSearchType(value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="id">User ID</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="search-query"
                        type="text"
                        placeholder={searchType === "email" ? "user@example.com" : "User UUID"}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search User
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* User Profile Display */}
            {userProfile && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  User Details
                </h2>

                <div className="space-y-4">
                  {/* User Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-600">Full Name</p>
                      <p className="font-medium">{userProfile.full_name || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-medium font-mono text-sm">{userProfile.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">User ID</p>
                      <p className="font-mono text-xs text-slate-700">{userProfile.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-medium">{userProfile.location || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Timezone</p>
                      <p className="font-medium">{userProfile.timezone || "Not set"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Member Since</p>
                      <p className="font-medium">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Current Plan Status */}
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        Current Plan
                      </h3>
                      <Badge
                        variant={userProfile.plan === "pro" ? "default" : "secondary"}
                        className={
                          userProfile.plan === "pro" ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-700"
                        }
                      >
                        {userProfile.plan?.toUpperCase() || "FREE"}
                      </Badge>
                    </div>

                    {userProfile.plan === "pro" && userProfile.plan_expiry_date && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Expires:</span>
                          <span className="font-medium">
                            {new Date(userProfile.plan_expiry_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-slate-600" />
                          <span className="text-slate-600">Days Remaining:</span>
                          <span
                            className={`font-bold ${
                              (getDaysRemaining(userProfile.plan_expiry_date) || 0) <= 7
                                ? "text-red-600"
                                : (getDaysRemaining(userProfile.plan_expiry_date) || 0) <= 30
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {getDaysRemaining(userProfile.plan_expiry_date)} days
                          </span>
                        </div>
                      </div>
                    )}

                    {userProfile.plan === "free" && (
                      <p className="text-sm text-slate-600">User is on the Free plan with limited features</p>
                    )}
                  </div>

                  {/* Change Plan Section */}
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <h3 className="font-semibold mb-4">Change User Plan</h3>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new-plan">New Plan</Label>
                        <Select value={selectedPlan} onValueChange={(value: "free" | "pro") => setSelectedPlan(value)}>
                          <SelectTrigger id="new-plan" className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free Plan</SelectItem>
                            <SelectItem value="pro">Pro Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedPlan === "pro" && (
                        <div>
                          <Label htmlFor="duration">Duration (days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            min="1"
                            max="365"
                            className="mt-2"
                          />
                        </div>
                      )}

                      <Button
                        onClick={handleChangePlan}
                        disabled={actionLoading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating Plan...
                          </>
                        ) : (
                          `Change to ${selectedPlan.toUpperCase()}`
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Messages */}
            {message && (
              <div
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-50 text-green-800 border border-green-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span className="text-sm">{message.text}</span>
              </div>
            )}
          </TabsContent>

          {/* Quick Upgrade Tab (Original functionality) */}
          <TabsContent value="quick-upgrade">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-2">Quick Upgrade</h2>
              <p className="text-slate-600 mb-6">Manually upgrade user subscriptions to Pro</p>

              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const userId = (document.getElementById("quick-user-id") as HTMLInputElement).value
                  const duration = (document.getElementById("quick-duration") as HTMLInputElement).value

                  if (!userId) {
                    setMessage({ type: "error", text: "Please enter a User ID" })
                    return
                  }

                  const adminKey = prompt("Enter your ADMIN_API_KEY:")
                  if (!adminKey) return

                  setActionLoading(true)
                  setMessage(null)

                  try {
                    const response = await fetch("/api/admin/confirm-subscription", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "x-admin-api-key": adminKey,
                      },
                      body: JSON.stringify({
                        user_id: userId,
                        new_plan: "pro",
                        duration_in_months: Number.parseInt(duration),
                      }),
                    })

                    const data = await response.json()

                    if (!response.ok) {
                      setMessage({ type: "error", text: data.error || "Failed to upgrade subscription" })
                      return
                    }

                    setMessage({ type: "success", text: `User upgraded to Pro for ${duration} days` })
                  } catch (error) {
                    setMessage({
                      type: "error",
                      text: "Error: " + (error instanceof Error ? error.message : "Unknown error"),
                    })
                  } finally {
                    setActionLoading(false)
                  }
                }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="quick-user-id">User ID (UUID)</Label>
                  <Input
                    id="quick-user-id"
                    type="text"
                    placeholder="Paste user UUID here..."
                    className="font-mono text-sm mt-2"
                  />
                  <p className="text-xs text-slate-500 mt-1">Find this in Supabase Auth or user Profile page</p>
                </div>

                <div>
                  <Label htmlFor="quick-duration">Duration (days)</Label>
                  <Input id="quick-duration" type="number" defaultValue="30" min="1" max="365" className="mt-2" />
                </div>

                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Upgrade to Pro"
                  )}
                </Button>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Get the user UUID from Supabase or their Profile</li>
                  <li>Fill in the form above</li>
                  <li>Click Upgrade to Pro</li>
                  <li>When prompted, enter your ADMIN_API_KEY</li>
                  <li>Done</li>
                </ol>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
