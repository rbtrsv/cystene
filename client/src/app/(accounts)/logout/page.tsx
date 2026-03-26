'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Client auth (comment out to switch back):
// import { useAuth } from '@/modules/accounts/hooks/use-auth-client';

// Server auth (current):
import { useAuth } from '@/modules/accounts/hooks/use-auth-server';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth();
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Use the auth hook logout (handles token invalidation and cleanup)
        await logout();
        
        // Small delay to ensure state updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Redirect to login
        router.push('/login');
        
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, redirect to login
        router.push('/login');
      }
    };
    
    performLogout();
  }, [logout, router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-white dark:bg-black">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-lg shadow-md overflow-hidden border border-zinc-200 dark:border-zinc-700 p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-zinc-600 dark:text-zinc-400" />
        <h1 className="text-2xl font-semibold mb-3 text-zinc-900 dark:text-white">Logging out...</h1>
        <p className="text-zinc-500 dark:text-zinc-400">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
