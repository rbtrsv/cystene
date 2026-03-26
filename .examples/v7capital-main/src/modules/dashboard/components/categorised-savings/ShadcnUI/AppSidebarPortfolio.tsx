"use client"

import * as React from "react"
import {
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  FileSpreadsheet,
  FolderOpen,
  Gauge,
  HandCoins,
  Landmark,
  LayoutDashboard,
  LogOut,
  PieChart,
  Plus,
  ScrollText,
  Settings,
  Share2,
  Shuffle,
  TrendingUp,
  User2,
  Users,
  Wallet,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/modules/shadcnui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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


export function AppSidebarFinal({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  
  // For fund selector dropdown
  const [activeFund, setActiveFund] = React.useState("Growth Fund I")

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Fund Selector Header with Dropdown */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  tooltip="Select Fund"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Landmark className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeFund}</span>
                    <span className="truncate text-xs">$100M AUM</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
                <DropdownMenuLabel>Overview</DropdownMenuLabel>
                
                <DropdownMenuItem 
                  onClick={() => setActiveFund("Growth Fund I")}
                  className="gap-2 p-2"
                >
                  <Landmark className="h-4 w-4" />
                  Growth Fund I
                  <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setActiveFund("Growth Fund II")}
                  className="gap-2 p-2"
                >
                  <Landmark className="h-4 w-4" />
                  Growth Fund II
                  <DropdownMenuShortcut>⌘2</DropdownMenuShortcut>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="gap-2 p-2">
                  <Plus className="h-4 w-4" />
                  <div className="font-medium text-muted-foreground">Add new fund</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Cap Table Management*/}
        <SidebarGroup>
          <SidebarGroupLabel>Capitalization Table</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Portfolio Monitoring*/}
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio Monitoring</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Dealflow Management*/}
        <SidebarGroup>
          <SidebarGroupLabel>Dealflow Management</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Fund Administration*/}
        <SidebarGroup>
          <SidebarGroupLabel>Fund Administration</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Investor Reporting*/}
        <SidebarGroup>
          <SidebarGroupLabel>Investor Reporting</SidebarGroupLabel>
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
        </SidebarGroup>

        <SidebarSeparator />

        {/* Companies*/}
        <SidebarGroup>
          <SidebarGroupLabel>Companies</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
        </SidebarGroup>
      </SidebarContent>

      {/* User Profile in Footer */}
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
                <DropdownMenuLabel>Overview</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User2 className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
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