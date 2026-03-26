'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/modules/accounts/utils/supabase/supabase-client';
import { Loader2 } from 'lucide-react';

/**
 * A simple verification page that redirects users after email verification
 */
export default function VerifyPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Simple function to check auth status and redirect appropriately
    async function handleVerification() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      
      // Redirect based on session status
      if (data.session) {
        router.push('/dashboard');
      } else {
        router.push('/accounts/login?verified=true');
      }
    }
    
    // Run verification check and redirect
    handleVerification().catch(() => {
      // Fallback to login page if anything goes wrong
      router.push('/accounts/login');
    });
  }, [router]);
  
  // Simple loading UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">
        Verifying your account...
      </p>
    </div>
  );
} 