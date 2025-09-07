import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { PageLoading } from "@/components/page-loading"
import { NavigationProgress } from "@/components/navigation-progress"

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "DeadlineMate - Stay Ahead of Every Deadline",
  description:
    "Track tasks, plan projects, and hit every due date without stress. Perfect for students, professionals, and remote workers.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <NavigationProgress />
        <PageLoading />
        {children}
      </body>
    </html>
  )
}
