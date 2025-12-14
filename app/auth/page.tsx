"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Target,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Github,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react"
import Link from "next/link"
import { login, signup } from "./actions"
import { LoadingButton } from "@/components/loading-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginPending, startLoginTransition] = useTransition()
  const [signupPending, startSignupTransition] = useTransition()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetPending, startResetTransition] = useTransition()
  const [resetEmail, setResetEmail] = useState("")

  const searchParams = useSearchParams()
  const message = searchParams.get("message")
  const isSuccessMessage = message?.includes("Success") || message?.includes("check your email")

  // Check if we're in demo mode
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLoginSubmit = (formData: FormData) => {
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const errors: Record<string, string> = {}

    if (!email) errors.email = "Email is required"
    else if (!validateEmail(email)) errors.email = "Please enter a valid email"

    if (!password) errors.password = "Password is required"

    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      startLoginTransition(() => {
        login(formData)
      })
    }
  }

  const handleSignupSubmit = (formData: FormData) => {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const fullName = formData.get("fullName") as string
    const confirmPassword = formData.get("confirmPassword") as string

    const errors: Record<string, string> = {}

    if (!fullName) errors.fullName = "Full name is required"
    if (!email) errors.email = "Email is required"
    else if (!validateEmail(email)) errors.email = "Please enter a valid email"

    if (!password) errors.password = "Password is required"
    else if (password.length < 6) errors.password = "Password must be at least 6 characters"

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password"
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match"

    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      startSignupTransition(() => {
        signup(formData)
      })
    }
  }

  const fillDemoCredentials = () => {
    const emailInput = document.getElementById("login-email") as HTMLInputElement
    const passwordInput = document.getElementById("login-password") as HTMLInputElement

    if (emailInput && passwordInput) {
      emailInput.value = "demo@deadlinemate.com"
      passwordInput.value = "demo123"
    }
  }

  const handleForgotPassword = async () => {
    if (!resetEmail || !validateEmail(resetEmail)) {
      setFormErrors({ resetEmail: "Please enter a valid email" })
      return
    }

    setFormErrors({})
    startResetTransition(async () => {
      try {
        const supabase = (await import("@/utils/supabase/client")).createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        })

        if (error) throw error

        setResetEmailSent(true)
      } catch (error) {
        console.error("[v0] Forgot password error:", error)
        setFormErrors({ resetEmail: "Failed to send reset email. Please try again." })
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <LoadingButton
            variant="ghost"
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </LoadingButton>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">DeadlineMate</span>
          </div>
          <p className="text-gray-600">Welcome! Please sign in to your account or create a new one</p>
        </div>

        {/* Demo Mode Alert */}
        {isDemoMode && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> Use <strong>demo@deadlinemate.com</strong> / <strong>demo123</strong> to try
              the dashboard.
              <Button variant="link" className="p-0 h-auto text-blue-600 underline ml-1" onClick={fillDemoCredentials}>
                Fill demo credentials
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {message && (
          <Alert
            className={`mb-6 ${isSuccessMessage ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
          >
            {isSuccessMessage ? (
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={isSuccessMessage ? "text-emerald-800" : "text-red-800"}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="text-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login" className="space-y-4">
                <div className="text-center mb-6">
                  <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                  <CardDescription className="mt-2">Sign in to your account to continue</CardDescription>
                </div>

                <form action={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 ${formErrors.email ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="login-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <input
                        id="remember"
                        type="checkbox"
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600">
                        Remember me
                      </Label>
                    </div>
                    <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          className="text-sm text-emerald-600 hover:text-emerald-500"
                          onClick={() => {
                            setResetEmailSent(false)
                            setResetEmail("")
                            setFormErrors({})
                          }}
                        >
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{resetEmailSent ? "Check your email" : "Reset your password"}</DialogTitle>
                          <DialogDescription>
                            {resetEmailSent
                              ? "We've sent you a password reset link. Please check your email inbox and spam folder."
                              : "Enter your email address and we'll send you a link to reset your password."}
                          </DialogDescription>
                        </DialogHeader>

                        {!resetEmailSent ? (
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email">Email</Label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  id="reset-email"
                                  type="email"
                                  placeholder="Enter your email"
                                  value={resetEmail}
                                  onChange={(e) => setResetEmail(e.target.value)}
                                  className={`pl-10 ${formErrors.resetEmail ? "border-red-500" : ""}`}
                                  disabled={resetPending}
                                />
                              </div>
                              {formErrors.resetEmail && <p className="text-sm text-red-600">{formErrors.resetEmail}</p>}
                            </div>

                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setForgotPasswordOpen(false)}
                                className="flex-1"
                                disabled={resetPending}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                onClick={handleForgotPassword}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                                disabled={resetPending}
                              >
                                {resetPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  "Send Reset Link"
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4">
                            <Alert className="border-emerald-200 bg-emerald-50">
                              <CheckCircle className="h-4 w-4 text-emerald-600" />
                              <AlertDescription className="text-emerald-800">
                                Password reset email sent to <strong>{resetEmail}</strong>
                              </AlertDescription>
                            </Alert>
                            <Button
                              type="button"
                              onClick={() => setForgotPasswordOpen(false)}
                              className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600"
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 h-11"
                    disabled={loginPending}
                  >
                    {loginPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Form */}
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center mb-6">
                  <CardTitle className="text-2xl font-bold">Create account</CardTitle>
                  <CardDescription className="mt-2">Get started with your free account</CardDescription>
                </div>

                <form action={handleSignupSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signup-name"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        className={`pl-10 ${formErrors.fullName ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {formErrors.fullName && <p className="text-sm text-red-600">{formErrors.fullName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 ${formErrors.email ? "border-red-500" : ""}`}
                        required
                      />
                    </div>
                    {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password (min 6 characters)"
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
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
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

                  <div className="flex items-start space-x-2">
                    <input
                      id="terms"
                      type="checkbox"
                      className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1"
                      required
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                      I agree to the{" "}
                      <Link href="#" className="text-emerald-600 hover:text-emerald-500">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="#" className="text-emerald-600 hover:text-emerald-500">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-600 h-11"
                    disabled={signupPending}
                  >
                    {signupPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button variant="outline" className="h-11 bg-transparent" disabled>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-11 bg-transparent" disabled>
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Social login coming soon</p>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">Protected by industry-standard encryption</p>
        </div>
      </div>
    </div>
  )
}
