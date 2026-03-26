'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Plus, Puzzle } from 'lucide-react';
import { useConstructs } from '@/modules/nexotype/hooks/engineering/use-constructs';
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
export default function ConstructsPage() {
  const router = useRouter();
  const { constructs, isLoading, error } = useConstructs();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    if (!t) return constructs;
    return constructs.filter((c) => String(c.id).includes(t) || String(c.candidate_id).includes(t) || (c.plasmid_map_url ?? '').toLowerCase().includes(t));
  }, [constructs, search]);

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
<h1 className="text-3xl font-bold tracking-tight">Constructs</h1>
<p className="text-muted-foreground">Manage construct records per candidate</p>
</div>
        <Link href="/constructs/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Construct</Button>
</Link>
      </div>
      <Card>
        <CardHeader>
<CardTitle>Constructs</CardTitle>
<CardDescription>All construct records</CardDescription>
</CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
<Label htmlFor="search">Search</Label>
<Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ID, candidate ID, URL..." />
</div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
<Puzzle className="h-12 w-12 text-muted-foreground mb-4" />{constructs.length === 0 && <Link href="/constructs/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Construct</Button>
</Link>}</div>
          ) : (
            <Table>
              <TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Candidate ID</TableHead>
<TableHead>Plasmid Map URL</TableHead>
<TableHead>Created</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/constructs/${item.id}/details`)}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.candidate_id}</TableCell>
                    <TableCell>{item.plasmid_map_url ?? '—'}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/constructs/${item.id}/details`); }}>View</Button>
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
