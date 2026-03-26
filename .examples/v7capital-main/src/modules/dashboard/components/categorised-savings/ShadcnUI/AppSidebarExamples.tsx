"use client"

import * as React from "react"
import {
  BadgeCheck,
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  FileText,
  Folder,
  Forward,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Plus,
  Settings,
  Settings2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/modules/shadcnui/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/modules/shadcnui/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/modules/shadcnui/components/ui/sidebar"

/**
 * AppSidebarFinal component
 * 
 * A comprehensive showcase of all sidebar examples from the documentation:
 * - SidebarHeader with DropdownMenu
 * - Standard SidebarGroup with menu items
 * - SidebarGroup with SidebarGroupAction
 * - Collapsible SidebarGroup (expanded by default)
 * - Collapsible SidebarGroup (collapsed by default)
 * - SidebarMenuSub for nested navigation
 * - SidebarMenuBadge for notification counts
 * - SidebarMenuAction with dropdown
 * - Element that hides in icon mode
 * - SidebarSeparator for visual separation
 * - SidebarFooter with user profile
 * - SidebarRail for collapsing
 */
export function AppSidebarFinal({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isMobile } = useSidebar()

  // For workspace dropdown
  const [activeWorkspace, setActiveWorkspace] = React.useState("Acme Inc")
  
  // For projects menu state
  const [projectExpandedOpen, setProjectExpandedOpen] = React.useState(true)
  const [projectCollapsedOpen, setProjectCollapsedOpen] = React.useState(false)

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ======== EXAMPLE: SidebarHeader with DropdownMenu ======== */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{activeWorkspace}</span>
                    <span className="truncate text-xs">Enterprise</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Workspaces
                </DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => setActiveWorkspace("Acme Inc")}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Users className="size-4 shrink-0" />
                  </div>
                  Acme Inc
                  <DropdownMenuShortcut>⌘1</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setActiveWorkspace("Acme Corp")}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <Users className="size-4 shrink-0" />
                  </div>
                  Acme Corp
                  <DropdownMenuShortcut>⌘2</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add workspace</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ======== EXAMPLE: SidebarSeparator ======== */}
      <SidebarSeparator />

      <SidebarContent>
        {/* ======== EXAMPLE: Standard SidebarGroup with SidebarMenu ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>Standard SidebarGroup Example</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Menu item with isActive prop */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                  <a href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Active Menu Item Example</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* ======== EXAMPLE: SidebarMenuBadge ======== */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/inbox">
                    <Inbox className="h-4 w-4" />
                    <span>Menu Item with Badge</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuBadge>24</SidebarMenuBadge>
              </SidebarMenuItem>

              {/* Simple menu items */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/calendar">
                    <Calendar className="h-4 w-4" />
                    <span>Standard Menu Item</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* ======== EXAMPLE: SidebarMenuAction ======== */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Item with Action Button</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuAction className="peer-data-[active=true]/menu-button:opacity-100">
                  <Settings2 className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </SidebarMenuAction>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== EXAMPLE: SidebarGroup with SidebarGroupAction ======== */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel>Group with Action Button</SidebarGroupLabel>
            <SidebarGroupAction title="Add Document">
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Document</span>
            </SidebarGroupAction>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/documents/contracts">
                    <FileText className="h-4 w-4" />
                    <span>Contracts</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/documents/proposals">
                    <FileText className="h-4 w-4" />
                    <span>Proposals</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* ======== EXAMPLE: Collapsible SidebarGroup (Expanded by Default) ======== */}
        <Collapsible 
          open={projectExpandedOpen} 
          onOpenChange={setProjectExpandedOpen}
          defaultOpen={true}
          className="group/collapsible"
        >
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center">
                  Expanded Collapsible Group
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <SidebarGroupAction title="Add Project">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Project</span>
              </SidebarGroupAction>
            </div>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* ======== EXAMPLE: SidebarMenuItem with DropdownMenu action ======== */}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/projects/website-redesign">
                        <Folder className="h-4 w-4" />
                        <span>Item with Dropdown Action</span>
                      </a>
                    </SidebarMenuButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction showOnHover>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-48 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align={isMobile ? "end" : "start"}
                      >
                        <DropdownMenuItem>
                          <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>View Project</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Forward className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Share Project</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Delete Project</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/projects/marketing-campaign">
                        <Folder className="h-4 w-4" />
                        <span>Marketing Campaign</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />
        
        {/* ======== EXAMPLE: Collapsible SidebarGroup (Collapsed by Default) ======== */}
        <Collapsible 
          open={projectCollapsedOpen} 
          onOpenChange={setProjectCollapsedOpen}
          defaultOpen={false}
          className="group/collapsible"
        >
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex items-center">
                  Collapsed Collapsible Group
                  <ChevronDown className="ml-2 h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <SidebarGroupAction title="Add Task">
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add Task</span>
              </SidebarGroupAction>
            </div>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/tasks/pending">
                        <Folder className="h-4 w-4" />
                        <span>Pending Tasks</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <a href="/tasks/completed">
                        <Folder className="h-4 w-4" />
                        <span>Completed Tasks</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* ======== EXAMPLE: SidebarMenu with SidebarMenuSub (submenu) ======== */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu with Submenu Examples</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* ======== EXAMPLE: Collapsible Menu Item (Expanded by Default) ======== */}
              <Collapsible defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Home className="h-4 w-4" />
                      <span>Expanded by Default</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/docs/getting-started">
                            <span>Submenu Item 1</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/docs/components">
                            <span>Submenu Item 2</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/docs/api-reference">
                            <span>Submenu Item 3</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* ======== EXAMPLE: Collapsible Menu Item (Collapsed by Default) ======== */}
              <Collapsible defaultOpen={false} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Settings2 className="h-4 w-4" />
                      <span>Collapsed by Default</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/help/faqs">
                            <span>FAQ Submenu Item</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/help/contact">
                            <span>Contact Submenu Item</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              
              {/* ======== EXAMPLE: Menu Item with Active Submenu Item ======== */}
              <Collapsible defaultOpen={true} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <BookOpen className="h-4 w-4" />
                      <span>With Active Submenu Item</span>
                      <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/resources/overview">
                            <span>Overview</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive>
                          <a href="/resources/guides">
                            <span>Guides (Active)</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild>
                          <a href="/resources/tutorials">
                            <span>Tutorials</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* ======== EXAMPLE: Group that hides in icon mode ======== */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Hidden When Collapsed to Icons</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/admin/users">
                    <Users className="h-4 w-4" />
                    <span>This Group Hides in Icon Mode</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ======== EXAMPLE: SidebarFooter with user profile dropdown ======== */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="/avatars/user.jpg" alt="User" />
                    <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">John Doe</span>
                    <span className="truncate text-xs">john.doe@example.com</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatars/user.jpg" alt="User" />
                      <AvatarFallback className="rounded-lg">JD</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">John Doe</span>
                      <span className="truncate text-xs">john.doe@example.com</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
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

      {/* ======== EXAMPLE: SidebarRail for collapsing the sidebar ======== */}
      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebarFinal