"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Check, Mail, Crown, AlertCircle } from "lucide-react"

interface SubscriptionManagementProps {
  user: any
  isDemoMode?: boolean
}

export function SubscriptionManagement({ user, isDemoMode = false }: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const handleContactSales = () => {
    setIsLoading(true)
    const subject = encodeURIComponent("Subscription Request: Upgrade to Pro Plan")
    const body = encodeURIComponent(
      `Hello,\n\nI would like to upgrade my DeadlineMate account to the Pro Plan.\n\nUser Email: ${user?.email || "your-email@example.com"}\n\nPlease send me the payment details (GPay/UPI) to proceed.\n\nThank you.`,
    )
    const mailtoLink = `mailto:ns371511@gmail.com?subject=${subject}&body=${body}`
    window.location.href = mailtoLink
    setIsLoading(false)
    setMessage({ type: "info", text: "Opening email client..." })
    setTimeout(() => setMessage(null), 3000)
  }

  const currentPlan = "Free" // In a real app, this would come from the database
  const planLimits = {
    Free: {
      deadlines: 5,
      features: ["Up to 5 active deadlines", "Smart calendar view", "Email & in-app notifications"],
    },
    Pro: {
      deadlines: "Unlimited",
      features: [
        "Unlimited deadlines & projects",
        "Advanced analytics & insights",
        "Advanced time table management",
        "Share deadlines & team collaboration",
        "Advanced notes with tags & colors",
        "Deadline search & smart filters",
        "Priority support & data export",
      ],
    },
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Crown className="w-5 h-5" />
            Current Plan
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your subscription and upgrade options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Free Plan Card */}
            <Card className="border-2 border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Free Plan</CardTitle>
                  <Badge className="bg-emerald-100 text-emerald-700">Current</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">₹0</p>
                  <p className="text-xs sm:text-sm text-gray-600">/month</p>
                </div>
                <div className="space-y-2">
                  {planLimits.Free.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pro Plan Card */}
            <Card className="border-2 border-emerald-500 relative">
              <div className="absolute -top-3 left-4">
                <Badge className="bg-emerald-500 text-white text-xs">Recommended</Badge>
              </div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">Pro Plan</CardTitle>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                    Upgrade
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">₹99</p>
                  <p className="text-xs sm:text-sm text-gray-600">/month</p>
                </div>
                <div className="space-y-2">
                  {planLimits.Pro.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start">
                      <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 pt-2">+ {planLimits.Pro.features.length - 4} more features</p>
                </div>
                <Button
                  onClick={handleContactSales}
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base h-10 sm:h-11"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact for Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-blue-900">
            <AlertCircle className="w-5 h-5" />
            How to Upgrade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </span>
              <span className="text-sm sm:text-base text-blue-900">
                Click "Contact for Sales" to send us an email request
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </span>
              <span className="text-sm sm:text-base text-blue-900">
                We'll respond with payment options (GPay, UPI, Bank Transfer)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </span>
              <span className="text-sm sm:text-base text-blue-900">
                Complete the payment and we'll activate your Pro Plan instantly
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 text-sm sm:text-base">
            <strong>Demo Mode:</strong> This is a demonstration. The email client will open with a pre-filled upgrade
            request.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Messages */}
      {message && (
        <Alert
          className={`${
            message.type === "success"
              ? "border-green-200 bg-green-50"
              : message.type === "error"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
          }`}
        >
          <AlertCircle
            className={`h-4 w-4 ${message.type === "success" ? "text-green-600" : message.type === "error" ? "text-red-600" : "text-blue-600"}`}
          />
          <AlertDescription
            className={`${message.type === "success" ? "text-green-800" : message.type === "error" ? "text-red-800" : "text-blue-800"} text-sm sm:text-base`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* FAQ */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base sm:text-lg">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-2">Can I cancel anytime?</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Yes, you can cancel your subscription at any time. No long-term commitment required.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-2">What payment methods do you accept?</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              We accept GPay, UPI, Bank Transfers, and other digital payment methods.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-2">Is there a trial period?</h4>
            <p className="text-xs sm:text-sm text-gray-600">
              Contact our sales team to discuss trial options for your use case.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
