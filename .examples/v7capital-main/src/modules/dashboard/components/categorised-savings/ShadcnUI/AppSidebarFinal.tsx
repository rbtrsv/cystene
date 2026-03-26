"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  BarChart3,
  ChevronDown,
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

import { Avatar, AvatarFallback, AvatarImage } from "@/modules/shadcnui/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/modules/shadcnui/components/ui/collapsible"
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
import logoLight from "@/images/company/logo-v7-black.png"
import logoDark from "@/images/company/logo-v7-white.png"
import Link from "next/link"

export function AppSidebarFinal({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()

  // Theme switching functionality
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  const [open, setOpen] = useState(false)
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

  // For collapsible sections
  const [openSections, setOpenSections] = React.useState({
    overview: true,
    capTable: true,
    portfolio: true,
    dealflow: true,
    fundAdmin: true,
    investorReporting: true,
    companies: true,
  })

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Updated Header with Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center justify-center px-4 mb-6">
            <Image
              src={logoDark || "/placeholder.svg"}
              alt="V7 Capital"
              width={160}
              height={60}
              className="hidden dark:block"
            />
            <Image
              src={logoLight || "/placeholder.svg"}
              alt="V7 Capital"
              width={160}
              height={60}
              className="block dark:hidden"
            />
          </Link>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Dashboard */}
        <Collapsible
          open={openSections.overview}
          onOpenChange={() => toggleSection("overview")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Overview</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <a href="/dashboard">
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Analytics">
                      <a href="/dashboard/analytics">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analytics</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Cap Table Management*/}
        <Collapsible
          open={openSections.capTable}
          onOpenChange={() => toggleSection("capTable")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Capitalization Table</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Rounds">
                      <a href="/cap-table/rounds">
                        <CircleDollarSign className="h-4 w-4" />
                        <span>Rounds</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Stakeholders">
                      <a href="/cap-table/stakeholders">
                        <Users className="h-4 w-4" />
                        <span>Stakeholders</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Securities">
                      <a href="/cap-table/securities">
                        <ScrollText className="h-4 w-4" />
                        <span>Securities</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="ESOP & Options">
                      <a href="/cap-table/security-options">
                        <Share2 className="h-4 w-4" />
                        <span>ESOP & Options</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Transactions">
                      <a href="/cap-table/transactions">
                        <Shuffle className="h-4 w-4" />
                        <span>Transactions</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Portfolio Monitoring*/}
        <Collapsible
          open={openSections.portfolio}
          onOpenChange={() => toggleSection("portfolio")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Portfolio Monitoring</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Portfolio Investments">
                      <a href="/portfolio/investments">
                        <TrendingUp className="h-4 w-4" />
                        <span>Portfolio Investments</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Portfolio Cash Flow">
                      <a href="/portfolio/cash-flow">
                        <Wallet className="h-4 w-4" />
                        <span>Portfolio Cash Flow</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Portfolio Performance">
                      <a href="/portfolio/performance">
                        <BarChart3 className="h-4 w-4" />
                        <span>Portfolio Performance</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Dealflow Management*/}
        <Collapsible
          open={openSections.dealflow}
          onOpenChange={() => toggleSection("dealflow")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Dealflow Management</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Deal Pipeline">
                      <a href="/dealflow/pipeline">
                        <FolderOpen className="h-4 w-4" />
                        <span>Deal Pipeline</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Fund Administration*/}
        <Collapsible
          open={openSections.fundAdmin}
          onOpenChange={() => toggleSection("fundAdmin")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Fund Administration</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Fees">
                      <a href="/fund/fees">
                        <HandCoins className="h-4 w-4" />
                        <span>Fees</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Investor Reporting*/}
        <Collapsible
          open={openSections.investorReporting}
          onOpenChange={() => toggleSection("investorReporting")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Investor Reporting</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Cap Table">
                      <a href="/investor/cap-table">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Cap Table</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Performance">
                      <a href="/investor/performance">
                        <PieChart className="h-4 w-4" />
                        <span>Performance</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Companies*/}
        <Collapsible
          open={openSections.companies}
          onOpenChange={() => toggleSection("companies")}
          className="group/collapsible"
        >
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>Companies</span>
                <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Companies">
                      <a href="/companies">
                        <Building className="h-4 w-4" />
                        <span>Companies</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Financial Statements">
                      <a href="/companies/financials">
                        <FileBarChart className="h-4 w-4" />
                        <span>Financial Statements</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="KPIs">
                      <a href="/companies/kpis">
                        <Gauge className="h-4 w-4" />
                        <span>KPIs</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Ratios">
                      <a href="/companies/ratios">
                        <PieChart className="h-4 w-4" />
                        <span>Ratios</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
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
                    <AvatarFallback className="rounded-lg">AD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Fund Admin</span>
                    <span className="truncate text-xs">admin@fund.com</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
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

                <DropdownMenuItem>
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

export default AppSidebarFinal

