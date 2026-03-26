'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GitBranch, Loader2, Plus } from 'lucide-react';
import { useCandidates } from '@/modules/nexotype/hooks/engineering/use-candidates';
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
export default function CandidatesPage() {
  const router = useRouter();
  const { candidates, isLoading, error } = useCandidates();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return candidates;
    return candidates.filter((c) =>
      c.version_number.toLowerCase().includes(term) ||
      String(c.asset_id).includes(term) ||
      String(c.parent_candidate_id ?? '').includes(term)
    );
  }, [candidates, search]);

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
          <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
          <p className="text-muted-foreground">Manage candidate versions linked to therapeutic assets</p>
        </div>
        <Link href="/candidates/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Candidate</Button>
</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidates</CardTitle>
          <CardDescription>All candidate records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by version number, asset ID, parent ID..." />
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{candidates.length === 0 ? 'No candidates yet' : 'No candidates match filters'}</h3>
              {candidates.length === 0 && <Link href="/candidates/new">
<Button>
<Plus className="mr-2 h-4 w-4" />Create Candidate</Button>
</Link>}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Parent Candidate ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className="cursor-pointer" onClick={() => router.push(`/candidates/${item.id}/details`)}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.asset_id}</TableCell>
                      <TableCell>{item.version_number}</TableCell>
                      <TableCell>{item.parent_candidate_id ?? '—'}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); router.push(`/candidates/${item.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filtered.length} of {candidates.length} candidates</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
