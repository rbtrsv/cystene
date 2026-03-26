'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
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
import { Bug, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the organisms table
 */
type SortField = 'scientific_name';
type SortDirection = 'asc' | 'desc' | null;

export default function OrganismsPage() {
  const router = useRouter();
  const {
    organisms,
    isLoading,
    error,
  } = useOrganisms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort organisms
  // ==========================================

  const filteredOrganisms = useMemo(() => {
    let filtered = organisms;

    // Search by scientific name or common name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.scientific_name.toLowerCase().includes(term) ||
        o.common_name.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'scientific_name':
            comparison = a.scientific_name.localeCompare(b.scientific_name);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [organisms, searchTerm, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Organisms</h1>
          <p className="text-muted-foreground">
            Manage biological organisms in the omics registry
          </p>
        </div>
        <Link href="/organisms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organism
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organisms</CardTitle>
          <CardDescription>
            All organisms in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by scientific or common name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredOrganisms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {organisms.length === 0 ? 'No organisms yet' : 'No organisms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {organisms.length === 0
                  ? 'Create your first organism to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {organisms.length === 0 && (
                <Link href="/organisms/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Organism
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
                        onClick={() => handleSort('scientific_name')}
                      >
                        Scientific Name
                        <SortIndicator field="scientific_name" />
                      </Button>
                    </TableHead>
                    <TableHead>Common Name</TableHead>
                    <TableHead>NCBI Taxonomy ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganisms.map((organism) => (
                    <TableRow
                      key={organism.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/organisms/${organism.id}/details`)}
                    >
                      <TableCell className="font-medium">{organism.scientific_name}</TableCell>
                      <TableCell>{organism.common_name}</TableCell>
                      <TableCell>{organism.ncbi_taxonomy_id}</TableCell>
                      <TableCell>{new Date(organism.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/organisms/${organism.id}/details`);
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
                Showing {filteredOrganisms.length} of {organisms.length} organisms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
