"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  Moon,
  Sun,
  User2,
  Building2,
  Server,
  KeyRound,
  Target,
  FileCode,
  Calendar,
  Play,
  AlertTriangle,
  Globe,
  FileBarChart,
  LayoutDashboard,
  ChevronsUpDown,
  Check,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuthStore } from "@/modules/accounts/store/auth.server.store"
import { useOrganizations } from "@/modules/accounts/hooks/use-organizations"

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
import logoCysteneDark from '@/modules/main/logos/cystene-black-text-with-logo.svg';
import logoCysteneLight from '@/modules/main/logos/cystene-white-text-with-logo.svg';

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)
// 3. Do NOT add className="overflow-x-hidden" to <SidebarContent> — it conflicts with no-scrollbar

export function CybersecuritySidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()

  // Organization data for switcher
  const { organizations, activeOrganization, setActiveOrganization } = useOrganizations()

  // Popover open/close state for organization switcher
  const [orgPopoverOpen, setOrgPopoverOpen] = useState(false)

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
    // Exact match for home
    if (path === "/" && pathname === "/") {
      return true
    }

    // For other routes, check if the pathname starts with the path
    // Why startsWith: /findings/123 should keep "Findings" sidebar item active
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
      {/* Header with Cystene Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Image
            src={logoCysteneLight}
            alt="Cystene"
            width={120}
            height={32}
            className="dark:block hidden"
          />
          <Image
            src={logoCysteneDark}
            alt="Cystene"
            width={120}
            height={32}
            className="dark:hidden block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Organization Switcher - hidden when sidebar is collapsed to icon mode */}
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

        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Overview">
                  <Link href="/">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Infrastructure */}
        <SidebarGroup>
          <SidebarGroupLabel>Infrastructure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/infrastructure")} tooltip="Infrastructure">
                  <Link href="/infrastructure">
                    <Server className="h-4 w-4" />
                    <span>Infrastructure</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/credentials")} tooltip="Credentials">
                  <Link href="/credentials">
                    <KeyRound className="h-4 w-4" />
                    <span>Credentials</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scan-targets")} tooltip="Scan Targets">
                  <Link href="/scan-targets">
                    <Target className="h-4 w-4" />
                    <span>Scan Targets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Scanning */}
        <SidebarGroup>
          <SidebarGroupLabel>Scanning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scan-templates")} tooltip="Scan Templates">
                  <Link href="/scan-templates">
                    <FileCode className="h-4 w-4" />
                    <span>Scan Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scan-schedules")} tooltip="Scan Schedules">
                  <Link href="/scan-schedules">
                    <Calendar className="h-4 w-4" />
                    <span>Scan Schedules</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/scan-jobs")} tooltip="Scan Jobs">
                  <Link href="/scan-jobs">
                    <Play className="h-4 w-4" />
                    <span>Scan Jobs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Results */}
        <SidebarGroup>
          <SidebarGroupLabel>Results</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/findings")} tooltip="Findings">
                  <Link href="/findings">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Findings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/assets")} tooltip="Assets">
                  <Link href="/assets">
                    <Globe className="h-4 w-4" />
                    <span>Assets</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/reports")} tooltip="Reports">
                  <Link href="/reports">
                    <FileBarChart className="h-4 w-4" />
                    <span>Reports</span>
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

export default CybersecuritySidebar
