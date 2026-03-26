"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
  LogOut,
  Moon,
  Sun,
  User2,
  Building,
  PlugZap,
  Settings,
  TrendingUp,
  LayoutGrid,
  BarChart3,
  BookOpen,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import logoNudgioDark from '@/modules/main/logos/nudgio_black_text_with_logo.svg';
import logoNudgioLight from '@/modules/main/logos/nudgio_white_text_with_logo.svg';
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

// After `npx shadcn@latest add sidebar` re-apply these fixes in sidebar.tsx:
// 1. CSS vars: w-[--sidebar-width] → w-(--sidebar-width), same for w-icon and max-w-skeleton
// 2. Scrollbar: add `no-scrollbar` class to SidebarContent (requires @utility in globals.css)
// 3. Do NOT add className="overflow-x-hidden" to <SidebarContent> — it conflicts with no-scrollbar

export function EcommerceSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
      {/* Header with Logo */}
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <Image
            src={logoNudgioLight}
            alt="Nudgio"
            width={168}
            height={39}
            className="dark:block hidden"
          />
          <Image
            src={logoNudgioDark}
            alt="Nudgio"
            width={168}
            height={39}
            className="dark:hidden block"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Organizations */}
        <SidebarGroup>
          <SidebarGroupLabel>Organizations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/organizations")} tooltip="Organizations">
                  <Link href="/organizations">
                    <Building className="h-4 w-4" />
                    <span>Organizations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Ecommerce */}
        <SidebarGroup>
          <SidebarGroupLabel>Ecommerce</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/connections")} tooltip="Connections">
                  <Link href="/connections">
                    <PlugZap className="h-4 w-4" />
                    <span>Connections</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")} tooltip="Settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/recommendations")} tooltip="Recommendations">
                  <Link href="/recommendations">
                    <TrendingUp className="h-4 w-4" />
                    <span>Recommendations</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/components")} tooltip="Components">
                  <Link href="/components">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Components</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/analytics")} tooltip="Analytics">
                  <Link href="/analytics">
                    <BarChart3 className="h-4 w-4" />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/documentation")} tooltip="Documentation">
                  <Link href="/documentation">
                    <BookOpen className="h-4 w-4" />
                    <span>Documentation</span>
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

export default EcommerceSidebar
