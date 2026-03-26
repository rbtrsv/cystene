"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  BarChart3,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  FileBarChart,
  FileSpreadsheet,
  Calculator,
  ArrowLeftRight,
  FolderOpen,
  Gauge,
  HandCoins,
  LogOut,
  Moon,
  PieChart,
  ScrollText,
  Settings,
  Shuffle,
  Sun,
  TrendingUp,
  TrendingUpDown,
  User2,
  UserCog,
  Users,
  Wallet,
  Building,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/modules/accounts/store/auth.store"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { Avatar, AvatarFallback, AvatarImage } from "@/modules/shadcnui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/shadcnui/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/modules/shadcnui/components/ui/sidebar"

import Image from "next/image"
import Link from "next/link"
import logoLight from "@/images/company/logo-v7-black.png"
import logoDark from "@/images/company/logo-v7-white.png"

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { profile, resetAuth } = useAuthStore()
  const supabase = createClientComponentClient();

  // Theme switching functionality
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  const [theme, setTheme] = useState(isDark ? "dark" : "light")

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark")
      document.documentElement.classList.add("dark")
    } else {
      setTheme("light")
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const handleThemeSwitch = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    }
  }

  // Function to check if a path is active
  const isActive = (path: string) => {
    // Make sure all paths have the dashboard prefix
    const fullPath = path.startsWith("/dashboard") ? path : `/dashboard${path}`
    
    // Exact match for dashboard home
    if (fullPath === "/dashboard" && pathname === "/dashboard") {
      return true
    }
    
    // For other routes, check if the pathname starts with the path
    return pathname === fullPath || (pathname.startsWith(fullPath) && pathname !== "/dashboard")
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      resetAuth();
      router.push('/accounts/login');
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  }


  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Updated Header with Logo */}
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center overflow-hidden">
          <Image
            src={logoDark || "/placeholder.svg"}
            alt="Logo"
            width={120}
            height={32}
            className="dark:block hidden shrink-0"
          />
          <Image
            src={logoLight || "/placeholder.svg"}
            alt="Logo"
            width={120}
            height={32}
            className="dark:hidden block shrink-0"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>

        {/* Cap Table Management*/}
        <SidebarGroup>
          <SidebarGroupLabel>Capitalization Table</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/funds")} tooltip="Funds">
                  <Link href="/dashboard/funds">
                    <Building2 className="h-4 w-4" />
                    <span>Funds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/rounds")} tooltip="Rounds">
                  <Link href="/dashboard/rounds">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Rounds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/stakeholders")} tooltip="Stakeholders">
                  <Link href="/dashboard/stakeholders">
                    <Users className="h-4 w-4" />
                    <span>Stakeholders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/securities")} tooltip="Securities">
                  <Link href="/dashboard/securities">
                    <ScrollText className="h-4 w-4" />
                    <span>Securities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/transactions")} tooltip="Transactions">
                  <Link href="/dashboard/transactions">
                    <Shuffle className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/investor/captable")} tooltip="Cap Table">
                  <Link href="/dashboard/investor/captable">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Cap Table</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Portfolio Monitoring*/}
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio Monitoring</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/portfolio/investments")} tooltip="Portfolio Investments">
                  <Link href="/dashboard/portfolio/investments">
                    <TrendingUp className="h-4 w-4" />
                    <span>Portfolio Investments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/portfolio/cash-flows")} tooltip="Portfolio Cash Flows">
                  <Link href="/dashboard/portfolio/cash-flows">
                    <Wallet className="h-4 w-4" />
                    <span>Portfolio Cash Flows</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/portfolio-performance")} tooltip="Portfolio Performance">
                  <Link href="/dashboard/portfolio-performance">
                    <BarChart3 className="h-4 w-4" />
                    <span>Portfolio Performance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Dealflow Management*/}
        <SidebarGroup>
          <SidebarGroupLabel>Dealflow Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/deal-pipeline")} tooltip="Deal Pipeline">
                  <Link href="/dashboard/deal-pipeline">
                    <FolderOpen className="h-4 w-4" />
                    <span>Deal Pipeline</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Fund Administration*/}
        <SidebarGroup>
          <SidebarGroupLabel>Fund Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/fee-costs")} tooltip="Fee Costs">
                  <Link href="/dashboard/fee-costs">
                    <HandCoins className="h-4 w-4" />
                    <span>Fee Costs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Performance */}
        <SidebarGroup>
          <SidebarGroupLabel>Performance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/performance/funds")} tooltip="Funds Performance">
                  <Link href="/dashboard/performance/funds">
                    <ChartNoAxesCombined className="h-4 w-4" />
                    <span>Funds Performance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/performance/companies")} tooltip="Companies Performance">
                  <Link href="/dashboard/performance/companies">
                    <TrendingUpDown className="h-4 w-4" />
                    <span>Companies Performance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/performance/stakeholders")} tooltip="Stakeholders Returns">
                  <Link href="/dashboard/performance/stakeholders">
                    <PieChart className="h-4 w-4" />
                    <span>Stakeholders Returns</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/reporting")} tooltip="Reporting">
                  <Link href="/dashboard/reporting">
                    <FileBarChart className="h-4 w-4" />
                    <span>Reporting</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Companies*/}
        <SidebarGroup>
          <SidebarGroupLabel>Companies</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/companies")} tooltip="Companies">
                  <Link href="/dashboard/companies">
                    <Building className="h-4 w-4" />
                    <span>Companies</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/income-statements")} tooltip="Income Statements">
                  <Link href="/dashboard/income-statements">
                    <FileBarChart className="h-4 w-4" />
                    <span>Income Statements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/balance-sheets")} tooltip="Balance Sheets">
                  <Link href="/dashboard/balance-sheets">
                    <Calculator className="h-4 w-4" />
                    <span>Balance Sheets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cash-flow-statements")} tooltip="Cash Flow Statements">
                  <Link href="/dashboard/cash-flow-statements">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Cash Flow Statements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/financial-ratios")} tooltip="Financial Ratios">
                  <Link href="/dashboard/financial-ratios">
                    <PieChart className="h-4 w-4" />
                    <span>Financial Ratios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/revenue-metrics")} tooltip="Revenue Metrics">
                  <Link href="/dashboard/revenue-metrics">
                    <TrendingUp className="h-4 w-4" />
                    <span>Revenue Metrics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/customer-metrics")} tooltip="Customer Metrics">
                  <Link href="/dashboard/customer-metrics">
                    <Users className="h-4 w-4" />
                    <span>Customer Metrics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/operational-metrics")} tooltip="Operational Metrics">
                  <Link href="/dashboard/operational-metrics">
                    <Gauge className="h-4 w-4" />
                    <span>Operational Metrics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/team-metrics")} tooltip="Team Metrics">
                  <Link href="/dashboard/team-metrics">
                    <UserCog className="h-4 w-4" />
                    <span>Team Metrics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/kpis-definitions")} tooltip="KPI Definitions">
                  <Link href="/dashboard/kpis-definitions">
                    <Settings className="h-4 w-4" />
                    <span>KPI Definitions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/kpis-values")} tooltip="KPI Values">
                  <Link href="/dashboard/kpis-values">
                    <BarChart3 className="h-4 w-4" />
                    <span>KPI Values</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile in Footer with Theme Toggle */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip="User Profile"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/user.jpg" alt="User" />
                    <AvatarFallback className="rounded-lg">
                      {profile?.email ? profile.email.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {profile?.name || (profile?.email ? 
                        profile.email.split('@')[0] : 
                        'User')}
                    </span>
                    <span className="truncate text-xs">
                      {profile?.email || ''}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel>User Settings</DropdownMenuLabel>

                <DropdownMenuItem>
                  <User2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                {/* Theme Toggle */}
                <DropdownMenuItem onClick={handleThemeSwitch}>
                  {theme === "dark" ? (
                    <>
                      <Sun className="mr-2 h-4 w-4" />
                      Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4" />
                      Dark Mode
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for collapsing the sidebar */}
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
