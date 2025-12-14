"use client"

import type React from "react"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Eye, EyeOff, Lock, AlertCircle, Loader2, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetPending, startResetTransition] = useTransition()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [sessionVerified, setSessionVerified] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const verifySession = async () => {
      const supabase = createClient()

      // Check if there's a recovery token in the URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = hashParams.get("type")

      console.log("[v0] Reset password page loaded", { hasAccessToken: !!accessToken, type })

      // If we have tokens in the hash, set the session
      if (accessToken && type === "recovery") {
        console.log("[v0] Found recovery tokens in URL, setting session...")
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        })

        if (error) {
          console.error("[v0] Error setting session:", error)
          setMessage({
            type: "error",
            text: "Your reset link is invalid or has expired. Please request a new password reset.",
          })
          setCheckingSession(false)
          return
        }

        // Clear the hash from URL for security
        window.history.replaceState(null, "", window.location.pathname)
      }

      // Verify we have a valid session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      console.log("[v0] Session verification:", {
        hasSession: !!session,
        userId: session?.user?.id,
        error: sessionError?.message,
      })

      if (!session) {
        setMessage({
          type: "error",
          text: "Your reset link has expired. Please request a new password reset.",
        })
        setCheckingSession(false)
        return
      }

      setSessionVerified(true)
      setCheckingSession(false)
    }

    verifySession()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    const errors: Record<string, string> = {}

    if (!password) errors.password = "Password is required"
    else if (password.length < 6) errors.password = "Password must be at least 6 characters"

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"

    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      startResetTransition(async () => {
        try {
          const supabase = createClient()

          console.log("[v0] Updating password...")
          const { data, error } = await supabase.auth.updateUser({
            password: password,
          })

          if (error) {
            console.error("[v0] Password update error:", error)
            setMessage({ type: "error", text: "Failed to reset password. Please try again." })
            return
          }

          console.log("[v0] Password updated successfully")

          // Sign out the user so they can login with new password
          await supabase.auth.signOut()

          // Redirect to login with success message
          router.push("/auth?message=Success! Your password has been reset. Please sign in with your new password.")
        } catch (error) {
          console.error("[v0] Unexpected error:", error)
          setMessage({ type: "error", text: "An unexpected error occurred. Please try again." })
        }
      })
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    )
  }

  if (!sessionVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center text-red-600">Reset Link Expired</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {message?.text || "Your reset link has expired. Please request a new password reset."}
                </AlertDescription>
              </Alert>
              <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600">
                <Link href="/auth">Back to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/auth"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to sign in
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DeadlineMate</span>
          </div>
          <p className="text-gray-600">Set your new password</p>
        </div>

        {message && (
          <Alert
            className={`mb-6 ${message.type === "error" ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}
          >
            {message.type === "error" ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            )}
            <AlertDescription className={message.type === "error" ? "text-red-800" : "text-emerald-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
            <CardDescription className="text-center">Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 6 characters)"
                    className={`pl-10 pr-10 ${formErrors.password ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-sm text-red-600">{formErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className={`pl-10 pr-10 ${formErrors.confirmPassword ? "border-red-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 h-11" disabled={resetPending}>
                {resetPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/auth" className="text-emerald-600 hover:text-emerald-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
