'use client';

import * as React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/modules/shadcnui/components/ui/sidebar"
import { TooltipProvider } from "@/modules/shadcnui/components/ui/tooltip"
import { CybersecuritySidebar } from "@/modules/cybersecurity/components/cybersecurity-sidebar"
import { Separator } from "@/modules/shadcnui/components/ui/separator"
import { CybersecurityBreadcrumb } from "@/modules/cybersecurity/components/cybersecurity-breadcrumb"
import { AccountsProviders } from '@/modules/accounts/providers/accounts-providers'
import { CybersecurityProviders } from '@/modules/cybersecurity/providers/cybersecurity-providers'
import { StripeSuccessHandler } from '@/modules/accounts/components/stripe-success-handler'

export default function CybersecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = true;

  return (
    <AccountsProviders>
      <CybersecurityProviders>
        <StripeSuccessHandler />
        <TooltipProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <CybersecuritySidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <CybersecurityBreadcrumb />
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </CybersecurityProviders>
    </AccountsProviders>
  );
}
