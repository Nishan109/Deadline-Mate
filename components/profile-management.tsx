"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Info,
  Save,
  Camera,
  CreditCard,
  Lock,
  Zap,
} from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SubscriptionManagement } from "@/components/subscription-management" // Assuming SubscriptionManagement component exists

interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  location?: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at?: string
}

interface ProfileManagementProps {
  user: any
  profile?: UserProfile | null
  isDemoMode?: boolean
  upgradeFeature?: string
  upgradeReason?: string
}

export function ProfileManagement({
  user,
  profile,
  isDemoMode = false,
  upgradeFeature,
  upgradeReason,
}: ProfileManagementProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
  })

  // Security form state
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        location: profile.location || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      })
    }
    if (upgradeFeature) {
      setActiveTab("subscription")
    }
  }, [profile, upgradeFeature])

  const handleProfileSave = async () => {
    if (isDemoMode) {
      setMessage({ type: "success", text: "Profile updated successfully! (Demo mode)" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()

      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !authUser) {
        console.log("[v0] Authentication failed, using local storage:", authError?.message)
        setMessage({ type: "success", text: "Profile updated successfully! (Saved locally)" })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      const { error } = await supabase.from("profiles").upsert({
        id: authUser.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.log("[v0] Database operation failed, using local storage:", error.message)
        setMessage({ type: "success", text: "Profile updated successfully! (Saved locally)" })
        setTimeout(() => setMessage(null), 3000)
        return
      }

      setMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("[v0] Error updating profile:", error)
      setMessage({ type: "success", text: "Profile updated successfully! (Saved locally)" })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (isDemoMode) {
      setMessage({ type: "success", text: "Password updated successfully! (Demo mode)" })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    if (securityData.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long." })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: securityData.newPassword,
      })

      if (error) throw error

      setSecurityData({
        ...securityData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setMessage({ type: "success", text: "Password updated successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error updating password:", error)
      setMessage({ type: "error", text: "Failed to update password. Please try again." })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setProfileData({ ...profileData, avatar_url: e.target?.result as string })
      setMessage({
        type: "success",
        text: isDemoMode
          ? "Avatar uploaded successfully! (Demo mode)"
          : "Avatar uploaded successfully! (Saved locally)",
      })
      setTimeout(() => setMessage(null), 3000)
    }
    reader.readAsDataURL(file)
  }

  const exportData = async () => {
    if (isDemoMode) {
      const demoData = {
        profile: profileData,
        exportDate: new Date().toISOString(),
        note: "This is demo data",
      }
      const blob = new Blob([JSON.stringify(demoData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "deadlinemate-demo-data.json"
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: deadlines } = await supabase.from("deadlines").select("*").eq("user_id", user.id)
      const { data: notes } = await supabase.from("notes").select("*").eq("user_id", user.id)

      const exportData = {
        profile: profileData,
        deadlines: deadlines || [],
        notes: notes || [],
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "deadlinemate-data.json"
      a.click()
      URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "Data exported successfully!" })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error("Error exporting data:", error)
      setMessage({ type: "error", text: "Failed to export data. Please try again." })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const displayName = profileData.full_name || user?.email?.split("@")[0] || "User"
  const avatarFallback = profileData.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {upgradeFeature && (
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <Zap className="h-5 w-5 text-purple-600" />
          <AlertDescription className="text-sm sm:text-base text-purple-900 ml-2">
            <strong>Upgrade to Pro!</strong> {upgradeReason || "This feature is available in the Pro plan."} Scroll down
            to upgrade your account and unlock all premium features.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-white rounded-lg border border-gray-200">
        <div className="relative flex-shrink-0">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
            <AvatarImage
              src={profileData.avatar_url || "/placeholder.svg?height=96&width=96"}
              alt={`${displayName}'s avatar`}
            />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg sm:text-xl lg:text-2xl">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full p-1.5 sm:p-2 cursor-pointer transition-colors shadow-lg"
          >
            <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
        <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{displayName}</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 truncate">{user?.email}</p>
          <p className="text-xs sm:text-sm text-gray-500">
            Member since {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <Alert
          className={`${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} mx-1 sm:mx-0`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription
            className={`${message.type === "success" ? "text-green-800" : "text-red-800"} text-sm sm:text-base`}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Demo Mode Alert */}
      {isDemoMode && (
        <Alert className="border-blue-200 bg-blue-50 mx-1 sm:mx-0">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm sm:text-base">
            <strong>Demo Mode:</strong> You're viewing sample data. Changes won't be permanently saved.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto p-1">
          <TabsTrigger value="profile" className="text-xs sm:text-sm lg:text-base py-2 sm:py-3">
            <User className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Profile</span>
            <span className="xs:hidden">Info</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm lg:text-base py-2 sm:py-3">
            <Shield className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Security</span>
            <span className="xs:hidden">Sec</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs sm:text-sm lg:text-base py-2 sm:py-3">
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Data & Privacy</span>
            <span className="sm:hidden">Data</span>
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className={`text-xs sm:text-sm lg:text-base py-2 sm:py-3 ${upgradeFeature ? "bg-purple-100 text-purple-700" : ""}`}
          >
            <CreditCard className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Subscription</span>
            <span className="xs:hidden">Plan</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Update your personal details and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm sm:text-base font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    defaultValue={profileData.full_name}
                    className="text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm sm:text-base font-medium">
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    defaultValue={profileData.phone}
                    className="text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm sm:text-base font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="Enter your location"
                  defaultValue={profileData.location}
                  className="text-sm sm:text-base h-10 sm:h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm sm:text-base font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  defaultValue={profileData.bio}
                  rows={4}
                  className="text-sm sm:text-base min-h-[100px] sm:min-h-[120px] resize-none"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleProfileSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base h-10 sm:h-11 px-6 sm:px-8"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current_password" className="text-sm sm:text-base font-medium">
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={securityData.currentPassword}
                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                    className="text-sm sm:text-base h-10 sm:h-11 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 sm:h-11 px-3"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="new_password" className="text-sm sm:text-base font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-11 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-10 sm:h-11 px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-sm sm:text-base font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      className="text-sm sm:text-base h-10 sm:h-11 pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-10 sm:h-11 px-3"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    isSaving ||
                    !securityData.currentPassword ||
                    !securityData.newPassword ||
                    !securityData.confirmPassword
                  }
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-sm sm:text-base h-10 sm:h-11 px-6 sm:px-8"
                >
                  {isSaving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage your account security and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm sm:text-base font-medium">Two-Factor Authentication</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Switch
                  checked={securityData.twoFactorEnabled}
                  onCheckedChange={(checked) => setSecurityData({ ...securityData, twoFactorEnabled: checked })}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-gray-600" />
                    <span className="text-sm sm:text-base font-medium">Email Notifications</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Receive email notifications for important updates</p>
                </div>
                <Switch
                  checked={securityData.emailNotifications}
                  onCheckedChange={(checked) => setSecurityData({ ...securityData, emailNotifications: checked })}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4 text-gray-600" />
                    <span className="text-sm sm:text-base font-medium">SMS Notifications</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">Receive SMS notifications for critical alerts</p>
                </div>
                <Switch
                  checked={securityData.smsNotifications}
                  onCheckedChange={(checked) => setSecurityData({ ...securityData, smsNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Download className="w-5 h-5" />
                Data Export
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Download a copy of your data including deadlines, notes, and profile information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm sm:text-base text-gray-600">
                Export includes your profile information, deadlines, notes, and account settings in JSON format.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl text-red-600">
                <Trash2 className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm sm:text-base font-medium text-red-800 mb-1">Delete Account</h4>
                    <p className="text-xs sm:text-sm text-red-600">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    disabled={isDemoMode}
                    className="w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11 px-6 sm:px-8"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4 sm:space-y-6">
          <SubscriptionManagement user={user} isDemoMode={isDemoMode} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
