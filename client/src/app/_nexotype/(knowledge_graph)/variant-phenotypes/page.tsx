'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVariantPhenotypes } from '@/modules/nexotype/hooks/knowledge_graph/use-variant-phenotypes';
import { useVariants } from '@/modules/nexotype/hooks/omics/use-variants';
import { usePhenotypes } from '@/modules/nexotype/hooks/clinical/use-phenotypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/modules/shadcnui/components/ui/card';
import { Button } from '@/modules/shadcnui/components/ui/button';
import { Input } from '@/modules/shadcnui/components/ui/input';
import { Label } from '@/modules/shadcnui/components/ui/label';
import { Alert, AlertDescription } from '@/modules/shadcnui/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/modules/shadcnui/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/modules/shadcnui/components/ui/command';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/modules/shadcnui/components/ui/table';
import { GitBranch, Plus, Loader2, ChevronUp, ChevronDown, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';

// ==========================================
// Types
// ==========================================

type SortField = 'effect_size';
type SortDirection = 'asc' | 'desc' | null;

// ---------------------------------------------------------------------------
// Variant Phenotypes list page
// Displays all variant phenotypes with FK resolution, filters, and sorting
// ---------------------------------------------------------------------------
export default function VariantPhenotypesPage() {
  const router = useRouter();
  const { variantPhenotypes, isLoading, error } = useVariantPhenotypes();

  // Get referenced entities for FK name resolution
  const { variants } = useVariants();
  const { phenotypes } = usePhenotypes();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [variantFilter, setVariantFilter] = useState<string>('all');
  const [variantPopoverOpen, setVariantPopoverOpen] = useState(false);
  const [phenotypeFilter, setPhenotypeFilter] = useState<string>('all');
  const [phenotypePopoverOpen, setPhenotypePopoverOpen] = useState(false);

  // Sort state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Helper to resolve variant name from FK ID
  const getVariantName = (variantId: number) => {
    const variant = variants.find(v => v.id === variantId);
    return variant ? variant.db_snp_id : `Variant #${variantId}`;
  };

  // Helper to resolve phenotype name from FK ID
  const getPhenotypeName = (phenotypeId: number) => {
    const phenotype = phenotypes.find(p => p.id === phenotypeId);
    return phenotype ? phenotype.name : `Phenotype #${phenotypeId}`;
  };

  // Build filter options from entities that appear in variant phenotypes
  const variantFilterOptions = useMemo(() => {
    const variantIds = [...new Set(variantPhenotypes.map(vp => vp.variant_id))];
    return variantIds.map(id => ({
      id,
      name: variants.find(v => v.id === id)?.db_snp_id || `Variant #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [variantPhenotypes, variants]);

  const phenotypeFilterOptions = useMemo(() => {
    const phenotypeIds = [...new Set(variantPhenotypes.map(vp => vp.phenotype_id))];
    return phenotypeIds.map(id => ({
      id,
      name: phenotypes.find(p => p.id === id)?.name || `Phenotype #${id}`,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [variantPhenotypes, phenotypes]);

  // ==========================================
  // Filter and sort variant phenotypes
  // ==========================================

  const filteredVariantPhenotypes = useMemo(() => {
    let filtered = [...variantPhenotypes];

    // Filter by variant
    if (variantFilter !== 'all') {
      const variantId = parseInt(variantFilter);
      filtered = filtered.filter(vp => vp.variant_id === variantId);
    }

    // Filter by phenotype
    if (phenotypeFilter !== 'all') {
      const phenotypeId = parseInt(phenotypeFilter);
      filtered = filtered.filter(vp => vp.phenotype_id === phenotypeId);
    }

    // Search by effect_size
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vp =>
        vp.effect_size && vp.effect_size.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'effect_size':
            comparison = (a.effect_size || '').localeCompare(b.effect_size || '');
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [variantPhenotypes, variantFilter, phenotypeFilter, searchTerm, sortField, sortDirection]);

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

  const totalCount = variantPhenotypes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Variant Phenotypes</h1>
          <p className="text-muted-foreground">Manage variant phenotypes in the knowledge graph</p>
        </div>
        <Link href="/variant-phenotypes/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Create Variant Phenotype
          </Button>
        </Link>
      </div>

      {/* Variant phenotypes table card */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Phenotypes</CardTitle>
          <CardDescription>All variant phenotypes in the registry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters Bar */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Variant FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Variant</Label>
              <Popover open={variantPopoverOpen} onOpenChange={setVariantPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={variantPopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {variantFilter === 'all'
                        ? 'All Variants'
                        : variantFilterOptions.find(opt => opt.id.toString() === variantFilter)?.name || 'All Variants'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search variant..." />
                    <CommandList>
                      <CommandEmpty>No variants found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Variants"
                          onSelect={() => {
                            setVariantFilter('all');
                            setVariantPopoverOpen(false);
                          }}
                        >
                          All Variants
                          {variantFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {variantFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setVariantFilter(opt.id.toString());
                              setVariantPopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {variantFilter === opt.id.toString() && (
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

            {/* Phenotype FK filter — searchable combobox */}
            <div className="space-y-2">
              <Label>Phenotype</Label>
              <Popover open={phenotypePopoverOpen} onOpenChange={setPhenotypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={phenotypePopoverOpen}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {phenotypeFilter === 'all'
                        ? 'All Phenotypes'
                        : phenotypeFilterOptions.find(opt => opt.id.toString() === phenotypeFilter)?.name || 'All Phenotypes'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search phenotype..." />
                    <CommandList>
                      <CommandEmpty>No phenotypes found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="All Phenotypes"
                          onSelect={() => {
                            setPhenotypeFilter('all');
                            setPhenotypePopoverOpen(false);
                          }}
                        >
                          All Phenotypes
                          {phenotypeFilter === 'all' && (
                            <Check className="ml-auto h-4 w-4" />
                          )}
                        </CommandItem>
                        {phenotypeFilterOptions.map(opt => (
                          <CommandItem
                            key={opt.id}
                            value={opt.name}
                            onSelect={() => {
                              setPhenotypeFilter(opt.id.toString());
                              setPhenotypePopoverOpen(false);
                            }}
                          >
                            {opt.name}
                            {phenotypeFilter === opt.id.toString() && (
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

            {/* Search input — filters by effect_size */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by effect size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table or empty state */}
          {filteredVariantPhenotypes.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-12">
              <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {totalCount === 0 ? 'No variant phenotypes yet' : 'No variant phenotypes match filters'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {totalCount === 0 ? 'Create your first variant phenotype' : 'Try adjusting your search or filter criteria'}
              </p>
              {totalCount === 0 && (
                <Link href="/variant-phenotypes/new"><Button><Plus className="mr-2 h-4 w-4" />Create Variant Phenotype</Button></Link>
              )}
            </div>
          ) : (
            <>
              {/* Horizontal scroll on mobile for wide tables */}
              <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Phenotype</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto font-medium hover:bg-transparent"
                        onClick={() => handleSort('effect_size')}
                      >
                        Effect Size
                        <SortIndicator field="effect_size" />
                      </Button>
                    </TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariantPhenotypes.map((vp) => (
                    <TableRow key={vp.id} className="cursor-pointer" onClick={() => router.push(`/variant-phenotypes/${vp.id}/details`)}>
                      <TableCell className="font-medium">{vp.id}</TableCell>
                      <TableCell>{getVariantName(vp.variant_id)}</TableCell>
                      <TableCell>{getPhenotypeName(vp.phenotype_id)}</TableCell>
                      <TableCell>{vp.effect_size ?? '—'}</TableCell>
                      <TableCell>{new Date(vp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/variant-phenotypes/${vp.id}/details`); }}>View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredVariantPhenotypes.length} of {totalCount} variant phenotypes
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
