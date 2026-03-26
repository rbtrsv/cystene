'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GitBranch, Loader2, Plus } from 'lucide-react';
import { useUserVariants } from '@/modules/nexotype/hooks/user/use-user-variants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** User variant list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function UserVariantsPage() {
  const router = useRouter();
  const { userVariants, isLoading, error } = useUserVariants();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return userVariants;
    return userVariants.filter((item) => String(item.subject_id).includes(term) || String(item.variant_id).includes(term) || item.zygosity.toLowerCase().includes(term));
  }, [userVariants, search]);

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
<h1 className="text-3xl font-bold tracking-tight">User Variants</h1>
<p className="text-muted-foreground">Manage per-subject genomic variant links</p>
</div>
<Link href="/user-variants/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create User Variant</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>User Variants</CardTitle>
<CardDescription>All user variant records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by subject_id, variant_id, zygosity..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No user variants found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Subject ID</TableHead>
<TableHead>Variant ID</TableHead>
<TableHead>Zygosity</TableHead>
<TableHead>Created</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/user-variants/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell>{item.variant_id}</TableCell>
<TableCell>{item.zygosity}</TableCell>
<TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/user-variants/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {userVariants.length} user variants</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
