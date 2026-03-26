'use client';

import { Button } from '@/modules/shadcnui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { useAuthStore } from '@/modules/accounts/store/auth.store';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, profile } = useAuthStore();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Profile</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <div className="space-y-3">
                <p><strong>User ID:</strong> {user.id}</p>
                {profile && (
                  <>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Name:</strong> {profile.name || 'Not set'}</p>
                    <p><strong>Role:</strong> {profile.role || 'Standard User'}</p>
                  </>
                )}
              </div>
            ) : (
              <p>Loading profile information...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
