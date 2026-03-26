'use client';

import React from 'react';
import Sidebar from '@/modules/dashboard/components/SidebarComplex';
import { SupabaseProvider } from '@/modules/supabase/SupabaseContext';
import { Neo4jProvider } from '@/modules/neo4j/Neo4jContext';
import { SidebarProvider } from '@/modules/dashboard/components/SidebarContext';
import HydrationZustand from '@/modules/dashboard/components/HydrationZustand';

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <Sidebar>
      <div>{children}</div>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HydrationZustand>
      <SidebarProvider>
        <SupabaseProvider>
          <Neo4jProvider>
            <DashboardContent>{children}</DashboardContent>
          </Neo4jProvider>
        </SupabaseProvider>
      </SidebarProvider>
    </HydrationZustand>
  );
}
