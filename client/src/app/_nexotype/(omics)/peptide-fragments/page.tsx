'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePeptideFragments } from '@/modules/nexotype/hooks/omics/use-peptide-fragments';
import { useProteins } from '@/modules/nexotype/hooks/omics/use-proteins';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/shadcnui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Scissors, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the peptide fragments table
 */
type SortField = 'sequence';
type SortDirection = 'asc' | 'desc' | null;

export default function PeptideFragmentsPage() {
  const router = useRouter();
  const {
    peptideFragments,
    isLoading,
    error,
  } = usePeptideFragments();

  // Get proteins for resolving protein_id to accession
  const { proteins } = useProteins();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [proteinFilter, setProteinFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve protein accession from ID
  const getProteinAccession = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // ==========================================
  // Filter and sort peptide fragments
  // ==========================================

  const filteredFragments = useMemo(() => {
    let filtered = peptideFragments;

    // Search by sequence
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(f =>
        f.sequence.toLowerCase().includes(term)
      );
    }

    // Filter by protein
    if (proteinFilter !== 'all') {
      const proteinId = parseInt(proteinFilter);
      filtered = filtered.filter(f => f.protein_id === proteinId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'sequence':
            comparison = a.sequence.localeCompare(b.sequence);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [peptideFragments, searchTerm, proteinFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Peptide Fragments</h1>
          <p className="text-muted-foreground">
            Manage tryptic peptide fragments in the omics registry
          </p>
        </div>
        <Link href="/peptide-fragments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Peptide Fragment
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Peptide Fragments</CardTitle>
          <CardDescription>
            All peptide fragments in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by sequence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein</Label>
              <Select value={proteinFilter} onValueChange={setProteinFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Proteins" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proteins</SelectItem>
                  {proteins.map((protein) => (
                    <SelectItem key={protein.id} value={protein.id.toString()}>
                      {protein.uniprot_accession}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table or empty state */}
          {filteredFragments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {peptideFragments.length === 0 ? 'No peptide fragments yet' : 'No peptide fragments match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {peptideFragments.length === 0
                  ? 'Create your first peptide fragment to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {peptideFragments.length === 0 && (
                <Link href="/peptide-fragments/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Peptide Fragment
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
                        onClick={() => handleSort('sequence')}
                      >
                        Sequence
                        <SortIndicator field="sequence" />
                      </Button>
                    </TableHead>
                    <TableHead>Protein</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFragments.map((fragment) => (
                    <TableRow
                      key={fragment.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/peptide-fragments/${fragment.id}/details`)}
                    >
                      <TableCell className="font-mono font-medium">{fragment.sequence}</TableCell>
                      <TableCell>{getProteinAccession(fragment.protein_id)}</TableCell>
                      <TableCell>{new Date(fragment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/peptide-fragments/${fragment.id}/details`);
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
                Showing {filteredFragments.length} of {peptideFragments.length} peptide fragments
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
