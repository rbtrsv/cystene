'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, User2 } from 'lucide-react';
import { useUserProfiles } from '@/modules/nexotype/hooks/user/use-user-profiles';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** User profile list page with lightweight local search. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserProfilesPage() {
  const router = useRouter();
  const { userProfiles, isLoading, error } = useUserProfiles();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return userProfiles;
    return userProfiles.filter((item) =>
      String(item.id).includes(term) ||
      String(item.user_id).includes(term) ||
      String(item.subject_id).includes(term)
    );
  }, [userProfiles, search]);

    // Guard: loading state.
  if (isLoading) return <div className="flex items-center justify-center p-8">
<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>;
    // Guard: error state.
  if (error) return <Alert variant="destructive">
<AlertDescription>{error}</AlertDescription>
</Alert>;

    // Render page content.
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
<h1 className="text-3xl font-bold tracking-tight">User Profiles</h1>
<p className="text-muted-foreground">Map account users to subject records</p>
</div>
        <Link href="/user-profiles/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create User Profile</Button>
</Link>
      </div>
      <Card>
        <CardHeader>
<CardTitle>User Profiles</CardTitle>
<CardDescription>All user profile records</CardDescription>
</CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search by id, user_id, subject_id..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {filtered.length === 0 ? (
            <div className="py-12 flex flex-col items-center">
<User2 className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No user profiles found</p>
</div>
          ) : (
            <>
              <Table>
                <TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>User ID</TableHead>
<TableHead>Subject ID</TableHead>
<TableHead>Created</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
                <TableBody>{filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/user-profiles/${item.id}/details`)}>
                    <TableCell>{item.id}</TableCell>
<TableCell>{item.user_id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/user-profiles/${item.id}/details`); }}>View</Button>
</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filtered.length} of {userProfiles.length} user profiles</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
