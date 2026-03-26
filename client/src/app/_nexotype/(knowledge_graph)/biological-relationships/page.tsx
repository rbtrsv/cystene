'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBiologicalRelationships } from '@/modules/nexotype/hooks/knowledge_graph/use-biological-relationships';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Link2, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Biological Relationships list page
// Displays all protein-protein interactions with search filtering by
// interaction_type
// ---------------------------------------------------------------------------
export default function BiologicalRelationshipsPage() {
  const router = useRouter();
  const { biologicalRelationships, isLoading, error } = useBiologicalRelationships();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter biological relationships by interaction_type
  const filteredBiologicalRelationships = useMemo(() => {
    let filtered = biologicalRelationships;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(br =>
        br.interaction_type.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [biologicalRelationships, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Biological Relationships</h1>
          <p className="text-muted-foreground">Manage protein-protein interactions in the knowledge graph</p>
        </div>
        <Link href="/biological-relationships/new">
          <Button><Plus className="mr-2 h-4 w-4" />Create Biological Relationship</Button>
        </Link>
      </div>

      {/* Biological relationships table card */}
      <Card>
        <CardHeader>
          <CardTitle>Biological Relationships</CardTitle>
          <CardDescription>All biological relationships in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by interaction_type */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by interaction type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredBiologicalRelationships.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {biologicalRelationships.length === 0 ? 'No biological relationships yet' : 'No biological relationships match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {biologicalRelationships.length === 0 ? 'Create your first biological relationship' : 'Try adjusting your search'}
              </p>
              {biologicalRelationships.length === 0 && (
                <Link href="/biological-relationships/new"><Button><Plus className="mr-2 h-4 w-4" />Create Biological Relationship</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Results table */}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Protein A ID</TableHead>
                  <TableHead>Protein B ID</TableHead>
                  <TableHead>Interaction Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredBiologicalRelationships.map((br) => (
                    <TableRow key={br.id} className="cursor-pointer" onClick={() => router.push(`/biological-relationships/${br.id}/details`)}>
                      <TableCell className="font-medium">{br.id}</TableCell>
                      <TableCell>{br.protein_a_id}</TableCell>
                      <TableCell>{br.protein_b_id}</TableCell>
                      <TableCell>{br.interaction_type}</TableCell>
                      <TableCell>{new Date(br.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/biological-relationships/${br.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filteredBiologicalRelationships.length} of {biologicalRelationships.length} biological relationships</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
