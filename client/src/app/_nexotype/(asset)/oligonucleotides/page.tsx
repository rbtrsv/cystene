'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOligonucleotides } from '@/modules/nexotype/hooks/asset/use-oligonucleotides';
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
import { Brackets, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the oligonucleotides table
 */
type SortField = 'name' | 'uid';
type SortDirection = 'asc' | 'desc' | null;

// Route state and navigation.
// Domain data comes from typed hooks.
// Handlers preserve API behavior; style-only normalization.
// Handlers preserve API behavior and keep flows explicit.
export default function OligonucleotidesPage() {
  const router = useRouter();
  const {
    oligonucleotides,
    isLoading,
    error,
  } = useOligonucleotides();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // ==========================================
  // Filter and sort oligonucleotides
  // ==========================================

  const filteredMolecules = useMemo(() => {
    let filtered = oligonucleotides;

    // Search by name, UID, Nucleotide Sequence, or Modification Type
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.uid.toLowerCase().includes(term) ||
        m.sequence_na.toLowerCase().includes(term) ||
        (m.modification_type && m.modification_type.toLowerCase().includes(term))
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
  }, [oligonucleotides, searchTerm, sortField, sortDirection]);

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
            Manage oligonucleotide chemical agents (NMEs)
          </p>
        </div>
        <Link href="/oligonucleotides/new">
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
            All oligonucleotides in the asset registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, UID, Nucleotide Sequence, or Modification Type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredMolecules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Brackets className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {oligonucleotides.length === 0 ? 'No oligonucleotides yet' : 'No oligonucleotides match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {oligonucleotides.length === 0
                  ? 'Create your first oligonucleotide to get started'
                  : 'Try adjusting your search criteria'}
              </p>
              {oligonucleotides.length === 0 && (
                <Link href="/oligonucleotides/new">
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
                    <TableHead>Modification Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMolecules.map((oligonucleotide) => (
                    <TableRow
                      key={oligonucleotide.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/oligonucleotides/${oligonucleotide.id}/details`)}
                    >
                      <TableCell className="font-medium">{oligonucleotide.name}</TableCell>
                      <TableCell>{oligonucleotide.uid}</TableCell>
                      <TableCell>{oligonucleotide.project_code || '—'}</TableCell>
                      <TableCell className="text-xs">{oligonucleotide.modification_type || '—'}</TableCell>
                      <TableCell>{new Date(oligonucleotide.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/oligonucleotides/${oligonucleotide.id}/details`);
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
                Showing {filteredMolecules.length} of {oligonucleotides.length} oligonucleotides
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
