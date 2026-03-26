'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathways } from '@/modules/nexotype/hooks/clinical/use-pathways';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Route, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the pathways table
 */
type SortField = 'name';
type SortDirection = 'asc' | 'desc' | null;

export default function PathwaysPage() {
  const router = useRouter();
  const {
    pathways,
    isLoading,
    error,
  } = usePathways();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort pathways
  // ==========================================

  const filteredPathways = useMemo(() => {
    let filtered = pathways;

    // Search by name or KEGG ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.kegg_id && p.kegg_id.toLowerCase().includes(term))
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [pathways, searchTerm, sortField, sortDirection]);

  // ==========================================
  // Sort handler
  // ==========================================

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc → desc → none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="inline h-4 w-4 ml-1" />
    ) : (
      <ChevronDown className="inline h-4 w-4 ml-1" />
    );
  };

  // ==========================================
  // Render
  // ==========================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pathways</h1>
          <p className="text-muted-foreground">
            Manage biological networks and signaling pathways
          </p>
        </div>
        <Link href="/pathways/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Pathway
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pathways</CardTitle>
          <CardDescription>
            All pathways in the registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or KEGG ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredPathways.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Route className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {pathways.length === 0 ? 'No pathways yet' : 'No pathways match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {pathways.length === 0
                  ? 'Create your first pathway to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {pathways.length === 0 && (
                <Link href="/pathways/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Pathway
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('name')}
                      >
                        Name
                        <SortIndicator field="name" />
                      </Button>
                    </TableHead>
                    <TableHead>KEGG ID</TableHead>
                    <TableHead>Longevity Tier</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPathways.map((pathway) => (
                    <TableRow
                      key={pathway.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/pathways/${pathway.id}/details`)}
                    >
                      <TableCell className="font-medium">{pathway.name}</TableCell>
                      <TableCell>{pathway.kegg_id || '—'}</TableCell>
                      <TableCell>{pathway.longevity_tier || '—'}</TableCell>
                      <TableCell>{new Date(pathway.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/pathways/${pathway.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredPathways.length} of {pathways.length} pathways
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
