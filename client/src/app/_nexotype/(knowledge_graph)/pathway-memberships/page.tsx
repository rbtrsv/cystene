'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathwayMemberships } from '@/modules/nexotype/hooks/knowledge_graph/use-pathway-memberships';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Network, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Pathway Memberships list page
// Displays all protein-pathway memberships with search filtering by role
// ---------------------------------------------------------------------------
export default function PathwayMembershipsPage() {
  const router = useRouter();
  const { pathwayMemberships, isLoading, error } = usePathwayMemberships();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter pathway memberships by role (if not null)
  const filteredPathwayMemberships = useMemo(() => {
    let filtered = pathwayMemberships;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pm =>
        pm.role && pm.role.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [pathwayMemberships, searchTerm]);

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
          <h1 className="text-3xl font-bold tracking-tight">Pathway Memberships</h1>
          <p className="text-muted-foreground">Manage protein-pathway memberships in the knowledge graph</p>
        </div>
        <Link href="/pathway-memberships/new">
          <Button><Plus className="mr-2 h-4 w-4" />Create Pathway Membership</Button>
        </Link>
      </div>

      {/* Pathway memberships table card */}
      <Card>
        <CardHeader>
          <CardTitle>Pathway Memberships</CardTitle>
          <CardDescription>All pathway memberships in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search input — filters by role */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input id="search" placeholder="Search by role..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {filteredPathwayMemberships.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <Network className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {pathwayMemberships.length === 0 ? 'No pathway memberships yet' : 'No pathway memberships match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pathwayMemberships.length === 0 ? 'Create your first pathway membership' : 'Try adjusting your search'}
              </p>
              {pathwayMemberships.length === 0 && (
                <Link href="/pathway-memberships/new"><Button><Plus className="mr-2 h-4 w-4" />Create Pathway Membership</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Results table */}
              <Table>
                <TableHeader><TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Protein ID</TableHead>
                  <TableHead>Pathway ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filteredPathwayMemberships.map((pm) => (
                    <TableRow key={pm.id} className="cursor-pointer" onClick={() => router.push(`/pathway-memberships/${pm.id}/details`)}>
                      <TableCell className="font-medium">{pm.id}</TableCell>
                      <TableCell>{pm.protein_id}</TableCell>
                      <TableCell>{pm.pathway_id}</TableCell>
                      <TableCell>{pm.role ?? '—'}</TableCell>
                      <TableCell>{new Date(pm.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/pathway-memberships/${pm.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">Showing {filteredPathwayMemberships.length} of {pathwayMemberships.length} pathway memberships</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
