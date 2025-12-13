import { createClient } from "@/utils/supabase/client"

export interface UserPlanStatus {
  plan: "free" | "pro"
  isExpired: boolean
  expiryDate: string | null
  daysRemaining: number | null
}

/**
 * Get the effective user plan status, accounting for expiry dates
 */
export async function getEffectivePlan(userId: string): Promise<UserPlanStatus> {
  try {
    const supabase = createClient()
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("plan, plan_expiry_date")
      .eq("id", userId)
      .single()

    if (error || !profile) {
      return {
        plan: "free",
        isExpired: false,
        expiryDate: null,
        daysRemaining: null,
      }
    }

    const planFromDb = profile.plan || "free"
    const expiryDate = profile.plan_expiry_date

    if (planFromDb === "pro" && expiryDate) {
      const now = new Date()
      const expiry = new Date(expiryDate)
      const isExpired = now > expiry

      if (isExpired) {
        // Auto-downgrade to free in database
        await supabase.from("profiles").update({ plan: "free" }).eq("id", userId)

        return {
          plan: "free",
          isExpired: true,
          expiryDate: expiryDate,
          daysRemaining: 0,
        }
      }

      // Calculate days remaining
      const diffTime = expiry.getTime() - now.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        plan: "pro",
        isExpired: false,
        expiryDate: expiryDate,
        daysRemaining: daysRemaining,
      }
    }

    return {
      plan: planFromDb as "free" | "pro",
      isExpired: false,
      expiryDate: expiryDate || null,
      daysRemaining: null,
    }
  } catch (error) {
    console.error("Error checking plan status:", error)
    return {
      plan: "free",
      isExpired: false,
      expiryDate: null,
      daysRemaining: null,
    }
  }
}
