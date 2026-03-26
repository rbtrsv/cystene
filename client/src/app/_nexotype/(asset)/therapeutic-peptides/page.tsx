'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTherapeuticPeptides } from '@/modules/nexotype/hooks/asset/use-therapeutic-peptides';
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
import { Scissors, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the therapeutic peptides table
 */
type SortField = 'name' | 'uid';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function TherapeuticPeptidesPage() {
  const router = useRouter();
  const {
    therapeuticPeptides,
    isLoading,
    error,
  } = useTherapeuticPeptides();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort therapeutic peptides
  // ==========================================

  const filteredMolecules = useMemo(() => {
    let filtered = therapeuticPeptides;

    // Search by name, UID, Amino Acid Sequence, or Purity Grade
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.uid.toLowerCase().includes(term) ||
        m.sequence_aa.toLowerCase().includes(term) ||
        (m.purity_grade && m.purity_grade.toLowerCase().includes(term))
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
          case 'uid':
            comparison = a.uid.localeCompare(b.uid);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [therapeuticPeptides, searchTerm, sortField, sortDirection]);

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
      // Render page content.
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
          <h1 className="text-3xl font-bold tracking-tight">Small Molecules</h1>
          <p className="text-muted-foreground">
            Manage therapeutic peptide chemical agents (NMEs)
          </p>
        </div>
        <Link href="/therapeutic-peptides/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Small Molecule
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Small Molecules</CardTitle>
          <CardDescription>
            All therapeutic peptides in the asset registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, UID, Amino Acid Sequence, or Purity Grade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredMolecules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {therapeuticPeptides.length === 0 ? 'No therapeutic peptides yet' : 'No therapeutic peptides match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {therapeuticPeptides.length === 0
                  ? 'Create your first therapeutic peptide to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {therapeuticPeptides.length === 0 && (
                <Link href="/therapeutic-peptides/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Small Molecule
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('uid')}
                      >
                        UID
                        <SortIndicator field="uid" />
                      </Button>
                    </TableHead>
                    <TableHead>Project Code</TableHead>
                    <TableHead>Purity Grade</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMolecules.map((therapeuticPeptide) => (
                    <TableRow
                      key={therapeuticPeptide.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/therapeutic-peptides/${therapeuticPeptide.id}/details`)}
                    >
                      <TableCell className="font-medium">{therapeuticPeptide.name}</TableCell>
                      <TableCell>{therapeuticPeptide.uid}</TableCell>
                      <TableCell>{therapeuticPeptide.project_code || '—'}</TableCell>
                      <TableCell className="text-xs">{therapeuticPeptide.purity_grade || '—'}</TableCell>
                      <TableCell>{new Date(therapeuticPeptide.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/therapeutic-peptides/${therapeuticPeptide.id}/details`);
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
                Showing {filteredMolecules.length} of {therapeuticPeptides.length} therapeutic peptides
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
