'use client';

import { useAuthStore } from '@/modules/accounts/store/auth.store';
import { Card, CardContent } from '@/modules/shadcnui/components/ui/card';
import { Badge } from '@/modules/shadcnui/components/ui/badge';

export function AuthStateDebugger() {
  const { user, profile, isLoading, error } = useAuthStore();
  
  return (
    <div className="space-y-6">
      {/* Authentication Status */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">Status:</h3>
          {isLoading ? (
            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
              Loading...
            </Badge>
          ) : user && profile ? (
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              Authenticated
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
              Not Authenticated
            </Badge>
          )}
        </div>
        
        {error && (
          <div className="p-3 mb-4 bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-300 text-sm rounded-md">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      
      {/* Supabase User */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">Supabase User</h3>
          {user ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(user, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 italic">No user data available</p>
          )}
        </CardContent>
      </Card>
      
      {/* User Profile */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-2">User Profile</h3>
          {profile ? (
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-x-auto">
              <pre className="text-xs">{JSON.stringify(profile, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 italic">No profile data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 