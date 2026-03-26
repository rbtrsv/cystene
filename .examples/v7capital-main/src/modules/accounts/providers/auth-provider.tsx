'use client';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { refreshUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      setError(null);
      try {
        // Use refreshUser which handles setting loading and error states
        await refreshUser();
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Failed to load user data';
        console.error('Error in AuthProvider:', error);
        setError(errorMessage);
      }
    }
    
    fetchUserData();
  }, [refreshUser]);

  // We could display an error message here if needed
  return <>{children}</>;
}
