'use client';

import * as React from "react"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/modules/shadcnui/components/ui/sidebar"
import { TooltipProvider } from "@/modules/shadcnui/components/ui/tooltip"
import { AssetManagerSidebar } from "@/modules/assetmanager/components/assetmanager-sidebar"
import { Separator } from "@/modules/shadcnui/components/ui/separator"
import { AssetManagerBreadcrumb } from "@/modules/assetmanager/components/assetmanager-breadcrumb"
import { AccountsProviders } from '@/modules/accounts/providers/accounts-providers'
import { AssetManagerProviders } from '@/modules/assetmanager/providers/assetmanager-providers'
import { StripeSuccessHandler } from '@/modules/accounts/components/stripe-success-handler'

export default function AssetManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultOpen = true;

  return (
    <AccountsProviders>
      <AssetManagerProviders>
        <StripeSuccessHandler />
        <TooltipProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AssetManagerSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <SidebarTrigger className="-ml-1" />
                  <Separator orientation="vertical" className="mr-2 h-4" />
                  <AssetManagerBreadcrumb />
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </AssetManagerProviders>
    </AccountsProviders>
  );
}
