'use client';

import { SupabaseProvider } from '@/modules/supabase/SupabaseContext';

export default function SupabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <div>{children}</div>
    </SupabaseProvider>
  );
}
