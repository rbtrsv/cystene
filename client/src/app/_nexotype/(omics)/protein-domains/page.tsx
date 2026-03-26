'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProteinDomains } from '@/modules/nexotype/hooks/omics/use-protein-domains';
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
import { Puzzle, Plus, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the protein domains table
 */
type SortField = 'name' | 'pfam_id';
type SortDirection = 'asc' | 'desc' | null;

export default function ProteinDomainsPage() {
  const router = useRouter();
  const {
    proteinDomains,
    isLoading,
    error,
  } = useProteinDomains();

  // Get proteins for resolving protein_id to name
  const { proteins } = useProteins();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [proteinFilter, setProteinFilter] = useState<string>('all');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve protein name from ID
  const getProteinName = (proteinId: number) => {
    const protein = proteins.find(p => p.id === proteinId);
    return protein ? protein.uniprot_accession : `Protein #${proteinId}`;
  };

  // ==========================================
  // Filter and sort protein domains
  // ==========================================

  const filteredDomains = useMemo(() => {
    let filtered = proteinDomains;

    // Search by name or Pfam ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.pfam_id.toLowerCase().includes(term)
      );
    }

    // Filter by protein
    if (proteinFilter !== 'all') {
      const proteinId = parseInt(proteinFilter);
      filtered = filtered.filter(d => d.protein_id === proteinId);
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'pfam_id':
            comparison = a.pfam_id.localeCompare(b.pfam_id);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [proteinDomains, searchTerm, proteinFilter, sortField, sortDirection]);

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
          <h1 className="text-3xl font-bold tracking-tight">Protein Domains</h1>
          <p className="text-muted-foreground">
            Manage structural motifs and functional regions in the omics registry
          </p>
        </div>
        <Link href="/protein-domains/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Protein Domain
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Protein Domains</CardTitle>
          <CardDescription>
            All protein domains in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name or Pfam ID..."
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
          {filteredDomains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {proteinDomains.length === 0 ? 'No protein domains yet' : 'No protein domains match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {proteinDomains.length === 0
                  ? 'Create your first protein domain to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {proteinDomains.length === 0 && (
                <Link href="/protein-domains/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Protein Domain
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
                        onClick={() => handleSort('pfam_id')}
                      >
                        Pfam ID
                        <SortIndicator field="pfam_id" />
                      </Button>
                    </TableHead>
                    <TableHead>Protein</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDomains.map((domain) => (
                    <TableRow
                      key={domain.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/protein-domains/${domain.id}/details`)}
                    >
                      <TableCell className="font-medium">{domain.name}</TableCell>
                      <TableCell>{domain.pfam_id}</TableCell>
                      <TableCell>{getProteinName(domain.protein_id)}</TableCell>
                      <TableCell>{new Date(domain.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/protein-domains/${domain.id}/details`);
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
                Showing {filteredDomains.length} of {proteinDomains.length} protein domains
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
