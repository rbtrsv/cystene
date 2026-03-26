'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/modules/accounts/utils/supabase/supabase-client';

export default function SignOutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Variable to track if component is mounted
    let isMounted = true;
    
    const performSignOut = async () => {
      try {
        // Create Supabase client and sign out directly
        const supabase = createClient();
        await supabase.auth.signOut();
        
        // Clear any auth-related items from local storage
        if (typeof window !== 'undefined') {
          const localStorageKeys = Object.keys(localStorage);
          localStorageKeys.forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
          
          // Clear all sessionStorage
          sessionStorage.clear();
        }
        
        // If component is still mounted, redirect
        if (isMounted) {
          setTimeout(() => {
            router.push('/accounts/login');
          }, 1000);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to sign out properly. Try clearing your browser cookies.');
          
          // Still attempt to redirect after a delay
          setTimeout(() => {
            router.push('/accounts/login');
          }, 3000);
        }
      }
    };
    
    performSignOut();
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">
        {error || "Signing out..."}
      </p>
    </div>
  );
} 