"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export default function AdminPage() {
  const [userEmail, setUserEmail] = useState("")
  const [userId, setUserId] = useState("")
  const [duration, setDuration] = useState("30")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      setMessage({ type: "error", text: "Please enter a User ID" })
      return
    }

    const adminKey = prompt("Enter your ADMIN_API_KEY:")
    if (!adminKey) return

    setLoading(true)
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

      setMessage({ type: "success", text: `✅ User upgraded to Pro for ${duration} days!` })
      setUserId("")
      setUserEmail("")
      setDuration("30")
    } catch (error) {
      setMessage({ type: "error", text: "Error: " + (error instanceof Error ? error.message : "Unknown error") })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Admin Panel</h1>
          <p className="text-slate-600 mb-6">Manually upgrade user subscriptions to Pro</p>

          <form onSubmit={handleUpgrade} className="space-y-6">
            {/* User ID Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User ID (UUID)</label>
              <Input
                type="text"
                placeholder="Paste user UUID here..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">Find this in Supabase Auth → Users or user Profile page</p>
            </div>

            {/* Email (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User Email (optional - for reference)
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Duration (days)</label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" max="365" />
            </div>

            {/* Message */}
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !userId}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2"
            >
              {loading ? (
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
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Get the user's UUID from Supabase or their Profile</li>
              <li>Fill in the form above</li>
              <li>Click "Upgrade to Pro"</li>
              <li>When prompted, enter your ADMIN_API_KEY</li>
              <li>Done! User is now Pro</li>
            </ol>
          </div>
        </Card>
      </div>
    </div>
  )
}
