import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TimetableClient } from "./timetable-client"

// Mock data for demo mode
const mockTimetables = [
  {
    id: "1",
    name: "Weekly Schedule",
    description: "My main weekly timetable",
    user_id: "demo-user",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockActivities = [
  {
    id: "1",
    timetable_id: "1",
    title: "Morning Workout",
    description: "Daily exercise routine",
    location: "Home Gym",
    category: "Health",
    color: "#10b981",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schedules: [
      {
        id: "1",
        activity_id: "1",
        day_of_week: 1,
        start_time: "07:00",
        end_time: "08:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "2",
        activity_id: "1",
        day_of_week: 3,
        start_time: "07:00",
        end_time: "08:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "3",
        activity_id: "1",
        day_of_week: 5,
        start_time: "07:00",
        end_time: "08:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "2",
    timetable_id: "1",
    title: "Team Meeting",
    description: "Weekly team sync",
    location: "Conference Room A",
    category: "Work",
    color: "#3b82f6",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schedules: [
      {
        id: "4",
        activity_id: "2",
        day_of_week: 2,
        start_time: "10:00",
        end_time: "11:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "3",
    timetable_id: "1",
    title: "Study Session",
    description: "Focus time for learning",
    location: "Library",
    category: "Education",
    color: "#8b5cf6",
    is_recurring: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schedules: [
      {
        id: "5",
        activity_id: "3",
        day_of_week: 1,
        start_time: "19:00",
        end_time: "21:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "6",
        activity_id: "3",
        day_of_week: 4,
        start_time: "19:00",
        end_time: "21:00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
]

const mockSchedules = [
  {
    id: "1",
    activity_id: "1",
    day_of_week: 1, // Monday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    activity_id: "1",
    day_of_week: 3, // Wednesday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    activity_id: "1",
    day_of_week: 5, // Friday
    start_time: "07:00",
    end_time: "08:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    activity_id: "2",
    day_of_week: 2, // Tuesday
    start_time: "10:00",
    end_time: "11:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    activity_id: "3",
    day_of_week: 1, // Monday
    start_time: "19:00",
    end_time: "21:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    activity_id: "3",
    day_of_week: 4, // Thursday
    start_time: "19:00",
    end_time: "21:00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockUser = {
  id: "demo-user",
  email: "demo@deadlinemate.com",
  user_metadata: {
    full_name: "Demo User",
    avatar_url: null,
  },
}

export default async function TimetablePage({ searchParams }: { searchParams: { demo?: string } }) {
  const supabase = await createClient()

  const isDemoMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || searchParams.demo === "true"

  let user = null
  let timetables = []
  let activities = []
  let schedules = []
  let profile = null

  if (isDemoMode) {
    user = mockUser
    timetables = mockTimetables
    activities = mockActivities
    schedules = mockSchedules
    profile = {
      id: "demo-user",
      full_name: "Demo User",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  } else {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return redirect("/auth")
    }

    user = authUser

    try {
      // Get user profile first to check tier
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("plan, plan_expiry_date")
        .eq("id", authUser.id)
        .single()

      profile = userProfile

      if (profile) {
        const now = new Date()
        const expiryDate = profile.plan_expiry_date ? new Date(profile.plan_expiry_date) : null

        if (profile.plan === "pro" && expiryDate && expiryDate < now) {
          // Pro plan expired, downgrade to free
          await supabase.from("profiles").update({ plan: "free" }).eq("id", authUser.id)

          profile.plan = "free"
        }
      }
    } catch (profileError) {
      console.error("Error fetching user profile:", profileError)
    }

    if (profile?.plan === "free") {
      return redirect("/profile?upgrade=timetable&reason=Timetable+Management+is+a+Pro+feature")
    }

    try {
      // Get user's timetables
      const { data: userTimetables, error: timetablesError } = await supabase
        .from("timetables")
        .select("*")
        .eq("user_id", authUser.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (timetablesError && timetablesError.code !== "42P01") {
        console.error("Error fetching timetables:", timetablesError)
      }

      timetables = userTimetables || []

      // If we have timetables, get activities and schedules
      if (timetables.length > 0) {
        const timetableIds = timetables.map((t) => t.id)

        const { data: userActivities, error: activitiesError } = await supabase
          .from("activities")
          .select("*")
          .in("timetable_id", timetableIds)
          .order("title", { ascending: true })

        if (activitiesError) {
          console.error("[v0] Error fetching activities:", activitiesError)
        }

        activities = (userActivities || []).map((activity) => ({
          ...activity,
          schedules: [],
        }))

        console.log("[v0] Fetched activities count:", activities.length)

        if (activities.length > 0) {
          const activityIds = activities.map((a) => a.id)

          const { data: userSchedules, error: schedulesError } = await supabase
            .from("schedules")
            .select("*")
            .in("activity_id", activityIds)
            .order("day_of_week", { ascending: true })

          if (schedulesError) {
            console.error("[v0] Error fetching schedules:", schedulesError)
            console.error("[v0] Schedules error details:", JSON.stringify(schedulesError))
          }

          console.log("[v0] Fetched schedules:", userSchedules?.length || 0)

          if (userSchedules && userSchedules.length > 0) {
            console.log("[v0] First schedule sample:", JSON.stringify(userSchedules[0]))
          }

          // Group schedules by activity_id
          const schedulesByActivity = (userSchedules || []).reduce(
            (acc, schedule) => {
              if (!acc[schedule.activity_id]) {
                acc[schedule.activity_id] = []
              }
              acc[schedule.activity_id].push(schedule)
              return acc
            },
            {} as Record<string, any[]>,
          )

          // Map schedules to activities
          activities = activities.map((activity) => {
            const activitySchedules = schedulesByActivity[activity.id] || []
            console.log(`[v0] Activity "${activity.title}" has ${activitySchedules.length} schedules`)
            return {
              ...activity,
              schedules: activitySchedules,
            }
          })

          console.log("[v0] Total activities with schedules attached:", activities.length)
          console.log(
            "[v0] Activities with non-empty schedules:",
            activities.filter((a) => a.schedules.length > 0).length,
          )
        }
      }
    } catch (error) {
      console.error("Error fetching timetable data:", error)
      // Continue with empty data if tables don't exist yet
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-amber-800">
                <strong>Demo Mode:</strong> You're viewing a preview with sample timetable data.
                <a href="/auth" className="underline ml-1 hover:text-amber-900 transition-colors">
                  Try the real authentication
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 shadow-sm text-sm font-medium rounded-xl text-gray-700 hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Back to Dashboard
              </a>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Time Table
                  </h1>
                  <p className="text-sm text-gray-600">Manage your daily schedule and activities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <TimetableClient
          user={user}
          profile={profile}
          initialTimetables={timetables}
          initialActivities={activities}
          initialSchedules={schedules}
          isDemoMode={isDemoMode}
        />
      </main>
    </div>
  )
}
