'use client';

import * as React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/modules/shadcnui/components/ui/sidebar"
import { AppSidebar } from "@/modules/dashboard/components/app-sidebar"
import { Separator } from "@/modules/shadcnui/components/ui/separator"
import { DynamicBreadcrumb } from "@/modules/dashboard/components/dynamic-breadcrumb"
import { AccountsProviders } from '@/modules/accounts/providers/accounts-providers'
import { StripeSuccessHandler } from '@/modules/accounts/components/stripe-success-handler'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: cookies() can't be used in client components, so we'll handle sidebar state differently
  const defaultOpen = true; // Default to open, or manage this with client-side state

  return (
    <AccountsProviders>
      <StripeSuccessHandler />
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <DynamicBreadcrumb />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AccountsProviders>
  );
}
