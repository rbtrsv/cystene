import * as React from "react"
import { cookies } from "next/headers"

// Force dynamic rendering for all dashboard pages (uses cookies for auth)
export const dynamic = 'force-dynamic'
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/modules/shadcnui/components/ui/sidebar"
import { AppSidebar } from "@/modules/dashboard/components/app-sidebar"
import { Separator } from "@/modules/shadcnui/components/ui/separator"
import { DynamicBreadcrumb } from "@/modules/dashboard/components/dynamic-bread-crumb"
import AuthProvider from "@/modules/accounts/providers/auth-provider"
import AssetsProvider from "@/modules/assetmanager/providers/assets-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"

  return (
    <>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <AuthProvider>
              <AssetsProvider>
                {children}
              </AssetsProvider>
            </AuthProvider>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
