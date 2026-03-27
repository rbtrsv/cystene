"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  BarChart3,
  CircleDollarSign,
  FileBarChart,
  FileSpreadsheet,
  FolderOpen,
  Gauge,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Moon,
  PieChart,
  ScrollText,
  Settings,
  Share2,
  Shuffle,
  Sun,
  TrendingUp,
  User2,
  Users,
  Wallet,
  Building,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/modules/accounts/store/auth.server.store"

import { Avatar, AvatarFallback } from "@/modules/shadcnui/components/ui/avatar"
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
import logoCysteneDark from '@/modules/main/logos/cystene-black-text-with-logo.svg';
import logoCysteneLight from '@/modules/main/logos/cystene-white-text-with-logo.svg';

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)
// 3. Do NOT add className="overflow-x-hidden" to <SidebarContent> — it conflicts with no-scrollbar

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()

  // Hydration state - prevents radix-ui ID mismatch between server/client
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Theme switching functionality
  const [theme, setTheme] = useState("light")

  // Initialize theme from localStorage on component mount
  useEffect(() => {
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
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
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
      // Navigate to logout page which handles the actual logout flow
      router.push('/logout');
    } catch (err) {
      console.error('Error during sign out:', err);
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Updated Header with Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Image
            src={logoCysteneLight}
            alt="Cystene"
            width={168}
            height={39}
            className="dark:block hidden"
          />
          <Image
            src={logoCysteneDark}
            alt="Cystene"
            width={168}
            height={39}
            className="dark:hidden block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Dashboard">
                  <a href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/analytics")} tooltip="Analytics">
                  <a href="/dashboard/analytics">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Cap Table Management*/}
        <SidebarGroup>
          <SidebarGroupLabel>Capitalization Table</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cap-table/rounds")} tooltip="Rounds">
                  <a href="/dashboard/cap-table/rounds">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Rounds</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cap-table/stakeholders")} tooltip="Stakeholders">
                  <a href="/dashboard/cap-table/stakeholders">
                    <Users className="h-4 w-4" />
                    <span>Stakeholders</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cap-table/securities")} tooltip="Securities">
                  <a href="/dashboard/cap-table/securities">
                    <ScrollText className="h-4 w-4" />
                    <span>Securities</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cap-table/security-options")} tooltip="ESOP & Options">
                  <a href="/dashboard/cap-table/security-options">
                    <Share2 className="h-4 w-4" />
                    <span>ESOP & Options</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/cap-table/transactions")} tooltip="Transactions">
                  <a href="/dashboard/cap-table/transactions">
                    <Shuffle className="h-4 w-4" />
                    <span>Transactions</span>
                  </a>
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
                  <a href="/dashboard/portfolio/investments">
                    <TrendingUp className="h-4 w-4" />
                    <span>Portfolio Investments</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/portfolio/cash-flow")} tooltip="Portfolio Cash Flow">
                  <a href="/dashboard/portfolio/cash-flow">
                    <Wallet className="h-4 w-4" />
                    <span>Portfolio Cash Flow</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/portfolio/performance")} tooltip="Portfolio Performance">
                  <a href="/dashboard/portfolio/performance">
                    <BarChart3 className="h-4 w-4" />
                    <span>Portfolio Performance</span>
                  </a>
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
                <SidebarMenuButton asChild isActive={isActive("/dashboard/dealflow/pipeline")} tooltip="Deal Pipeline">
                  <a href="/dashboard/dealflow/pipeline">
                    <FolderOpen className="h-4 w-4" />
                    <span>Deal Pipeline</span>
                  </a>
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
                <SidebarMenuButton asChild isActive={isActive("/dashboard/fund/fees")} tooltip="Fees">
                  <a href="/dashboard/fund/fees">
                    <HandCoins className="h-4 w-4" />
                    <span>Fees</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Investor Reporting*/}
        <SidebarGroup>
          <SidebarGroupLabel>Investor Reporting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/investor/cap-table")} tooltip="Cap Table">
                  <a href="/dashboard/investor/cap-table">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Cap Table</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/investor/performance")} tooltip="Performance">
                  <a href="/dashboard/investor/performance">
                    <PieChart className="h-4 w-4" />
                    <span>Performance</span>
                  </a>
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
                  <a href="/dashboard/companies">
                    <Building className="h-4 w-4" />
                    <span>Companies</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/companies/financials")} tooltip="Financial Statements">
                  <a href="/dashboard/companies/financials">
                    <FileBarChart className="h-4 w-4" />
                    <span>Financial Statements</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/companies/kpis")} tooltip="KPIs">
                  <a href="/dashboard/companies/kpis">
                    <Gauge className="h-4 w-4" />
                    <span>KPIs</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard/companies/ratios")} tooltip="Ratios">
                  <a href="/dashboard/companies/ratios">
                    <PieChart className="h-4 w-4" />
                    <span>Ratios</span>
                  </a>
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
            {hasMounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    tooltip="User Profile"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.name || (user?.email ?
                          user.email.split('@')[0] :
                          'User')}
                      </span>
                      <span className="truncate text-xs">
                        {user?.email || ''}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel>User Settings</DropdownMenuLabel>

                  <DropdownMenuItem>
                    <User2 className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/dashboard/settings/billing">
                      <Settings className="mr-2 h-4 w-4" />
                      Billing & Settings
                    </a>
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
            ) : (
              <SidebarMenuButton size="lg" className="cursor-default">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">U</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">User</span>
                  <span className="truncate text-xs">&nbsp;</span>
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for collapsing the sidebar */}
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
