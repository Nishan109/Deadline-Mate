import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  Target,
  Bell,
  BarChart3,
  Users,
  Check,
  ArrowRight,
  Mail,
  Twitter,
  Github,
  Linkedin,
  Award,
  Code,
  Cloud,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { LoadingButton } from "@/components/loading-button"
import { MobileNav } from "@/components/mobile-nav"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DeadlineMate</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <LoadingButton variant="ghost" href="/auth">
              Sign In
            </LoadingButton>
            <LoadingButton className="bg-emerald-500 hover:bg-emerald-600" href="/auth">
              Get Started Free
            </LoadingButton>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge
            variant="secondary"
            className="mb-4 sm:mb-6 bg-emerald-50 text-emerald-700 border-emerald-200 text-xs sm:text-sm"
          >
            ✨ New: Smart deadline predictions now available
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Stay Ahead of Every <span className="text-emerald-500">Deadline</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed">
            Track tasks, plan projects, and hit every due date without stress. Perfect for students, professionals, and
            remote workers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 max-w-md sm:max-w-none mx-auto">
            <LoadingButton
              size="lg"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
              href="/auth"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </LoadingButton>
            <a href="https://youtu.be/24qRnJKcNMs?si=RBsRtvmw7_atwsyr" target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent"
              >
                Watch Demo
              </Button>
            </a>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">Free forever • No credit card required • 2-minute setup</p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl transform rotate-1"></div>
              <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
                <Image
                  src="/images/dashboard-preview.jpg"
                  alt="Professional working environment - DeadlineMate helps you stay organized and meet every deadline"
                  width={1200}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Perfect for Every Environment
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're in the classroom or the boardroom, DeadlineMate adapts to your workflow
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            {/* Students Section */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl sm:rounded-2xl transform -rotate-1"></div>
                  <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                    <Image
                      src="/images/classroom-environment.jpg"
                      alt="Classroom environment - DeadlineMate helps students manage academic deadlines and assignments"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">For Students</Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Excel in Your Academic Journey
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 mb-6">
                    From assignment due dates to exam schedules, keep track of all your academic commitments in one
                    place.
                  </p>
                  <ul className="space-y-3 mb-6 sm:mb-8 text-left">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <span>Assignment and project tracking</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <span>Exam schedule management</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <span>Study session planning</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                      <span>Group project coordination</span>
                    </li>
                  </ul>
                  <LoadingButton className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600" href="/auth">
                    Start Your Academic Success
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </LoadingButton>
                </div>
              </div>
            </div>

            {/* Professionals Section */}
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl sm:rounded-2xl transform rotate-1"></div>
                  <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                    <Image
                      src="/images/dashboard-preview.jpg"
                      alt="Professional working environment - DeadlineMate helps professionals meet project deadlines"
                      width={600}
                      height={400}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              </div>
              <div className="order-2">
                <div className="max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                  <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">For Professionals</Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                    Deliver Projects On Time, Every Time
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 mb-6">
                    Manage complex projects, client deliverables, and team deadlines with professional-grade tools.
                  </p>
                  <ul className="space-y-3 mb-6 sm:mb-8 text-left">
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <span>Project milestone tracking</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <span>Client deadline management</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <span>Team collaboration tools</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <span>Advanced analytics & reporting</span>
                    </li>
                  </ul>
                  <LoadingButton className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600" href="/auth">
                    Boost Your Productivity
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Everything you need to stay organized
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you manage deadlines effortlessly
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Smart Calendar</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Visual timeline of all your deadlines with intelligent scheduling suggestions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Smart Reminders</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Get notified at the perfect time with customizable alerts and notifications
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Progress Tracking</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Monitor your productivity with detailed analytics and completion rates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Time Management</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Break down large projects into manageable tasks with time estimates
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Team Collaboration</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Share deadlines and collaborate with classmates or colleagues
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <CardHeader className="text-center sm:text-left">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 mx-auto sm:mx-0">
                  <Target className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Goal Setting</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Set and track long-term goals with milestone tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Meet DeadlineMate Founder
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Built by a passionate developer with expertise in AI and cloud computing
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Image Section */}
                  <div className="relative h-64 sm:h-80 lg:h-full min-h-[400px]">
                    <Image
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-08-15%20at%2009.41.54_a1114356.jpg-1SebtMdJvySIjHlM2I4JKRQmYI72J5.jpeg"
                      alt="Nishan Singh - DeadlineMate Founder"
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/10"></div>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                    <div className="mb-6">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Nishan Singh</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Award className="w-3 h-3 mr-1" />
                          Google Gen AI Certified
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Code className="w-3 h-3 mr-1" />
                          Computer Science
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <Cloud className="w-3 h-3 mr-1" />
                          Diamond League
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Computer Science undergraduate with a strong foundation in cloud computing, AI, and full-stack
                      development. Completed over{" "}
                      <span className="font-semibold text-gray-900">300+ hands-on labs</span> and
                      <span className="font-semibold text-gray-900"> 40+ skill badges</span> on Google Cloud, achieving
                      Diamond League status.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600">
                          Skilled in deploying cloud infrastructure and building AI-powered applications
                        </p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600">
                          Expert with modern tools like ChatGPT, Gemini, Vertex AI Studio, and Supabase
                        </p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600">
                          Known for building real-world solutions like ChartGPT and DeadlineMate
                        </p>
                      </div>
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-sm text-gray-600">
                          Continuously learning through structured Google Cloud learning paths
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 italic">
                      "Actively seeking opportunities to apply technical skills to solve impactful problems and help
                      people stay organized and productive."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">Start free, upgrade when you need more features</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="border-2 border-gray-200 relative">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold">₹0</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="mt-2">Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Up to 5 active deadlines
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Smart calendar view
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Email & in-app notifications
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Organize notes with categories
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Quick links & bookmarks
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Smart time table with activities
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Mobile responsive design
                  </li>
                </ul>
                <LoadingButton className="w-full bg-transparent" variant="outline" href="/auth">
                  Get Started Free
                </LoadingButton>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-emerald-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white text-xs sm:text-sm">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6 sm:pb-8">
                <CardTitle className="text-xl sm:text-2xl">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-3xl sm:text-4xl font-bold">₹99</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <CardDescription className="mt-2">For power users and teams</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Unlimited deadlines & projects
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Advanced analytics & insights
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Advanced time table management
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Share deadlines & team collaboration
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Advanced notes with tags & colors
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Deadline search & smart filters
                  </li>
                  <li className="flex items-center text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 mr-3 flex-shrink-0" />
                    Priority support & data export
                  </li>
                </ul>
                <LoadingButton className="w-full bg-emerald-500 hover:bg-emerald-600" href="/auth">
                  Start Pro Trial
                </LoadingButton>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <p className="text-sm sm:text-base text-gray-600">
              All plans include 14-day free trial • Cancel anytime • No setup fees
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-emerald-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to never miss a deadline again?
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who trust DeadlineMate to keep them organized and stress-free.
          </p>
          <LoadingButton
            size="lg"
            className="w-full sm:w-auto bg-white text-emerald-500 hover:bg-gray-100 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4"
            href="/auth"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
          </LoadingButton>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">DeadlineMate</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md mx-auto md:mx-0">
                The ultimate deadline tracker for students, professionals, and remote workers. Stay organized, reduce
                stress, and never miss an important deadline again.
              </p>
              <div className="flex justify-center md:justify-start space-x-4">
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h3 className="font-semibold mb-4">Get in Touch</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Cloudfusionacademy1@gmail.com</span>
                </li>
                <li className="text-sm sm:text-base">Sirsa, India</li>
                <li className="pt-2">
                  <LoadingButton
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    href="/auth"
                  >
                    Get Started Free
                  </LoadingButton>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <p className="text-gray-400 text-xs sm:text-sm">
              © {new Date().getFullYear()} DeadlineMate. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center space-x-4 sm:space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
