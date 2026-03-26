'use client';

import React, { useState, useEffect } from 'react';
import PremiumContent from '@/modules/supabase/components/PremiumContent';
import {
  SupabaseProvider,
  useSupabase,
} from '@/modules/supabase/SupabaseContext';
import { Neo4jProvider } from '@/modules/neo4j/Neo4jContext';

function DashboardPremiumContent({ children }: { children: React.ReactNode }) {
  const { user, session } = useSupabase();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [user, session]);

  if (loading) return null;

  if (!user) {
    return <PremiumContent />;
  }

  return <div>{children}</div>;
}

export default function DashboardPremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <Neo4jProvider>
        <DashboardPremiumContent>{children}</DashboardPremiumContent>
      </Neo4jProvider>
    </SupabaseProvider>
  );
}
