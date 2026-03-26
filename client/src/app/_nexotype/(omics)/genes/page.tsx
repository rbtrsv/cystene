'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGenes } from '@/modules/nexotype/hooks/omics/use-genes';
import { useOrganisms } from '@/modules/nexotype/hooks/omics/use-organisms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { Dna, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

/**
 * Sort field options for the genes table
 */
type SortField = 'hgnc_symbol' | 'ensembl_gene_id';
type SortDirection = 'asc' | 'desc' | null;

export default function GenesPage() {
  const router = useRouter();
  const {
    genes,
    isLoading,
    error,
  } = useGenes();

  // Get organisms for resolving organism_id to name
  const { organisms } = useOrganisms();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [organismFilter, setOrganismFilter] = useState<string>('all');
  const [organismPopoverOpen, setOrganismPopoverOpen] = useState(false);
  const [chromosomeFilter, setChromosomeFilter] = useState('');

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve organism name from ID
  const getOrganismName = (organismId: number) => {
    const organism = organisms.find(o => o.id === organismId);
    return organism ? organism.scientific_name : `Organism #${organismId}`;
  };

  // ==========================================
  // Filter and sort genes
  // ==========================================

  const filteredGenes = useMemo(() => {
    let filtered = genes;

    // Search by HGNC symbol or Ensembl gene ID
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.hgnc_symbol.toLowerCase().includes(term) ||
        g.ensembl_gene_id.toLowerCase().includes(term)
      );
    }

    // Filter by organism
    if (organismFilter !== 'all') {
      const organismId = parseInt(organismFilter);
      filtered = filtered.filter(g => g.organism_id === organismId);
    }

    // Filter by chromosome
    if (chromosomeFilter) {
      const term = chromosomeFilter.toLowerCase();
      filtered = filtered.filter(g => g.chromosome.toLowerCase().includes(term));
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'hgnc_symbol':
            comparison = a.hgnc_symbol.localeCompare(b.hgnc_symbol);
            break;
          case 'ensembl_gene_id':
            comparison = a.ensembl_gene_id.localeCompare(b.ensembl_gene_id);
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [genes, searchTerm, organismFilter, chromosomeFilter, sortField, sortDirection]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Genes</h1>
          <p className="text-muted-foreground">
            Manage genomic loci in the omics registry
          </p>
        </div>
        <Link href="/genes/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Gene
          </Button>
        </Link>
      </div>

      {/* Filters & Table */}
      <Card>
        <CardHeader>
          <CardTitle>Genes</CardTitle>
          <CardDescription>
            All genes in the omics registry
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by HGNC symbol or Ensembl ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Organism</Label>
              <Popover open={organismPopoverOpen} onOpenChange={setOrganismPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={organismPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {organismFilter === 'all'
                        ? 'All Organisms'
                        : organisms.find((o) => o.id.toString() === organismFilter)?.scientific_name || 'All Organisms'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search organism..." />
                    <CommandList>
                      <CommandEmpty>No organisms found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Organisms"
                          onSelect={() => {
                            setOrganismFilter('all');
                            setOrganismPopoverOpen(false);
                          }}
                        >
                          All Organisms
                          {organismFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {organisms.map((organism) => (
                          <CommandItem
                            key={organism.id}
                            value={organism.scientific_name}
                            onSelect={() => {
                              setOrganismFilter(organism.id.toString());
                              setOrganismPopoverOpen(false);
                            }}
                          >
                            {organism.scientific_name}
                            {organismFilter === organism.id.toString() && (
                              <Check className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chromosome">Chromosome</Label>
              <Input
                id="chromosome"
                placeholder="Filter by chromosome..."
                value={chromosomeFilter}
                onChange={(e) => setChromosomeFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredGenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Dna className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {genes.length === 0 ? 'No genes yet' : 'No genes match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {genes.length === 0
                  ? 'Create your first gene to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {genes.length === 0 && (
                <Link href="/genes/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Gene
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile for wide tables */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('hgnc_symbol')}
                      >
                        HGNC Symbol
                        <SortIndicator field="hgnc_symbol" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('ensembl_gene_id')}
                      >
                        Ensembl Gene ID
                        <SortIndicator field="ensembl_gene_id" />
                      </Button>
                    </TableHead>
                    <TableHead>Chromosome</TableHead>
                    <TableHead>Organism</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGenes.map((gene) => (
                    <TableRow
                      key={gene.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/genes/${gene.id}/details`)}
                    >
                      <TableCell className="font-medium">{gene.hgnc_symbol}</TableCell>
                      <TableCell>{gene.ensembl_gene_id}</TableCell>
                      <TableCell>{gene.chromosome}</TableCell>
                      <TableCell>{getOrganismName(gene.organism_id)}</TableCell>
                      <TableCell>{new Date(gene.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/genes/${gene.id}/details`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredGenes.length} of {genes.length} genes
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
