'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Route, Loader2, Plus } from 'lucide-react';
import { usePathwayScores } from '@/modules/nexotype/hooks/user/use-pathway-scores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/modules/shadcnui/components/ui/table';

/** Pathway score list page with local search support. */
// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function PathwayScoresPage() {
  const router = useRouter();
  const { pathwayScores, isLoading, error } = usePathwayScores();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return pathwayScores;
    return pathwayScores.filter((item) => String(item.subject_id).includes(term) || String(item.pathway_id).includes(term) || String(item.score).includes(term));
  }, [pathwayScores, search]);

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
<h1 className="text-3xl font-bold tracking-tight">Pathway Scores</h1>
<p className="text-muted-foreground">Manage computed pathway activity scores by subject</p>
</div>
<Link href="/pathway-scores/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Pathway Score</Button>
</Link>
</div>
      <Card>
<CardHeader>
<CardTitle>Pathway Scores</CardTitle>
<CardDescription>All pathway score records</CardDescription>
</CardHeader>
<CardContent className="space-y-4">
        <Input placeholder="Search by subject_id, pathway_id, score..." value={search} onChange={(e) => setSearch(e.target.value)} />
        {filtered.length === 0 ? <div className="py-12 flex flex-col items-center">
<Route className="h-12 w-12 text-muted-foreground mb-4" />
<p className="text-muted-foreground">No pathway scores found</p>
</div> : (
          <>
            <Table>
<TableHeader>
<TableRow>
<TableHead>ID</TableHead>
<TableHead>Subject</TableHead>
<TableHead>Pathway</TableHead>
<TableHead>Score</TableHead>
<TableHead>Calculated At</TableHead>
<TableHead>Actions</TableHead>
</TableRow>
</TableHeader>
<TableBody>{filtered.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/pathway-scores/${item.id}/details`)}>
<TableCell>{item.id}</TableCell>
<TableCell>{item.subject_id}</TableCell>
<TableCell>{item.pathway_id}</TableCell>
<TableCell>{item.score}</TableCell>
<TableCell>{new Date(item.calculated_at).toLocaleString()}</TableCell>
<TableCell>
<Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/pathway-scores/${item.id}/details`); }}>View</Button>
</TableCell>
</TableRow>
            ))}</TableBody>
</Table>
            <p className="text-sm text-muted-foreground">Showing {filtered.length} of {pathwayScores.length} pathway scores</p>
          </>
        )}
      </CardContent>
</Card>
    </div>
  );
}
