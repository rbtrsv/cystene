'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
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
import { Activity, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the phenotypes table
 */
type SortField = 'name';
type SortDirection = 'asc' | 'desc' | null;

export default function PhenotypesPage() {
  const router = useRouter();
  const {
    phenotypes,
    isLoading,
    error,
  } = usePhenotypes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort phenotypes
  // ==========================================

  const filteredPhenotypes = useMemo(() => {
    let filtered = phenotypes;

    // Search by name or HPO ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.hpo_id && p.hpo_id.toLowerCase().includes(term))
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
  }, [phenotypes, searchTerm, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Phenotypes</h1>
          <p className="text-muted-foreground">
            Manage observable traits and characteristics
          </p>
        </div>
        <Link href="/phenotypes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Phenotype
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phenotypes</CardTitle>
          <CardDescription>
            All phenotypes in the registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or HPO ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredPhenotypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {phenotypes.length === 0 ? 'No phenotypes yet' : 'No phenotypes match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {phenotypes.length === 0
                  ? 'Create your first phenotype to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {phenotypes.length === 0 && (
                <Link href="/phenotypes/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Phenotype
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
                    <TableHead>HPO ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPhenotypes.map((phenotype) => (
                    <TableRow
                      key={phenotype.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/phenotypes/${phenotype.id}/details`)}
                    >
                      <TableCell className="font-medium">{phenotype.name}</TableCell>
                      <TableCell>{phenotype.hpo_id || '—'}</TableCell>
                      <TableCell>{new Date(phenotype.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/phenotypes/${phenotype.id}/details`);
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
                Showing {filteredPhenotypes.length} of {phenotypes.length} phenotypes
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
