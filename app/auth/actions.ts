"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  // Basic validation
  if (!email || !password) {
    redirect("/auth?message=Email and password are required")
  }

  if (!email.includes("@")) {
    redirect("/auth?message=Please enter a valid email address")
  }

  // Check if we're in demo mode
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Demo mode - simulate successful login for demo purposes
    if (email === "demo@deadlinemate.com" && password === "demo123") {
      redirect("/dashboard?demo=true")
    } else {
      redirect("/auth?message=Demo mode: Use demo@deadlinemate.com / demo123")
    }
    return
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login error:", error)
    if (error.message.includes("Invalid login credentials")) {
      redirect("/auth?message=Invalid email or password")
    } else if (error.message.includes("Email not confirmed")) {
      redirect("/auth?message=Please check your email and confirm your account")
    } else {
      redirect("/auth?message=Unable to sign in. Please try again.")
    }
  }

  revalidatePath("/", "layout")
  redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
  if (!email || !password || !fullName) {
    redirect("/auth?message=All fields are required")
  }

  if (!email.includes("@")) {
    redirect("/auth?message=Please enter a valid email address")
  }

  if (password.length < 6) {
    redirect("/auth?message=Password must be at least 6 characters long")
  }

  if (password !== confirmPassword) {
    redirect("/auth?message=Passwords do not match")
  }

  // Check if we're in demo mode
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/auth?message=Demo mode: Account created! Use demo@deadlinemate.com / demo123 to login")
    return
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    console.error("Signup error:", error)
    if (error.message.includes("User already registered")) {
      redirect("/auth?message=An account with this email already exists")
    } else {
      redirect("/auth?message=Unable to create account. Please try again.")
    }
  }

  revalidatePath("/", "layout")
  redirect("/auth?message=Success! Please check your email to confirm your account")
}

export async function signOut() {
  const supabase = await createClient()

  // Check if we're in demo mode
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/auth")
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Sign out error:", error)
  }

  revalidatePath("/", "layout")
  redirect("/auth")
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validation
  if (!password || !confirmPassword) {
    redirect("/auth/reset-password?message=All fields are required")
  }

  if (password.length < 6) {
    redirect("/auth/reset-password?message=Password must be at least 6 characters long")
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?message=Passwords do not match")
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    console.error("Reset password error:", error)
    redirect("/auth/reset-password?message=Failed to reset password. Please try again.")
  }

  revalidatePath("/", "layout")
  redirect("/auth?message=Success! Your password has been reset. Please sign in with your new password.")
}
