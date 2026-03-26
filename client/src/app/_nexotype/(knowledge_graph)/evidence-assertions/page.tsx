'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEvidenceAssertions } from '@/modules/nexotype/hooks/knowledge_graph/use-evidence-assertions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { ShieldCheck, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Evidence Assertions list page
// Displays all evidence assertions with search filtering by
// relationship_table
// ---------------------------------------------------------------------------
export default function EvidenceAssertionsPage() {
  const router = useRouter();
  const { evidenceAssertions, isLoading, error } = useEvidenceAssertions();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter evidence assertions by relationship_table
  const filteredEvidenceAssertions = useMemo(() => {
    let filtered = evidenceAssertions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ea =>
        ea.relationship_table.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [evidenceAssertions, searchTerm]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>);
  }

  return (
    <div className="space-y-6">
      {/* Page header with title and create button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Assertions</h1>
          <p className="text-muted-foreground">Manage evidence assertions in the knowledge graph</p>
        </div>
        <Link href="/evidence-assertions/new">
          <Button><Plus className="mr-2 h-4 w-4" />Create Evidence Assertion</Button>
        </Link>
      </div>

      {/* Evidence assertions table card */}
      <Card>
        <CardHeader>
          <CardTitle>Evidence Assertions</CardTitle>
          <CardDescription>All evidence assertions in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by relationship_table */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by relationship table..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredEvidenceAssertions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {evidenceAssertions.length === 0 ? 'No evidence assertions yet' : 'No evidence assertions match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {evidenceAssertions.length === 0 ? 'Create your first evidence assertion' : 'Try adjusting your search'}
              </p>
              {evidenceAssertions.length === 0 && (
                <Link href="/evidence-assertions/new"><Button><Plus className="mr-2 h-4 w-4" />Create Evidence Assertion</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Results table */}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Relationship Table</TableHead>
                  <TableHead>Relationship ID</TableHead>
                  <TableHead>Source ID</TableHead>
                  <TableHead>Confidence Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredEvidenceAssertions.map((ea) => (
                    <TableRow key={ea.id} className="cursor-pointer" onClick={() => router.push(`/evidence-assertions/${ea.id}/details`)}>
                      <TableCell className="font-medium">{ea.id}</TableCell>
                      <TableCell>{ea.relationship_table}</TableCell>
                      <TableCell>{ea.relationship_id}</TableCell>
                      <TableCell>{ea.source_id}</TableCell>
                      <TableCell>{ea.confidence_score ?? '—'}</TableCell>
                      <TableCell>{new Date(ea.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/evidence-assertions/${ea.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filteredEvidenceAssertions.length} of {evidenceAssertions.length} evidence assertions</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
