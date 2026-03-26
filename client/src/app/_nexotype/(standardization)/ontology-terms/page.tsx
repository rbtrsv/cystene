'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOntologyTerms } from '@/modules/nexotype/hooks/standardization/use-ontology-terms';
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
import { BookOpen, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the ontology terms table
 */
type SortField = 'name' | 'source';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
export default function OntologyTermsPage() {
  const router = useRouter();
  const {
    ontologyTerms,
    isLoading,
    error,
  } = useOntologyTerms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort ontology terms
  // ==========================================

  const filteredOntologyTerms = useMemo(() => {
    let filtered = ontologyTerms;

    // Search by name, accession, or source
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ot =>
        ot.name.toLowerCase().includes(term) ||
        ot.accession.toLowerCase().includes(term) ||
        ot.source.toLowerCase().includes(term)
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
          case 'source':
            comparison = a.source.localeCompare(b.source);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [ontologyTerms, searchTerm, sortField, sortDirection]);

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

  // Guard: loading state.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Guard: error state.
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
          <h1 className="text-3xl font-bold tracking-tight">Ontology Terms</h1>
          <p className="text-muted-foreground">
            Manage controlled vocabulary terms (GO, HPO, CHEBI)
          </p>
        </div>
        <Link href="/ontology-terms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Ontology Term
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ontology Terms</CardTitle>
          <CardDescription>
            All ontology terms in the standardization registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name, accession, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table or empty state */}
          {filteredOntologyTerms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {ontologyTerms.length === 0 ? 'No ontology terms yet' : 'No ontology terms match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {ontologyTerms.length === 0
                  ? 'Create your first ontology term to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {ontologyTerms.length === 0 && (
                <Link href="/ontology-terms/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ontology Term
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
                    <TableHead>Accession</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('source')}
                      >
                        Source
                        <SortIndicator field="source" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOntologyTerms.map((ontologyTerm) => (
                    <TableRow
                      key={ontologyTerm.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/ontology-terms/${ontologyTerm.id}/details`)}
                    >
                      <TableCell className="font-medium">{ontologyTerm.name}</TableCell>
                      <TableCell>{ontologyTerm.accession}</TableCell>
                      <TableCell>{ontologyTerm.source}</TableCell>
                      <TableCell>{new Date(ontologyTerm.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/ontology-terms/${ontologyTerm.id}/details`);
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
                Showing {filteredOntologyTerms.length} of {ontologyTerms.length} ontology terms
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
