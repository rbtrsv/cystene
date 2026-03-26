'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Scissors } from 'lucide-react';
import { useDesignMutations } from '@/modules/nexotype/hooks/engineering/use-design-mutations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/**
 * Page component for this route.
 */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function DesignMutationsPage() {
  const router = useRouter();
  const { designMutations, isLoading, error } = useDesignMutations();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    if (!t) return designMutations;
    return designMutations.filter((m) =>
      String(m.candidate_id).includes(t) ||
      String(m.position).includes(t) ||
      m.wild_type.toLowerCase().includes(t) ||
      m.mutant.toLowerCase().includes(t)
    );
  }, [designMutations, search]);

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
<h1 className="text-3xl font-bold tracking-tight">Design Mutations</h1>
<p className="text-muted-foreground">Manage design mutations linked to candidate positions</p>
</div>
        <Link href="/design-mutations/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Design Mutation</Button>
</Link>
      </div>
      <Card>
        <CardHeader>
<CardTitle>Design Mutations</CardTitle>
<CardDescription>All design mutation records</CardDescription>
</CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
<Label htmlFor="search">Search</Label>
<Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by candidate ID, position, WT, mutant..." />
</div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
<Scissors className="h-12 w-12 text-muted-foreground mb-4" />{designMutations.length === 0 && <Link href="/design-mutations/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Design Mutation</Button>
</Link>}</div>
          ) : (
            <Table>
              <TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Candidate ID</TableHead>
<TableHead>Position</TableHead>
<TableHead>Wild Type</TableHead>
<TableHead>Mutant</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/design-mutations/${item.id}/details`)}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.candidate_id}</TableCell>
                    <TableCell>{item.position}</TableCell>
                    <TableCell>{item.wild_type}</TableCell>
                    <TableCell>{item.mutant}</TableCell>
                    <TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/design-mutations/${item.id}/details`); }}>View</Button>
</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
