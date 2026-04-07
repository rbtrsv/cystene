"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  Moon,
  Sun,
  User2,
  Building,
  Building2,
  Users,
  CircleDollarSign,
  Shield,
  ArrowLeftRight,
  HandCoins,
  Handshake,
  UserCheck,
  Receipt,
  TrendingUp,
  TrendingUpDown,
  ChevronsUpDown,
  Check,
  FileBarChart,
  Calculator,
  BarChart3,
  Settings,
  Gauge,
  Wallet,
  Eye,
  Banknote,
  Search,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/modules/accounts/store/auth.server.store"
import { useOrganizations } from "@/modules/accounts/hooks/use-organizations"
import { useEntities } from "@/modules/assetmanager/hooks/entity/use-entities"

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/modules/shadcnui/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/modules/shadcnui/components/ui/command"
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
import logoFinpyDark from '@/modules/main/logos/finpy_black_text_with_logo.svg';
import logoFinpyLight from '@/modules/main/logos/finpy_white_text_with_logo.svg';

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)
// 3. Do NOT add className="overflow-x-hidden" to <SidebarContent> — it conflicts with no-scrollbar

export function AssetManagerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()

  // Organization and entity data for switchers
  const { organizations, activeOrganization, setActiveOrganization } = useOrganizations()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { entities, activeEntity, setActiveEntity, fetchEntities, getEntitiesByOrganization } = useEntities()

  // Popover open/close state for organization and entity switchers
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false)
  const [entityPopoverOpen, setEntityPopoverOpen] = useState(false)

  // Hydration state - prevents radix-ui ID mismatch between server/client
  const [hasMounted, setHasMounted] = useState(false)
  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Fetch all entities when active organization changes
  // Why: store holds ALL accessible entities across all user's orgs
  // Sidebar filters client-side via getEntitiesByOrganization() below
  useEffect(() => {
    if (activeOrganization) {
      fetchEntities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrganization])

  // Get entities filtered by active organization
  const orgEntities = activeOrganization
    ? getEntitiesByOrganization(activeOrganization.id)
    : []

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
    // Exact match for home
    if (path === "/" && pathname === "/") {
      return true
    }

    // For other routes, check if the pathname starts with the path
    return pathname === path || (pathname.startsWith(path) && path !== "/")
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
            src={logoFinpyLight}
            alt="Logo"
            width={120}
            height={32}
            className="dark:block hidden"
          />
          <Image
            src={logoFinpyDark}
            alt="Logo"
            width={120}
            height={32}
            className="dark:hidden block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Organization & Entity Switchers - hidden when sidebar is collapsed to icon mode */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Organization Switcher */}
              <SidebarMenuItem>
                <Popover open={orgPopoverOpen} onOpenChange={setOrgPopoverOpen}>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      tooltip={activeOrganization?.name || "Select Organization"}
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Building2 className="h-4 w-4" />
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {activeOrganization?.name || "Select Organization"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {activeOrganization?.role
                            ? activeOrganization.role.charAt(0) + activeOrganization.role.slice(1).toLowerCase()
                            : "Organization"}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] min-w-56 p-0"
                    side={isMobile ? "bottom" : "right"}
                    align="start"
                    sideOffset={4}
                  >
                    <Command>
                      <CommandInput placeholder="Search organization..." />
                      <CommandList>
                        <CommandEmpty>No organizations found.</CommandEmpty>
                        <CommandGroup>
                          {organizations.map((org) => (
                            <CommandItem
                              key={org.id}
                              value={org.name}
                              onSelect={() => {
                                setActiveOrganization(org.id)
                                setOrgPopoverOpen(false)
                              }}
                            >
                              <Building2 className="h-4 w-4" />
                              <span>{org.name}</span>
                              {activeOrganization?.id === org.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>

              {/* Entity Switcher - only shown when organization is selected */}
              {activeOrganization && (
                <SidebarMenuItem>
                  <Popover open={entityPopoverOpen} onOpenChange={setEntityPopoverOpen}>
                    <PopoverTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        tooltip={activeEntity?.name || "Select Entity"}
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Building className="h-4 w-4" />
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {activeEntity?.name || "Select Entity"}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {activeEntity?.entity_type
                              ? activeEntity.entity_type.charAt(0).toUpperCase() + activeEntity.entity_type.slice(1)
                              : "Entity"}
                          </span>
                        </div>
                        <ChevronsUpDown className="ml-auto h-4 w-4" />
                      </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] min-w-56 p-0"
                      side={isMobile ? "bottom" : "right"}
                      align="start"
                      sideOffset={4}
                    >
                      <Command>
                        <CommandInput placeholder="Search entity..." />
                        <CommandList>
                          <CommandEmpty>No entities found.</CommandEmpty>
                          <CommandGroup>
                            {orgEntities.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.name}
                                onSelect={() => {
                                  setActiveEntity(entity.id)
                                  setEntityPopoverOpen(false)
                                }}
                              >
                                <Building className="h-4 w-4" />
                                <span>{entity.name}</span>
                                {activeEntity?.id === entity.id && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Organizations */}
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/organizations")} tooltip="Organizations">
                  <Link href="/organizations">
                    <Building2 className="h-4 w-4" />
                    <span>Organizations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Entities */}
        <SidebarGroup>
          <SidebarGroupLabel>Entities</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/entities")} tooltip="Entities">
                  <Link href="/entities">
                    <Building className="h-4 w-4" />
                    <span>Entities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/entities/discover")} tooltip="Discover Entities">
                  <Link href="/entities/discover">
                    <Search className="h-4 w-4" />
                    <span>Discover Entities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Cap Table */}
        <SidebarGroup>
          <SidebarGroupLabel>Cap Table</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/stakeholders")} tooltip="Stakeholders">
                  <Link href="/stakeholders">
                    <Users className="h-4 w-4" />
                    <span>Stakeholders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/funding-rounds")} tooltip="Funding Rounds">
                  <Link href="/funding-rounds">
                    <CircleDollarSign className="h-4 w-4" />
                    <span>Funding Rounds</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/securities")} tooltip="Securities">
                  <Link href="/securities">
                    <Shield className="h-4 w-4" />
                    <span>Securities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/security-transactions")} tooltip="Transactions">
                  <Link href="/security-transactions">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Transactions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/commitments-sent")} tooltip="Commitments Sent">
                  <Link href="/commitments-sent">
                    <UserCheck className="h-4 w-4" />
                    <span>Commitments Sent</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/fees")} tooltip="Fees">
                  <Link href="/fees">
                    <Receipt className="h-4 w-4" />
                    <span>Fees</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Portfolio */}
        <SidebarGroup>
          <SidebarGroupLabel>Portfolio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/deal-pipeline")} tooltip="Deal Pipeline">
                  <Link href="/deal-pipeline">
                    <Handshake className="h-4 w-4" />
                    <span>Deal Pipeline</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/holdings")} tooltip="Holdings">
                  <Link href="/holdings">
                    <Wallet className="h-4 w-4" />
                    <span>Holdings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/holding-cash-flows")} tooltip="Holding Cash Flows">
                  <Link href="/holding-cash-flows">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Holding Cash Flows</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/holding-performance")} tooltip="Holding Performance">
                  <Link href="/holding-performance">
                    <TrendingUp className="h-4 w-4" />
                    <span>Holding Performance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/valuations")} tooltip="Valuations">
                  <Link href="/valuations">
                    <TrendingUpDown className="h-4 w-4" />
                    <span>Valuations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Fundraising */}
        <SidebarGroup>
          <SidebarGroupLabel>Fundraising</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/entity-deal-profiles")} tooltip="Deal Profiles">
                  <Link href="/entity-deal-profiles">
                    <User2 className="h-4 w-4" />
                    <span>Deal Profiles</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/deals")} tooltip="Deals">
                  <Link href="/deals">
                    <Handshake className="h-4 w-4" />
                    <span>Deals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/deal-commitments")} tooltip="Deal Commitments">
                  <Link href="/deal-commitments">
                    <HandCoins className="h-4 w-4" />
                    <span>Deal Commitments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Stakeholder Relations */}
        <SidebarGroup>
          <SidebarGroupLabel>Stakeholder Relations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/commitments-received")} tooltip="Commitments Received">
                  <Link href="/commitments-received">
                    <HandCoins className="h-4 w-4" />
                    <span>Commitments Received</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/stakeholder-positions")} tooltip="Positions">
                  <Link href="/stakeholder-positions">
                    <Eye className="h-4 w-4" />
                    <span>Positions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/distributions")} tooltip="Distributions">
                  <Link href="/distributions">
                    <Banknote className="h-4 w-4" />
                    <span>Distributions</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Financials */}
        <SidebarGroup>
          <SidebarGroupLabel>Financials</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/income-statements")} tooltip="Income Statements">
                  <Link href="/income-statements">
                    <FileBarChart className="h-4 w-4" />
                    <span>Income Statements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/cash-flow-statements")} tooltip="Cash Flow Statements">
                  <Link href="/cash-flow-statements">
                    <ArrowLeftRight className="h-4 w-4" />
                    <span>Cash Flow Statements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/balance-sheets")} tooltip="Balance Sheets">
                  <Link href="/balance-sheets">
                    <Calculator className="h-4 w-4" />
                    <span>Balance Sheets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/financial-metrics")} tooltip="Financial Metrics">
                  <Link href="/financial-metrics">
                    <Gauge className="h-4 w-4" />
                    <span>Financial Metrics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/kpis")} tooltip="KPIs">
                  <Link href="/kpis">
                    <Settings className="h-4 w-4" />
                    <span>KPIs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/kpi-values")} tooltip="KPI Values">
                  <Link href="/kpi-values">
                    <BarChart3 className="h-4 w-4" />
                    <span>KPI Values</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Reporting */}
        <SidebarGroup>
          <SidebarGroupLabel>Reporting</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/reporting")} tooltip="Reporting">
                  <Link href="/reporting">
                    <FileBarChart className="h-4 w-4" />
                    <span>Reporting</span>
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

                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">
                      <User2 className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
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

export default AssetManagerSidebar
